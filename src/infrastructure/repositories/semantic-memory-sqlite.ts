/**
 * semantic-memory-sqlite — PowerSync/SQLite adapter for the semantic-memory
 * domain (read-only ports).
 *
 * Implements the three read-only ports declared in
 * `src/domains/semantic-memory/repositories.ts` on top of the shared
 * PowerSync database:
 *
 *   - {@link SemanticConceptRepository}   → IConceptRepository
 *   - {@link SemanticCommunityRepository} → ICommunityRepository
 *   - {@link SemanticVerseRelationRepository} → IVerseRelationRepository
 *
 * Every row crossing the boundary is parsed with the domain Zod schemas,
 * so the domain can assume well-formed entities. JSON columns
 * (`labels_by_language`, `concept_ids`, `source_provenance`) are decoded
 * before parsing.
 *
 * The adapter ensures the 5 semantic tables exist (CREATE TABLE IF NOT
 * EXISTS, matching `buildSemanticSchemaDdl()` in
 * `src/infrastructure/semantic/schema.ts` — a copy lives in
 * `semantic-memory.schema.ts` so the adapter is self-contained). Writes
 * are out of scope for these ports; the pipeline owns row creation.
 */

import type { CommonPowerSyncDatabase } from '@powersync/common';
import {
  peekPowerSyncDatabase,
  getPowerSyncDatabase,
} from '@/infrastructure/sync/powersync-database';
import { SEMANTIC_MEMORY_DDL } from './semantic-memory.schema';
import {
  conceptSchema,
  verseConceptSchema,
  conceptRelationSchema,
  communitySchema,
  verseRelationSchema,
} from '@/domains/semantic-memory/entities';
import type {
  IConceptRepository,
  ICommunityRepository,
  IVerseRelationRepository,
  ConceptSearchHit,
} from '@/domains/semantic-memory/repositories';

// ------------------------------------------------------------------
// Row shapes (snake_case, as stored in SQLite)
// ------------------------------------------------------------------

interface ConceptRow {
  id: string;
  labels_by_language: string | null;
  canonical_name: string;
  slug: string;
  description: string | null;
  source_provenance: string | null;
  confidence: number;
  status: string;
  kind: string | null;
  source: string | null;
  created_by: string | null;
  created_at: string | null;
  updated_at: string | null;
}

interface ConceptRelationRow {
  id: string;
  from_concept_id: string;
  to_concept_id: string;
  type: string;
  confidence: number;
  source: string;
  created_at: string | null;
}

interface VerseConceptRow {
  id: string;
  verse_id: string;
  concept_id: string;
  role: string;
  confidence: number;
  source: string;
  created_at: string | null;
}

interface CommunityRow {
  id: string;
  name: string;
  description: string | null;
  concept_ids: string | null;
  source_concept_id: string | null;
  size: number | null;
  coherence: number | null;
  source: string;
  confidence: number | null;
  created_at: string | null;
  updated_at: string | null;
}

interface VerseRelationRow {
  id: string;
  verse_a: string;
  verse_b: string;
  type: string;
  score: number;
  source: string;
  concept_id: string | null;
  community_id: string | null;
  created_at: string | null;
}

// ------------------------------------------------------------------
// JSON-column decoding
// ------------------------------------------------------------------

/** Decode a JSON text column; fall back to `fallback` on missing/invalid. */
function decodeJsonColumn<T>(raw: unknown, fallback: T): T {
  if (raw == null) return fallback;
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  }
  return raw as T;
}

/** labels_by_language is always `Record<string, string>` at the boundary. */
type LabelMap = Record<string, string>;

function mapConcept(row: ConceptRow): ReturnType<typeof conceptSchema.parse> {
  return conceptSchema.parse({
    ...row,
    labels_by_language: decodeJsonColumn<LabelMap>(row.labels_by_language, {}),
    source_provenance: decodeJsonColumn(row.source_provenance, []),
  });
}

function mapConceptRelation(row: ConceptRelationRow) {
  return conceptRelationSchema.parse({
    from_concept_id: row.from_concept_id,
    to_concept_id: row.to_concept_id,
    type: row.type,
    confidence: row.confidence,
    source: row.source,
    created_at: row.created_at ?? undefined,
  });
}

