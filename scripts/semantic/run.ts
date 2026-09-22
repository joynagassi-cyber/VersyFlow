/**
 * Semantic pipeline — top-level orchestrator (Stages A → H, idempotent).
 *
 * Runs the deterministic-only build:
 *
 *   A  Import      — 35 built datasets → verse universe; NEUU layers or the
 *                    documented minimal seed
 *   B  Align       — label canonicalization over the seed concepts
 *   C  Seed        — materialize schema row shapes
 *   D  Normalize   — dedup concepts, merge edges, recompute counters
 *   E  Map         — attach head verses to concepts with roles (NoopLlmPort)
 *   F  Relations   — CROSS_REFERENCE + SHARED_CONCEPT verse edges
 *   G  Communities — deterministic clustering + naming (NoopLlmPort)
 *   H  Validate    — full invariant gate over in-memory rows
 *
 * Outputs land under `data/bible/semantic/` as git-safe JSON (no binary
 * artifacts): one file per stage, plus `report/pipeline-report.json`.
 * A rebuild on identical inputs is byte-identical — timestamps are pinned
 * (`DEFAULT_NOW`), ids are `detUuid`, everything is sorted deterministically.
 *
 * On Stage H failure the batch is reverted (staged outputs are removed) and
 * the process exits non-zero.
 */

import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import {
  DEFAULT_NOW,
  loadVerseUniverse,
  importAllLayers,
  buildMinimalSeed,
  alignCrossrefs,
} from './import';import { alignTopics } from './align';
import { seedMinimalSeed, type SeedOut } from './seed';
import { dedupConcepts } from './normalize';
import { mapVerseRoles, type MapResult } from './map';
import { runRelations, buildSameCommunityRelations, type VerseRelationRow } from './relations';
import { runCommunities, type CommunityOut } from './communities';
import { NoopLlmPort } from './llm-port';
import { runHChecksInMemory, runExtendedChecks, type InMemoryRows, type HResult } from './validate';
import type { StageResult, PipelineReport } from './helpers';

export interface RunOptions {
  /** Repo root (default: process.cwd()). */
  cwd?: string;
  /** Pinned timestamp (default: `DEFAULT_NOW`). */
  now?: string;
  /** When true, write JSON outputs to data/bible/semantic/. Default true. */
  write?: boolean;
}

// ---------------------------------------------------------------------------
// Stage A — Import
// ---------------------------------------------------------------------------

interface StageAOut {
  datasetsCount: number;
  verseCount: number;
  /** Full canonical verse universe (Stage H resolves verse ids against it). */
  universeVerses: string[];
  universeBookIds: number;
  /** Aligned source crossref edges (empty when no crossref dataset is present). */
  alignedCrossrefs: Array<{ fromVerseId: string; toVerseId: string; confidence?: number; source?: string }>;
  minimalSeed: ReturnType<typeof buildMinimalSeed>;
  errors: string[];
}

function runStageA(opts: RunOptions): StageAOut {
  const root = opts.cwd ?? process.cwd();
  const bibleDir = join(root, 'data', 'bible');
  const semanticBaseDir = join(bibleDir, 'semantic');
  const errors: string[] = [];

  const { datasets, universe } = loadVerseUniverse(bibleDir, errors);

  // Try the NEUU layers first; when none exist (the default on this box),
  // fall back to the documented minimal seed (run.ts just records it).
  const imported = importAllLayers(semanticBaseDir, 'nave');
  errors.push(...imported.errors);

  // Align source crossref edges to the verse universe (one verse pair per
  // edge — verse 1 of each referenced chapter; out-of-range chapters and
  // unresolvable book tokens are counted, not errors).
  const xref = alignCrossrefs(imported.crossrefs, universe);
  errors.push(...(xref.unresolved > 0 ? [`crossrefs: ${xref.unresolved} unresolved book token(s)`] : []));

  const now = opts.now ?? DEFAULT_NOW;
  const minimalSeed = buildMinimalSeed({ now });

  return {
    datasetsCount: datasets.length,
    verseCount: universe.verses.length,
    universeVerses: universe.verses,
    universeBookIds: universe.bookIds.length,
    alignedCrossrefs: xref.aligned.map((a) => ({
      fromVerseId: a.fromVerse,
      toVerseId: a.toVerse,
      source: `stage-A:crossref:${a.fromBook}→${a.toBook}`,
    })),
    minimalSeed,
    errors,
  };
}

