/**
 * Stage H — extended checks: verse-universe resolution, concept-id
 * resolution, CHILD_OF cycles, empty communities, duplicate canonical
 * concepts. Pure, no network.
 */
import { describe, it, expect } from 'vitest';
import { runExtendedChecks } from '../../scripts/semantic/validate';
import type { InMemoryRows } from '../../scripts/semantic/validate';

const cleanRows: InMemoryRows = {
  concepts: [
    { id: 'c1', key: 'seed:faith', canonicalLabel: 'Faith', confidence: 1.0 },
    { id: 'c2', key: 'seed:hope', canonicalLabel: 'Hope', confidence: 0.9 },
  ],
  concept_relations: [
    {
      id: 'r1',
      fromConceptId: 'c1',
      toConceptId: 'c2',
      relationType: 'RELATED',
      confidence: 0.8,
    },
  ],
  verse_concepts: [
    { id: 'v1', verseId: 'heb:11:1', conceptId: 'c1', role: 'PRIMARY', confidence: 0.95 },
  ],
  verse_relations: [
    {
      id: 'vr1',
      fromVerseId: 'gen:1:1',
      toVerseId: 'heb:11:3',
      relationType: 'CROSS_REFERENCE',
      confidence: 0.9,
    },
  ],
  communities: [],
};

const UNIVERSE = ['gen:1:1', 'heb:11:1', 'heb:11:3'];

function opts(overrides: Partial<Parameters<typeof runExtendedChecks>[0]> = {}) {
  return {
    rows: cleanRows,
    verseUniverse: UNIVERSE,
    concepts: [
      { id: 'c1', key: 'seed:faith', confidence: 1.0 },
      { id: 'c2', key: 'seed:hope', confidence: 0.9 },
    ],
    conceptEdges: [],
    ...overrides,
  };
}

describe('stage H — extended checks', () => {
  it('passes on a clean, fully-resolved row set', () => {
    const h = runExtendedChecks(opts());
    expect(h.passed).toBe(true);
    expect(h.violations).toHaveLength(0);
    expect(h.counts.verse_universe).toBe(3);
  });

  it('flags verse ids that are absent from the verse universe', () => {
    const rows: InMemoryRows = {
      ...cleanRows,
      verse_concepts: [
        { id: 'v1', verseId: 'zzz:99:99', conceptId: 'c1', role: 'PRIMARY', confidence: 0.95 },
      ],
    };
    const h = runExtendedChecks(opts({ rows }));
    expect(h.passed).toBe(false);
    expect(h.violations.some((v) => v.check === 'verse_ids_resolve')).toBe(true);
  });

  it('flags verse_relation endpoints that are not in the universe', () => {
    const rows: InMemoryRows = {
      ...cleanRows,
      verse_relations: [
        {
          id: 'vr1',
          fromVerseId: 'gen:1:1',
          toVerseId: 'notabook:1:1',
          relationType: 'CROSS_REFERENCE',
          confidence: 0.9,
        },
      ],
    };
    const h = runExtendedChecks(opts({ rows }));
    expect(h.passed).toBe(false);
    expect(h.violations.some((v) => v.check === 'verse_ids_resolve')).toBe(true);
  });

  it('flags concept refs that have no concept row', () => {
    const rows: InMemoryRows = {
      ...cleanRows,
      verse_concepts: [
        { id: 'v1', verseId: 'heb:11:1', conceptId: 'missing', role: 'PRIMARY', confidence: 0.95 },
      ],
    };
    const h = runExtendedChecks(opts({ rows }));
    expect(h.passed).toBe(false);
    expect(h.violations.some((v) => v.check === 'concept_ids_resolve')).toBe(true);
  });

  it('flags self-relations in the extended set', () => {
    const rows: InMemoryRows = {
      ...cleanRows,
      verse_relations: [
        {
          id: 'vr1',
          fromVerseId: 'gen:1:1',
          toVerseId: 'gen:1:1',
          relationType: 'SHARED_CONCEPT',
          confidence: 0.9,
        },
      ],
    };
    const h = runExtendedChecks(opts({ rows }));
    expect(h.violations.some((v) => v.check === 'no_self_relations')).toBe(true);
  });

  it('detects a CHILD_OF cycle among concept edges', () => {
    const edges = [
      { fromConceptId: 'c1', toConceptId: 'c2', relationType: 'CHILD_OF' },
      { fromConceptId: 'c2', toConceptId: 'c3', relationType: 'CHILD_OF' },
      { fromConceptId: 'c3', toConceptId: 'c1', relationType: 'CHILD_OF' },
    ];
    const h = runExtendedChecks(opts({ conceptEdges: edges }));
    expect(h.passed).toBe(false);
    expect(h.violations.some((v) => v.check === 'no_child_of_cycles')).toBe(true);
  });

  it('accepts a CHILD_OF chain with no cycle', () => {
    const edges = [
      { fromConceptId: 'c1', toConceptId: 'c2', relationType: 'CHILD_OF' },
      { fromConceptId: 'c2', toConceptId: 'c3', relationType: 'CHILD_OF' },
    ];
    const h = runExtendedChecks(opts({ conceptEdges: edges }));
    expect(h.passed).toBe(true);
  });

  it('flags an empty community (size 0 or no name)', () => {
    const rows: InMemoryRows = {
      ...cleanRows,
      communities: [
        { id: 'm1', name: '', size: 3, coherence: 0.5, source: 'louvain-v1' },
      ],
    };
    const h = runExtendedChecks(opts({ rows }));
    expect(h.violations.some((v) => v.check === 'no_empty_communities')).toBe(true);
  });

  it('flags confidence values outside [0,1] on the extended row set', () => {
    const rows: InMemoryRows = {
      ...cleanRows,
      verse_relations: [
        {
          id: 'vr1',
          fromVerseId: 'gen:1:1',
          toVerseId: 'heb:11:3',
          relationType: 'CROSS_REFERENCE',
          confidence: 1.4,
        },
      ],
    };
    const h = runExtendedChecks(opts({ rows }));
    expect(h.violations.some((v) => v.check === 'confidence_valid')).toBe(true);
  });

  it('flags two concepts that share one canonical key', () => {
    const concepts = [
      { id: 'c1', key: 'seed:faith' },
      { id: 'c2', key: 'seed:faith' },
    ];
    const h = runExtendedChecks(opts({ concepts }));
    expect(h.passed).toBe(false);
    expect(h.violations.some((v) => v.check === 'unique_canonical_concepts')).toBe(true);
  });

  it('flags verse_concept rows whose concept is missing from the post-normalize set', () => {
    const vc = [{ verseId: 'heb:11:1', concept_id: 'ghost', role: 'PRIMARY' }];
    const h = runExtendedChecks(opts({ verseConcepts: vc }));
    expect(h.violations.some((v) => v.check === 'no_orphan_verse_concepts')).toBe(true);
  });
});
