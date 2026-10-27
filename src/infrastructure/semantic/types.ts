/**
 * `@semantic-verse/types` — shared entities of the semantic layer (Stage B).
 *
 * These are the TS interfaces specified in the decision phase (5 entities +
 * enums). They live here (consumed by the pipeline scripts under
 * `scripts/semantic/`) and will be mirrored into `src/domains/semantic/`
 * when the semantic domain lands in-app (Stage C+).
 *
 * Conventions (project-wide):
 *  - UUIDs are TEXT
 *  - timestamps are TEXT ISO-8601 UTC
 *  - confidence is a REAL in [0,1]
 *  - `verseId` is the CANONICAL, translation-independent key `bookId:ch:verse`
 *    (e.g. `joh:3:16`) — NOT a memorization record id.
 */

// ---- shared enums (as const + union types, mirroring the
//      MemorizationStatus pattern in src/domains/memorization/entities.ts) ----

export const CONCEPT_ROLE = ['PRIMARY', 'SECONDARY', 'CONTRAST', 'RELATED'] as const;
export type ConceptRole = (typeof CONCEPT_ROLE)[number];

export const CONCEPT_RELATION_TYPES = ['RELATED', 'CONTRASTS', 'SUPPORTS', 'CHILD_OF'] as const;
export type ConceptRelationType = (typeof CONCEPT_RELATION_TYPES)[number];

export const VERSE_RELATION_TYPES = ['CROSS_REFERENCE', 'SHARED_CONCEPT', 'SAME_COMMUNITY'] as const;
export type VerseRelationType = (typeof VERSE_RELATION_TYPES)[number];

export const CONCEPT_STATUS = ['unresolved', 'accepted', 'rejected'] as const;
export type ConceptStatus = (typeof CONCEPT_STATUS)[number];

export const CONCEPT_KINDS = ['TOPIC', 'PERSON', 'EVENT', 'TEACHING', 'OTHER'] as const;
export type ConceptKind = (typeof CONCEPT_KINDS)[number];

export const CONCEPT_SOURCES = ['nave', 'torrey', 'openbible', 'derived', 'manual'] as const;
export type ConceptSource = (typeof CONCEPT_SOURCES)[number];

/** Concept — a semantic node (theme/person/event/teaching) */
export interface Concept {
  id: string; // UUID
  labelsByLanguage: Record<string, string>; // {"fr":"foi","en":"faith","pt":"fé"}
  canonicalLabel: string; // default-language label, denormalized for index/display
  kind: 'TOPIC' | 'PERSON' | 'EVENT' | 'TEACHING' | 'OTHER';
  source: 'nave' | 'torrey' | 'openbible' | 'derived' | 'manual';
  definition?: string; // optional (published 01_parsed layer has no definitions yet — do not require)
  status: ConceptStatus;
  confidence: number; // 0..1
  createdBy: string; // pipeline stage identifier ('stage-A'..'stage-G' | 'user')
  createdAt: string;
  updatedAt: string;
}

/** ConceptRelation — directed edge between two concepts */
export interface ConceptRelation {
  id: string;
  fromConceptId: string; // FK concepts.id
  toConceptId: string; // FK concepts.id
  relationType: ConceptRelationType;
  confidence: number; // 0..1
  source: string; // provenance (dataset/stage); CONTRASTS edges always carry 'derived'
  createdAt: string;
}

/** Community — a cluster of concepts/verses (graph-derived, not LLM-created) */
export interface Community {
  id: string;
  name: string; // LLM may SUGGEST names, but only after deterministic clustering
  sourceConceptId?: string; // anchor concept, when one dominates (deterministic rule)
  size: number; // count of distinct concepts (denormalized, refreshed by stage G)
  coherence: number; // deterministic score in 0..1
  source: string; // algorithm + version, e.g. 'louvain-v1'
  createdAt: string;
  updatedAt: string;
}

/** VerseConcept — N:N bridge verse <-> concept, with role */
export interface VerseConcept {
  id: string;
  verseId: string; // FK reference to canonical verse (bookId:ch:verse, NOT a memorization record)
  conceptId: string; // FK concepts.id
  role: ConceptRole; // PRIMARY/SECONDARY/CONTRAST/RELATED
  confidence: number; // 0..1
  source: string;
  createdAt: string;
}

/** VerseRelation — derived verse-to-verse edge */
export interface VerseRelation {
  id: string;
  fromVerseId: string;
  toVerseId: string;
  relationType: VerseRelationType;
  conceptId?: string; // the concept that links them (SHARED_CONCEPT, or community anchor for SAME_COMMUNITY)
  communityId?: string;
  confidence: number;
  source: string;
  createdAt: string;
}
