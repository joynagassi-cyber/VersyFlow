/**
 * Stage A — Import: verse-universe loading, layer discovery, and the
 * documented minimal seed (fixed 56-concept list + deterministic
 * co-occurrence graph). Pure, no network.
 */
import { describe, it, expect } from 'vitest';
import {
  alignCrossrefs,
  buildMinimalSeed,
  loadVerseUniverse,
  discoverLayers,
  importLayer,
  DEFAULT_NOW,
} from '../../scripts/semantic/import';

const REPO_ROOT = process.cwd();

describe('stage A — import', () => {
  it('loads the 35 built datasets and builds a verse universe', () => {
    const errors: string[] = [];
    const { datasets, universe } = loadVerseUniverse(`${REPO_ROOT}/data/bible`, errors);
    expect(errors).toEqual([]);
    expect(datasets.length).toBe(35);
    expect(universe.verses.length).toBeGreaterThan(30000);
    expect(universe.bookIds).toHaveLength(66);
    // Canonical verse keys: book:chapter:verse
    expect(universe.verses[0]).toMatch(/^[a-z0-9]+:\d+:\d+$/);
  }, 60_000);

  it('discovers no NEUU layers on the default checkout (fallback path)', () => {
    const layers = discoverLayers(`${REPO_ROOT}/data/bible/semantic`);
    expect(layers).toEqual({});
  });

  it('builds the minimal 56-concept seed with deterministic ids + head verses', () => {
    const a = buildMinimalSeed({ now: DEFAULT_NOW });
    const b = buildMinimalSeed({ now: DEFAULT_NOW });
    expect(a.concepts).toHaveLength(56);
    expect(a.relations.length).toBeGreaterThan(0);
    // Deterministic: two runs are byte-identical.
    expect(JSON.stringify(a.concepts)).toBe(JSON.stringify(b.concepts));
    // Every concept has a head verse and a canonical key.
    for (const c of a.concepts) {
      expect(c.key).toMatch(/^seed:/);
      expect(c.headVerse).toMatch(/^[a-z0-9]+:\d+:\d+$/);
    }
    // Head-verse index covers every concept.
    for (const c of a.concepts) {
      expect(a.headVerseByKey.get(c.key)).toBe(c.headVerse);
    }
  });

  it('produces a stable relation graph (deduped, undirected, no self-loops)', () => {
    const seed = buildMinimalSeed({ now: DEFAULT_NOW });
    const ids = new Set(seed.concepts.map((c) => c.id));
    const seen = new Set<string>();
    for (const r of seed.relations) {
      expect(ids.has(r.fromConceptId)).toBe(true);
      expect(ids.has(r.toConceptId)).toBe(true);
      expect(r.fromConceptId).not.toBe(r.toConceptId);
      const k = [r.fromConceptId, r.toConceptId].sort().join('|');
      expect(seen.has(k)).toBe(false); // no duplicate pair
      seen.add(k);
    }
  });

  it('importLayer on an empty layer dir returns zero topics, no crash', () => {
    const res = importLayer({
      semanticBaseDir: `${REPO_ROOT}/data/bible/semantic`,
      layer: '01_parsed',
    });
    expect(res.topics).toEqual([]);
    expect(res.edges).toEqual([]);
    expect(res.errors).toEqual([]);
  });

  it('alignCrossrefs aligns raw crossref tokens to verse keys, counting unresolvable tokens', () => {
    const errors: string[] = [];
    const { universe } = loadVerseUniverse(`${REPO_ROOT}/data/bible`, errors);
    // 'Gen 1' → gen:1:1 and 'Heb 11' → heb:11:1 both exist in the
    // universe; a nonsense book token is counted unresolved, not an error.
    const { aligned, unresolved } = alignCrossrefs(
      [
        { from: 'Gen 1', to: 'Heb 11' },
        { from: 'Gen 1', to: 'Heb 11' }, // undirected duplicate → deduped
        { from: 'Zzz 5', to: 'Gen 1' }, // unresolvable book → unresolved
      ],
      universe,
    );
    expect(unresolved).toBe(1);
    expect(aligned).toHaveLength(1);
    expect(aligned[0].fromVerse).toBe('gen:1:1');
    expect(aligned[0].toVerse).toBe('heb:11:1');
    expect(aligned[0].fromBook).toBe('gen');
    expect(aligned[0].toBook).toBe('heb');
  }, 60_000);
});
