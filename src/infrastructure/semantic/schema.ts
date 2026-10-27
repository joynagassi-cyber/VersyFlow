/**
 * `@semantic-verse/schema` — SQLite DDL for the semantic layer (Stage B).
 *
 * 6 tables: `concepts`, `concept_relations`, `communities`, `verse_concepts`,
 * `verse_relations`, `semantic_memory_meta` (carries `schema_version`).
 *
 * Conventions:
 *  - UUIDs are TEXT, timestamps are TEXT ISO-8601 UTC, booleans INTEGER 0/1,
 *    confidence REAL in [0,1]
 *  - bare table names (DB-relative)
 *  - every row table that carries a confidence is guarded by
 *    `check (confidence >= 0.0 and confidence <= 1.0)`
 *  - relation_type / role / kind / status are guarded by CHECK with the exact
 *    allowed values
 *  - `semantic_memory_meta` is seeded with `schema_version` = '1' via
 *    `insert ... on conflict (key) do nothing` so the DDL is idempotent
 *
 * The returned DDL string is a single batch, ready to hand to
 * `db.exec()` (better-sqlite3) or run split on `;` by other drivers.
 */

export const SEMANTIC_SCHEMA_VERSION = 1;

export function buildSemanticSchemaDdl(): string {
  return `
create table if not exists concepts (
  id text primary key,
  labels_by_language text not null default '{}',        -- JSON column, spec-mandated
  canonical_label text not null,
  kind text not null check (kind in ('TOPIC','PERSON','EVENT','TEACHING','OTHER')),
  source text not null,
  definition text,
  status text not null default 'unresolved' check (status in ('unresolved','accepted','rejected')),
  confidence real not null check (confidence >= 0.0 and confidence <= 1.0),
  created_by text not null,
  created_at text not null,
  updated_at text not null
);
create index if not exists idx_concepts_label on concepts(canonical_label);
create index if not exists idx_concepts_status on concepts(status);

create table if not exists concept_relations (
  id text primary key,
  from_concept_id text not null references concepts(id) on delete cascade,
  to_concept_id text not null references concepts(id) on delete cascade,
  relation_type text not null check (relation_type in ('RELATED','CONTRASTS','SUPPORTS','CHILD_OF')),
  confidence real not null check (confidence >= 0.0 and confidence <= 1.0),
  source text not null,
  created_at text not null,
  check (from_concept_id <> to_concept_id)               -- no self-loops
);
create unique index if not exists uq_cr_pair_type on concept_relations(from_concept_id, to_concept_id, relation_type);
create index if not exists idx_cr_to on concept_relations(to_concept_id);

create table if not exists communities (
  id text primary key,
  name text not null,
  source_concept_id text references concepts(id) on delete set null,
  size integer not null default 0,
  coherence real not null default 0 check (coherence >= 0.0 and coherence <= 1.0),
  source text not null,
  created_at text not null,
  updated_at text not null
);

create table if not exists verse_concepts (
  id text primary key,
  verse_id text not null,
  concept_id text not null references concepts(id) on delete cascade,
  role text not null check (role in ('PRIMARY','SECONDARY','CONTRAST','RELATED')),
  confidence real not null check (confidence >= 0.0 and confidence <= 1.0),
  source text not null,
  created_at text not null,
  unique (verse_id, concept_id, role)                     -- one edge per (verse,concept,role)
);
create index if not exists idx_vc_concept on verse_concepts(concept_id);
create index if not exists idx_vc_verse on verse_concepts(verse_id);

create table if not exists verse_relations (
  id text primary key,
  from_verse_id text not null,
  to_verse_id text not null,
  relation_type text not null check (relation_type in ('CROSS_REFERENCE','SHARED_CONCEPT','SAME_COMMUNITY')),
  concept_id text references concepts(id) on delete set null,
  community_id text references communities(id) on delete set null,
  confidence real not null check (confidence >= 0.0 and confidence <= 1.0),
  source text not null,
  created_at text not null,
  check (from_verse_id <> to_verse_id),
  unique (from_verse_id, to_verse_id, relation_type, concept_id, community_id)
);
create index if not exists idx_vr_from on verse_relations(from_verse_id);
create index if not exists idx_vr_to on verse_relations(to_verse_id);

create table if not exists semantic_memory_meta (
  key text primary key,
  value text not null
);
insert into semantic_memory_meta (key, value) values ('schema_version', '${SEMANTIC_SCHEMA_VERSION}')
  on conflict (key) do nothing;
`;
}

/**
 * Split a DDL batch into individual statements (one per `;`).
 *
 * The semantic DDL contains no embedded `;` inside string literals, so a
 * naive split is safe. Returns statements with trailing whitespace trimmed;
 * empty/whitespace-only fragments are dropped.
 */
export function splitSqlStatements(ddl: string): string[] {
  return ddl
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}
