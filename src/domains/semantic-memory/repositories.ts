/**
 * Semantic-Memory Domain — Repository Ports (read-only)
 *
 * Pure interfaces implemented by the infrastructure layer
 * (`src/infrastructure/repositories/semantic-memory-sqlite.ts`). The domain
 * never imports infrastructure; adapters are injected through
 * {@link SemanticQueryService}.
 *
 * All rows crossing this boundary are parsed with the Zod schemas from
 * `./entities` by the adapter before being returned, so the domain can
 * assume well-formed entities.
 */

import type {
  Community,
  Concept,
  ConceptRelation,
  VerseConcept,
  VerseRelation,
} from './entities';

// ====================
// Concept repository
// ====================

/**
 * A concept hit returned by {@link IConceptRepository.searchConcepts}.
 * `matchedLabels` is the denormalized label(s) that matched the search term,
 * so the UI can display what matched and in which language.
 */
export interface ConceptSearchHit {
  concept: Concept;
  /** The label(s) that matched, keyed by language code. */
  matchedLabels: Record<string, string>;
}

export interface IConceptRepository {
  /**
   * Fetch a single concept by UUID.
   * @returns the concept, or `null` when absent.
   */
  getConcept(id: string): Promise<Concept | null>;

  /**
   * Search concepts by term.
   *
   * @param term free-text search term (case-insensitive, matching the
   *              canonical name, slug, or any localized label).
   * @param lang optional BCP-47 locale filter (only concepts carrying a
   *             label for this language are returned).
   * @param limit maximum number of hits (default 50, clamped 1..200).
   *
   * Hits are ordered by confidence descending, then canonical name ascending.
   */
  searchConcepts(term: string, lang?: string, limit?: number): Promise<ConceptSearchHit[]>;

  /**
   * All concepts attached to a canonical verse (`bookId:ch:verse`),
   * joined with their bridge row (role / confidence / source).
   *
   * @returns the bridge rows, ordered by role weight (PRIMARY first) then
   *          confidence descending.
   */
  getConceptsForVerse(verseKey: string): Promise<VerseConcept[]>;

  /**
   * Concept-level edges touching a concept, in either direction.
   *
   * @param conceptId the concept UUID.
   * @returns the matching directed edges (the seed may appear as
   *          `from_concept_id` or `to_concept_id`), ordered by confidence
   *          descending.
   */
  getConceptRelations(conceptId: string): Promise<ConceptRelation[]>;
}

// ====================
// Community repository
// ====================

export interface ICommunityRepository {
  /**
   * All communities. Ordered by size descending, then name ascending.
   */
  getCommunities(): Promise<Community[]>;

  /**
   * Communities containing a given concept.
   *
   * @param conceptId the concept UUID.
   * @returns the matching communities (a concept belongs to at most a few).
   */
  getCommunitiesForConcept(conceptId: string): Promise<Community[]>;
}

// ====================
// Verse-relation repository
// ====================

export interface IVerseRelationRepository {
  /**
   * All verse-to-verse edges touching a canonical verse
   * (`bookId:ch:verse`), in either direction.
   *
   * @returns the edges, ordered by score descending.
   */
  getRelationsForVerse(verseKey: string): Promise<VerseRelation[]>;

  /**
   * Edges of a specific type only (default `CROSS_REFERENCE`).
   */
  getRelationsForVerseOfType(
    verseKey: string,
    type: VerseRelation['type'],
  ): Promise<VerseRelation[]>;

  /**
   * All `CROSS_REFERENCE` edges, ordered by score descending.
   *
   * @param limit maximum number of rows (default 100, clamped 1..500).
   */
  getCrossRefs(limit?: number): Promise<VerseRelation[]>;
}
