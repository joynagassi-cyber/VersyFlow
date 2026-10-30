/**
 * Bible — noms de livres complets partout.
 *
 * Défaut mesuré : le dataset LSG (`data/bible/lsg.json`) ne stocke que des
 * sigles (`GEN`, `EXO`, `PSA`). `useBibleBooks` superposait ce nom brut sur le
 * référentiel statique : les écrans Bible affichaient donc « GEN 1 » au lieu
 * de « Genèse 1 ».
 *
 * Ces tests vérifient la règle de résolution **et** le dataset réellement
 * présent sur le poste (ignoré s'il a été retiré, il est non versionné).
 */

import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { BIBLE_BOOKS } from '@/domains/bible/entities';
import { looksAbbreviated, resolveBookName } from '@/hooks/useBibleBooks';

describe('résolution du nom de livre', () => {
  it('reconnaît les sigles du dataset, jamais les vrais noms courts', () => {
    expect(looksAbbreviated('GEN')).toBe(true);
    expect(looksAbbreviated('PSA')).toBe(true);
    expect(looksAbbreviated('1CO')).toBe(true);
    expect(looksAbbreviated('Job')).toBe(false);
    expect(looksAbbreviated('Ruth')).toBe(false);
    expect(looksAbbreviated('Marc')).toBe(false);
    expect(looksAbbreviated('Genèse')).toBe(false);
    expect(looksAbbreviated('')).toBe(false);
    expect(looksAbbreviated(null)).toBe(false);
  });

  it('préfère le nom complet quand le dataset ne fournit qu’un sigle', () => {
    expect(resolveBookName({ fr: 'GEN', en: 'GEN' }, 'Genèse', 'gen', 'fr')).toBe('Genèse');
    expect(resolveBookName({ fr: 'PSA', en: 'PSA' }, 'Psaumes', 'psa', 'fr')).toBe('Psaumes');
  });

  it('garde le nom du dataset quand il est réellement complet', () => {
    expect(resolveBookName({ fr: 'Genèse', en: 'Genesis' }, 'Genèse', 'gen', 'fr')).toBe('Genèse');
    expect(resolveBookName({ fr: 'Job', en: 'Job' }, 'Job', 'job', 'fr')).toBe('Job');
    expect(resolveBookName({ fr: 'Genèse', en: 'Genesis' }, 'Genèse', 'gen', 'en')).toBe('Genesis');
  });

  it('retombe sur le nom statique puis sur l’identifiant', () => {
    expect(resolveBookName(undefined, 'Genèse', 'gen', 'fr')).toBe('Genèse');
    expect(resolveBookName(undefined, undefined, 'xyz', 'fr')).toBe('xyz');
  });
});

describe('dataset LSG local (si présent)', () => {
  const path = 'data/bible/lsg.json';
  const hasDataset = existsSync(path);

  it.skipIf(!hasDataset)('couvre 66 livres et tous leurs noms complets', () => {
    const dataset = JSON.parse(readFileSync(path, 'utf8')) as {
      books: Array<{ id: string; name: Record<string, string>; chapters: unknown[] }>;
    };
    expect(dataset.books).toHaveLength(66);

    const staticById = new Map(BIBLE_BOOKS.map((book) => [book.id, book.name]));
    const unresolved: string[] = [];
    const abbreviatedInUi: string[] = [];

    for (const book of dataset.books) {
      const staticName = staticById.get(book.id)?.fr;
      if (!staticName) {
        unresolved.push(book.id);
        continue;
      }
      const display = resolveBookName(book.name, staticName, book.id, 'fr');
      if (looksAbbreviated(display)) abbreviatedInUi.push(`${book.id} → ${display}`);
      expect(book.chapters.length).toBeGreaterThan(0);
    }

    expect(unresolved, `livres sans nom statique : ${unresolved.join(', ')}`).toEqual([]);
    expect(abbreviatedInUi, `sigles affichés : ${abbreviatedInUi.join(', ')}`).toEqual([]);
  });
});
