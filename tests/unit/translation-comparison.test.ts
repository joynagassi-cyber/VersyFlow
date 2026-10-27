/**
 * Translation Comparison — Unit Tests
 *
 * Tests the pure TranslationComparisonEngine directly against an
 * InMemoryBibleTextSource and a hand-crafted BibleTranslationRegistry.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  BibleTranslationRegistry,
  type BibleTranslationManifest,
} from '@/domains/bible/registry';
import {
  LocalBibleRepository,
  InMemoryBibleTextSource,
  parseTranslationData,
} from '@/domains/bible/repository-local';
import {
  TranslationComparisonEngine,
  type BibleReference,
  type TranslationComparisonResult,
} from '@/capabilities/comparison/translation-comparison';

// ─── Fixtures ───────────────────────────────────────────────────────────────

function makeJoh3_16Dataset(translationId: string, text: string): Record<string, unknown> {
  return {
    id: translationId,
    language: 'fr',
    name: translationId,
    books: [
      {
        id: 'joh',
        name: { fr: 'Jean', en: 'John' },
        testament: 'new',
        chapterCount: 21,
        chapters: [
          {
            number: 3,
            verses: [{ number: 16, text }],
          },
        ],
      },
    ],
  };
}

function buildEngine(registry: BibleTranslationRegistry, source: InMemoryBibleTextSource) {
  const repo = new LocalBibleRepository(source);
  return new TranslationComparisonEngine(repo, registry);
}

const REF: BibleReference = { bookId: 'joh', chapter: 3, verse: 16 };

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('TranslationComparisonEngine', () => {
  it('returns results for all requested translations', async () => {
    const source = new InMemoryBibleTextSource({
      lsg: makeJoh3_16Dataset('lsg', 'Car Dieu a tant aime le monde...'),
      darby: makeJoh3_16Dataset('darby', 'Car Dieu a tant aime'),
      ostervald: makeJoh3_16Dataset('ostervald', 'Car ainsi Dieu a aime'),
    });

    const registry = new BibleTranslationRegistry([
      { id: 'lsg', language: 'fr', name: 'Louis Segond', license: 'VERIFIED_FREE', available: true },
      { id: 'darby', language: 'fr', name: 'Darby', license: 'LICENSE_REQUIRED', available: true },
      { id: 'ostervald', language: 'fr', name: 'Ostervald', license: 'LICENSE_REQUIRED', available: true },
    ]);

    const engine = buildEngine(registry, source);
    const results = await engine.compare(REF, ['lsg', 'darby', 'ostervald']);

    expect(results).toHaveLength(3);
    expect(results.find(r => r.translationId === 'lsg')!.text).toBe('Car Dieu a tant aime le monde...');
    expect(results.find(r => r.translationId === 'darby')!.text).toBe('Car Dieu a tant aime');
    expect(results.find(r => r.translationId === 'ostervald')!.text).toBe('Car ainsi Dieu a aime');
  });

  it('returns null text when verse is missing in a translation', async () => {
    // Source has lsg with the verse but tm02 only has chapter 1 (no chapter 3)
    const source = new InMemoryBibleTextSource({
      lsg: makeJoh3_16Dataset('lsg', 'Car Dieu a tant aime le monde...'),
      'tm02': {
        id: 'tm02',
        language: 'fr',
        name: 'Test Missing',
        books: [
          {
            id: 'joh',
            name: { fr: 'Jean', en: 'John' },
            testament: 'new',
            chapterCount: 21,
            chapters: [
              { number: 1, verses: [{ number: 1, text: 'Au commencement...' }], },
            ],
          },
        ],
      } as unknown as Record<string, unknown>,
    });

    const registry = new BibleTranslationRegistry([
      { id: 'lsg', language: 'fr', name: 'LSG', license: 'VERIFIED_FREE', available: true },
      { id: 'tm02', language: 'fr', name: 'Test Missing', license: 'VERIFIED_FREE', available: true },
    ], 'lsg');

    const engine = buildEngine(registry, source);
    const results = await engine.compare(REF, ['lsg', 'tm02']);

    expect(results).toHaveLength(2);
    expect(results.find(r => r.translationId === 'lsg')!.text).not.toBeNull();
    expect(results.find(r => r.translationId === 'tm02')!.text).toBeNull();
  });

  it('respects registry availability flag', async () => {
    const source = new InMemoryBibleTextSource({
      lsg: makeJoh3_16Dataset('lsg', 'Car Dieu a tant aime le monde...'),
      darby: makeJoh3_16Dataset('darby', 'Car Dieu a tant aime'),
    });

    const registry = new BibleTranslationRegistry([
      { id: 'lsg', language: 'fr', name: 'LSG', license: 'VERIFIED_FREE', available: true },
      { id: 'darby', language: 'fr', name: 'Darby', license: 'LICENSE_REQUIRED', available: false },
    ]);

    const engine = buildEngine(registry, source);
    const results = await engine.compare(REF, ['lsg', 'darby']);

    expect(results.find(r => r.translationId === 'lsg')!.available).toBe(true);
    expect(results.find(r => r.translationId === 'darby')!.available).toBe(false);
    // Still returns text even when unavailable (display only)
    expect(results.find(r => r.translationId === 'darby')!.text).not.toBeNull();
  });

  it('translation name comes from registry, not dataset id', async () => {
    const source = new InMemoryBibleTextSource({
      test: makeJoh3_16Dataset('test', 'Some text'),
    });

    const registry = new BibleTranslationRegistry([
      { id: 'test', language: 'fr', name: 'Test LSG Custom Name', license: 'VERIFIED_FREE', available: true },
    ], 'test');

    const engine = buildEngine(registry, source);
    const results = await engine.compare(REF, ['test']);

    expect(results[0].name).toBe('Test LSG Custom Name');
    expect(results[0].translationId).toBe('test');
  });

  it('invariant: different translations have independent texts', async () => {
    const source = new InMemoryBibleTextSource({
      alpha: makeJoh3_16Dataset('alpha', 'Text A only'),
      beta: makeJoh3_16Dataset('beta', 'Text B only'),
      gamma: makeJoh3_16Dataset('gamma', 'Text C only'),
    });

    const registry = new BibleTranslationRegistry([
      { id: 'alpha', language: 'fr', name: 'A', license: 'VERIFIED_FREE', available: true },
      { id: 'beta', language: 'fr', name: 'B', license: 'VERIFIED_FREE', available: true },
      { id: 'gamma', language: 'fr', name: 'C', license: 'VERIFIED_FREE', available: true },
    ], 'alpha');

    const engine = buildEngine(registry, source);
    const results = await engine.compare(REF, ['alpha', 'beta', 'gamma']);

    expect(results[0].text).toBe('Text A only');
    expect(results[1].text).toBe('Text B only');
    expect(results[2].text).toBe('Text C only');

    // Create a fresh engine with modified dataset to verify no cross-contamination
    const modifiedSource = new InMemoryBibleTextSource({
      alpha: makeJoh3_16Dataset('alpha', 'Modified A'),
      beta: makeJoh3_16Dataset('beta', 'Text B only'),
      gamma: makeJoh3_16Dataset('gamma', 'Text C only'),
    });
    const engine2 = buildEngine(registry, modifiedSource);
    const results2 = await engine2.compare(REF, ['alpha', 'beta', 'gamma']);
    expect(results2[0].text).toBe('Modified A');
    expect(results2[1].text).toBe('Text B only');
    expect(results2[2].text).toBe('Text C only');
  });

  it('empty translationIds returns empty array', async () => {
    const source = new InMemoryBibleTextSource({
      lsg: makeJoh3_16Dataset('lsg', 'Some text'),
    });
    const registry = new BibleTranslationRegistry([
      { id: 'lsg', language: 'fr', name: 'LSG', license: 'VERIFIED_FREE', available: true },
    ]);
    const engine = buildEngine(registry, source);
    const results = await engine.compare(REF, []);
    expect(results).toEqual([]);
  });

  it('skips unknown translation ids silently', async () => {
    const source = new InMemoryBibleTextSource({
      lsg: makeJoh3_16Dataset('lsg', 'Some text'),
    });
    const registry = new BibleTranslationRegistry([
      { id: 'lsg', language: 'fr', name: 'LSG', license: 'VERIFIED_FREE', available: true },
    ]);
    const engine = buildEngine(registry, source);
    const results = await engine.compare(REF, ['lsg', 'nonexistent', 'also-missing']);
    expect(results).toHaveLength(1);
    expect(results[0].translationId).toBe('lsg');
  });
});
