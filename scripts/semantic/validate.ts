/**
 * Stage H — Validate (DETERMINISTIC, never LLM — this module is the gate).
 *
 * Runs the full set of semantic-layer invariants over a `QueryDriver` and
 * returns a structured `HResult`. Callers revert the offending batch and
 * flag rows 'unresolved' when `passed === false` (see run.ts).
 *
 * The semantic DB lives inside the existing PowerSync SQLite instance as
 * LOCAL_ONLY tables (deliberately NOT part of `buildPowerSyncSchema()`).
 * This module is pure: it takes the minimal `QueryDriver` interface so it
 * runs identically against better-sqlite3 (tests / e2e), a raw SQLite
 * file, or the in-app driver. No concrete driver is imported
 * (Interface/Adapter rule) and there is no I/O of its own.
 */

export interface QueryDriver {
  /** Run `sql` with positional params; returns rows as plain objects. */
  all(sql: string, ...params: unknown[]): Record<string, unknown>[];
  /** Run a single-row query; returns the row or null. */
  get(sql: string, ...params: unknown[]): Record<string, unknown> | null;
}

export interface HViolation {
  check: string;
  detail: string;
  /** Offending row ids / verse keys (bounded, for the report). */
  rows: string[];
}

export interface HResult {
  passed: boolean;
  violations: HViolation[];
  counts: Record<string, number | string>;
}

// ---------------------------------------------------------------------------
// Invariant query text (Stage H — deterministic; no LLM involved anywhere)
// ---------------------------------------------------------------------------

const SELF_LOOP_SQL = `
  select id from concept_relations
  where from_concept_id = to_concept_id
  union all
  select id from verse_relations
  where from_verse_id = to_verse_id
`;

const OUT_OF_RANGE_CONF_SQL = `
  select id from concepts where confidence < 0.0 or confidence > 1.0
  union all
  select id from concept_relations where confidence < 0.0 or confidence > 1.0
  union all
  select id from verse_concepts where confidence < 0.0 or confidence > 1.0
  union all
  select id from verse_relations where confidence < 0.0 or confidence > 1.0
  union all
  select id from communities where coherence < 0.0 or coherence > 1.0
`;

const ORPHAN_VC_SQL = `
  select vc.id, vc.concept_id from verse_concepts vc
  left join concepts c on c.id = vc.concept_id
  where c.id is null
`;

const ORPHAN_CR_SQL = `
  select cr.id, cr.from_concept_id, cr.to_concept_id from concept_relations cr
  left join concepts cf on cf.id = cr.from_concept_id
  left join concepts ct on ct.id = cr.to_concept_id
  where cf.id is null or ct.id is null
`;

const ORPHAN_COMMUNITY_FK_SQL = `
  select c.id, c.source_concept_id from communities c
  left join concepts cc on cc.id = c.source_concept_id
  where c.source_concept_id is not null and cc.id is null
`;

/**
 * Run every Stage H invariant check. `acceptedCommunitySource` is the
 * provenance marker written by Stage G on communities that traced to a
 * structural partition; any community WITHOUT it is a violation ("never
 * accept a community just because an LLM gave it a plausible name").
 *
 * `orphanThreshold` bounds the fraction of concepts that may carry no
 * link of any kind (default 0.2 — a fresh batch may seed a few unlinked
 * concepts, but the graph itself must stay well-connected).
 */