function mapVerseConcept(row: VerseConceptRow) {
  return verseConceptSchema.parse({
    verse_id: row.verse_id,
    concept_id: row.concept_id,
    role: row.role,
    confidence: row.confidence,
    source: row.source,
    created_at: row.created_at ?? undefined,
  });
}

function mapCommunity(row: CommunityRow) {
  return communitySchema.parse({
    id: row.id,
    name: row.name,
    description: row.description ?? undefined,
    concept_ids: decodeJsonColumn(row.concept_ids, []),
    source_concept_id: row.source_concept_id ?? undefined,
    size: row.size ?? undefined,
    coherence: row.coherence ?? undefined,
    source: row.source,
    confidence: row.confidence ?? undefined,
    created_at: row.created_at ?? undefined,
    updated_at: row.updated_at ?? undefined,
  });
}

function mapVerseRelation(row: VerseRelationRow) {
  return verseRelationSchema.parse({
    verse_a: row.verse_a,
    verse_b: row.verse_b,
    type: row.type,
    score: row.score,
    source: row.source,
    concept_id: row.concept_id ?? undefined,
    community_id: row.community_id ?? undefined,
    created_at: row.created_at ?? undefined,
  });
}

// ------------------------------------------------------------------
// Schema bootstrap (idempotent, once per adapter)
// ------------------------------------------------------------------

async function ensureSemanticTables(
  db: CommonPowerSyncDatabase,
): Promise<void> {
  await db.waitForReady();
  for (const statement of SEMANTIC_MEMORY_DDL) {
    await db.database.execute(statement);
  }
}

/**
 * Resolves to a shared PowerSync database whose semantic tables are
 * guaranteed to exist. When the app's singleton DB is already open we
 * reuse it; otherwise we lazily create one (matching the
 * `peekPowerSyncDatabase()` pattern from `bible-dataset-cache.ts`).
 *
 * `ensureSemanticTables` is memoized per-DB: the DDL is idempotent, but
 * running 20 statements per query would be wasteful.
 */
const ensuredDbs = new WeakSet<CommonPowerSyncDatabase>();
async function resolveDb(): Promise<CommonPowerSyncDatabase> {
  const db = peekPowerSyncDatabase() ?? getPowerSyncDatabase();
  if (!ensuredDbs.has(db)) {
    await ensureSemanticTables(db);
    ensuredDbs.add(db);
  }
  return db;
}

/**
 * Clamp a caller-supplied limit into `[1, max]`.
 */
function clampLimit(limit: number | undefined, max: number): number {
  if (limit == null) return max;
  return Math.max(1, Math.min(limit, max));
}

// ------------------------------------------------------------------
// IConceptRepository
// ------------------------------------------------------------------

/** Role weights for ordering bridge rows (PRIMARY first). */
const ROLE_ORDER: Record<string, number> = {
  PRIMARY: 0,
  SECONDARY: 1,
  CONTRAST: 2,
  RELATED: 3,
};

export class SemanticConceptRepository implements IConceptRepository {
  async getConcept(id: string) {
    const db = await resolveDb();
    const rows = await db.getAll<ConceptRow>(
      'SELECT * FROM concepts WHERE id = ?',
      [id],
    );
    if (rows.length === 0) return null;
    return mapConcept(rows[0]);
  }

  async searchConcepts(term: string, lang?: string, limit?: number) {
    const db = await resolveDb();
    const max = clampLimit(limit, 200);
    const needle = `%${term.trim().toLowerCase()}%`;
    // Match on canonical_name, slug, or any value in the labels JSON.
    // `labels_by_language LIKE ?` works because the column is a TEXT blob
    // of JSON (the labels appear verbatim inside it). When a language is
    // requested, rows are re-filtered in JS: only concepts carrying a
    // label for that language qualify.
    const rows = await db.getAll<ConceptRow>(
      `SELECT *
       FROM concepts
       WHERE lower(canonical_name) LIKE ?
          OR lower(slug) LIKE ?
          OR lower(labels_by_language) LIKE ?
       ORDER BY confidence DESC, canonical_name ASC
       LIMIT ?`,
      [needle, needle, needle, max],
    );
    const termLower = term.trim().toLowerCase();
    const hits: ConceptSearchHit[] = [];
    for (const row of rows) {
      const labels: LabelMap = decodeJsonColumn(row.labels_by_language, {});
      const labelForLang = lang ? labels[lang] : undefined;
      if (lang && labelForLang === undefined) continue;
      const matched: Record<string, string> = {};
      for (const [code, value] of Object.entries(labels)) {
        if (value.toLowerCase().includes(termLower)) matched[code] = value;
      }
      // When the match comes from canonical_name / slug (not a label),
      // report the canonical name as the matched label.
      const source =
        row.canonical_name.toLowerCase().includes(termLower) ||
        row.slug.toLowerCase().includes(termLower);
      if (Object.keys(matched).length === 0) {
        matched[lang ?? 'canonical'] = row.canonical_name;
      }
      if (Object.keys(matched).length === 0 && !source) continue;
      hits.push({ concept: mapConcept(row), matchedLabels: matched });
      if (hits.length >= max) break;
    }
    return hits;
  }

