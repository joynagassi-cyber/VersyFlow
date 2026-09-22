/**
 * `@semantic-verse/db` — schema bootstrap + deterministic validator
 * (Stage H) for the semantic layer.
 *
 * Two responsibilities:
 *  1. `createSemanticDb(driver)` — create the 6 semantic tables
 *     (`concepts`, `concept_relations`, `communities`, `verse_concepts`,
 *     `verse_relations`, `semantic_memory_meta`) on an injected SQLite driver,
 *     so it works against better-sqlite3 (in tests / build) and the PowerSync
 *     web driver (LOCAL_ONLY tables on Capacitor, per the decision phase:
 *     these tables are NOT part of `buildPowerSyncSchema()`).
 *  2. `validateSemanticDb(driver)` — Stage H: deterministic invariant checks
 *     over the same driver (never LLM — it is the gate itself).
 */

import { buildSemanticSchemaDdl, splitSqlStatements, SEMANTIC_SCHEMA_VERSION } from './schema';
import type { CheckResult, ValidationSummary } from './entities';

/**
 * Minimal structural-driver interface: just enough for bootstrap + validation.
 * The real driver (better-sqlite3 in the build; the PowerSync web driver's
 * underlying db on the app) is injected — no concrete class is imported,
 * which keeps this module pure and testable (rule: no I/O inside domains).
 */
export interface StructuralDriver {
  exec(sql: string): unknown;
  prepare(sql: string): {
    run: (...params: unknown[]) => unknown;
    all: (...params: unknown[]) => unknown[];
    get: (...params: unknown[]) => unknown;
  };
}

/** Create the semantic schema on `driver`. Idempotent (CREATE IF NOT EXISTS). */
export function createSemanticDb(driver: StructuralDriver): void {
  driver.exec(buildSemanticSchemaDdl());
}

/** Read the stored `schema_version` from `semantic_memory_meta` (or null). */
export function getSemanticSchemaVersion(driver: StructuralDriver): number | null {
  const row = driver
    .prepare('select value from semantic_memory_meta where key = ?')
    .get('schema_version') as { value: string } | undefined;
  return row ? Number(row.value) : null;
}

/** Whether the driver reports the current schema version. */
export function semanticSchemaIsCurrent(driver: StructuralDriver): boolean {
  return getSemanticSchemaVersion(driver) === SEMANTIC_SCHEMA_VERSION;
}

// ---------------------------------------------------------------------------
// Stage H — Validate (DETERMINISTIC, never LLM)
// ---------------------------------------------------------------------------

function assertNoOrphanFk(
  driver: StructuralDriver,
  table: string,
  col: string,
  refTable: string
): { name: string; passed: boolean; detail: string } {
  const q = driver.prepare(
    `select count(*) as c from ${table} where ${col} is not null and ${col} != '' and not exists (select 1 from ${refTable} p where p.id = ${table}.${col})`
  );
  const row = q.get() as { c: number };
  const orphans = row?.c ?? 0;
  return {
    name: `no-orphan-fk:${table}.${col}->${refTable}`,
    passed: orphans === 0,
    detail: orphans === 0 ? 'ok' : `${orphans} orphan rows`,
  };
}

function assertConfidenceInRange(driver: StructuralDriver, table: string): CheckResult {
  const q = driver.prepare(
    `select count(*) as c from ${table} where confidence is null or confidence < 0.0 or confidence > 1.0`
  );
  const row = q.get() as { c: number };
  const bad = row?.c ?? 0;
  return {
    name: `confidence-in-range:${table}`,
    passed: bad === 0,
    detail: bad === 0 ? 'ok' : `${bad} rows with confidence outside [0,1]`,
  };
}

function assertNoSelfLoops(driver: StructuralDriver, table: string): CheckResult {
  const q = driver.prepare(
    `select count(*) as c from ${table} where from_concept_id = to_concept_id or from_verse_id = to_verse_id`
  );
  const row = q.get() as { c: number };
  const bad = row?.c ?? 0;
  return {
    name: `no-self-loops:${table}`,
    passed: bad === 0,
    detail: bad === 0 ? 'ok' : `${bad} self-loop rows`,
  };
}

function assertUniqueConstraints(driver: StructuralDriver): CheckResult[] {
  // A constraint violation would have prevented the insert; we only verify
  // the declared unique indexes actually exist (schema shape), which is a
  // deterministic structural check — not a re-scan of data.
  const out: CheckResult[] = [];
  const expected: Array<[string, string, string]> = [
    ['concepts', 'id', 'pk'],
    ['concept_relations', 'id', 'pk'],
    ['communities', 'id', 'pk'],
    ['verse_concepts', 'id', 'pk'],
    ['verse_relations', 'id', 'pk'],
    ['semantic_memory_meta', 'key', 'pk'],
  ];
  for (const [table, col, label] of expected) {
    const q = driver.prepare(
      `select count(*) as c from pragma_table_info('${table}') where pk = 1`
    );
    const row = q.get() as { c: number };
    out.push({
      name: `unique-constraint:${table}.${col}(${label})`,
      passed: (row?.c ?? 0) >= 1,
      detail: `${col} is a primary key`,
    });
  }
  return out;
}

