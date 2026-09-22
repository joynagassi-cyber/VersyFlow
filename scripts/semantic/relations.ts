/**
 * Stage F — Relations (DETERMINISTIC, no LLM).
 *
 * Expands the concept graph into verse_relations:
 *
 *  - CROSS_REFERENCE: direct edges from the crossref dataset
 *    (`data/bible/semantic/raw/crossrefs.json` when present; otherwise
 *    the deterministic fallback pairs below). Emitted once per
 *    unordered pair (lexicographic lower verse id first), deduplicated.
 *  - SHARED_CONCEPT: two verses co-occur under one concept with mean
 *    edge confidence ≥ 0.7. Computed over the verse_concept roles from
 *    Stage E (PRIMARY/SECONDARY only count; RELATED does not raise the
 *    co-occurrence bar).
 *  - SAME_COMMUNITY: every verse pair within a structurally-validated
 *    community's verse set, attributed to the community's anchor
 *    concept. Pairs already emitted as CROSS_REFERENCE / SHARED_CONCEPT
 *    are skipped (first-emitted relation type wins, deterministically).
 */

import { detUuid } from './helpers';

export interface CrossrefEdge {
  fromVerseId: string;
  toVerseId: string;
  /** Confidence in [0,1]; defaults to 0.8 for the curated fallback set. */
  confidence?: number;
  source?: string;
}

/**
 * A pre-aligned source-dataset crossref edge (Stage A import). When the
 * eBible 1.1M-edge crossref dataset is present under
 * `data/bible/semantic/raw/`, its edges feed in here ALIGNED — i.e. every
 * verse key already in the canonical `bookId:chapter:verse` form.
 */
export interface AlignedCrossrefEdge {
  /** Canonical verse key `bookId:chapter:verse`. */
  fromVerseId: string;
  /** Canonical verse key `bookId:chapter:verse`. */
  toVerseId: string;
  confidence?: number;
  source?: string;
}

export interface SharedConceptInput {
  /** conceptKey → verse keys attached to it (any role). */
  versesByConcept: Record<string, string[]>;
  /**
   * conceptKey → mean confidence of its verse↔concept edges. When a
   * concept has no recorded confidence, the co-occurrence is admitted at
   * the default 0.7 (the stage floor).
   */
  meanConfidenceByConcept?: Record<string, number>;
  minConfidence?: number;
}

export interface VerseRelationRow {
  id: string;
  fromVerseId: string;
  toVerseId: string;
  relationType: 'CROSS_REFERENCE' | 'SHARED_CONCEPT' | 'SAME_COMMUNITY';
  conceptId?: string;
  /** Community id; set on SAME_COMMUNITY rows (Stage G owns the id). */
  communityId?: string;
  confidence: number;
  source: string;
}

export interface SameCommunityInput {
  id: string;
  name: string;
  verseIds: string[];
  sourceConceptKey?: string;
}

export interface RelationsOut {
  crossrefs: VerseRelationRow[];
  shared: VerseRelationRow[];
  sameCommunity: VerseRelationRow[];
  stats: Record<string, number>;
}

/**
 * Curated, deterministic cross-ref pairs (used when no crossref dataset
 * is checked in — the eBible crossref dataset is ~1.1M edges and is
 * intentionally NOT vendored into the repo; this fallback keeps the
 * pipeline runnable and git-safe).
 *
 * Every pair is emitted undirected once (lower verse id first).
 */
const FALLBACK_CROSSREFS: CrossrefEdge[] = [
  { fromVerseId: 'gen:1:1', toVerseId: 'heb:11:3', confidence: 0.9 },
  { fromVerseId: 'joh:3:16', toVerseId: 'rom:5:8', confidence: 0.9 },
  { fromVerseId: 'joh:1:1', toVerseId: 'col:1:15', confidence: 0.8 },
  { fromVerseId: 'mat:5:14', toVerseId: 'luk:11:36', confidence: 0.7 },
  { fromVerseId: 'rom:3:23', toVerseId: 'rom:3:24', confidence: 0.95 },
  { fromVerseId: 'eph:2:8', toVerseId: 'eph:2:9', confidence: 0.95 },
  { fromVerseId: 'joh:14:6', toVerseId: 'act:4:12', confidence: 0.85 },
  { fromVerseId: 'psa:23:1', toVerseId: '1pet:2:25', confidence: 0.6 },
  { fromVerseId: 'mat:7:7', toVerseId: 'luk:6:37', confidence: 0.8 },
  { fromVerseId: 'gal:5:22', toVerseId: 'rom:6:22', confidence: 0.7 },
  { fromVerseId: 'heb:11:1', toVerseId: 'heb:11:6', confidence: 0.9 },
  { fromVerseId: 'joh:1:5', toVerseId: '1joh:1:5', confidence: 0.85 },
];