export function runHChecks(
  driver: QueryDriver,
  opts: {
    acceptedCommunitySource?: string;
    maxRowsPerCheck?: number;
    orphanThreshold?: number;
  } = {}
): HResult {
  const acceptedCommunitySource = opts.acceptedCommunitySource ?? 'louvain-v1';
  const maxRows = opts.maxRowsPerCheck ?? 25;
  const orphanThreshold = opts.orphanThreshold ?? 0.2;
  const violations: HViolation[] = [];

  const add = (check: string, rows: Record<string, unknown>[]) => {
    if (rows.length === 0) return;
    const ids = rows
      .slice(0, maxRows)
      .map(
        (r) =>
          String(r.id ?? `${r.concept_id ?? ''}:${r.from_concept_id ?? ''}:${r.to_concept_id ?? ''}`)
      );
    violations.push({ check, detail: `${rows.length} row(s)`, rows: ids });
  };

  // 1. No orphan FKs (concept side of verse_concepts, both ends of
  //    concept_relations, community anchor FKs).
  add('orphan_fk_verse_concepts', driver.all(ORPHAN_VC_SQL));
  add('orphan_fk_concept_relations', driver.all(ORPHAN_CR_SQL));
  add('orphan_fk_communities', driver.all(ORPHAN_COMMUNITY_FK_SQL));

  // 2. Confidence / coherence in [0,1].
  add('confidence_in_range', driver.all(OUT_OF_RANGE_CONF_SQL));

  // 3. No self-loops.
  add('no_self_loops', driver.all(SELF_LOOP_SQL));

  // 4. Unique constraints hold — a second, independent scan for duplicates
  //    (belt-and-suspenders next to the DB-level UNIQUE indexes).
  const dupVc = driver.all(
    `select verse_id, concept_id, role, count(*) as n from verse_concepts
     group by verse_id, concept_id, role having n > 1`
  );
  add('unique_verse_concept_role', dupVc);

  const dupCr = driver.all(
    `select from_concept_id, to_concept_id, relation_type, count(*) as n
     from concept_relations group by from_concept_id, to_concept_id, relation_type having n > 1`
  );
  add('unique_concept_relation_pair', dupCr);

  const dupVr = driver.all(
    `select from_verse_id, to_verse_id, relation_type, concept_id, community_id, count(*) as n
     from verse_relations
     group by from_verse_id, to_verse_id, relation_type, concept_id, community_id having n > 1`
  );
  add('unique_verse_relation', dupVr);

  // 5. Every community traces to a structural partition
  //    (provenance check — the LLM may rename, never create).
  const unprovenanced = driver.all(
    `select id, name from communities
     where coalesce(source, '') = ?`,
    ''
  );
  add('community_provenance', unprovenanced);

  // 6. Orphan-concept ratio below threshold.
  const totalConcepts = Number(driver.get(`select count(*) as n from concepts`)?.n ?? 0);
  const linked = Number(
    driver.get(
      `select count(distinct c.id) as n from concepts c
       where c.id in (select concept_id from verse_concepts)
          or c.id in (select from_concept_id from concept_relations)
          or c.id in (select to_concept_id from concept_relations)
          or c.id in (select source_concept_id from communities where source_concept_id is not null)`
    )?.n ?? 0
  );
  const orphanRatio = totalConcepts === 0 ? 0 : (totalConcepts - linked) / totalConcepts;
  const orphanOk = orphanRatio <= orphanThreshold;
  if (!orphanOk) {
    violations.push({
      check: 'orphan_concept_ratio',
      detail: `ratio ${orphanRatio.toFixed(4)} exceeds threshold ${orphanThreshold}`,
      rows: [],
    });
  }

  const passed = violations.length === 0 && orphanOk;

  return {
    passed,
    violations,
    counts: {
      concepts: totalConcepts,
      linked_concepts: linked,
      orphan_concept_ratio: Number(orphanRatio.toFixed(4)),
      accepted_community_source: acceptedCommunitySource,
      violation_groups: violations.length,
    },
  };
}

// ---------------------------------------------------------------------------
// Extended invariants (verse-universe + concept-graph checks)
// ---------------------------------------------------------------------------

/**
 * Checks that run on top of `runHChecksInMemory` when a verse universe and
 * a concept graph (post-Stage D) are available:
 *
 *  - `verse_ids_resolve`   — every verseId / fromVerseId / toVerseId is a
 *                            key of the universe (translation-independent
 *                            `bookId:ch:verse`);
 *  - `concept_ids_resolve` — every conceptId (including `verse_relations`
 *                            `conceptId`) is a seeded concept;
 *  - `no_orphan_verse_concepts` — every verse_concept row's concept exists
 *                            in the (post-normalize) concept set;
 *  - `no_self_relations`   — no relation where both ends are identical
 *                            (redundant with `no_self_loops`, kept explicit);
 *  - `no_child_of_cycles`  — no cycles in the CHILD_OF subgraph
 *                            (topological Kahn + remaining-edge scan);
 *  - `no_empty_communities`— every community row has size ≥ 1 and a name;
 *  - `confidence_valid`    — reasserted on the extended row set;
 *  - `unique_canonical_concepts` — no two post-normalize concepts share
 *                            the same canonical key (casefold + NFC +
 *                            accent-strip).
 *
 * Returns the same `HResult` shape (an `HViolation` per finding) so the
 * caller can merge it into the gate.
 */