// ---------------------------------------------------------------------------
// Stage B — Align
// ---------------------------------------------------------------------------

function runStageB(seed: StageAOut['minimalSeed']) {
  const rawTopics = seed.concepts.map((c) => ({
    key: c.key,
    label: c.canonicalLabel,
    labelsByLanguage: c.labelsByLanguage,
  }));
  return alignTopics(rawTopics);
}

// ---------------------------------------------------------------------------
// Stage C — Seed
// ---------------------------------------------------------------------------

function runStageC(seed: StageAOut['minimalSeed'], now: string): SeedOut {
  return seedMinimalSeed(
    { concepts: seed.concepts, relations: seed.relations },
    now
  );
}

// ---------------------------------------------------------------------------
// Stage D — Normalize
// ---------------------------------------------------------------------------

function runStageD(seeded: SeedOut) {
  const concepts = seeded.concepts.map((c) => ({
    key: c.key,
    label: c.canonicalLabel,
    labelsByLanguage: JSON.parse(c.labelsByLanguage as string) as Record<string, string>,
  }));
  const edges = seeded.relations.map((e) => ({
    fromKey: seeded.conceptIdToKey.get(e.fromConceptId) ?? e.fromConceptId,
    toKey: seeded.conceptIdToKey.get(e.toConceptId) ?? e.toConceptId,
    relationType: e.relationType,
    confidence: e.confidence,
    source: e.source,
  }));
  // Explicit provenance: every original concept term is preserved on the
  // winner it folds into (source/language from the seed row itself).
  const provenance: Record<string, { source?: string; language?: string }> = {};
  for (const c of seeded.concepts) {
    const labels = JSON.parse(c.labelsByLanguage as string) as Record<string, string>;
    provenance[c.key] = { source: c.source, language: Object.keys(labels)[0] ?? 'en' };
  }
  return dedupConcepts(concepts, edges, { provenance });
}

// ---------------------------------------------------------------------------
// Stage E — Map
// ---------------------------------------------------------------------------

async function runStageE(seeded: SeedOut, now: string): Promise<MapResult> {
  const port = new NoopLlmPort();
  const refs = seeded.verseConcepts.map((vc) => ({
    conceptKey: seeded.conceptIdToKey.get(vc.conceptId) ?? vc.conceptId,
    verseId: vc.verseId,
    refKind: 'head' as const,
    confidence: vc.confidence,
  }));
  return mapVerseRoles({ refs, activeVerses: [] }, port, now);
}

// ---------------------------------------------------------------------------
// Stage F — Relations
// ---------------------------------------------------------------------------

function versesByConceptFrom(seeded: SeedOut): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const vc of seeded.verseConcepts) {
    const key = seeded.conceptIdToKey.get(vc.conceptId) ?? vc.conceptId;
    (out[key] ?? (out[key] = [])).push(vc.verseId);
  }
  return out;
}

function runStageF(seeded: SeedOut, normalized: ReturnType<typeof runStageD>, alignedCrossrefs?: StageAOut['alignedCrossrefs']) {
  const versesByConcept = versesByConceptFrom(seeded);
  // When the source crossref dataset is present, its aligned edges take
  // precedence over the curated fallback.
  return runRelations({
    shared: {
      versesByConcept,
      meanConfidenceByConcept: Object.fromEntries(
        Object.keys(versesByConcept).map((k) => [k, 0.95])
      ),
      minConfidence: 0.7,
    },
    alignedCrossrefs,
  });
}

// ---------------------------------------------------------------------------
// Stage G — Communities
// ---------------------------------------------------------------------------

async function runStageG(
  seeded: SeedOut,
  normalized: ReturnType<typeof runStageD>,
  now: string
): Promise<CommunityOut> {
  const port = new NoopLlmPort();
  const versesByConcept: Record<string, string[]> = {};
  for (const [key, verses] of Object.entries(versesByConceptFrom(seeded))) {
    const normKey = normalized.folded[key] ?? key;
    (versesByConcept[normKey] ?? (versesByConcept[normKey] = [])).push(...verses);
  }
  const conceptEdges = normalized.edges.map((e) => ({
    fromKey: e.fromKey,
    toKey: e.toKey,
  }));
  return runCommunities(
    {
      degree: normalized.degree,
      versesByConcept,
      conceptEdges,
      seedLabels: normalized.seedLabels,
      now,
    },
    port
  );
}

