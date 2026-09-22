/**
 * Semantic-Memory Domain — Barrel Exports
 *
 * Pure domain: entities + Zod schemas, read-only repository ports, and the
 * query service. No I/O, no infrastructure imports.
 */

// Entities & Zod schemas
export {
  CONCEPT_ROLE,
  CONCEPT_RELATION_TYPES,
  VERSE_RELATION_TYPES,
  CONCEPT_STATUS,
  CONCEPT_KINDS,
  CONCEPT_SOURCES,
  confidenceSchema,
  sourceProvenanceSchema,
  conceptSchema,
  verseConceptSchema,
  conceptRelationSchema,
  communitySchema,
  verseRelationSchema,
  toVerseKey,
  parseVerseKey,
} from './entities';
export type {
  ConceptRole,
  ConceptRelationType,
  VerseRelationType,
  ConceptStatus,
  ConceptKind,
  ConceptSource,
  SourceProvenance,
  Concept,
  VerseConcept,
  ConceptRelation,
  Community,
  VerseRelation,
  VerseReference,
} from './entities';

// Repository ports (read-only)
export type {
  IConceptRepository,
  ICommunityRepository,
  IVerseRelationRepository,
  ConceptSearchHit,
} from './repositories';

// Query service (pure)
export {
  SemanticQueryService,
  DEFAULT_NEIGHBORHOOD_DEPTH,
  NEIGHBORHOOD_EDGE_TYPES,
} from './services';
export type { RecallCues, NeighborhoodNode } from './services';
