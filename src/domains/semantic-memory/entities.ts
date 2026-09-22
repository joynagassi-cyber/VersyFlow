/**
 * Semantic-Memory Domain — Entities & Zod Schemas
 *
 * The 5 semantic entities of the memory graph (Stage B alignment layer),
 * plus the 3 read-only repository ports and the pure query service.
 *
 * This module is PURE: no I/O, no infrastructure imports, no React.
 * Every entity carries a Zod schema (spec-mandated) used to parse rows
 * coming out of the PowerSync/SQLite adapter before they cross the
 * domain boundary.
 *
 * Conventions (project-wide, matching src/infrastructure/semantic/types.ts):
 *  - UUIDs are TEXT
 *  - timestamps are TEXT ISO-8601 UTC
 *  - confidence / score are REAL in [0, 1]
 *  - `verseId` / `verseRef` is the CANONICAL, translation-independent key
 *    `bookId:ch:verse` (e.g. `joh:3:16`) — NOT a memorization record id.
 */

import { z } from 'zod';

// ====================
// Shared enums (as const + union types, mirroring the
// MemorizationStatus pattern in src/domains/memorization/entities.ts)
// ====================

export const CONCEPT_ROLE = ['PRIMARY', 'SECONDARY', 'CONTRAST', 'RELATED'] as const;
export type ConceptRole = (typeof CONCEPT_ROLE)[number];

export const CONCEPT_RELATION_TYPES = ['RELATED', 'CONTRASTS', 'SUPPORTS', 'CHILD_OF'] as const;
export type ConceptRelationType = (typeof CONCEPT_RELATION_TYPES)[number];

export const VERSE_RELATION_TYPES = ['CROSS_REFERENCE', 'SHARED_CONCEPT', 'SAME_COMMUNITY'] as const;
export type VerseRelationType = (typeof VERSE_RELATION_TYPES)[number];

/** Lifecycle status of a concept as it moves through the pipeline. */
export const CONCEPT_STATUS = ['candidate', 'active', 'deprecated'] as const;
export type ConceptStatus = (typeof CONCEPT_STATUS)[number];

export const CONCEPT_KINDS = ['TOPIC', 'PERSON', 'EVENT', 'TEACHING', 'OTHER'] as const;
export type ConceptKind = (typeof CONCEPT_KINDS)[number];

export const CONCEPT_SOURCES = ['nave', 'torrey', 'openbible', 'derived', 'manual'] as const;
export type ConceptSource = (typeof CONCEPT_SOURCES)[number];

// ====================
// Zod schemas (entity parsing at the infrastructure boundary)
// ====================

/** Confidence in [0, 1] — shared by every edge entity. */
export const confidenceSchema = z.number().min(0.0).max(1.0);

/**
 * A single provenance entry: where a claim about a concept comes from
 * (dataset + pipeline stage + optional source URL / document key).
 */
export const sourceProvenanceSchema = z.object({
  /** Free-form provenance identifier (dataset / stage / 'user'). */
  source: z.string().min(1),
  /** Optional document or dataset key (e.g. 'nave/old-testament'). */
  docKey: z.string().optional(),
  /** Optional URL or stable identifier for traceability. */
  url: z.string().optional(),
});
export type SourceProvenance = z.infer<typeof sourceProvenanceSchema>;

/**
 * Concept — a semantic node (theme / person / event / teaching).
 *
 * `labels_by_language` is a JSON column in SQLite (`labels_by_language`);
 * it is parsed into a `Record<string, string>` by the adapter before the
 * Zod schema runs.
 */
export const conceptSchema = z.object({
  /** UUID */
  id: z.string().min(1),
  /** Human-readable canonical name (default-language label), denormalized. */
  canonical_name: z.string().min(1),
  /** URL-safe slug of canonical_name (deterministic). */
  slug: z.string().min(1),
  /** Labels keyed by BCP-47 / locale code: {"fr":"foi","en":"faith"} */
  labels_by_language: z.record(z.string(), z.string()),
  /** Free-text description (optional — published 01_parsed layer has none yet). */
  description: z.string().optional(),
  /** Provenance chain — at least one entry (dataset / stage / 'user'). */
  source_provenance: z.array(sourceProvenanceSchema).min(1),
  /** Pipeline confidence in [0, 1]. */
  confidence: confidenceSchema,
  /** Lifecycle status: candidate → active → deprecated. */
  status: z.enum(CONCEPT_STATUS),
  /** Node kind. */
  kind: z.enum(CONCEPT_KINDS).optional(),
  /** Origin dataset (nave / torrey / openbible / derived / manual). */
  source: z.enum(CONCEPT_SOURCES).optional(),
  /** Pipeline stage identifier that created the row ('stage-A'..'stage-G' | 'user'). */
  created_by: z.string().optional(),
  /** ISO-8601 UTC timestamps. */
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});
export type Concept = z.infer<typeof conceptSchema>;