// ---------------------------------------------------------------------------
// Stage H — Validate (in-memory rows, camelCase field names)
// ---------------------------------------------------------------------------

function buildInMemoryRows(
  seeded: SeedOut,
  mapResult: MapResult,
  relations: ReturnType<typeof runStageF>,
  sameCommunity: ReturnType<typeof buildSameCommunityRelations>,
  communities: CommunityOut
): InMemoryRows {
  const conceptIds = new Set(seeded.concepts.map((c) => c.id));

  // verse_concepts: Stage C head rows + Stage E accepted rows, deduped on
  // (verse, concept, role) — first-seen wins, byte-stable input order.
  const vcSeen = new Map<string, Record<string, unknown>>();
  for (const vc of seeded.verseConcepts) {
    const k = `${vc.verseId}|${vc.conceptId}|${vc.role}`;
    vcSeen.set(k, {
      id: vc.id,
      verseId: vc.verseId,
      conceptId: vc.conceptId,
      role: vc.role,
      confidence: vc.confidence,
      source: vc.source,
    });
  }
  for (const row of mapResult.rows) {
    if (row.status !== 'accepted') continue; // unresolved rows are flagged, not inserted
    const conceptId = seeded.conceptKeyToId.get(row.conceptKey);
    if (!conceptId || !conceptIds.has(conceptId)) continue;
    const k = `${row.verseId}|${conceptId}|${row.role}`;
    if (!vcSeen.has(k)) {
      vcSeen.set(k, {
        id: row.id,
        verseId: row.verseId,
        conceptId,
        role: row.role,
        confidence: row.confidence,
        source: row.source,
      });
    }
  }

  const verseRelations: Array<Record<string, unknown>> = [
    ...relations.crossrefs.map((r: VerseRelationRow) => ({
      id: r.id,
      fromVerseId: r.fromVerseId,
      toVerseId: r.toVerseId,
      relationType: r.relationType,
      conceptId: r.conceptId,
      communityId: r.communityId,
      confidence: r.confidence,
      source: r.source,
    })),
    ...relations.shared.map((r: VerseRelationRow) => ({
      id: r.id,
      fromVerseId: r.fromVerseId,
      toVerseId: r.toVerseId,
      relationType: r.relationType,
      conceptId: r.conceptId,
      communityId: r.communityId,
      confidence: r.confidence,
      source: r.source,
    })),
    ...sameCommunity.map((r: VerseRelationRow) => ({
      id: r.id,
      fromVerseId: r.fromVerseId,
      toVerseId: r.toVerseId,
      relationType: r.relationType,
      conceptId: r.conceptId,
      communityId: r.communityId,
      confidence: r.confidence,
      source: r.source,
    })),
  ];

  return {
    concepts: seeded.concepts.map((c) => ({
      id: c.id,
      confidence: c.confidence,
      status: c.status,
    })),
    concept_relations: seeded.relations.map((r) => ({
      id: r.id,
      fromConceptId: r.fromConceptId,
      toConceptId: r.toConceptId,
      relationType: r.relationType,
      confidence: r.confidence,
      source: r.source,
    })),
    verse_concepts: Array.from(vcSeen.values()),
    verse_relations: verseRelations,
    communities: communities.communities.map((c) => ({
      id: c.id,
      name: c.name,
      sourceConceptId: c.sourceConceptId,
      size: c.size,
      coherence: c.coherence,
      source: c.source,
    })),
  };
}

// ---------------------------------------------------------------------------
// Orchestration
// ---------------------------------------------------------------------------

