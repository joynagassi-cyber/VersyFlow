/**
 * Stage G — Communities: deterministic label-propagation clustering +
 * coherence gate + LLM-named (no-op) naming. Pure, no network.
 */
import { describe, it, expect } from 'vitest';
import {
  buildClusters,
  clusterConcepts,
  clusterCoherence,
  runCommunities,
} from '../../scripts/semantic/communities';
import { NoopLlmPort, type ILlmPort } from '../../scripts/semantic/llm-port';

const NOW = '2026-09-13T22:00:43.494Z';

/** A tight triangle of three concepts sharing verses. */
const tight = {
  degree: { 'a:x': 2, 'b:y': 2, 'c:z': 2, 'iso:w': 0 },
  versesByConcept: {
    'a:x': ['v:1:1', 'v:1:2'],
    'b:y': ['v:1:1', 'v:1:2'],
    'c:z': ['v:1:1', 'v:1:2'],
    'iso:w': ['v:9:9'],
  },
  conceptEdges: [
    { fromKey: 'a:x', toKey: 'b:y' },
    { fromKey: 'b:y', toKey: 'c:z' },
    { fromKey: 'a:x', toKey: 'c:z' },
  ],
  now: NOW,
};

describe('stage G — communities', () => {
  it('clusterConcepts is deterministic (fixed-point, lexicographic tie-break)', () => {
    const a = clusterConcepts(tight);
    const b = clusterConcepts(tight);
    expect(JSON.stringify([...a.entries()].sort())).toBe(
      JSON.stringify([...b.entries()].sort()),
    );
    // The triangle converges to one shared label.
    expect(a.get('a:x')).toBe(a.get('b:y'));
    expect(a.get('b:y')).toBe(a.get('c:z'));
  });

  it('coherence of fully co-occurring members is 1; disjoint is 0', () => {
    expect(clusterCoherence(['a:x', 'b:y'], tight.versesByConcept)).toBe(1);
    expect(clusterCoherence(['a:x', 'iso:w'], tight.versesByConcept)).toBe(0);
    expect(clusterCoherence([], tight.versesByConcept)).toBe(0);
  });

  it('buildClusters mints a valid cluster for the tight triangle, not for the isolate', () => {
    const clusters = buildClusters(tight);
    const valid = clusters.filter((c) => c.valid);
    expect(valid).toHaveLength(1);
    expect(valid[0].members).toEqual(['a:x', 'b:y', 'c:z']);
    expect(valid[0].coherence).toBe(1);
    expect(valid[0].verses).toEqual(['v:1:1', 'v:1:2']);
    // The isolated single concept fails the size/coherence bar.
    const iso = clusters.find((c) => c.members.includes('iso:w'));
    expect(iso).toBeDefined();
    expect(iso!.valid).toBe(false);
  });

  it('runCommunities mints only valid clusters; NoopLlmPort → deterministic names', async () => {
    const out = await runCommunities(tight, new NoopLlmPort());
    expect(out.stats.communities_minted).toBe(1);
    expect(out.stats.llm_calls).toBe(0);
    const c = out.communities[0];
    expect(c.source).toBe('louvain-v1');
    expect(['deterministic', 'unique-anchor', 'llm']).toContain(c.nameSource);
    expect(c.size).toBe(3);
    expect(c.memberKeys).toEqual(['a:x', 'b:y', 'c:z']);
    // Provenance: sourceConceptId points at the top anchor's row id.
    expect(c.sourceConceptId).toBeTypeOf('string');
  });

  it('a non-unique-anchor community consults the port, and an LLM name is validated', async () => {
    // 'a:love' tops the degree ranking and 'b:love' shares its label, so
    // the top anchor is NOT unique → the LLM port is consulted. All three
    // hold the same verses (Jaccard 1.0 per pair → coherence above the
    // 0.4 floor; 3 concepts meets the size bar), so the cluster is valid.
    const input = {
      degree: { 'a:love': 2, 'b:love': 1, 'c:love': 1 },
      versesByConcept: {
        'a:love': ['v:1:1', 'v:1:2', 'v:1:3'],
        'b:love': ['v:1:1', 'v:1:2', 'v:1:3'],
        'c:love': ['v:1:1', 'v:1:2', 'v:1:3'],
      },
      conceptEdges: [
        { fromKey: 'a:love', toKey: 'b:love' },
        { fromKey: 'a:love', toKey: 'c:love' },
      ],
      now: NOW,
    };
    // NoopLlmPort → deterministic fallback name.
    const noop = await runCommunities(input, new NoopLlmPort());
    expect(noop.stats.llm_calls).toBe(1);
    expect(noop.communities[0].nameSource).toBe('deterministic');

    // A port that proposes a valid name (≤6 words, reuses an anchor label,
    // no foreign entities) is accepted.
    const goodPort: ILlmPort = {
      nameCommunity: async () => 'Love',
      assignRole: async () => null,
    };
    const good = await runCommunities(input, goodPort);
    expect(good.communities[0].nameSource).toBe('llm');
    expect(good.communities[0].name).toBe('Love');

    // A port that introduces a foreign entity is rejected → deterministic.
    const badPort: ILlmPort = {
      nameCommunity: async () => 'Mystic Dragons of Love',
      assignRole: async () => null,
    };
    const bad = await runCommunities(input, badPort);
    expect(bad.communities[0].nameSource).toBe('deterministic');
  });

  it('a single-concept community with a unique anchor uses it directly (no LLM call)', async () => {
    const input = {
      degree: { 'a:solitude': 1 },
      versesByConcept: { 'a:solitude': ['v:1:1', 'v:1:2', 'v:1:3', 'v:1:4', 'v:1:5'] },
      conceptEdges: [] as Array<{ fromKey: string; toKey: string }>,
      now: NOW,
    };
    const out = await runCommunities(input, new NoopLlmPort());
    // 5 verses meets the MIN_VERSES bar even with 1 concept.
    expect(out.communities.length).toBe(1);
    expect(out.communities[0].nameSource).toBe('unique-anchor');
    expect(out.stats.llm_calls).toBe(0);
  });

  it('community ids are deterministic across runs', async () => {
    const a = await runCommunities(tight, new NoopLlmPort());
    const b = await runCommunities(tight, new NoopLlmPort());
    expect(a.communities.map((c) => c.id)).toEqual(b.communities.map((c) => c.id));
  });
});
