/**
 * P1B-1 — Multi-translation local (LSG + Ostervald).
 *
 * Invariants under test:
 *  1. The registry lists BOTH bundled translations as `available` (lsg +
 *     ostervald) and `getByLanguage('fr')` returns both.
 *  2. The `BibleJsonFileSource` (Node fs) serves BOTH `lsg.json` and
 *     `ostervald.json` from `data/bible/`, and `LocalBibleRepository`
 *     resolves the same reference to different texts per translation.
 *
 * This is a test-first lot: the test must fail before the dataset + registry
 * change land, and pass after.
 */

import { describe, it, expect } from 'vitest';
import {
  BibleTranslationRegistry,
  DEFAULT_BIBLE_TRANSLATIONS,
  LocalBibleRepository,
} from '@/domains/bible';
import { BibleJsonFileSource } from '@/infrastructure/bible/bible-json-source';

describe('P1B-1 multi-translation registry', () => {
  it('lists lsg AND ostervald as available bundled translations', () => {
    const registry = new BibleTranslationRegistry(DEFAULT_BIBLE_TRANSLATIONS);
    expect(registry.isAvailable('lsg')).toBe(true);
    expect(registry.isAvailable('ostervald')).toBe(true);
  });

  it('getByLanguage("fr") returns both lsg and ostervald', () => {
    const registry = new BibleTranslationRegistry(DEFAULT_BIBLE_TRANSLATIONS);
    const fr = registry.getByLanguage('fr').map((t) => t.id);
    expect(fr).toEqual(expect.arrayContaining(['lsg', 'ostervald']));
  });

  it('both bundled datasets load through the JSON file source', async () => {
    // Node fs path: reads data/bible/<id>.json from the project root.
    const source = new BibleJsonFileSource({ useNodeFs: true });
    const lsg = await source.load('lsg');
    const ost = await source.load('ostervald');
    expect(lsg.id).toBe('lsg');
    expect(ost.id).toBe('ostervald');
    expect(lsg.books.length).toBeGreaterThan(0);
    expect(ost.books.length).toBeGreaterThan(0);
  });

  it('same reference yields different text per translation', async () => {
    const source = new BibleJsonFileSource({ useNodeFs: true });
    const repo = new LocalBibleRepository(source);
    const lsgVerse = await repo.getVerse('lsg', 'gen', 1, 1);
    const ostVerse = await repo.getVerse('ostervald', 'gen', 1, 1);
    expect(lsgVerse?.text).toBeTruthy();
    expect(ostVerse?.text).toBeTruthy();
    // The two datasets are deliberately distinct wordings.
    expect(lsgVerse?.text).not.toBe(ostVerse?.text);
  });
});