export async function runPipeline(opts: RunOptions = {}): Promise<{
  report: PipelineReport;
  h: HResult;
}> {
  const root = opts.cwd ?? process.cwd();
  const now = opts.now ?? DEFAULT_NOW;
  const write = opts.write ?? true;
  const semanticDir = join(root, 'data', 'bible', 'semantic');

  const stages: StageResult[] = [];
  const mark = (stage: string, startedAt: number, counts: Record<string, number>, errors: string[] = []) => {
    stages.push({
      stage,
      ok: errors.length === 0,
      counts,
      durationMs: Math.max(0, Date.now() - startedAt),
      errors,
    });
  };

  // --- A ---
  let t = Date.now();
  const stageA = runStageA(opts);
  mark(
    'A-import',
    t,
    {
      datasets: stageA.datasetsCount,
      verses: stageA.verseCount,
      book_ids: stageA.universeBookIds,
      seed_concepts: stageA.minimalSeed.concepts.length,
      seed_relations: stageA.minimalSeed.relations.length,
    },
    stageA.errors
  );

  // --- B ---
  t = Date.now();
  const aligned = runStageB(stageA.minimalSeed);
  mark('B-align', t, aligned.stats);

  // --- C ---
  t = Date.now();
  const seeded = runStageC(stageA.minimalSeed, now);
  mark('C-seed', t, seeded.stats);

  // --- D ---
  t = Date.now();
  const normalized = runStageD(seeded);
  mark('D-normalize', t, normalized.stats);

  // --- E ---
  t = Date.now();
  const mapped = await runStageE(seeded, now);
  mark('E-map', t, mapped.stats);

  // --- F ---
  t = Date.now();
  const relations = runStageF(seeded, normalized, stageA.alignedCrossrefs);
  mark('F-relations', t, relations.stats);

  // --- G ---
  t = Date.now();
  const communities = await runStageG(seeded, normalized, now);
  mark('G-communities', t, communities.stats);

  // --- G′ — SAME_COMMUNITY verse edges (Stage G owns the community ids;
  //      Stage F's deterministic builder emits the verse pairs).
  t = Date.now();
  const emittedPairs = new Set<string>();
  for (const r of relations.crossrefs) emittedPairs.add(`CC:${r.fromVerseId}:${r.toVerseId}`);
  for (const r of relations.shared) emittedPairs.add(`CC:${r.fromVerseId}:${r.toVerseId}`);
  const sameCommunity = buildSameCommunityRelations({
    communities: communities.communities.map((c) => ({
      id: c.id,
      name: c.name,
      verseIds: c.verseIds,
      sourceConceptKey: c.sourceConceptKey ?? undefined,
    })),
    skipKeys: emittedPairs,
  });
  mark('G2-same-community', t, {
    communities_with_edges: sameCommunity.filter((r) => r.communityId).length,
    edges: sameCommunity.length,
  });

  // --- H ---
  t = Date.now();
  const rows = buildInMemoryRows(seeded, mapped, relations, sameCommunity, communities);
  const baseH = runHChecksInMemory(rows, { orphanThreshold: 0.2 });
  const extendedH = runExtendedChecks({
    rows,
    verseUniverse: stageA.universeVerses,
    concepts: Object.values(normalized.concepts) as unknown as Array<Record<string, unknown>>,
    conceptEdges: normalized.edges as unknown as Array<Record<string, unknown>>,
    conceptIds: seeded.concepts.map((c) => c.id),
    verseConcepts: seeded.verseConcepts as unknown as Array<Record<string, unknown>>,
  });
  const h: HResult = {
    passed: baseH.passed && extendedH.passed,
    violations: [...baseH.violations, ...extendedH.violations],
    counts: { ...baseH.counts, ...extendedH.counts },
  };
  const hErrors = h.violations.map((v) => `${v.check}: ${v.detail}`);
  mark(
    'H-validate',
    t,
    {
      ...(h.counts as unknown as Record<string, number>),
      passed: h.passed ? 1 : 0,
    },
    hErrors
  );

  const report: PipelineReport = {
    ranAt: now,
    idempotent: true,
    stages,
    validation: {
      passed: h.passed,
      details: h.violations.reduce<Record<string, string>>((acc, v) => {
        acc[v.check] = v.detail;
        return acc;
      }, {}),
    },
  };

  // The dataset report is derived from `report` + `h` only — deterministic
  // (no wall-clock), so the build stays byte-identical on re-runs.
  const datasetReport = buildDatasetReport(report, h, stageA);

  // --- Output (git-safe JSON; reverted on H failure) ---
  // The persisted report zeroes `durationMs` (real wall-clock is
  // non-reproducible); the in-memory `report` keeps it for diagnostics.
  const persistedReport: PipelineReport = {
    ...report,
    stages: report.stages.map((s) => ({ ...s, durationMs: 0 })),
  };
  const out = {
    aligned: {
      labels: aligned.normalized,
      stats: aligned.stats,
    },
    concepts: {
      concepts: seeded.concepts,
      relations: seeded.relations,
    },
    normalize: {
      concepts: normalized.concepts,
      edges: normalized.edges,
      degree: normalized.degree,
      stats: normalized.stats,
    },
    'verse-concepts': {
      verseConcepts: seeded.verseConcepts,
      mapped: mapped.rows,
    },
    relations: {
      crossrefs: relations.crossrefs,
      shared: relations.shared,
    },
    communities: {
      communities: communities.communities,
      stats: communities.stats,
    },
  };

  if (write) {
    const subs = ['aligned', 'concepts', 'normalize', 'verse-concepts', 'relations', 'communities', 'report'];
    if (!h.passed) {
      // Revert the offending batch: staged outputs must not ship.
      for (const sub of subs) {
        rmSync(join(semanticDir, sub), { recursive: true, force: true });
      }
      mkdirSync(join(semanticDir, 'report'), { recursive: true });
      writeFileSync(
        join(semanticDir, 'report', 'pipeline-report.json'),
        JSON.stringify(persistedReport, null, 2) + '\n',
        'utf8'
      );
    } else {
      const writeJson = (rel: string, value: unknown) => {
        const target = join(semanticDir, rel, 'index.json');
        mkdirSync(dirname(target), { recursive: true });
        writeFileSync(target, JSON.stringify(value, null, 2) + '\n', 'utf8');
      };
      writeJson('aligned', out.aligned);
      writeJson('concepts', out.concepts);
      writeJson('normalize', out.normalize);
      writeJson('verse-concepts', out['verse-concepts']);
      writeJson('relations', out.relations);
      writeJson('communities', out.communities);
      mkdirSync(join(semanticDir, 'report'), { recursive: true });
      writeFileSync(
        join(semanticDir, 'report', 'pipeline-report.json'),
        JSON.stringify(persistedReport, null, 2) + '\n',
        'utf8'
      );
    }
    // Dataset report (json + markdown) is always written — it is the
    // machine-readable PASS/FAIL the pipeline run must end with.
    writeFileSync(
      join(semanticDir, 'report', 'semantic-dataset-report.json'),
      JSON.stringify(datasetReport, null, 2) + '\n',
      'utf8'
    );
    writeFileSync(
      join(semanticDir, 'report', 'semantic-dataset-report.md'),
      renderDatasetReportMarkdown(datasetReport),
      'utf8'
    );
  }

  return { report, h };
}

