/**
 * groupTranslationsByLanguage / sortTranslationsInLanguage — exhaustive audit.
 *
 * Simulates the grouping over the 35 real dataset ids of
 * BIBLE_DATASET_CATALOG (pending stubs de-tkw / pt-brbsl excluded) and
 * verifies:
 *  (1) the 8 preferred editions (lsg, frlsg-eb, ostervald, darby,
 *      francrampon, kujv, web, webu) lead their language group, the rest
 *      of each group is alphabetical by id;
 *  (2) "Français" and "Anglais" are the first two groups;
 *  (3) a language group with a single id is left untouched (no
 *      division-by-zero / no reordering failure).
 */

import { describe, it, expect } from 'vitest';
import {
  BIBLE_DATASET_CATALOG,
} from '@/services/bible-text-service';
import {
  groupTranslationsByLanguage,
  sortTranslationsInLanguage,
  PREFERRED_TRANSLATION_ORDER,
} from '@/services/bible-translation-names';

const CATALOG_IDS = BIBLE_DATASET_CATALOG.map((e) => e.id);

describe('groupTranslationsByLanguage — audit on the real catalogue', () => {
  it('works on exactly the 37 built dataset ids (37 pending stubs excluded)', () => {
    // Ground truth: data/bible/dataset-catalog.json has 39 entries, of which
    // 2 are pending stubs (de-tkw, pt-brbsl — checksum "sha256:pending")
    // filtered out by `isBuilt` in bible-text-service.ts → 37 built ids.
    expect(CATALOG_IDS).toHaveLength(37);
    expect(CATALOG_IDS).not.toContain('de-tkw');
    expect(CATALOG_IDS).not.toContain('pt-brbsl');
  });

  it('(1) the 8 preferred editions lead their language group, rest is alphabetical', () => {
    const groups = groupTranslationsByLanguage(CATALOG_IDS);
    const fr = groups.find((g) => g.language === 'Français');
    const en = groups.find((g) => g.language === 'Anglais');

    expect(fr?.ids).toEqual(['lsg', 'frlsg-eb', 'ostervald', 'darby', 'francrampon']);
    expect(en?.ids).toEqual(['kujv', 'web', 'webu', 'asv', 'bsb']);

    // Preferred prefix = exactly the 8 PREFERRED_TRANSLATION_ORDER entries that
    // belong to the group, in that order.
    for (const g of groups) {
      const prefInGroup = PREFERRED_TRANSLATION_ORDER.filter((id) => g.ids.includes(id));
      expect(g.ids.slice(0, prefInGroup.length)).toEqual(prefInGroup);
      // The remainder (beyond the preferred prefix) must be alphabetical by id.
      const rest = g.ids.slice(prefInGroup.length);
      const sortedRest = [...rest].sort((a, b) => a.localeCompare(b));
      expect(rest).toEqual(sortedRest);
      // No id lost or duplicated.
      expect(new Set(g.ids).size).toBe(g.ids.length);
    }

    // No language group may start with a non-preferred id when a preferred
    // one is present.
    for (const g of groups) {
      if (PREFERRED_TRANSLATION_ORDER.some((id) => g.ids.includes(id))) {
        expect(g.ids[0]).toBe(PREFERRED_TRANSLATION_ORDER.find((id) => g.ids.includes(id)));
      }
    }
  });

  it('(2) Français and Anglais are the first two groups, in that order', () => {
    const groups = groupTranslationsByLanguage(CATALOG_IDS);
    expect(groups[0].language).toBe('Français');
    expect(groups[1].language).toBe('Anglais');
  });

  it('(2b) all remaining groups are alphabetically ordered by language label', () => {
    const groups = groupTranslationsByLanguage(CATALOG_IDS);
    const tail = groups.slice(2).map((g) => g.language);
    const expectedTail = [...tail].sort((a, b) => a.localeCompare(b));
    expect(tail).toEqual(expectedTail);
    expect(tail).toEqual([
      'Allemand',
      'Arabe',
      'Chinois',
      'Coréen',
      'Danois',
      'Espagnol',
      'Hindi',
      'Italien',
      'Japonais',
      'Latin',
      'Malayalam',
      'Néerlandais',
      'Persan',
      'Portugais',
      'Russe',
      'Somali',
      'Suédois',
      'Swahili',
      'Tagalog',
      'Ukrainien',
    ]);
  });

  it('(3) single-id language groups are returned intact, unchanged', () => {
    const groups = groupTranslationsByLanguage(CATALOG_IDS);
    const singletons = groups.filter((g) => g.ids.length === 1);
    // Every singleton must keep its only id as-is.
    for (const g of singletons) {
      expect(g.ids).toHaveLength(1);
      expect(g.ids[0]).toBe(g.ids[0] as string);
    }
    // At least one true singleton exists in the catalogue (Russe, Latin…).
    expect(singletons.length).toBeGreaterThanOrEqual(1);
    // And singletons must be part of the overall group order, not dropped.
    const allLanguages = groups.map((g) => g.language);
    for (const g of singletons) {
      expect(allLanguages).toContain(g.language);
    }
  });

  it('(3b) sortTranslationsInLanguage on a single id is a no-op', () => {
    expect(sortTranslationsInLanguage(['la-vulgate'])).toEqual(['la-vulgate']);
    // Even when the single id happens to be preferred:
    expect(sortTranslationsInLanguage(['lsg'])).toEqual(['lsg']);
  });

  it('no ids are lost or duplicated across all groups', () => {
    const groups = groupTranslationsByLanguage(CATALOG_IDS);
    const flat = groups.flatMap((g) => g.ids);
    expect(flat).toHaveLength(CATALOG_IDS.length);
    expect(new Set(flat).size).toBe(CATALOG_IDS.length);
    expect([...flat].sort()).toEqual([...CATALOG_IDS].sort());
  });
});