  async getConceptsForVerse(verseKey: string) {
    const db = await resolveDb();
    const rows = await db.getAll<VerseConceptRow>(
      `SELECT *
       FROM verse_concepts
       WHERE verse_id = ?
       ORDER BY
         CASE role
           WHEN 'PRIMARY' THEN 0
           WHEN 'SECONDARY' THEN 1
           WHEN 'CONTRAST' THEN 2
           WHEN 'RELATED' THEN 3
         END,
         confidence DESC`,
      [verseKey],
    );
    return rows.map(mapVerseConcept);
  }

  async getConceptRelations(conceptId: string) {
    const db = await resolveDb();
    const rows = await db.getAll<ConceptRelationRow>(
      `SELECT *
       FROM concept_relations
       WHERE from_concept_id = ? OR to_concept_id = ?
       ORDER BY confidence DESC`,
      [conceptId, conceptId],
    );
    return rows.map(mapConceptRelation);
  }
}

// ------------------------------------------------------------------
// ICommunityRepository
// ------------------------------------------------------------------

export class SemanticCommunityRepository implements ICommunityRepository {
  async getCommunities() {
    const db = await resolveDb();
    const rows = await db.getAll<CommunityRow>(
      'SELECT * FROM communities ORDER BY COALESCE(size, 0) DESC, name ASC',
    );
    return rows.map(mapCommunity);
  }

  async getCommunitiesForConcept(conceptId: string) {
    const all = await this.getCommunities();
    return all.filter((c) => c.concept_ids.includes(conceptId));
  }
}

// ------------------------------------------------------------------
// IVerseRelationRepository
// ------------------------------------------------------------------

export class SemanticVerseRelationRepository
  implements IVerseRelationRepository
{
  async getRelationsForVerse(verseKey: string) {
    const db = await resolveDb();
    const rows = await db.getAll<VerseRelationRow>(
      `SELECT *
       FROM verse_relations
       WHERE verse_a = ? OR verse_b = ?
       ORDER BY score DESC`,
      [verseKey, verseKey],
    );
    return rows.map(mapVerseRelation);
  }

  async getRelationsForVerseOfType(verseKey: string, type: string) {
    const db = await resolveDb();
    const rows = await db.getAll<VerseRelationRow>(
      `SELECT *
       FROM verse_relations
       WHERE (verse_a = ? OR verse_b = ?) AND type = ?
       ORDER BY score DESC`,
      [verseKey, verseKey, type],
    );
    return rows.map(mapVerseRelation);
  }

  async getCrossRefs(limit?: number) {
    const db = await resolveDb();
    const max = clampLimit(limit, 500);
    const rows = await db.getAll<VerseRelationRow>(
      `SELECT *
       FROM verse_relations
       WHERE type = 'CROSS_REFERENCE'
       ORDER BY score DESC
       LIMIT ?`,
      [max],
    );
    return rows.map(mapVerseRelation);
  }
}

// ------------------------------------------------------------------
// Composition convenience
// ------------------------------------------------------------------

/**
 * Create all three adapters bound to the shared PowerSync DB. The
 * adapter classes are cheap (no I/O in the constructor); the DDL is
 * ensured on first query.
 */
export function createSemanticMemoryRepositories(): {
  conceptRepository: IConceptRepository;
  communityRepository: ICommunityRepository;
  verseRelationRepository: IVerseRelationRepository;
} {
  return {
    conceptRepository: new SemanticConceptRepository(),
    communityRepository: new SemanticCommunityRepository(),
    verseRelationRepository: new SemanticVerseRelationRepository(),
  };
}
