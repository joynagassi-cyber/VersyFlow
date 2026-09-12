/**
 * Bible Domain — registry dataset manifest tests (Task 5)
 *
 * Verifies that `BibleDatasetManifest` correctly extends `BibleTranslationManifest`
 * with the new fields (canon, completeness, checksum, source, datasetPaths,
 * expectedVerseCount) and that a `fra-lsg-1910` manifest can carry a
 * PROTESTANT_66 / FULL_BIBLE / 31,170-verse expectation.
 */

import { describe, it, expect } from 'vitest';
import type {
  BibleDatasetManifest,
  BibleTranslationManifest,
} from '@/domains/bible/registry';

describe('BibleDatasetManifest', () => {
  it('extends BibleTranslationManifest (type-level check)', () => {
    const base: BibleTranslationManifest = {
      id: 'lsg',
      language: 'fr',
      name: 'Louis Segond (1910)',
      license: 'VERIFIED_FREE',
      available: true,
    };
    const dataset: BibleDatasetManifest = {
      ...base,
      canon: 'PROTESTANT_66',
      completeness: 'FULL_BIBLE',
      checksum: 'sha256-abcdef',
      expectedVerseCount: 31170,
      source: {
        rawPath: 'data/bible/raw/fra/fraLSG_usfm/',
        sourcePage: 'https://ebible.org/eng/GNT',
      },
      datasetPaths: {
        runtime: 'data/bible/lsg.json',
        raw: 'data/bible/raw/fra/fraLSG_usfm/',
      },
    };
    expect(dataset.canon).toBe('PROTESTANT_66');
    expect(dataset.completeness).toBe('FULL_BIBLE');
    expect(dataset.expectedVerseCount).toBe(31170);
    expect(dataset.source?.rawPath).toBe('data/bible/raw/fra/fraLSG_usfm/');
  });

  it('OPTIONAL fields can be omitted (still valid)', () => {
    const minimal: BibleDatasetManifest = {
      id: 'web',
      language: 'en',
      name: 'World English Bible',
      license: 'VERIFIED_FREE',
      available: true,
      canon: 'PROTESTANT_66',
      completeness: 'FULL_BIBLE',
    };
    expect(minimal.checksum).toBeUndefined();
    expect(minimal.source).toBeUndefined();
    expect(minimal.expectedVerseCount).toBeUndefined();
  });

  it('supports OLD_TESTAMENT completeness', () => {
    const ot: BibleDatasetManifest = {
      id: 'ostervald-ot',
      language: 'fr',
      name: 'Ostervald (OT)',
      license: 'VERIFIED_FREE',
      available: true,
      canon: 'PROTESTANT_66',
      completeness: 'OLD_TESTAMENT',
    };
    expect(ot.completeness).toBe('OLD_TESTAMENT');
  });
});
