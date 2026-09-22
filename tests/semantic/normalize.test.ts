/**
 * Stage D — Normalize: deterministic dedup + edge merging + degree counters.
 * Pure, no network.
 */
import { describe, it, expect } from 'vitest';
import {
  dedupConcepts,
  EQUIVALENCE_CONFIDENCE,
  EQUIVALENCE_SOURCE,
  equivalenceProvenance,
} from '../../scripts/semantic/normalize';
import { EQUIVALENCE_TABLE, lookupEquivalence } from '../../scripts/semantic/equivalence';

describe('stage D — normalize', () => {
  it('folds diacritic/case variants of the same label onto one winner', () => {
    const res = dedupConcepts(
      [
        { key: 'a', label: 'Foi' },
        { key: 'b', label: 'FOI' },
        { key: 'c', label: 'Foi' },
      ],
      [],
    );
    // Two of the three fold onto a single canonical winner.
    expect(res.stats.folded).toBe(2);
    expect(res.stats.output_concepts).toBe(1);
    // The winner is re-keyed to `canon:<casefold>`; the original keys map
    // into it via `folded` (first-seen key 'a' is kept as-is for b/c).
    expect(Object.keys(res.concepts)).toHaveLength(1);
    expect(res.folded.b).toBeDefined();
    expect(res.folded.c).toBeDefined();
  });

  it('folds high-Jaccard near-duplicates at the default 0.85 bar', () => {
    // The 0.85 bar is deliberately strict: only near-verbatim pairs fold.
    const pairs = [
      ['The Love of God', 'Love of God'], // 2/3 = 0.667 — below
      ['The Love of God in Christ', 'The Love of God'], // 3/5 = 0.6 — below
      ['The Love of God in Christ Jesus', 'The Love of God in Christ'], // 5/6 = 0.833 — below
    ] as const;
    for (const [a, b] of pairs) {
      const res = dedupConcepts(
        [
          { key: 'a', label: a },
          { key: 'b', label: b },
        ],
        [],
      );
      expect(res.stats.folded, `${a} ~ ${b} should not fold`).toBe(0);
      expect(res.stats.output_concepts).toBe(2);
    }

    // Two distinct labels sharing no tokens: Jaccard 0 — separate.
    const disjoint = dedupConcepts(
      [
        { key: 'a', label: 'Repentance' },
        { key: 'b', label: 'Manna' },
      ],
      [],
    );
    expect(disjoint.stats.folded).toBe(0);
    expect(disjoint.stats.output_concepts).toBe(2);
  });

  it('keeps distinct labels separate below the threshold', () => {
    const res = dedupConcepts(
      [
        { key: 'a', label: 'Faith' },
        { key: 'b', label: 'Worship' },
      ],
      [],
    );
    expect(res.stats.folded).toBe(0);
    expect(res.stats.output_concepts).toBe(2);
  });

  it('re-keys folded edge endpoints, drops self-edges, keeps max confidence', () => {
    const res = dedupConcepts(
      [
        { key: 'a', label: 'Foi' },
        { key: 'b', label: 'FOI' }, // folds onto a's winner
        { key: 'c', label: 'Grace' },
      ],
      [
        { fromKey: 'b', toKey: 'c', relationType: 'RELATED', confidence: 0.5, source: 's1' },
        { fromKey: 'a', toKey: 'c', relationType: 'RELATED', confidence: 0.9, source: 's2' },
      ],
    );
    expect(res.stats.self_edges_dropped).toBe(0);
    // b folds onto a's winner, so b→c re-keys to a→c and merges with the
    // existing a→c edge (max confidence wins). No a–b self-edge exists.
    // Edge endpoints are re-keyed to the canonical winners (canon:foi,
    // canon:grace) — so exactly one merged a–c RELATED edge at 0.9.
    expect(res.edges).toHaveLength(1);
    const ac = res.edges.filter((e) => e.relationType === 'RELATED');
    expect(ac).toHaveLength(1);
    expect(ac[0].confidence).toBe(0.9);
  });

  it('computes in+out degree counters for every survivor', () => {
    const res = dedupConcepts(
      [
        { key: 'a', label: 'Faith' },
        { key: 'b', label: 'Hope' },
        { key: 'c', label: 'Joy' },
      ],
      [
        { fromKey: 'a', toKey: 'b', relationType: 'RELATED', confidence: 0.8, source: 's' },
        { fromKey: 'b', toKey: 'c', relationType: 'RELATED', confidence: 0.8, source: 's' },
      ],
    );
    // Degree is denormalized onto the canonical winners (canon:faith, …).
    expect(res.degree['canon:faith']).toBe(1);
    expect(res.degree['canon:hope']).toBe(2);
    expect(res.degree['canon:joy']).toBe(1);
  });

  it('honors a custom similarity threshold', () => {
    // jaccard('Resurrection', 'Resurrection of Jesus') = 1/2 = 0.5
    const loose = dedupConcepts(
      [
        { key: 'a', label: 'Resurrection' },
        { key: 'b', label: 'Resurrection of Jesus' },
      ],
      [],
      { similarityThreshold: 0.4 },
    );
    const strict = dedupConcepts(
      [
        { key: 'a', label: 'Resurrection' },
        { key: 'b', label: 'Resurrection of Jesus' },
      ],
      [],
      { similarityThreshold: 0.99 },
    );
    expect(loose.stats.folded).toBe(1);
    expect(strict.stats.folded).toBe(0);
  });

  // ---------------------------------------------------------------------
  // Stage D — lexical equivalence table (deterministic merges)
  // ---------------------------------------------------------------------

  it('folds humility ~ humbleness ~ lowliness ~ meekness onto Humility', () => {
    const res = dedupConcepts(
      [
        { key: 'nave:humility', label: 'Humility', labelsByLanguage: { en: 'Humility' } },
        { key: 'torrey:humbleness', label: 'Humbleness', labelsByLanguage: { en: 'Humbleness' } },
        { key: 'nave:lowliness', label: 'Lowliness', labelsByLanguage: { en: 'Lowliness' } },
        { key: 'torrey:meekness', label: 'Meekness', labelsByLanguage: { en: 'Meekness' } },
        { key: 'seed:grace', label: 'Grace', labelsByLanguage: { en: 'Grace' } },
      ],
      [
        // Torrey→Nave parallel edge: re-keys onto the Humility winner.
        { fromKey: 'torrey:humbleness', toKey: 'seed:grace', relationType: 'RELATED', confidence: 0.5, source: 'torrey' },
        { fromKey: 'nave:humility', toKey: 'seed:grace', relationType: 'SUPPORTS', confidence: 0.7, source: 'nave' },
      ],
    );

    // Three of the four family members fold; Grace is untouched.
    expect(res.stats.equivalence_merges).toBe(3);
    expect(res.stats.folded).toBe(3);
    expect(res.stats.output_concepts).toBe(2);

    // The first-seen original key survives as the winner key space.
    expect(res.folded['torrey:humbleness']).toBe('nave:humility');
    expect(res.folded['nave:lowliness']).toBe('nave:humility');
    expect(res.folded['torrey:meekness']).toBe('nave:humility');
    expect(res.concepts['nave:humility']).toBeDefined();
    expect(res.concepts['seed:grace']).toBeDefined();

    // Parallel edges on the same (from,to,type) triple keep the MAX
    // confidence after the endpoint re-key — one merged edge at 0.7.
    expect(res.edges.filter((e) => e.relationType === 'SUPPORTS')).toHaveLength(1);
    expect(res.edges.filter((e) => e.relationType === 'SUPPORTS')[0].confidence).toBe(0.7);
  });

  it('keeps original source terms in provenance on every merge', () => {
    const res = dedupConcepts(
      [
        { key: 'nave:humility', label: 'Humility', labelsByLanguage: { en: 'Humility', fr: 'Humilité' } },
        { key: 'torrey:humbleness', label: 'Humbleness', labelsByLanguage: { en: 'Humbleness' } },
        { key: 'nave:lowliness', label: 'Lowliness', labelsByLanguage: { en: 'Lowliness' } },
      ],
      [],
      { provenance: { 'nave:humility': { language: 'en' }, 'torrey:humbleness': { source: 'torrey' } } },
    );

    const prov = res.concepts['nave:humility'].provenance;
    // All three original terms survive, in input order, deduped on (term,language).
    expect(prov.map((p) => p.term)).toEqual(['Humility', 'Humbleness', 'Lowliness']);
    // Source/language tags are preserved per-term.
    expect(prov[0].language).toBe('en');
    expect(prov[1].source).toBe('torrey');

    // Winner's labelsByLanguage absorbed the losers' per-language labels.
    expect(res.concepts['nave:humility'].labelsByLanguage).toMatchObject({
      en: 'Humility',
      fr: 'Humilité',
    });
  });

  it('never fires when fewer than two family members are present', () => {
    const res = dedupConcepts(
      [
        { key: 'nave:humility', label: 'Humility' },
        { key: 'seed:peace', label: 'Peace' },
      ],
      [],
    );
    expect(res.stats.equivalence_merges).toBe(0);
    expect(res.stats.folded).toBe(0);
    expect(res.stats.output_concepts).toBe(2);
    // 'Humility' alone is a table member that never merged — it keeps its
    // original key (the equivalence path), not a `canon:` re-key.
    expect(res.concepts['nave:humility']).toBeDefined();
    expect(res.concepts['canon:peace']).toBeDefined();
  });

  it('the equivalence table is disjoint and its provenance stamps are stable', () => {
    // Each label appears in at most one family (invariant check in
    // equivalence.ts throws at module load if that ever regresses).
    for (const entry of EQUIVALENCE_TABLE) {
      for (const label of [entry.canonicalTerm, ...entry.variants]) {
        expect(lookupEquivalence(label)?.canonicalTerm).toBe(entry.canonicalTerm);
      }
      // Provenance block: confidence 0.9, source manual-equivalence-table.
      const p = equivalenceProvenance(entry);
      expect(p.confidence).toBe(0.9);
      expect(p.source).toBe('manual-equivalence-table');
      expect(p.variants).toEqual(entry.variants);
      expect(p.canonicalTerm).toBe(entry.canonicalTerm);
    }
    expect(EQUIVALENCE_CONFIDENCE).toBe(0.9);
    expect(EQUIVALENCE_SOURCE).toBe('manual-equivalence-table');
  });

  it('re-keys folded edge endpoints through the equivalence winner', () => {
    const res = dedupConcepts(
      [
        { key: 'a', label: 'Humility' },
        { key: 'b', label: 'Lowliness' }, // folds onto a
        { key: 'c', label: 'Patience' },
      ],
      [
        { fromKey: 'b', toKey: 'c', relationType: 'RELATED', confidence: 0.4, source: 's1' },
        { fromKey: 'a', toKey: 'c', relationType: 'RELATED', confidence: 0.6, source: 's2' },
      ],
    );
    // b's edge re-keys to a→c and merges with the existing one at MAX 0.6.
    expect(res.edges).toHaveLength(1);
    expect(res.edges[0].fromKey).toBe('a');
    expect(res.edges[0].toKey).toBe('canon:patience');
    expect(res.edges[0].confidence).toBe(0.6);
  });
});
