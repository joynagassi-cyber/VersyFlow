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
 * The semantic cards live in the browser store, in local-only collections
 * (registered through a separate schema, exactly like the `bible_*` assets),
 * so the app needs no external vector index and keeps one offline store.
 * A future backend only adds another repository adapter.
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
  IConceptTagRepository,
} from '@/domains/semantic-memory';
import {
  createMockSemanticMemoryRepositories,
  mockChapterVerseConcepts,
  mockUserConcepts,
  mockVerseKeysForConcept,
} from '@/dev/mock/semantic';

/** One concept with its context, as the tree views render it. */
export interface ConceptWithVerses {
  concept: Concept;
  /** Canonical verse keys (`bookId:ch:verse`) the concept is attached to. */
  verseKeys: string[];
  /** Communities containing the concept (0..n). */
  communities: Community[];
}

/** A user-contributed concept for a verse (auto-filled from first tag). */
export interface SeedConcept {
  id: string;
  canonical_name: string;
  kind: 'TOPIC' | 'PERSON' | 'EVENT' | 'TEACHING' | 'OTHER';
  status: 'candidate' | 'active' | 'deprecated';
}

/** Concept detail view payload. */
export interface ConceptViewData {
  concept: ConceptWithVerses;
  /** 1-hop relations (depth 0 = the seed itself). */
  relations: NeighborhoodNode[];
}

/**
 * The minimal write payload accepted by `SemanticService.saveVerseTag`.
 * `verseKey` is the canonical `bookId:ch:verse`; `conceptId` is a
 * client-generated UUID (`crypto.randomUUID()`); `canonicalName` is the
 * display name the user typed (the adapter reuses an existing concept
 * with the same name, or creates it).
 */
export interface VerseTagSeed {
  verseKey: string;
  conceptId: string;
  canonicalName: string;
  role: 'PRIMARY' | 'SECONDARY' | 'CONTRAST' | 'RELATED';
  /** BCP-47 locale of the name (usually the current UI language). */
  locale?: string;
  /** Bridge row UUID (generated when absent). */
  bridgeId?: string;
}

/**
 * Result of saving a verse tag: the concept actually written (either a
 * pre-existing one or the auto-created seed) plus whether it was new.
 */
export interface VerseTagResult {
  concept: Concept;
  created: boolean;
}

/** One entry of the user's personal semantic tree (`myConcepts`). */
export interface MyConceptEntry {
  concept: Concept;
  /** Verse keys (`bookId:ch:verse`) the user tagged with this concept. */
  verseKeys: string[];
  /** Localized label (falls back to the canonical name). */
  label: string;
}

/**
 * All concept bridges of a chapter, in one `verse_concepts` range query
 * (`verse_id LIKE 'book:ch:%'`). The domain's per-verse `recallCues`
 * composes N queries; this is the O(1) variant the chapter tag chips use.
 */
export interface ChapterVerseConcepts {
  /** Canonical verse key → concept ids (deduplicated). */
  conceptIdsByVerse: Record<string, string[]>;
  /** Canonical verse key → bridge source ('user' / pipeline stage). */
  sourcesByVerse: Record<string, string[]>;
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
  private readonly tagRepo: IConceptTagRepository;


