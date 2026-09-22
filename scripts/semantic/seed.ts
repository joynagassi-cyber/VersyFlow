/**
 * Stage C — Seed (DETERMINISTIC, no LLM).
 *
 * Takes aligned NEUU topics/edges (Stage A import, Stage B alignment) and the
 * documented minimal seed (Stage A `buildMinimalSeed`, used when the NEUU
 * layers are absent), and materializes the schema row shapes:
 *
 *  - concepts: one row per canonical concept. `status = 'accepted'` ONLY
 *    when the source dataset is authoritative (the seed and the 02_unified /
 *    01_structured layers are; a raw 01_parsed Nave dump is treated as
 *    authoritative too — CC-BY-4.0, 5,745 topics / 65,485 refs). Anything
 *    else stays 'unresolved'.
 *  - concept_relations: edges de-duplicated on (from, to, relation_type);
 *    CONTRASTS edges always carry `source = 'derived'`.
 *  - verse_concepts: the deterministic head-verse PRIMARY rows (one per
 *    concept that declares a head verse). Stage E later extends this with
 *    SECONDARY/RELATED; CONTRAST is never produced here.
 *
 * All row ids are `detUuid(...)` — deterministic, so a re-run on the same
 * input is byte-identical (git-safe). Timestamps are pinned by the caller
 * (`now`), not read from the clock.
 */

import { detUuid } from './helpers';
import type { SeedConcept, SeedRelation } from './import';

// ---------------------------------------------------------------------------
// Row shapes (mirror src/infrastructure/semantic/types.ts)
// ---------------------------------------------------------------------------

export interface SeededConceptRow {
  id: string;
  labelsByLanguage: string; // JSON-encoded per the schema (spec-mandated)
  canonicalLabel: string;
  kind: SeedConcept['kind'];
  source: string;
  definition: string | null;
  status: 'unresolved' | 'accepted' | 'rejected';
  confidence: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  /** Seed-only pipeline field: stable key the other stages join on. */
  key: string;
  /** Seed-only: the concept's head verse (Stage E attaches it PRIMARY). */
  headVerse?: string;
}

export interface SeededRelationRow {
  id: string;
  fromConceptId: string;
  toConceptId: string;
  relationType: SeedRelation['relationType'];
  confidence: number;
  source: string;
  createdAt: string;
}

export interface SeededVerseConceptRow {
  id: string;
  verseId: string;
  conceptId: string;
  role: 'PRIMARY' | 'SECONDARY' | 'CONTRAST' | 'RELATED';
  confidence: number;
  source: string;
  createdAt: string;
}

export interface SeedOut {
  concepts: SeededConceptRow[];
  relations: SeededRelationRow[];
  verseConcepts: SeededVerseConceptRow[];
  /** Pipeline concept key → row id (for Stages D–G joins). */
  conceptKeyToId: Map<string, string>;
  /** Row id → pipeline concept key (reverse lookup). */
  conceptIdToKey: Map<string, string>;
  stats: Record<string, number>;
}

export interface SeedOptions {
  /** Pinned timestamp (ISO-8601 UTC) — never read the clock. */
  now: string;
  /**
   * Markers of which inputs are authoritative. The seed (CC-BY-4.0 Nave
   * derivative) is authoritative; layer topics carry their own flag.
   */
  authoritativeKeys?: Set<string>;
}

/**
 * Seed schema rows from a set of concepts + edges. Pure — returns rows,
 * writes nothing. Idempotent for identical input (same ids, same order:
 * input order is preserved, edges are de-duplicated by first-seen).
 */