export function runExtendedChecks(opts: {
  rows: InMemoryRows;
  verseUniverse: string[];
  concepts: Array<Record<string, unknown>>;
  conceptEdges: Array<Record<string, unknown>>;
  /** Seed rows (snake_case `id`). When given, concept-id resolution uses
   * the seed set instead of the normalized set (which carries no ids). */
  conceptIds?: string[];
  verseConcepts?: Array<Record<string, unknown>>;
}): HResult {
  const { rows, verseUniverse, concepts, conceptEdges, conceptIds, verseConcepts } = opts;
  const violations: HViolation[] = [];
  const add = (check: string, bad: Array<Record<string, unknown>>, detail: string) => {
    if (bad.length === 0) return;
    violations.push({
      check,
      detail: `${bad.length} row(s) — ${detail}`,
      rows: bad.slice(0, 25).map((r) => String(r.id ?? JSON.stringify(r))),
    });
  };

  const universe = new Set(verseUniverse);

  // verse_ids_resolve
  const badVerses: Array<Record<string, unknown>> = [];
  for (const r of rows.verse_concepts) {
    if (!universe.has(String(r.verseId)))
      badVerses.push({ id: String(r.id), verseId: r.verseId, why: 'verse_concepts.verse_id' });
  }
  for (const r of rows.verse_relations) {
    if (!universe.has(String(r.fromVerseId)))
      badVerses.push({ id: String(r.id), verseId: r.fromVerseId, why: 'verse_relations.from_verse_id' });
    if (!universe.has(String(r.toVerseId)))
      badVerses.push({ id: String(r.id), verseId: r.toVerseId, why: 'verse_relations.to_verse_id' });
  }
  add('verse_ids_resolve', badVerses, 'a verse key is absent from the verse universe');

  // concept_ids_resolve — the valid set is the seed ids (the schema rows);
  // `concepts` (post-normalize) carries no ids, so prefer `conceptIds`
  // when provided.
  const validConceptIds = new Set(conceptIds ? conceptIds.map(String) : concepts.map((r) => String(r.id)));
  const badConcepts: Array<Record<string, unknown>> = [];
  for (const r of rows.verse_concepts) {
    if (!validConceptIds.has(String(r.conceptId)))
      badConcepts.push({ id: String(r.id), conceptId: r.conceptId });
  }
  for (const r of rows.verse_relations) {
    const cid = r.conceptId;
    if (cid != null && !validConceptIds.has(String(cid)))
      badConcepts.push({ id: String(r.id), conceptId: cid });
  }
  for (const r of rows.concept_relations) {
    if (!validConceptIds.has(String(r.fromConceptId)))
      badConcepts.push({ id: String(r.id), conceptId: r.fromConceptId });
    if (!validConceptIds.has(String(r.toConceptId)))
      badConcepts.push({ id: String(r.id), conceptId: r.toConceptId });
  }
  add('concept_ids_resolve', badConcepts, 'a concept reference has no concept row');

  // no_orphan_verse_concepts (verse_concept's concept must exist in the
  // post-normalize concept set — the rows passed in are the D-normalized
  // view, so this is a membership check, not just a row-exists check).
  const vc = verseConcepts ?? [];
  add(
    'no_orphan_verse_concepts',
    vc.filter((r) => !validConceptIds.has(String(r.conceptId ?? r.concept_id))),
    'a verse_concept row points at a missing concept'
  );

  // no_self_relations (redundant with no_self_loops; kept explicit).
  add(
    'no_self_relations',
    [
      ...rows.concept_relations.filter((r) => String(r.fromConceptId) === String(r.toConceptId)),
      ...rows.verse_relations.filter((r) => String(r.fromVerseId) === String(r.toVerseId)),
    ],
    'a relation points at itself'
  );

  // no_child_of_cycles (deterministic Kahn + remaining-edge scan).
  const childOf = conceptEdges.filter(
    (e) => String(e.relationType ?? e.relation_type) === 'CHILD_OF'
  );
  const inDeg = new Map<string, number>();
  const out = new Map<string, string[]>();
  const seenNode = new Set<string>();
  for (const e of childOf) {
    const a = String(e.fromConceptId ?? e.from_concept_id);
    const b = String(e.toConceptId ?? e.to_concept_id);
    for (const n of [a, b]) {
      if (!seenNode.has(n)) {
        seenNode.add(n);
        inDeg.set(n, 0);
        out.set(n, []);
      }
    }
    inDeg.set(b, (inDeg.get(b) ?? 0) + 1);
    out.get(a)!.push(b);
  }
  const queue = Array.from(inDeg.keys()).filter((k) => inDeg.get(k) === 0);
  const visited = new Set<string>();
  while (queue.length > 0) {
    const n = queue.shift()!;
    if (visited.has(n)) continue;
    visited.add(n);
    for (const m of out.get(n) ?? []) {
      const d = inDeg.get(m) ?? 0;
      inDeg.set(m, d - 1);
      if (d - 1 === 0) queue.push(m);
    }
  }
  // Nodes in the cycle core: reachable via CHILD_OF but never reduced to 0
  // in-degree (a source in the core has in-degree ≥ 1 in the core itself,
  // so it is never queued — its presence in `seenNode` without a `visited`
  // hit is the cycle signal).
  const coreNodes = Array.from(seenNode).filter((n) => !visited.has(n));
  const inCore = new Set(coreNodes);
  const cycleEdges = childOf.filter((e) => {
    const a = String(e.fromConceptId ?? e.from_concept_id);
    const b = String(e.toConceptId ?? e.to_concept_id);
    // A back-edge: both endpoints in the cycle core (neither reduced to 0).
    return inCore.has(a) && inCore.has(b);
  });
  add('no_child_of_cycles', cycleEdges, 'a CHILD_OF edge is part of a cycle');

  // no_empty_communities
  add(
    'no_empty_communities',
    rows.communities.filter((r) => Number(r.size ?? 0) < 1 || !String(r.name ?? '').trim()),
    'a community row has size < 1 or no name'
  );

  // confidence_valid — reassert on the extended row set. The normalized
  // concept view carries no `confidence` column (only label + provenance);
  // rows that DO carry a confidence value are what we check, so we test
  // only the row-level tables where confidence is a real column.
  const inRange = (v: unknown): boolean => typeof v === 'number' && v >= 0 && v <= 1;
  add(
    'confidence_valid',
    [
      ...concepts.filter((r) => r.confidence !== undefined && !inRange(r.confidence)),
      ...rows.concept_relations.filter((r) => !inRange(r.confidence)),
      ...rows.verse_concepts.filter((r) => !inRange(r.confidence)),
      ...rows.verse_relations.filter((r) => !inRange(r.confidence)),
      ...rows.communities.filter((r) => !inRange(r.coherence)),
      ...vc.filter((r) => r.confidence !== undefined && !inRange(r.confidence)),
    ],
    'a confidence/coherence value is outside [0,1]'
  );

  // unique_canonical_concepts — no two post-normalize concepts share the
  // same canonical key (casefold + NFC + accent-strip of the label).
  // Keys are built from the concept's `key` pipeline token (seed:<slug> or
  // source:<label>) — two concepts folding to the same canonical key are
  // duplicates that Stage D was supposed to merge.
  const normKeyOf = (r: Record<string, unknown>): string => {
    const k = String(r.key ?? r.canonical_key ?? '');
    if (k.length > 0) return k;
    const label = String(r.canonicalLabel ?? r.canonical_label ?? r.label ?? '');
    return label
      .normalize('NFC')
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '');
  };
  const canonSeen = new Map<string, string>();
  const dupCanon: Array<Record<string, unknown>> = [];
  for (const r of concepts) {
    const ck = normKeyOf(r);
    if (!ck) continue;
    const prev = canonSeen.get(ck);
    if (prev === undefined) canonSeen.set(ck, String(r.id));
    else dupCanon.push({ id: String(r.id), key: ck, prev });
  }
  add('unique_canonical_concepts', dupCanon, 'two concepts share one canonical key');

  return {
    passed: violations.length === 0,
    violations,
    counts: {
      verse_universe: universe.size,
      concepts_checked: concepts.length,
      concept_edges_checked: childOf.length,
      verse_concepts_checked: vc.length,
      violation_groups: violations.length,
    },
  };
}