// ---------------------------------------------------------------------------
// Dataset report (Stage H output, machine-readable PASS/FAIL)
// ---------------------------------------------------------------------------

export interface DatasetReport {
  result: 'PASS' | 'FAIL';
  ranAt: string;
  datasets: number;
  verseUniverse: number;
  bookIds: number;
  concepts: number;
  conceptRelations: number;
  verseConcepts: number;
  verseRelations: number;
  communities: number;
  checks: Record<string, 'pass' | 'fail'>;
  details: Record<string, string>;
}

/**
 * Build the dataset report from the pipeline report + Stage H result.
 * Pure — no I/O, no clock. The `result` field is the machine-readable
 * PASS/FAIL the run must end with.
 */
export function buildDatasetReport(
  report: PipelineReport,
  h: HResult,
  stageA: StageAOut
): DatasetReport {
  // One 'pass'/'fail' entry per check — the invariants named in the
  // design decision + the extended checks run in `runExtendedChecks`.
  const CHECKS = [
    'verse_ids_resolve',
    'concept_ids_resolve',
    'no_orphan_verse_concepts',
    'no_self_relations',
    'no_child_of_cycles',
    'no_empty_communities',
    'confidence_valid',
    'unique_canonical_concepts',
    'orphan_fk_verse_concepts',
    'orphan_fk_concept_relations',
    'orphan_fk_communities',
    'confidence_in_range',
    'no_self_loops',
    'unique_verse_concept_role',
    'unique_concept_relation_pair',
    'unique_verse_relation',
    'community_provenance',
    'orphan_concept_ratio',
  ] as const;

  const failedChecks = new Set(h.violations.map((v) => v.check));
  const checks: Record<string, 'pass' | 'fail'> = {};
  for (const c of CHECKS) checks[c] = failedChecks.has(c) ? 'fail' : 'pass';

  const stageF = report.stages.find((s) => s.stage === 'F-relations');
  const stageC = report.stages.find((s) => s.stage === 'C-seed');
  const stageG = report.stages.find((s) => s.stage === 'G-communities');

  return {
    result: h.passed ? 'PASS' : 'FAIL',
    ranAt: report.ranAt,
    datasets: stageA.datasetsCount,
    verseUniverse: stageA.verseCount,
    bookIds: stageA.universeBookIds,
    concepts: stageC?.counts.concepts ?? 0,
    conceptRelations: stageC?.counts.relations ?? 0,
    verseConcepts: stageC?.counts.verse_concepts ?? 0,
    verseRelations:
      (stageF?.counts.crossrefs ?? 0) +
      (stageF?.counts.shared_concept ?? 0) +
      (stageF?.counts.same_community ?? 0),
    communities: stageG?.counts.communities_minted ?? 0,
    checks,
    details: h.violations.reduce<Record<string, string>>((acc, v) => {
      acc[v.check] = v.detail;
      return acc;
    }, {}),
  };
}

