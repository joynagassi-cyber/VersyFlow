/**
 * Bible Domain — BibleBook Entity
 * See docs/11-bible-domain.md
 */

export interface BibleBook {
  id: string; // Standard code: 'gen', 'exo', 'joh'...
  name: Record<string, string>; // Localized: { fr: 'Genèse', en: 'Genesis', ar: 'التكوين' }
  testament: 'old' | 'new';
  chapterCount: number;
  orderIndex: number; // 1-66 global ordering
}

/** List of all 66 books with standard codes and chapter counts */
export const BIBLE_BOOKS: BibleBook[] = [
  // Old Testament (39 books)
  { id: 'gen', name: { fr: 'Genèse', en: 'Genesis' }, testament: 'old', chapterCount: 50, orderIndex: 1 },
  { id: 'exo', name: { fr: 'Exode', en: 'Exodus' }, testament: 'old', chapterCount: 40, orderIndex: 2 },
  { id: 'lev', name: { fr: 'Lévitique', en: 'Leviticus' }, testament: 'old', chapterCount: 27, orderIndex: 3 },
  { id: 'nam', name: { fr: 'Nombres', en: 'Numbers' }, testament: 'old', chapterCount: 36, orderIndex: 4 },
  { id: 'deb', name: { fr: 'Deutéronome', en: 'Deuteronomy' }, testament: 'old', chapterCount: 34, orderIndex: 5 },
  { id: 'jos', name: { fr: 'Josué', en: 'Joshua' }, testament: 'old', chapterCount: 24, orderIndex: 6 },
  { id: 'jug', name: { fr: 'Juges', en: 'Judges' }, testament: 'old', chapterCount: 21, orderIndex: 7 },
  { id: 'rut', name: { fr: 'Ruth', en: 'Ruth' }, testament: 'old', chapterCount: 4, orderIndex: 8 },
  { id: '1sam', name: { fr: '1 Samuel', en: '1 Samuel' }, testament: 'old', chapterCount: 31, orderIndex: 9 },
  { id: '2sam', name: { fr: '2 Samuel', en: '2 Samuel' }, testament: 'old', chapterCount: 24, orderIndex: 10 },
  { id: '1roi', name: { fr: '1 Rois', en: '1 Kings' }, testament: 'old', chapterCount: 22, orderIndex: 11 },
  { id: '2roi', name: { fr: '2 Rois', en: '2 Kings' }, testament: 'old', chapterCount: 25, orderIndex: 12 },
  { id: '1chron', name: { fr: '1 Chroniques', en: '1 Chronicles' }, testament: 'old', chapterCount: 29, orderIndex: 13 },
  { id: '2chron', name: { fr: '2 Chroniques', en: '2 Chronicles' }, testament: 'old', chapterCount: 36, orderIndex: 14 },
  { id: 'esai', name: { fr: 'Esdras', en: 'Ezra' }, testament: 'old', chapterCount: 10, orderIndex: 15 },
  { id: 'neh', name: { fr: 'Néhémie', en: 'Nehemiah' }, testament: 'old', chapterCount: 13, orderIndex: 16 },
  { id: 'est', name: { fr: 'Esther', en: 'Esther' }, testament: 'old', chapterCount: 10, orderIndex: 17 },
  { id: 'job', name: { fr: 'Job', en: 'Job' }, testament: 'old', chapterCount: 42, orderIndex: 18 },
  { id: 'psa', name: { fr: 'Psaumes', en: 'Psalms' }, testament: 'old', chapterCount: 150, orderIndex: 19 },
  { id: 'prov', name: { fr: 'Proverbes', en: 'Proverbs' }, testament: 'old', chapterCount: 31, orderIndex: 20 },
  { id: 'eccl', name: { fr: 'Ecclésiaste', en: 'Ecclesiastes' }, testament: 'old', chapterCount: 12, orderIndex: 21 },
  { id: 'cant', name: { fr: 'Cantique des Cantiques', en: 'Song of Solomon' }, testament: 'old', chapterCount: 8, orderIndex: 22 },
  { id: 'isa', name: { fr: 'Ésaïe', en: 'Isaiah' }, testament: 'old', chapterCount: 66, orderIndex: 23 },
  { id: 'jer', name: { fr: 'Jérémie', en: 'Jeremiah' }, testament: 'old', chapterCount: 52, orderIndex: 24 },
  { id: 'lament', name: { fr: 'Lamentations', en: 'Lamentations' }, testament: 'old', chapterCount: 5, orderIndex: 25 },
  { id: 'ezek', name: { fr: 'Ézéchiel', en: 'Ezekiel' }, testament: 'old', chapterCount: 48, orderIndex: 26 },
  { id: 'dan', name: { fr: 'Daniel', en: 'Daniel' }, testament: 'old', chapterCount: 12, orderIndex: 27 },
  { id: 'os', name: { fr: 'Osée', en: 'Hosea' }, testament: 'old', chapterCount: 14, orderIndex: 28 },
  { id: 'joel', name: { fr: 'Joël', en: 'Joel' }, testament: 'old', chapterCount: 3, orderIndex: 29 },
  { id: 'amos', name: { fr: 'Amos', en: 'Amos' }, testament: 'old', chapterCount: 9, orderIndex: 30 },
  { id: 'abdj', name: { fr: 'Abdias', en: 'Obadiah' }, testament: 'old', chapterCount: 1, orderIndex: 31 },
  { id: 'jon', name: { fr: 'Jonas', en: 'Jonah' }, testament: 'old', chapterCount: 4, orderIndex: 32 },
  { id: 'mich', name: { fr: 'Michée', en: 'Micah' }, testament: 'old', chapterCount: 7, orderIndex: 33 },
  { id: 'nah', name: { fr: 'Nahum', en: 'Nahum' }, testament: 'old', chapterCount: 3, orderIndex: 34 },
  { id: 'hab', name: { fr: 'Habacuc', en: 'Habakkuk' }, testament: 'old', chapterCount: 3, orderIndex: 35 },
  { id: 'sep', name: { fr: 'Sophonie', en: 'Zephaniah' }, testament: 'old', chapterCount: 3, orderIndex: 36 },
  { id: 'ag', name: { fr: 'Aggée', en: 'Haggai' }, testament: 'old', chapterCount: 2, orderIndex: 37 },
  { id: 'zach', name: { fr: 'Zacharie', en: 'Zechariah' }, testament: 'old', chapterCount: 14, orderIndex: 38 },
  { id: 'mal', name: { fr: 'Malachie', en: 'Malachi' }, testament: 'old', chapterCount: 4, orderIndex: 39 },
  // New Testament (27 books)
  { id: 'mat', name: { fr: 'Matthieu', en: 'Matthew' }, testament: 'new', chapterCount: 28, orderIndex: 40 },
  { id: 'mar', name: { fr: 'Marc', en: 'Mark' }, testament: 'new', chapterCount: 16, orderIndex: 41 },
  { id: 'luk', name: { fr: 'Luc', en: 'Luke' }, testament: 'new', chapterCount: 24, orderIndex: 42 },
  { id: 'joh', name: { fr: 'Jean', en: 'John' }, testament: 'new', chapterCount: 21, orderIndex: 43 },
  { id: 'act', name: { fr: 'Actes', en: 'Acts' }, testament: 'new', chapterCount: 28, orderIndex: 44 },
  { id: 'rom', name: { fr: 'Romains', en: 'Romans' }, testament: 'new', chapterCount: 16, orderIndex: 45 },
  { id: '1cor', name: { fr: '1 Corinthiens', en: '1 Corinthians' }, testament: 'new', chapterCount: 16, orderIndex: 46 },
  { id: '2cor', name: { fr: '2 Corinthiens', en: '2 Corinthians' }, testament: 'new', chapterCount: 13, orderIndex: 47 },
  { id: 'gal', name: { fr: 'Galates', en: 'Galatians' }, testament: 'new', chapterCount: 6, orderIndex: 48 },
  { id: 'eph', name: { fr: 'Éphésiens', en: 'Ephesians' }, testament: 'new', chapterCount: 6, orderIndex: 49 },
  { id: 'phil', name: { fr: 'Philippiens', en: 'Philippians' }, testament: 'new', chapterCount: 4, orderIndex: 50 },
  { id: 'col', name: { fr: 'Colossiens', en: 'Colossians' }, testament: 'new', chapterCount: 4, orderIndex: 51 },
  { id: '1thes', name: { fr: '1 Thessaloniciens', en: '1 Thessalonians' }, testament: 'new', chapterCount: 5, orderIndex: 52 },
  { id: '2thes', name: { fr: '2 Thessaloniciens', en: '2 Thessalonians' }, testament: 'new', chapterCount: 3, orderIndex: 53 },
  { id: '1tim', name: { fr: '1 Timothée', en: '1 Timothy' }, testament: 'new', chapterCount: 6, orderIndex: 54 },
  { id: '2tim', name: { fr: '2 Timothée', en: '2 Timothy' }, testament: 'new', chapterCount: 4, orderIndex: 55 },
  { id: 'tit', name: { fr: 'Tite', en: 'Titus' }, testament: 'new', chapterCount: 3, orderIndex: 56 },
  { id: 'philem', name: { fr: 'Philémon', en: 'Philemon' }, testament: 'new', chapterCount: 1, orderIndex: 57 },
  { id: 'heb', name: { fr: 'Hébreux', en: 'Hebrews' }, testament: 'new', chapterCount: 13, orderIndex: 58 },
  { id: 'jac', name: { fr: 'Jacques', en: 'James' }, testament: 'new', chapterCount: 5, orderIndex: 59 },
  { id: '1pet', name: { fr: '1 Pierre', en: '1 Peter' }, testament: 'new', chapterCount: 5, orderIndex: 60 },
  { id: '2pet', name: { fr: '2 Pierre', en: '2 Peter' }, testament: 'new', chapterCount: 3, orderIndex: 61 },
  { id: '1joh', name: { fr: '1 Jean', en: '1 John' }, testament: 'new', chapterCount: 5, orderIndex: 62 },
  { id: '2joh', name: { fr: '2 Jean', en: '2 John' }, testament: 'new', chapterCount: 1, orderIndex: 63 },
  { id: '3joh', name: { fr: '3 Jean', en: '3 John' }, testament: 'new', chapterCount: 1, orderIndex: 64 },
  { id: 'jud', name: { fr: 'Jude', en: 'Jude' }, testament: 'new', chapterCount: 1, orderIndex: 65 },
  { id: 'rev', name: { fr: 'Apocalypse', en: 'Revelation' }, testament: 'new', chapterCount: 22, orderIndex: 66 },
];

/** Book name alias mapping for reference search resolution */
export const BOOK_ALIASES: Record<string, string[]> = {
  'gen': ['genèse', 'genesis', 'gn'],
  'exo': ['exode', 'ex', 'exc'],
  'psa': ['psaumes', 'psalm', 'ps', 'psz'],
  'joh': ['jean', 'john', 'jn', 'joh'],
  'mat': ['matthieu', 'matthew', 'mt'],
  'rev': ['apocalypse', 'revelation', 'apc', 'rv'],
  // Add more aliases as needed
};

/** Resolve a book ID from any alias (case-insensitive) */
export function resolveBookId(alias: string): string | null {
  const lower = alias.toLowerCase().trim();
  if (BIBLE_BOOKS.some(b => b.id === lower)) return lower;
  for (const [id, aliases] of Object.entries(BOOK_ALIASES)) {
    if (aliases.includes(lower)) return id;
  }
  return null;
}
