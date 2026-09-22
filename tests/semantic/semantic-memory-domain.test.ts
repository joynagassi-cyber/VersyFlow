/**
 * semantic-memory domain — unit tests
 *
 * Covers:
 *  - Zod entity schemas (accept / reject)
 *  - verse-key helpers
 *  - SemanticQueryService (pure orchestration with in-memory fakes)
 */
import { describe, it, expect } from 'vitest';
import {
  conceptSchema,
  verseConceptSchema,
  conceptRelationSchema,
  communitySchema,
  verseRelationSchema,
  toVerseKey,
  parseVerseKey,
  type Concept,
  type Community,
  type VerseConcept,
  type VerseRelation,
  type ConceptRelation,
} from '../../src/domains/semantic-memory/entities';
import type {
  IConceptRepository,
  ICommunityRepository,
  IVerseRelationRepository,
  ConceptSearchHit,
} from '../../src/domains/semantic-memory/repositories';
import {
  SemanticQueryService,
  type NeighborhoodNode,
} from '../../src/domains/semantic-memory/services';

// ------------------------------------------------------------------
// Fixtures
// ------------------------------------------------------------------

function makeConcept(overrides: Partial<Concept> = {}): Concept {
  return {
    id: 'c-1',
    canonical_name: 'faith',
    slug: 'faith',
    labels_by_language: { fr: 'foi', en: 'faith' },
    description: 'trust in God',
    source_provenance: [{ source: 'nave', docKey: 'nave/nt' }],
    confidence: 0.9,
    status: 'active',
    ...overrides,
  };
}

function makeVerseConcept(overrides: Partial<VerseConcept> = {}): VerseConcept {
  return {
    verse_id: 'joh:3:16',
    concept_id: 'c-1',
    role: 'PRIMARY',
    confidence: 0.95,
    source: 'stage-E',
    ...overrides,
  };
}

function makeConceptRelation(
  overrides: Partial<ConceptRelation> = {},
): ConceptRelation {
  return {
    from_concept_id: 'c-1',
    to_concept_id: 'c-2',
    type: 'RELATED',
    confidence: 0.8,
    source: 'stage-F',
    ...overrides,
  };
}

function makeCommunity(overrides: Partial<Community> = {}): Community {
  return {
    id: 'cm-1',
    name: 'Faith & Grace',
    description: 'cluster',
    concept_ids: ['c-1', 'c-2'],
    source: 'louvain-v1',
    confidence: 0.7,
    ...overrides,
  };
}

function makeVerseRelation(
  overrides: Partial<VerseRelation> = {},
): VerseRelation {
  return {
    verse_a: 'joh:3:16',
    verse_b: 'heb:11:1',
    type: 'CROSS_REFERENCE',
    score: 0.85,
    source: 'stage-G',
    ...overrides,
  };
}

// ------------------------------------------------------------------
// In-memory fake repositories
// ------------------------------------------------------------------

class FakeConceptRepo implements IConceptRepository {
  concepts: Map<string, Concept>;
  verseConcepts: VerseConcept[];
  relations: Map<string, ConceptRelation[]>;

  constructor() {
    this.concepts = new Map();
    this.verseConcepts = [];
    this.relations = new Map();
  }

  addConcept(c: Concept) {
    this.concepts.set(c.id, c);
  }
  addVerseConcept(v: VerseConcept) {
    this.verseConcepts.push(v);
  }
  addRelation(r: ConceptRelation) {
    const key = r.from_concept_id;
    if (!this.relations.has(key)) this.relations.set(key, []);
    this.relations.get(key)!.push(r);
    const revKey = r.to_concept_id;
    if (!this.relations.has(revKey)) this.relations.set(revKey, []);
    this.relations.get(revKey)!.push(r);
  }

  async getConcept(id: string): Promise<Concept | null> {
    return this.concepts.get(id) ?? null;
  }

  async searchConcepts(
    _term: string,
    _lang?: string,
    _limit?: number,
  ): Promise<ConceptSearchHit[]> {
    return [];
  }