export function seedConcepts(
  concepts: Array<
    Omit<SeedConcept, 'id' | 'createdAt' | 'updatedAt'> & {
      key: string;
      headVerse?: string;
      definition?: string;
    }
  >,
  edges: Array<{
    fromKey: string;
    toKey: string;
    relationType: SeedRelation['relationType'];
    confidence: number;
    source?: string;
  }>,
  opts: SeedOptions
): SeedOut {
  const now = opts.now;
  const authoritativeKeys = opts.authoritativeKeys ?? new Set<string>();

  const conceptKeyToId = new Map<string, string>();
  const conceptIdToKey = new Map<string, string>();
  const outConcepts: SeededConceptRow[] = [];

  for (const c of concepts) {
    const id = detUuid(`stage-c-concept:${c.key}`);
    conceptKeyToId.set(c.key, id);
    conceptIdToKey.set(id, c.key);
    const status = authoritativeKeys.has(c.key) ? 'accepted' : 'unresolved';
    outConcepts.push({
      id,
      labelsByLanguage: JSON.stringify(c.labelsByLanguage ?? { en: c.canonicalLabel }),
      canonicalLabel: c.canonicalLabel,
      kind: c.kind,
      source: c.source,
      definition: c.definition ?? null,
      status,
      confidence: c.confidence,
      createdBy: c.createdBy,
      createdAt: now,
      updatedAt: now,
      key: c.key,
      headVerse: c.headVerse,
    });
  }

  // --- concept_relations ---------------------------------------------------
  const seen = new Set<string>();
  const outRelations: SeededRelationRow[] = [];
  for (const e of edges) {
    const fromId = conceptKeyToId.get(e.fromKey);
    const toId = conceptKeyToId.get(e.toKey);
    if (!fromId || !toId || fromId === toId) continue; // no orphans, no self-loops
    const type = e.relationType;
    const src = type === 'CONTRASTS' ? 'derived' : (e.source ?? 'derived');
    const dedupKey = `${fromId}|${toId}|${type}`;
    if (seen.has(dedupKey)) continue;
    seen.add(dedupKey);
    outRelations.push({
      id: detUuid(`stage-c-edge:${dedupKey}`),
      fromConceptId: fromId,
      toConceptId: toId,
      relationType: type,
      confidence: e.confidence,
      source: src,
      createdAt: now,
    });
  }

  // --- verse_concepts (head-verse PRIMARY rows only) -----------------------
  const outVerseConcepts: SeededVerseConceptRow[] = [];
  for (const c of outConcepts) {
    if (!c.headVerse) continue;
    outVerseConcepts.push({
      id: detUuid(`stage-c-vc:${c.id}:${c.headVerse}:PRIMARY`),
      verseId: c.headVerse,
      conceptId: c.id,
      role: 'PRIMARY',
      confidence: 0.95,
      source: `stage-C:${c.source}`,
      createdAt: now,
    });
  }

  return {
    concepts: outConcepts,
    relations: outRelations,
    verseConcepts: outVerseConcepts,
    conceptKeyToId,
    conceptIdToKey,
    stats: {
      concepts: outConcepts.length,
      relations: outRelations.length,
      verse_concepts: outVerseConcepts.length,
      accepted: outConcepts.filter((c) => c.status === 'accepted').length,
      unresolved: outConcepts.filter((c) => c.status === 'unresolved').length,
    },
  };
}

/**
 * Convenience wrapper for the documented minimal seed: takes the
 * `SeedResult` from `import.ts#buildMinimalSeed` and seeds it.
 * All seed concepts are authoritative (CC-BY-4.0 Nave derivative), so they
 * are stamped 'accepted'.
 */
export function seedMinimalSeed(
  seed: { concepts: SeedConcept[]; relations: SeedRelation[] },
  now: string
): SeedOut {
  const authoritative = new Set(seed.concepts.map((c) => c.key));

  // The minimal seed's relation rows already carry concept ids, not keys —
  // remap them back to keys for the generic seedConcepts() path.
  const idToKey = new Map(seed.concepts.map((c) => [c.id, c.key]));
  const edges = seed.relations.map((r) => ({
    fromKey: idToKey.get(r.fromConceptId) ?? r.fromConceptId,
    toKey: idToKey.get(r.toConceptId) ?? r.toConceptId,
    relationType: r.relationType,
    confidence: r.confidence,
    source: r.source,
  }));

  return seedConcepts(
    seed.concepts.map((c) => ({
      key: c.key,
      labelsByLanguage: c.labelsByLanguage,
      canonicalLabel: c.canonicalLabel,
      kind: c.kind,
      source: c.source,
      dataset: c.dataset,
      confidence: c.confidence,
      createdBy: c.createdBy,
      status: c.status,
      headVerse: c.headVerse,
    })),
    edges,
    { now, authoritativeKeys: authoritative }
  );
}
