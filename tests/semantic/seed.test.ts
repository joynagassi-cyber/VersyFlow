/**
 * Stage C — Seed: materialize schema row shapes from the minimal seed.
 * Pure, no network.
 */
import { describe, it, expect } from 'vitest';
import { seedMinimalSeed } from '../../scripts/semantic/seed';
import { buildMinimalSeed, DEFAULT_NOW } from '../../scripts/semantic/import';

describe('stage C — seed', () => {
  const seed = buildMinimalSeed({ now: DEFAULT_NOW });

  it('seeds one concept row per seed concept, all accepted', () => {
    const out = seedMinimalSeed(
      { concepts: seed.concepts, relations: seed.relations },
      DEFAULT_NOW,
    );
    expect(out.concepts).toHaveLength(seed.concepts.length);
    expect(out.stats.accepted).toBe(seed.concepts.length);
    expect(out.stats.unresolved).toBe(0);
    // Row ids are deterministic detUuid values (stable across runs).
    expect(out.concepts[0].id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4/);
    // labelsByLanguage is JSON-encoded per the schema.
    expect(JSON.parse(out.concepts[0].labelsByLanguage)).toEqual({
      en: seed.concepts[0].canonicalLabel,
    });
  });

  it('emits a head-verse PRIMARY row for every concept with a head verse', () => {
    const out = seedMinimalSeed(
      { concepts: seed.concepts, relations: seed.relations },
      DEFAULT_NOW,
    );
    expect(out.verseConcepts).toHaveLength(seed.concepts.length);
    for (const vc of out.verseConcepts) {
      expect(vc.role).toBe('PRIMARY');
      expect(vc.confidence).toBe(0.95);
      const c = out.concepts.find((x) => x.id === vc.conceptId)!;
      expect(vc.verseId).toBe(c.headVerse);
    }
  });

  it('remaps seed relation ids to concept rows and dedupes pairs', () => {
    const out = seedMinimalSeed(
      { concepts: seed.concepts, relations: seed.relations },
      DEFAULT_NOW,
    );
    const ids = new Set(out.concepts.map((c) => c.id));
    for (const r of out.relations) {
      expect(ids.has(r.fromConceptId)).toBe(true);
      expect(ids.has(r.toConceptId)).toBe(true);
      expect(r.fromConceptId).not.toBe(r.toConceptId);
    }
    // Keyed joins are the inverse of each other.
    for (const [k, id] of out.conceptKeyToId) {
      expect(out.conceptIdToKey.get(id)).toBe(k);
    }
    expect(out.stats.relations).toBe(seed.relations.length);
  });

  it('is byte-stable: same input → same output', () => {
    const a = seedMinimalSeed(
      { concepts: seed.concepts, relations: seed.relations },
      DEFAULT_NOW,
    );
    const b = seedMinimalSeed(
      { concepts: seed.concepts, relations: seed.relations },
      DEFAULT_NOW,
    );
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });
});