  constructor() {
    // Local-only app: the semantic store is the browser adapter, seeded with
    // the default concept cards.
    const repos = createMockSemanticMemoryRepositories();
    this.conceptRepo = repos.conceptRepository;
    this.communityRepo = repos.communityRepository;
    this.verseRelationRepo = repos.verseRelationRepository;
    this.tagRepo = repos.tagRepository;
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
   *   - direct `verse_concepts` bridges (the bridge's `concept_id` is the
   *     concept) — resolved here through a single `verse_concepts` query,
   *     and
   *   - indirectly via SAME_COMMUNITY / SHARED_CONCEPT verse edges that
   *     name this concept.
   * The first route is authoritative; the second only fills gaps when
   * no bridge rows exist yet for the concept (sparse pipeline output).
   */
  private async conceptsForConcept(conceptId: string): Promise<string[]> {
    // (1) Authoritative: direct verse_concepts bridges for this concept.
    const keys = new Set<string>(mockVerseKeysForConcept(conceptId, false));

    // (2) Indirect: verse relations naming this concept (sparse pipeline).
    const relations = await this.verseRelationRepo.getCrossRefs(200);
    for (const r of relations) {
      if (r.concept_id === conceptId) {
        keys.add(r.verse_a);
        keys.add(r.verse_b);
      }
    }
    return Array.from(keys);
  }

  /**
   * All concept bridges of a whole chapter in a single range query.
   * Replaces the N-per-verse `recallCues` loop: one `verse_concepts`
   * read for `bookId:ch:%`, concepts then resolved in bulk.
   */
  async chapterConcepts(
    bookId: string,
    chapter: number,
  ): Promise<ChapterVerseConcepts> {
    return mockChapterVerseConcepts(bookId, chapter);
  }

  /**
   * Resolve the concept rows behind a chapter's bridge rows: verse-key →
   * `Concept[]` (deduplicated) + the community any of them belongs to
   * (one lookup, not N). Composes `chapterConcepts` (single range query)
   * with bulk concept resolution.
   */
  async chapterConceptsResolved(
    bookId: string,
    chapter: number,
  ): Promise<{
    conceptsByVerse: Record<string, Concept[]>;
    community: Community | null;
  }> {
    const raw = await this.chapterConcepts(bookId, chapter);
    const ids = Object.values(raw.conceptIdsByVerse).flat();
    const resolved = new Map<string, Concept>();
    const uniq = Array.from(new Set(ids));
    await Promise.all(
      uniq.map(async (id) => {
        const c = await this.conceptRepo.getConcept(id);
        if (c) resolved.set(id, c);
      }),
    );
    const conceptsByVerse: Record<string, Concept[]> = {};
    for (const [key, list] of Object.entries(raw.conceptIdsByVerse)) {
      const out = list.map((id) => resolved.get(id)).filter((c): c is Concept => Boolean(c));
      if (out.length > 0) conceptsByVerse[key] = out;
    }
    // One community pass over the union of concepts.
    let community: Community | null = null;
    if (uniq.length > 0) {
      const all = await this.communityRepo.getCommunities();
      const union = new Set(uniq);
      community = all.find((cm) => cm.concept_ids.some((cid) => union.has(cid))) ?? null;
    }
    return { conceptsByVerse, community };
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
   * Save a user-contributed tag on a verse: attach a concept to the verse
   * (creating the concept row if it does not exist yet). This is the write
   * side of the "Tag" action on the verse floating bar — it immediately
   * extends the user's personal semantic tree.
   *
   * @param seed the tag to save (client-generated UUID + display name).
   * @returns the concept actually written and whether it was new.
   */
  async saveVerseTag(seed: VerseTagSeed): Promise<VerseTagResult> {
    return this.tagRepo.insertTag({
      id: seed.conceptId,
      verse_id: seed.verseKey,
      concept_id: seed.conceptId,
      canonical_name: seed.canonicalName,
      locale: seed.locale,
      role: seed.role,
      bridgeId: seed.bridgeId,
    });
  }

  /**
   * Search for a concept by free-text term; used by the "add concept"
   * input on the verse page to avoid duplicate tags.
   */
  async searchConcepts(term: string, lang?: string, limit?: number) {
    return this.conceptRepo.searchConcepts(term, lang, limit);
  }

  /**
   * The user's personal semantic tree: every concept that was created
   * through the "Taguer" verse action (`source = 'manual'`,
   * `created_by = 'user'`), each with its tagged verse keys and a
   * localized label for the current language.
   */
  async myConcepts(limit = 40, lang?: string): Promise<MyConceptEntry[]> {
    const base = lang?.split('-')?.[0];
    return mockUserConcepts(limit).map((concept) => ({
      concept,
      verseKeys: mockVerseKeysForConcept(concept.id, true),
      label:
        concept.labels_by_language[lang ?? ''] ??
        (base ? concept.labels_by_language[base] : undefined) ??
        concept.canonical_name,
    }));
  }

  // ------------------------------------------------------------------
  // User-tag internals
  // ------------------------------------------------------------------

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
