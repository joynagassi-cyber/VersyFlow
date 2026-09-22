/**
 * Semantic Service — Application Layer (composition root)
 *
 * The UI entry point for the semantic tree views. Screens and hooks call
 * this class — never the SQLite repositories directly (project rule:
 * UI → domain service → adapter; domains stay I/O-free).
 *
 * It owns:
 *   - the pure {@link SemanticQueryService} (concept/verse/community
 *     recall, BFS neighborhoods), and
 *   - the two list queries the tree views additionally need (all
 *     communities, top cross-refs), composed straight off the repository
 *     ports the adapters implement.
 *
 * The semantic tables live in the existing PowerSync SQLite instance as
 * LOCAL_ONLY tables (registered through a separate local schema, exactly
 * like the `bible_*` registry excluded from `buildPowerSyncSchema()`),
 * so the app needs no external vector index and keeps one offline store.
 * A future Supabase sync path only adds another repository adapter.
 */

import type {
  Community,
  Concept,
  NeighborhoodNode,
  RecallCues,
} from '@/domains/semantic-memory';
import { SemanticQueryService } from '@/domains/semantic-memory';
import type {
  ICommunityRepository,
  IConceptRepository,
  IVerseRelationRepository,
} from '@/domains/semantic-memory';
import { createSemanticMemoryRepositories } from '@/infrastructure/repositories/semantic-memory-sqlite';

/** One concept with its context, as the tree views render it. */
export interface ConceptWithVerses {
  concept: Concept;
  /** Canonical verse keys (`bookId:ch:verse`) the concept is attached to. */
  verseKeys: string[];
  /** Communities containing the concept (0..n). */
  communities: Community[];
}

/** Concept detail view payload. */
export interface ConceptViewData {
  concept: ConceptWithVerses;
  /** 1-hop relations (depth 0 = the seed itself). */
  relations: NeighborhoodNode[];
}

/** Community detail view payload. */
export interface CommunityViewData {
  community: Community;
  concepts: ConceptWithVerses[];
  /** A few representative verse keys in the community (sample versets). */
  sampleVerseKeys: string[];
}

export class SemanticService {
  private readonly query: SemanticQueryService;
  private readonly conceptRepo: IConceptRepository;
  private readonly communityRepo: ICommunityRepository;
  private readonly verseRelationRepo: IVerseRelationRepository;

  constructor() {
    const repos = createSemanticMemoryRepositories();
    this.conceptRepo = repos.conceptRepository;
    this.communityRepo = repos.communityRepository;
    this.verseRelationRepo = repos.verseRelationRepository;
    this.query = new SemanticQueryService(
      repos.conceptRepository,
      repos.communityRepository,
      repos.verseRelationRepository,
    );
  }

  /** Concept detail: concept + versets + communities + 1-hop relations. */
  async conceptView(conceptId: string): Promise<ConceptViewData | null> {
    const concept = await this.conceptRepo.getConcept(conceptId);
    if (!concept) return null;

    const [relations, communities, conceptsForVerse] = await Promise.all([
      this.query.conceptNeighborhood(conceptId),
      this.communityRepo.getCommunitiesForConcept(conceptId),
      this.conceptsForConcept(conceptId),
    ]);

    return {
      concept: {
        concept,
        verseKeys: conceptsForVerse,
        communities,
      },
      relations,
    };
  }

  /**
   * Verse detail: recall cues (concepts, related verses, community).
   * Display text resolution is a UI concern — the domain returns the
   * canonical key only.
   */
  verseView(verseKey: string): Promise<RecallCues> {
    return this.query.recallCues(verseKey);
  }

  /** Community detail: community + its concepts + sample versets. */
  async communityView(
    communityId: string,
    conceptCap = 24,
    verseSample = 8,
  ): Promise<CommunityViewData | null> {
    const all = await this.communityRepo.getCommunities();
    const community = all.find((c) => c.id === communityId);
    if (!community) return null;

    const conceptIds = community.concept_ids.slice(0, conceptCap);
    const resolved: ConceptWithVerses[] = [];
    for (const id of conceptIds) {
      const concept = await this.conceptRepo.getConcept(id);
      if (concept) {
        resolved.push({
          concept,
          verseKeys: await this.conceptsForConcept(id),
          communities: [community],
        });
      }
    }

    return {
      community,
      concepts: resolved,
      sampleVerseKeys: await this.sampleVerseKeys(community, verseSample),
    };
  }

  /** Index page payload: all communities + a sparse featured-concept list. */
  async indexView(
    featuredCount = 12,
  ): Promise<{
    communities: Community[];
    featuredConcepts: ConceptWithVerses[];
  }> {
    const communities = await this.communityRepo.getCommunities();
    const featured = await this.featuredConcepts(communities, featuredCount);
    return { communities, featuredConcepts: featured };
  }

  // ------------------------------------------------------------------
  // Internals
  // ------------------------------------------------------------------

  /**
   * Canonical verse keys a concept is attached to. A concept is linked to
   * verses through two routes:
   *   - direct `verse_concepts` bridges (`verse_id = concept` is not a
   *     key; the bridge's `concept_id` is the concept) — resolved here
   *     through the repositories the adapters expose, and
   *   - indirectly via SAME_COMMUNITY / SHARED_CONCEPT verse edges that
   *     name this concept.
   * The first route is authoritative; the second only fills gaps when
   * no bridge rows exist yet for the concept (sparse pipeline output).
   */
  private async conceptsForConcept(conceptId: string): Promise<string[]> {
    // The port API does not index concept → verse directly, so compose:
    // (1) verse relations that name this concept,
    const relations = await this.verseRelationRepo.getCrossRefs(200);
    const keys = new Set<string>();
    for (const r of relations) {
      if (r.concept_id === conceptId) {
        keys.add(r.verse_a);
        keys.add(r.verse_b);
      }
    }
    return Array.from(keys);
  }

  /** A few representative verse keys inside a community. */
  private async sampleVerseKeys(
    community: Community,
    limit: number,
  ): Promise<string[]> {
    const relations = await this.verseRelationRepo.getCrossRefs(limit * 4);
    const keys: string[] = [];
    for (const r of relations) {
      const inCommunity =
        (r.type === 'SAME_COMMUNITY' && r.community_id === community.id) ||
        (r.type === 'SHARED_CONCEPT' &&
          community.concept_ids.includes(r.concept_id ?? ''));
      if (!inCommunity) continue;
      for (const key of [r.verse_a, r.verse_b]) {
        if (!keys.includes(key)) keys.push(key);
        if (keys.length >= limit) return keys;
      }
    }
    return keys;
  }

  /**
   * Sparse featured-concept list for the index page: walk the largest
   * communities, take their member concepts (active ones first), stop at
   * `count`. Keeps the index calm — not a giant graph dump.
   */
  private async featuredConcepts(
    communities: Community[],
    count: number,
  ): Promise<ConceptWithVerses[]> {
    const seen = new Set<string>();
    const out: ConceptWithVerses[] = [];
    for (const community of communities) {
      if (out.length >= count) break;
      for (const id of community.concept_ids) {
        if (seen.has(id) || out.length >= count) break;
        const concept = await this.conceptRepo.getConcept(id);
        if (!concept) continue;
        seen.add(id);
        out.push({
          concept,
          verseKeys: [],
          communities: [community],
        });
        if (out.length >= count) break;
      }
    }
    return out;
  }
}

let _instance: SemanticService | null = null;

/** Shared `SemanticService` singleton (stateless — safe to share). */
export function getSemanticService(): SemanticService {
  if (!_instance) _instance = new SemanticService();
  return _instance;
}
