/**
 * Semantic-Memory Domain — SemanticQueryService
 *
 * Pure query service over the read-only repository ports. Performs no I/O
 * itself — all access goes through the injected repositories. This keeps the
 * domain layer testable and infrastructure-agnostic (Interface/Adapter
 * pattern, project rule D-ENT / 29-architecture-rulebook).
 *
 * Use-cases:
 *  - {@link SemanticQueryService.recallCues} — "what should I see next to
 *    remember this verse" (concepts + related verses + community).
 *  - {@link SemanticQueryService.conceptNeighborhood} — BFS walk over
 *    CHILD_OF + RELATED concept edges.
 *  - {@link SemanticQueryService.verseCommunity} — which cluster a verse
 *    belongs to.
 */

import type {
  Community,
  Concept,
  VerseConcept,
  VerseRelation,
} from './entities';
import type {
  ICommunityRepository,
  IConceptRepository,
  IVerseRelationRepository,
} from './repositories';

// ====================
// Result shapes
// ====================

/** Result of {@link SemanticQueryService.recallCues}. */
export interface RecallCues {
  /** The canonical verse key the cues were recalled for. */
  verseKey: string;
  /** Concepts attached to the verse, with their bridge metadata. */
  concepts: Array<{
    concept: Concept;
    role: VerseConcept['role'];
    confidence: number;
    source: string;
  }>;
  /** Verses related to the verse (through verse-level edges). */
  relatedVerses: Array<{
    verseKey: string;
    relation: VerseRelation;
  }>;
  /** The community this verse belongs to, when one exists. */
  community: Community | null;
}

/** One node in a concept neighborhood walk. */
export interface NeighborhoodNode {
  concept: Concept;
  /** BFS depth (0 = the seed concept). */
  depth: number;
  /** How the node was reached (absent at depth 0). */
  via?: { fromConceptId: string; relationType: string; confidence: number };
}

// ====================
// Service
// ====================

/**
 * Default BFS neighborhood depth (1 = direct neighbors of the seed).
 */
export const DEFAULT_NEIGHBORHOOD_DEPTH = 1;

/**
 * Which concept-relation types the neighborhood walk traverses.
 * Structural (CHILD_OF) and associative (RELATED) only — CONTRASTS and
 * SUPPORTS are intentionally excluded to keep the graph walk focused.
 */
export const NEIGHBORHOOD_EDGE_TYPES: ReadonlySet<string> = new Set([
  'CHILD_OF',
  'RELATED',
]);

export class SemanticQueryService {
  constructor(
    private readonly conceptRepo: IConceptRepository,
    private readonly communityRepo: ICommunityRepository,
    private readonly verseRelationRepo: IVerseRelationRepository,
  ) {}

  /**
   * Recall cues for a verse: the concepts attached to it, the verses that
   * relate to it, and the community it belongs to (when any).
   *
   * Pure orchestration over the read-only ports — no I/O here.
   */
  async recallCues(verseKey: string): Promise<RecallCues> {
    const [bridges, relatedVerses, communities] = await Promise.all([
      this.conceptRepo.getConceptsForVerse(verseKey),
      this.verseRelationRepo.getRelationsForVerse(verseKey),
      this.communityRepo.getCommunities(),
    ]);

    // Resolve the concepts behind the bridge rows (dedup by concept id,
    // keeping the highest-confidence bridge per concept).
    const byConcept = new Map<string, VerseConcept>();
    for (const bridge of bridges) {
      const existing = byConcept.get(bridge.concept_id);
      if (!existing || bridge.confidence > existing.confidence) {
        byConcept.set(bridge.concept_id, bridge);
      }
    }

    const concepts: RecallCues['concepts'] = [];
    for (const bridge of byConcept.values()) {
      const concept = await this.conceptRepo.getConcept(bridge.concept_id);
      if (!concept) continue;
      concepts.push({
        concept,
        role: bridge.role,
        confidence: bridge.confidence,
        source: bridge.source,
      });
    }
    // PRIMARY first, then confidence descending.
    const roleWeight: Record<VerseConcept['role'], number> = {
      PRIMARY: 0,
      SECONDARY: 1,
      CONTRAST: 2,
      RELATED: 3,
    };
    concepts.sort(
      (a, b) =>
        roleWeight[a.role] - roleWeight[b.role] ||
        b.confidence - a.confidence,
    );

    // The community whose members include at least one of the verse's
    // concepts (the "community of the verse", when resolvable).
    const conceptIds = new Set(byConcept.keys());
    const community =
      communities.find((c) => c.concept_ids.some((id) => conceptIds.has(id))) ??
      null;

    return {
      verseKey,
      concepts,
      relatedVerses: relatedVerses.map((relation) => ({
        // The "other" side of the edge, relative to the queried verse.
        verseKey:
          relation.verse_a === verseKey
            ? relation.verse_b
            : relation.verse_a,
        relation,
      })),
      community,
    };
  }

  /**
   * BFS neighborhood of a concept over CHILD_OF + RELATED concept edges.
   *
   * @param conceptId the seed concept UUID.
   * @param depth BFS depth, default {@link DEFAULT_NEIGHBORHOOD_DEPTH}.
   * @returns the seed (depth 0) plus every reachable concept within
   *         `depth` hops, without revisits.
   */
  async conceptNeighborhood(
    conceptId: string,
    depth: number = DEFAULT_NEIGHBORHOOD_DEPTH,
  ): Promise<NeighborhoodNode[]> {
    const seed = await this.conceptRepo.getConcept(conceptId);
    if (!seed) return [];

    const visited = new Set<string>([conceptId]);
    const result: NeighborhoodNode[] = [{ concept: seed, depth: 0 }];
    if (depth <= 0) return result;

    // BFS level by level: expand frontier level k, stop when it empties.
    let frontier = [conceptId];
    for (let level = 0; level < depth && frontier.length > 0; level++) {
      const next: string[] = [];
      for (const id of frontier) {
        const edges = await this.conceptRepo.getConceptRelations(id);
        for (const edge of edges) {
          if (!NEIGHBORHOOD_EDGE_TYPES.has(edge.type)) continue;
          const otherId =
            edge.from_concept_id === id
              ? edge.to_concept_id
              : edge.from_concept_id;
          if (visited.has(otherId)) continue;
          visited.add(otherId);
          const neighbor = await this.conceptRepo.getConcept(otherId);
          if (!neighbor) continue;
          next.push(otherId);
          result.push({
            concept: neighbor,
            depth: level + 1,
            via: {
              fromConceptId: id,
              relationType: edge.type,
              confidence: edge.confidence,
            },
          });
        }
      }
      frontier = next;
    }

    return result;
  }

  /**
   * Resolve which community (if any) a verse belongs to, by joining the
   * verse's concepts with the community membership index.
   */
  async verseCommunity(verseKey: string): Promise<Community | null> {
    const cues = await this.recallCues(verseKey);
    return cues.community;
  }
}
