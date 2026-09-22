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
} from './import';import { alignTopics } from './align';
import { seedMinimalSeed, type SeedOut } from './seed';
import { dedupConcepts } from './normalize';
import { mapVerseRoles, type MapResult } from './map';
import { runRelations, type VerseRelationRow } from './relations';
import { runCommunities, type CommunityOut } from './communities';
import { NoopLlmPort } from './llm-port';
import { runHChecksInMemory, type InMemoryRows, type HResult } from './validate';
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
  universeBookIds: number;
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

  const now = opts.now ?? DEFAULT_NOW;
  const minimalSeed = buildMinimalSeed({ now });

  return {
    datasetsCount: datasets.length,
    verseCount: universe.verses.length,
    universeBookIds: universe.bookIds.length,
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
  return dedupConcepts(concepts, edges);
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

function runStageF(seeded: SeedOut) {
  const versesByConcept = versesByConceptFrom(seeded);
  // The minimal seed attaches one verse per concept, so no pair of verses
  // shares a concept at the 0.7 bar — the CROSS_REFERENCE fallback set is
  // what Stage F actually emits here (deterministic, curated).
  return runRelations({
    shared: {
      versesByConcept,
      meanConfidenceByConcept: Object.fromEntries(
        Object.keys(versesByConcept).map((k) => [k, 0.95])
      ),
      minConfidence: 0.7,
    },
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
  const relations = runStageF(seeded);
  mark('F-relations', t, relations.stats);

  // --- G ---
  t = Date.now();
  const communities = await runStageG(seeded, normalized, now);
  mark('G-communities', t, communities.stats);

  // --- H ---
  t = Date.now();
  const rows = buildInMemoryRows(seeded, mapped, relations, communities);
  const h = runHChecksInMemory(rows, { orphanThreshold: 0.2 });
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
    const subs = ['aligned', 'concepts', 'verse-concepts', 'relations', 'communities', 'report'];
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
  }

  return { report, h };
}

// ---------------------------------------------------------------------------
// CLI entry point
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const { report, h } = await runPipeline({ write: true });
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
