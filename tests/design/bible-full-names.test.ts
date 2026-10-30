import { describe, expect, it } from 'vitest';
import { BIBLE_BOOKS } from '@/domains/bible/entities';
import { bibleBookName } from '@/lib/bible-book-name';

describe('noms complets des livres bibliques', () => {
  it('ne remplace pas les 66 noms français et anglais par les codes du jeu de données', () => {
    expect(BIBLE_BOOKS).toHaveLength(66);
    for (const book of BIBLE_BOOKS) {
      const shortName = { fr: book.id.toUpperCase(), en: book.id.toUpperCase() };
      expect(bibleBookName(book.id, 'fr-FR', shortName)).toBe(book.name.fr);
      expect(bibleBookName(book.id, 'en-US', shortName)).toBe(book.name.en);
    }
    expect(bibleBookName('gen', 'fr', { fr: 'GEN' })).toBe('Genèse');
    expect(bibleBookName('1sam', 'fr', { fr: '1SAM' })).toBe('1 Samuel');
  });
  it('conserve un nom traduit disponible dans une autre langue', () => {
    expect(bibleBookName('gen', 'es', { es: 'Génesis' })).toBe('Génesis');
    expect(bibleBookName('gen', 'es', { es: 'GEN' })).toBe('Genesis');
  });
});