  async getConceptsForVerse(verseKey: string): Promise<VerseConcept[]> {
    return this.verseConcepts.filter((v) => v.verse_id === verseKey);
  }

  async getConceptRelations(conceptId: string): Promise<ConceptRelation[]> {
    return this.relations.get(conceptId) ?? [];
  }
}

class FakeCommunityRepo implements ICommunityRepository {
  constructor(private readonly communities: Community[] = []) {}
  async getCommunities(): Promise<Community[]> {
    return this.communities;
  }
  async getCommunitiesForConcept(conceptId: string): Promise<Community[]> {
    return this.communities.filter((c) =>
      c.concept_ids.includes(conceptId),
    );
  }
}

class FakeVerseRelationRepo implements IVerseRelationRepository {
  constructor(private readonly relations: VerseRelation[] = []) {}
  async getRelationsForVerse(verseKey: string): Promise<VerseRelation[]> {
    return this.relations.filter(
      (r) => r.verse_a === verseKey || r.verse_b === verseKey,
    );
  }
  async getRelationsForVerseOfType(
    verseKey: string,
    type: VerseRelation['type'],
  ): Promise<VerseRelation[]> {
    return this.relations.filter(
      (r) =>
        (r.verse_a === verseKey || r.verse_b === verseKey) && r.type === type,
    );
  }
  async getCrossRefs(_limit?: number): Promise<VerseRelation[]> {
    return this.relations.filter((r) => r.type === 'CROSS_REFERENCE');
  }
}

// ------------------------------------------------------------------
// Schema tests
// ------------------------------------------------------------------

describe('semantic-memory — Zod schemas', () => {
  it('conceptSchema accepts a valid concept', () => {
    const parsed = conceptSchema.parse(makeConcept());
    expect(parsed.canonical_name).toBe('faith');
    expect(parsed.status).toBe('active');
  });

  it('conceptSchema rejects confidence outside [0,1]', () => {
    expect(() =>
      conceptSchema.parse(makeConcept({ confidence: 1.5 })),
    ).toThrow();
  });

  it('conceptSchema rejects an unknown status', () => {
    expect(() =>
      conceptSchema.parse(makeConcept({ status: 'unknown' as never })),
    ).toThrow();
  });

  it('verseConceptSchema accepts a valid bridge row', () => {
    expect(verseConceptSchema.parse(makeVerseConcept()).role).toBe('PRIMARY');
  });

  it('conceptRelationSchema accepts a valid edge', () => {
    expect(
      conceptRelationSchema.parse(makeConceptRelation()).type,
    ).toBe('RELATED');
  });

  it('communitySchema accepts a valid community', () => {
    expect(communitySchema.parse(makeCommunity()).concept_ids).toHaveLength(2);
  });

  it('verseRelationSchema accepts a valid verse edge', () => {
    expect(verseRelationSchema.parse(makeVerseRelation()).score).toBe(0.85);
  });
});

describe('semantic-memory — verse-key helpers', () => {
  it('toVerseKey builds the canonical key', () => {
    expect(toVerseKey({ bookId: 'joh', chapter: 3, verse: 16 })).toBe(
      'joh:3:16',
    );
  });

  it('parseVerseKey round-trips', () => {
    const ref = parseVerseKey('joh:3:16');
    expect(ref).toEqual({ bookId: 'joh', chapter: 3, verse: 16 });
  });

  it('parseVerseKey returns null for malformed keys', () => {
    expect(parseVerseKey('bogus')).toBeNull();
    expect(parseVerseKey('joh:0:16')).toBeNull();
  });
});

// ------------------------------------------------------------------
// Service tests
// ------------------------------------------------------------------

