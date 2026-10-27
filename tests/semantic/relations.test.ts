/**
 * Stage F — Relations: deterministic CROSS_REFERENCE + SHARED_CONCEPT
 * verse edges. Pure, no network.
 */
import { describe, it, expect } from 'vitest';
import {
  buildCrossrefRelations,
  buildSameCommunityRelations,
  buildSharedConceptRelations,
  runRelations,
} from '../../scripts/semantic/relations';

describe('stage F — relations', () => {
  describe('buildCrossrefRelations', () => {
    it('dedupes undirected pairs and drops self-pairs / zero confidence', () => {
      const rows = buildCrossrefRelations([
        { fromVerseId: 'mat:5:1', toVerseId: 'luk:6:37', confidence: 0.8 },
        { fromVerseId: 'luk:6:37', toVerseId: 'mat:5:1', confidence: 0.6 }, // duplicate, lower conf
        { fromVerseId: 'gen:1:1', toVerseId: 'gen:1:1' }, // self → dropped
        { fromVerseId: 'rom:5:8', toVerseId: 'joh:3:16', confidence: 0 }, // conf ≤ 0 → dropped
      ]);
      expect(rows).toHaveLength(1);
      expect(rows[0].fromVerseId).toBe('luk:6:37');
      expect(rows[0].toVerseId).toBe('mat:5:1');
      expect(rows[0].relationType).toBe('CROSS_REFERENCE');
      expect(rows[0].confidence).toBe(0.8); // first-seen wins
    });

    it('is byte-stable across runs', () => {
      const edges = [
        { fromVerseId: 'a:1:1', toVerseId: 'b:1:1', confidence: 0.8 },
        { fromVerseId: 'c:1:1', toVerseId: 'd:1:1', confidence: 0.7 },
      ];
      expect(JSON.stringify(buildCrossrefRelations(edges))).toBe(
        JSON.stringify(buildCrossrefRelations(edges)),
      );
    });
  });

  describe('buildSharedConceptRelations', () => {
    it('emits every verse pair under a concept that clears the confidence floor', () => {
      const rows = buildSharedConceptRelations({
        versesByConcept: {
          'seed:faith': ['heb:11:1', 'heb:11:6', 'act:26:18'],
          'seed:joy': ['phil:4:4'], // single verse → no pairs
        },
        meanConfidenceByConcept: {
          'seed:faith': 0.95,
          'seed:joy': 0.5, // below the 0.7 floor
        },
      });
      // C(3,2) = 3 pairs, all under faith, sorted verse order.
      expect(rows).toHaveLength(3);
      for (const r of rows) {
        expect(r.relationType).toBe('SHARED_CONCEPT');
        expect(r.conceptId).toBe('seed:faith');
      }
      expect(rows[0].fromVerseId).toBe('act:26:18');
      expect(rows[0].toVerseId).toBe('heb:11:1');
    });

    it('honors a custom minConfidence floor', () => {
      const rows = buildSharedConceptRelations({
        versesByConcept: { 'k': ['a:1:1', 'a:1:2'] },
        meanConfidenceByConcept: { k: 0.65 },
        minConfidence: 0.7,
      });
      expect(rows).toHaveLength(0);
    });
  });

  describe('runRelations', () => {
    it('defaults to the curated fallback crossrefs when none are supplied', () => {
      const out = runRelations({});
      expect(out.stats.crossrefs).toBeGreaterThanOrEqual(10);
      expect(out.stats.shared_concept).toBe(0);
      // Fallback ids are deterministic.
      expect(out.crossrefs[0].id).toMatch(/^[0-9a-f]{8}-/);
    });

    it('combines supplied crossrefs + shared input', () => {
      const out = runRelations({
        crossrefs: [{ fromVerseId: 'gen:1:1', toVerseId: 'heb:11:3', confidence: 0.9 }],
        shared: {
          versesByConcept: { k: ['x:1:1', 'x:1:2'] },
          meanConfidenceByConcept: { k: 0.9 },
        },
      });
      expect(out.stats.crossrefs).toBe(1);
      expect(out.stats.shared_concept).toBe(1);
    });

    it('emits SAME_COMMUNITY rows for community verse pairs, skipping already-emitted pairs', () => {
      const out = runRelations({
        crossrefs: [{ fromVerseId: 'gen:1:1', toVerseId: 'gen:1:2', confidence: 0.9 }],
        communities: [
          {
            id: 'comm-1',
            name: 'Love (community 1)',
            verseIds: ['gen:1:1', 'gen:1:2', 'joh:3:16'],
            sourceConceptKey: 'seed:love',
          },
        ],
      });
      // Pairs: (gen:1:1,gen:1:2) skipped — already CROSS_REFERENCE;
      // (gen:1:1,joh:3:16) and (gen:1:2,joh:3:16) emitted.
      expect(out.stats.same_community).toBe(2);
      const rows = out.sameCommunity;
      expect(rows.every((r) => r.relationType === 'SAME_COMMUNITY')).toBe(true);
      expect(rows.every((r) => r.communityId === 'comm-1')).toBe(true);
      expect(rows.every((r) => r.conceptId === 'seed:love')).toBe(true);
      expect(rows.every((r) => r.confidence === 0.8)).toBe(true);
    });
  });

  describe('buildSameCommunityRelations', () => {
    it('emits every verse pair within a community undirected once, deduped across communities', () => {
      const rows = buildSameCommunityRelations({
        communities: [
          { id: 'c1', name: 'A', verseIds: ['v:1:1', 'v:1:2', 'v:1:3'], sourceConceptKey: 'k1' },
          { id: 'c2', name: 'B', verseIds: ['v:1:2', 'v:1:3'] }, // overlap with c1
        ],
      });
      // c1: (1,2),(1,3),(2,3); c2 pair (2,3) deduped → 3 rows total.
      expect(rows).toHaveLength(3);
      expect(rows.map((r) => `${r.fromVerseId}>${r.toVerseId}`).sort()).toEqual([
        'v:1:1>v:1:2',
        'v:1:1>v:1:3',
        'v:1:2>v:1:3',
      ]);
    });

    it('honors skipKeys (pairs already emitted by another relation type)', () => {
      const rows = buildSameCommunityRelations({
        communities: [{ id: 'c1', name: 'A', verseIds: ['a:1:1', 'a:1:2'], sourceConceptKey: 'k' }],
        skipKeys: new Set(['CC:a:1:1:a:1:2']),
      });
      expect(rows).toHaveLength(0);
    });
  });
});
