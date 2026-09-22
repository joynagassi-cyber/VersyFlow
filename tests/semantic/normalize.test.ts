/**
 * Stage D — Normalize: deterministic dedup + edge merging + degree counters.
 * Pure, no network.
 */
import { describe, it, expect } from 'vitest';
import { dedupConcepts } from '../../scripts/semantic/normalize';

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
});