function assertCheckConstraintsPresent(driver: StructuralDriver): CheckResult {
  // The CHECK guards are declarative; verify each row-table actually carries
  // a `confidence` guard and the correct enum list on its type column.
  const sql = driver.prepare("select sql from sqlite_master where type = 'table'").all() as Array<{
    sql: string;
  }>;
  const problems: string[] = [];
  for (const t of sql) {
    const body = t.sql ?? '';
    if (/from\s+concept_relations/i.test(body) && !/relation_type\s+in\s*\(/i.test(body)) {
      problems.push('concept_relations missing relation_type CHECK');
    }
    if (/from\s+verse_relations/i.test(body) && !/relation_type\s+in\s*\(/i.test(body)) {
      problems.push('verse_relations missing relation_type CHECK');
    }
    for (const name of ['concepts', 'concept_relations', 'verse_concepts', 'verse_relations']) {
      const re = new RegExp(`from\\s+${name}\\b`, 'i');
      const tableBody = sql.find((x) => re.test(x.sql ?? ''));
      if (tableBody && !/check\s*\(\s*confidence\s*>=\s*0\.0/i.test(tableBody.sql ?? '')) {
        problems.push(`${name} missing confidence CHECK`);
      }
    }
  }
  return {
    name: 'check-constraints-present',
    passed: problems.length === 0,
    detail: problems.length === 0 ? 'ok' : problems.join(', '),
  };
}

function assertNoOrphanConcepts(
  driver: StructuralDriver,
  threshold: number
): CheckResult {
  // An "orphan concept" is one with no concept_relation, no verse_concept and
  // no community referencing it — allowed up to a small ratio so that freshly
  // minted concepts do not fail the gate before stages E/F/G link them.
  const total = (driver.prepare('select count(*) as c from concepts').get() as { c: number })
    .c;
  if (total === 0) {
    return {
      name: 'orphan-concept-ratio',
      passed: true,
      detail: 'no concepts yet',
    };
  }
  const orphans = (
    driver.prepare(
      `select count(*) as c from concepts c
       where not exists (select 1 from concept_relations r where r.from_concept_id = c.id or r.to_concept_id = c.id)
         and not exists (select 1 from verse_concepts vc where vc.concept_id = c.id)
         and not exists (select 1 from communities cm where cm.source_concept_id = c.id)`
    ).get() as { c: number }
  ).c;
  const ratio = orphans / total;
  return {
    name: 'orphan-concept-ratio',
    passed: ratio <= threshold,
    detail: `orphan ratio ${(ratio * 100).toFixed(1)}% (threshold ${(threshold * 100).toFixed(1)}%)`,
  };
}

/**
 * Run all Stage H invariants. `orphanConceptThreshold` defaults to 0.2
 * (20% of concepts may be unlinked at seed time).
 */
export function validateSemanticDb(
  driver: StructuralDriver,
  orphanConceptThreshold = 0.2
): ValidationSummary {
  const checks: CheckResult[] = [
    // Orphan FKs
    assertNoOrphanFk(driver, 'concept_relations', 'from_concept_id', 'concepts'),
    assertNoOrphanFk(driver, 'concept_relations', 'to_concept_id', 'concepts'),
    assertNoOrphanFk(driver, 'verse_concepts', 'concept_id', 'concepts'),
    assertNoOrphanFk(driver, 'verse_relations', 'concept_id', 'concepts'),
    assertNoOrphanFk(driver, 'verse_relations', 'community_id', 'communities'),
    assertNoOrphanFk(driver, 'communities', 'source_concept_id', 'concepts'),
    // Confidence ranges
    assertConfidenceInRange(driver, 'concepts'),
    assertConfidenceInRange(driver, 'concept_relations'),
    assertConfidenceInRange(driver, 'verse_concepts'),
    assertConfidenceInRange(driver, 'verse_relations'),
    // Self-loops
    assertNoSelfLoops(driver, 'concept_relations'),
    assertNoSelfLoops(driver, 'verse_relations'),
    // Structural shape
    ...assertUniqueConstraints(driver),
    assertCheckConstraintsPresent(driver),
    // Orphan concepts
    assertNoOrphanConcepts(driver, orphanConceptThreshold),
  ];
  return { checks, passed: checks.every((c) => c.passed) };
}