// ---------------------------------------------------------------------------
// In-memory driver — runs Stage H over plain JSON row arrays.  This is
// what the pipeline's own build (which has no live SQLite yet) uses in
// `run.ts`, and it is also the reference implementation the unit tests
// compare the SQL-based driver against.  The check semantics are the
// same as the SQL version; the in-memory version is the authoritative
// one for the pipeline.
// ---------------------------------------------------------------------------

export interface InMemoryRows {
  concepts: Array<Record<string, unknown>>;
  concept_relations: Array<Record<string, unknown>>;
  verse_concepts: Array<Record<string, unknown>>;
  verse_relations: Array<Record<string, unknown>>;
  communities: Array<Record<string, unknown>>;
}

/**
 * Run the full Stage H invariant set over in-memory rows. Returns the
 * same `HResult` shape as `runHChecks` so callers can treat both the
 * same.
 */
export function runHChecksInMemory(rows: InMemoryRows, opts: { orphanThreshold?: number } = {}): HResult {
  const orphanThreshold = opts.orphanThreshold ?? 0.2;
  const violations: HViolation[] = [];
  const add = (check: string, bad: Array<Record<string, unknown>>, detail: string) => {
    if (bad.length === 0) return;
    violations.push({
      check,
      detail: `${bad.length} row(s) — ${detail}`,
      rows: bad.slice(0, 25).map((r) => String(r.id ?? JSON.stringify(r))),
    });
  };

  const conceptIds = new Set(rows.concepts.map((r) => String(r.id)));

  // 1. Orphan FKs.
  add(
    'orphan_fk_verse_concepts',
    rows.verse_concepts.filter((r) => !conceptIds.has(String(r.conceptId))),
    'verse_concept.concept_id has no concept row'
  );
  add(
    'orphan_fk_concept_relations',
    rows.concept_relations.filter(
      (r) => !conceptIds.has(String(r.fromConceptId)) || !conceptIds.has(String(r.toConceptId))
    ),
    'concept_relation endpoint has no concept row'
  );
  add(
    'orphan_fk_communities',
    rows.communities.filter((r) => r.sourceConceptId != null && !conceptIds.has(String(r.sourceConceptId))),
    'community anchor has no concept row'
  );

  // 2. Confidence / coherence in [0,1].
  const inRange = (v: unknown): boolean => typeof v === 'number' && v >= 0 && v <= 1;
  add(
    'confidence_in_range',
    [
      ...rows.concepts.filter((r) => !inRange(r.confidence)),
      ...rows.concept_relations.filter((r) => !inRange(r.confidence)),
      ...rows.verse_concepts.filter((r) => !inRange(r.confidence)),
      ...rows.verse_relations.filter((r) => !inRange(r.confidence)),
      ...rows.communities.filter((r) => !inRange(r.coherence)),
    ],
    'a confidence/coherence value is outside [0,1]'
  );

  // 3. Self-loops.
  add(
    'no_self_loops',
    [
      ...rows.concept_relations.filter((r) => r.fromConceptId === r.toConceptId),
      ...rows.verse_relations.filter((r) => r.fromVerseId === r.toVerseId),
    ],
    'a relation is a self-loop'
  );

  // 4. Unique-constraint scans.
  const uniq = <T extends Record<string, unknown>>(items: T[], key: (t: T) => string): T[] => {
    const seen = new Set<string>();
    const dup: T[] = [];
    for (const t of items) {
      const k = key(t);
      if (seen.has(k)) dup.push(t);
      else seen.add(k);
    }
    return dup;
  };
  add(
    'unique_verse_concept_role',
    uniq(rows.verse_concepts, (r) => `${r.verseId}|${r.conceptId}|${r.role}`),
    'duplicate (verse, concept, role) triple'
  );
  add(
    'unique_concept_relation_pair',
    uniq(rows.concept_relations, (r) => `${r.fromConceptId}|${r.toConceptId}|${r.relationType}`),
    'duplicate (from, to, type) triple'
  );
  add(
    'unique_verse_relation',
    uniq(rows.verse_relations, (r) => `${r.fromVerseId}|${r.toVerseId}|${r.relationType}|${r.conceptId ?? ''}|${r.communityId ?? ''}`),
    'duplicate (from, to, type, concept, community) quintuple'
  );

  // 5. Community provenance.
  add(
    'community_provenance',
    rows.communities.filter((r) => !r.source || String(r.source).length === 0),
    'a community row has no structural-partition provenance'
  );

  // 6. Orphan-concept ratio.
  const total = rows.concepts.length;
  const linkedSet = new Set<string>();
  for (const r of rows.verse_concepts) linkedSet.add(String(r.conceptId));
  for (const r of rows.concept_relations) {
    linkedSet.add(String(r.fromConceptId));
    linkedSet.add(String(r.toConceptId));
  }
  for (const r of rows.communities) if (r.sourceConceptId != null) linkedSet.add(String(r.sourceConceptId));
  const linked = Array.from(linkedSet).filter((id) => conceptIds.has(id)).length;
  const orphanRatio = total === 0 ? 0 : (total - linked) / total;
  const orphanOk = orphanRatio <= orphanThreshold;
  if (!orphanOk) {
    violations.push({
      check: 'orphan_concept_ratio',
      detail: `ratio ${orphanRatio.toFixed(4)} exceeds threshold ${orphanThreshold}`,
      rows: [],
    });
  }

  return {
    passed: violations.length === 0 && orphanOk,
    violations,
    counts: {
      concepts: total,
      linked_concepts: linked,
      orphan_concept_ratio: Number(orphanRatio.toFixed(4)),
      violation_groups: violations.length,
    },
  };
}