describe('SemanticQueryService', () => {
  it('recallCues returns concepts (dedup + sorted), related verses, and community', async () => {
    const conceptRepo = new FakeConceptRepo();
    conceptRepo.addConcept(makeConcept({ id: 'c-1' }));
    conceptRepo.addConcept(makeConcept({ id: 'c-2', canonical_name: 'grace' }));
    // c-1's bridges: PRIMARY 0.95 + SECONDARY 0.4 → dedup keeps the
    // 0.95 PRIMARY row.
    conceptRepo.addVerseConcept(makeVerseConcept());
    conceptRepo.addVerseConcept(
      makeVerseConcept({ concept_id: 'c-2', role: 'SECONDARY', confidence: 0.7 }),
    );
    conceptRepo.addVerseConcept(
      makeVerseConcept({
        concept_id: 'c-1',
        role: 'SECONDARY',
        confidence: 0.4,
      }),
    );
    const communityRepo = new FakeCommunityRepo([makeCommunity()]);
    const verseRelationRepo = new FakeVerseRelationRepo([
      makeVerseRelation(),
    ]);

    const service = new SemanticQueryService(
      conceptRepo,
      communityRepo,
      verseRelationRepo,
    );
    const cues = await service.recallCues('joh:3:16');

    expect(cues.concepts).toHaveLength(2);
    // PRIMARY before SECONDARY.
    // c-1's bridges: PRIMARY 0.95 + SECONDARY 0.4 → dedup keeps 0.95.
    const c1 = cues.concepts.find((c) => c.concept.id === 'c-1');
    expect(c1?.role).toBe('PRIMARY');
    expect(c1?.confidence).toBe(0.95);
    // c-2: SECONDARY 0.7.
    const c2 = cues.concepts.find((c) => c.concept.id === 'c-2');
    expect(c2?.role).toBe('SECONDARY');
    expect(c2?.confidence).toBe(0.7);
    // PRIMARY (c-1) ranks before SECONDARY (c-2).
    expect(cues.concepts.map((c) => c.concept.id)).toEqual([
      'c-1',
      'c-2',
    ]);
    expect(cues.relatedVerses).toHaveLength(1);
    expect(cues.relatedVerses[0].verseKey).toBe('heb:11:1');
    expect(cues.community?.id).toBe('cm-1');
  });

  it('conceptNeighborhood performs a BFS limited to CHILD_OF + RELATED', async () => {
    const conceptRepo = new FakeConceptRepo();
    conceptRepo.addConcept(makeConcept({ id: 'c-1' }));
    conceptRepo.addConcept(makeConcept({ id: 'c-2', canonical_name: 'grace' }));
    conceptRepo.addConcept(
      makeConcept({ id: 'c-3', canonical_name: 'love' }),
    );
    // c-1 RELATED c-2 (traversed), c-2 SUPPORTS c-3 (NOT traversed).
    conceptRepo.addRelation(
      makeConceptRelation({
        from_concept_id: 'c-1',
        to_concept_id: 'c-2',
        type: 'RELATED',
      }),
    );
    conceptRepo.addRelation(
      makeConceptRelation({
        from_concept_id: 'c-2',
        to_concept_id: 'c-3',
        type: 'SUPPORTS',
      }),
    );

    const service = new SemanticQueryService(
      conceptRepo,
      new FakeCommunityRepo(),
      new FakeVerseRelationRepo(),
    );
    const neighborhood: NeighborhoodNode[] = await service.conceptNeighborhood(
      'c-1',
      1,
    );
    const ids = neighborhood.map((n) => n.concept.id);
    expect(ids).toContain('c-1');
    expect(ids).toContain('c-2');
    expect(ids).not.toContain('c-3');
  });

  it('conceptNeighborhood returns [] for an unknown seed', async () => {
    const service = new SemanticQueryService(
      new FakeConceptRepo(),
      new FakeCommunityRepo(),
      new FakeVerseRelationRepo(),
    );
    expect(await service.conceptNeighborhood('nope')).toEqual([]);
  });

  it('verseCommunity resolves the community through the verse concepts', async () => {
    const conceptRepo = new FakeConceptRepo();
    conceptRepo.addConcept(makeConcept({ id: 'c-1' }));
    conceptRepo.addVerseConcept(makeVerseConcept());
    const service = new SemanticQueryService(
      conceptRepo,
      new FakeCommunityRepo([makeCommunity()]),
      new FakeVerseRelationRepo(),
    );
    const community = await service.verseCommunity('joh:3:16');
    expect(community?.name).toBe('Faith & Grace');
  });
});