function canonicalPair(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

function rowId(type: string, from: string, to: string, conceptId?: string): string {
  return detUuid(`stage-f-${type}:${from}:${to}${conceptId ? `:${conceptId}` : ''}`);
}

export function runRelations(input: {
  crossrefs?: CrossrefEdge[];
  shared?: SharedConceptInput;
  /** Pre-aligned source crossref edges (Stage A import); preferred over `crossrefs` when non-empty. */
  alignedCrossrefs?: AlignedCrossrefEdge[];
  /** Structurally-validated communities from Stage G (for SAME_COMMUNITY rows). */
  communities?: SameCommunityInput[];
}): RelationsOut {
  const sharedInput = input.shared;
  const alignedCrossrefs = input.alignedCrossrefs;
  const communities = input.communities;

  // Deterministic CROSS_REFERENCE rows from the source crossref dataset
  // (aligned edges when the source dataset is present; otherwise the
  // curated per-call crossrefs; otherwise the curated fallback).
  const xrefEdges: CrossrefEdge[] =
    alignedCrossrefs && alignedCrossrefs.length > 0
      ? alignedCrossrefs
      : input.crossrefs && input.crossrefs.length > 0
        ? input.crossrefs
        : FALLBACK_CROSSREFS;
  const crossrefs = buildCrossrefRelations(xrefEdges);

  // SHARED_CONCEPT rows: co-occurrence under one concept at ≥ 0.7 mean
  // edge confidence.
  const shared = sharedInput ? buildSharedConceptRelations(sharedInput) : [];

  // SAME_COMMUNITY rows: every verse pair within a community's verse set,
  // attributed to the community's anchor. Skips pairs already emitted as
  // CROSS_REFERENCE / SHARED_CONCEPT (first-emitted relation type wins,
  // deterministically).
  const emittedPairs = new Set<string>();
  for (const r of crossrefs) emittedPairs.add(`CC:${r.fromVerseId}:${r.toVerseId}`);
  for (const r of shared) emittedPairs.add(`CC:${r.fromVerseId}:${r.toVerseId}`);
  const sameCommunity =
    communities && communities.length > 0
      ? buildSameCommunityRelations({ communities, skipKeys: emittedPairs })
      : [];

  return {
    crossrefs,
    shared,
    sameCommunity,
    stats: {
      crossrefs: crossrefs.length,
      shared_concept: shared.length,
      same_community: sameCommunity.length,
    },
  };
}

/**
 * Deterministic CROSS_REFERENCE rows (deduped, undirected).
 */
export function buildCrossrefRelations(edges: CrossrefEdge[], source = 'stage-F:crossref'): VerseRelationRow[] {
  const seen = new Set<string>();
  const out: VerseRelationRow[] = [];
  for (const e of edges) {
    if (e.fromVerseId === e.toVerseId) continue;
    const conf = e.confidence ?? 0.8;
    if (conf <= 0) continue;
    const [lo, hi] = canonicalPair(e.fromVerseId, e.toVerseId);
    const key = `${lo}|${hi}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      id: rowId('CROSS_REFERENCE', lo, hi),
      fromVerseId: lo,
      toVerseId: hi,
      relationType: 'CROSS_REFERENCE',
      confidence: conf,
      source: e.source ?? source,
    });
  }
  return out;
}

/**
 * SHARED_CONCEPT rows: for each concept, every pair of its verses forms a
 * shared-concept edge when the concept's mean edge confidence clears the
 * floor (default 0.7). Pairs are emitted undirected once.
 */
export function buildSharedConceptRelations(input: SharedConceptInput): VerseRelationRow[] {
  const minConf = input.minConfidence ?? 0.7;
  const out: VerseRelationRow[] = [];
  const seen = new Set<string>();

  for (const [conceptKey, verses] of Object.entries(input.versesByConcept)) {
    const mean = input.meanConfidenceByConcept?.[conceptKey] ?? minConf;
    if (mean < minConf) continue;
    const uniq = Array.from(new Set(verses)).sort();
    for (let i = 0; i < uniq.length; i++) {
      for (let j = i + 1; j < uniq.length; j++) {
        const [lo, hi] = canonicalPair(uniq[i], uniq[j]);
        const key = `SC:${conceptKey}:${lo}:${hi}`;
        if (seen.has(key)) continue;
        seen.add(key);
        out.push({
          id: rowId('SHARED_CONCEPT', lo, hi, conceptKey),
          fromVerseId: lo,
          toVerseId: hi,
          relationType: 'SHARED_CONCEPT',
          conceptId: conceptKey,
          confidence: Math.min(mean, 1),
          source: `stage-F:shared:${conceptKey}`,
        });
      }
    }
  }
  return out;
}

/**
 * SAME_COMMUNITY rows: every verse pair within a community's verse set
 * (transitively co-occurring through shared concepts), attributed to the
 * community's anchor concept. Pairs are emitted undirected once, deduped
 * against `skipKeys` (already-emitted verse pairs) and internally.
 */
export function buildSameCommunityRelations(input: {
  communities: SameCommunityInput[];
  skipKeys?: Set<string>;
}): VerseRelationRow[] {
  const out: VerseRelationRow[] = [];
  const skip = input.skipKeys ?? new Set<string>();
  const seen = new Set<string>();
  for (const c of input.communities) {
    const uniq = Array.from(new Set(c.verseIds)).sort();
    for (let i = 0; i < uniq.length; i++) {
      for (let j = i + 1; j < uniq.length; j++) {
        const [lo, hi] = canonicalPair(uniq[i], uniq[j]);
        const key = `CC:${lo}:${hi}`;
        if (seen.has(key) || skip.has(key)) continue;
        seen.add(key);
        out.push({
          id: rowId('SAME_COMMUNITY', lo, hi, c.sourceConceptKey ?? c.name),
          fromVerseId: lo,
          toVerseId: hi,
          relationType: 'SAME_COMMUNITY',
          conceptId: c.sourceConceptKey,
          communityId: c.id,
          confidence: 0.8,
          source: `stage-F:same-community:${c.id}`,
        });
      }
    }
  }
  return out;
}

