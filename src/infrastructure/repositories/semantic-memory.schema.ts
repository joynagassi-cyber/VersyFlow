/**
 * semantic-memory.schema — DDL for the 5 semantic-memory tables.
 *
 * Self-contained copy of the schema used by
 * `src/infrastructure/semantic/schema.ts` (`buildSemanticSchemaDdl`),
 * split into individual statements for the PowerSync web driver
 * (which runs one statement at a time via `db.database.execute`).
 *
 * Conventions (matching the DDL in the decision phase):
 *  - bare table names (DB-relative; the PowerSync web driver names the
 *    local db `powersync.db` on Capacitor)
 *  - UUIDs are TEXT, timestamps are TEXT ISO-8601 UTC, booleans are
 *    INTEGER 0/1, confidence is REAL
 *  - `semantic_memory_meta` carries `schema_version` for deterministic
 *    migrations
 *
 * NOTE: `id` is declared explicitly here because these tables are
 * LOCAL_ONLY in the PowerSync driver — the SDK only auto-adds `id` to
 * SYNCED tables. The DDL is idempotent (`CREATE TABLE IF NOT EXISTS`).
 */

export const SEMANTIC_MEMORY_DDL: string[] = [
  // -- concepts -------------------------------------------------------
  `create table if not exists concepts (
    id text primary key,
    labels_by_language text not null default '{}',
    canonical_name text not null,
    slug text not null,
    description text,
    source_provenance text not null default '[]',
    confidence real not null check (confidence >= 0.0 and confidence <= 1.0),
    status text not null default 'candidate' check (status in ('candidate','active','deprecated')),
    kind text check (kind in ('TOPIC','PERSON','EVENT','TEACHING','OTHER')),
    source text check (source in ('nave','torrey','openbible','derived','manual')),
    created_by text,
    created_at text,
    updated_at text
  )`,
  `create index if not exists idx_concepts_canonical_name on concepts(canonical_name)`,
  `create index if not exists idx_concepts_status on concepts(status)`,

  // -- concept_relations ------------------------------------------------
  `create table if not exists concept_relations (
    id text primary key,
    from_concept_id text not null references concepts(id) on delete cascade,
    to_concept_id text not null references concepts(id) on delete cascade,
    type text not null check (type in ('RELATED','CONTRASTS','SUPPORTS','CHILD_OF')),
    confidence real not null check (confidence >= 0.0 and confidence <= 1.0),
    source text not null,
    created_at text,
    check (from_concept_id <> to_concept_id)
  )`,
  `create unique index if not exists uq_cr_pair_type on concept_relations(from_concept_id, to_concept_id, type)`,
  `create index if not exists idx_cr_to on concept_relations(to_concept_id)`,

  // -- communities ------------------------------------------------------
  `create table if not exists communities (
    id text primary key,
    name text not null,
    description text,
    concept_ids text not null default '[]',
    source_concept_id text references concepts(id) on delete set null,
    size integer not null default 0,
    coherence real check (coherence >= 0.0 and coherence <= 1.0),
    source text not null,
    confidence real check (confidence >= 0.0 and confidence <= 1.0),
    created_at text,
    updated_at text
  )`,
  `create index if not exists idx_communities_source_concept on communities(source_concept_id)`,

  // -- verse_concepts ---------------------------------------------------
  `create table if not exists verse_concepts (
    id text primary key,
    verse_id text not null,
    concept_id text not null references concepts(id) on delete cascade,
    role text not null check (role in ('PRIMARY','SECONDARY','CONTRAST','RELATED')),
    confidence real not null check (confidence >= 0.0 and confidence <= 1.0),
    source text not null,
    created_at text,
    unique (verse_id, concept_id, role)
  )`,
  `create index if not exists idx_vc_concept on verse_concepts(concept_id)`,
  `create index if not exists idx_vc_verse on verse_concepts(verse_id)`,

  // -- verse_relations --------------------------------------------------
  `create table if not exists verse_relations (
    id text primary key,
    verse_a text not null,
    verse_b text not null,
    type text not null check (type in ('CROSS_REFERENCE','SHARED_CONCEPT','SAME_COMMUNITY')),
    score real not null check (score >= 0.0 and score <= 1.0),
    source text not null,
    concept_id text references concepts(id) on delete set null,
    community_id text references communities(id) on delete set null,
    created_at text,
    check (verse_a <> verse_b),
    unique (verse_a, verse_b, type, concept_id, community_id)
  )`,
  `create index if not exists idx_vr_a on verse_relations(verse_a)`,
  `create index if not exists idx_vr_b on verse_relations(verse_b)`,

  // -- semantic_memory_meta --------------------------------------------
  `create table if not exists semantic_memory_meta (
    key text primary key,
    value text not null
  )`,
  `insert into semantic_memory_meta (key, value) values ('schema_version', '1')
    on conflict (key) do nothing`,
];