/**
 * VerseConcept — N:N bridge verse <-> concept, with role.
 * `verse_id` is the canonical translation-independent key `bookId:ch:verse`.
 */
export const verseConceptSchema = z.object({
  /** Canonical verse key `bookId:ch:verse` (NOT a memorization record id). */
  verse_id: z.string().min(1),
  /** FK concepts.id */
  concept_id: z.string().min(1),
  role: z.enum(CONCEPT_ROLE),
  confidence: confidenceSchema,
  /** Provenance (dataset / stage); CONTRASTS edges always carry 'derived'. */
  source: z.string().min(1),
  created_at: z.string().optional(),
});
export type VerseConcept = z.infer<typeof verseConceptSchema>;

/**
 * ConceptRelation — directed edge between two concepts.
 */
export const conceptRelationSchema = z.object({
  /** FK concepts.id */
  from_concept_id: z.string().min(1),
  /** FK concepts.id */
  to_concept_id: z.string().min(1),
  type: z.enum(CONCEPT_RELATION_TYPES),
  confidence: confidenceSchema,
  /** Provenance (dataset / stage); CONTRASTS edges always carry 'derived'. */
  source: z.string().min(1),
  created_at: z.string().optional(),
});
export type ConceptRelation = z.infer<typeof conceptRelationSchema>;

/**
 * Community — a deterministic cluster of concepts (graph-derived, not
 * LLM-created). The LLM may SUGGEST names, but only after clustering.
 */
export const communitySchema = z.object({
  /** UUID */
  id: z.string().min(1),
  /** Cluster name (deterministic or LLM-suggested after clustering). */
  name: z.string().min(1),
  /** Optional description. */
  description: z.string().optional(),
  /** Members of the cluster (concept ids). */
  concept_ids: z.array(z.string().min(1)),
  /** Anchor concept, when one dominates (deterministic rule). */
  source_concept_id: z.string().optional(),
  /** Denormalized size (count of distinct concepts, refreshed by stage G). */
  size: z.number().int().min(0).optional(),
  /** Deterministic coherence score in [0, 1]. */
  coherence: confidenceSchema.optional(),
  /** Algorithm + version, e.g. 'louvain-v1'. */
  source: z.string().min(1),
  /** Pipeline confidence in [0, 1]. */
  confidence: confidenceSchema.optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});
export type Community = z.infer<typeof communitySchema>;

/**
 * VerseRelation — derived verse-to-verse edge.
 *
 * `verse_a` / `verse_b` are canonical keys `bookId:ch:verse`. The pair is
 * symmetric in meaning but stored as a directed row; adapters may normalize
 * ordering deterministically (e.g. lexicographic) to keep one row per pair.
 */
export const verseRelationSchema = z.object({
  /** Canonical verse key `bookId:ch:verse`. */
  verse_a: z.string().min(1),
  /** Canonical verse key `bookId:ch:verse`. */
  verse_b: z.string().min(1),
  type: z.enum(VERSE_RELATION_TYPES),
  /** Similarity / strength score in [0, 1]. */
  score: confidenceSchema,
  /** Provenance (dataset / stage). */
  source: z.string().min(1),
  /** Linking concept (SHARED_CONCEPT, or community anchor for SAME_COMMUNITY). */
  concept_id: z.string().optional(),
  /** Linking community (SAME_COMMUNITY). */
  community_id: z.string().optional(),
  created_at: z.string().optional(),
});
export type VerseRelation = z.infer<typeof verseRelationSchema>;

// ====================
// Canonical verse reference (shared by the query service)
// ====================

/**
 * A minimal, translation-independent verse reference used as the entry
 * point of semantic queries. The domain only knows the canonical key
 * `bookId:ch:verse` — resolution of display text is a UI concern.
 */
export interface VerseReference {
  /** Book identifier (gen, exo, joh, ...). */
  bookId: string;
  /** Chapter number (1-based). */
  chapter: number;
  /** Verse number (1-based). */
  verse: number;
}

/** Build the canonical verse key `bookId:ch:verse` (e.g. `joh:3:16`). */
export function toVerseKey(ref: VerseReference): string {
  return `${ref.bookId}:${ref.chapter}:${ref.verse}`;
}

/**
 * Parse a canonical verse key `bookId:ch:verse` back into a
 * {@link VerseReference}. Returns `null` when the key is malformed.
 */
export function parseVerseKey(key: string): VerseReference | null {
  const m = /^([a-z]+):(\d+):(\d+)$/i.exec(key.trim());
  if (!m) return null;
  const chapter = Number(m[2]);
  const verse = Number(m[3]);
  if (chapter <= 0 || verse <= 0) return null;
  return { bookId: m[1].toLowerCase(), chapter, verse };
}
