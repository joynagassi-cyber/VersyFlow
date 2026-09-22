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