/** Render the dataset report as markdown (deterministic — no wall-clock). */
export function renderDatasetReportMarkdown(r: DatasetReport): string {
  const lines: string[] = [];
  lines.push('# Semantic dataset report');
  lines.push('');
  lines.push(`**Result:** ${r.result}`);
  lines.push('');
  lines.push(`- run: ${r.ranAt}`);
  lines.push(`- datasets: ${r.datasets}`);
  lines.push(`- verse universe: ${r.verseUniverse}`);
  lines.push(`- book ids: ${r.bookIds}`);
  lines.push(`- concepts: ${r.concepts}`);
  lines.push(`- concept relations: ${r.conceptRelations}`);
  lines.push(`- verse concepts: ${r.verseConcepts}`);
  lines.push(`- verse relations: ${r.verseRelations}`);
  lines.push(`- communities: ${r.communities}`);
  lines.push('');
  lines.push('## Checks');
  lines.push('');
  for (const [name, res] of Object.entries(r.checks)) {
    lines.push(`- ${res === 'pass' ? 'PASS' : 'FAIL'}: \`${name}\``);
  }
  if (Object.keys(r.details).length > 0) {
    lines.push('');
    lines.push('## Violations');
    lines.push('');
    for (const [name, detail] of Object.entries(r.details)) {
      lines.push(`- \`${name}\`: ${detail}`);
    }
  }
  lines.push('');
  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// CLI entry point
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const { report, h } = await runPipeline({ write: true });
  const root = process.cwd();
  const stageA: StageAOut = {
    datasetsCount: 0,
    verseCount: 0,
    universeVerses: [],
    universeBookIds: 0,
    alignedCrossrefs: [],
    minimalSeed: buildMinimalSeed({ now: report.ranAt }),
    errors: [],
  };
  // Re-run Stage A bookkeeping just for the report numbers (deterministic,
  // cheap relative to the full pipeline).
  const { datasets, universe } = loadVerseUniverse(join(root, 'data', 'bible'), stageA.errors);
  stageA.datasetsCount = datasets.length;
  stageA.verseCount = universe.verses.length;
  stageA.universeVerses = universe.verses;
  stageA.universeBookIds = universe.bookIds.length;
  const dataset = buildDatasetReport(report, h, stageA);
  for (const s of report.stages) {
    const ok = s.ok ? 'ok' : 'FAIL';
    const counts = Object.entries(s.counts)
      .map(([k, v]) => `${k}=${v}`)
      .join(' ');
    console.log(`[semantic] ${s.stage.padEnd(15)} ${ok}  ${counts}`);
    for (const e of s.errors) console.log(`         ${e}`);
  }
  console.log(
    `[semantic] Stage H passed=${h.passed}  (concepts=${h.counts.concepts}, orphan ratio=${h.counts.orphan_concept_ratio})`
  );
  console.log(`[semantic] dataset report: ${dataset.result}`);
  for (const [name, detail] of Object.entries(dataset.details)) {
    console.log(`         ${name}: ${detail}`);
  }
  if (!h.passed || report.stages.some((s) => !s.ok)) {
    process.exit(1);
  }
}

if (process.argv[1] && process.argv[1].endsWith('run.ts')) {
  main().catch((err) => {
    console.error('[semantic] fatal:', err);
    process.exit(1);
  });
}
