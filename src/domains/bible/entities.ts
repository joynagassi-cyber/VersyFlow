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
  { id: 'num', name: { fr: 'Nombres', en: 'Numbers' }, testament: 'old', chapterCount: 36, orderIndex: 4 },
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

/**
 * The 66 canonical book ids (39 OT + 27 NT, PROTESTANT_66).
 * Source of truth for the canonical filter: datasets that carry extra
 * (apocryphal or introductory) book slots are trimmed to this set at the
 * service/repository layer — the JSON files themselves stay untouched.
 */
export const CANONICAL_BOOK_IDS: ReadonlySet<string> = new Set(
  BIBLE_BOOKS.map((b) => b.id),
);

/**
 * Book name alias mapping for reference search resolution.
 *
 * Every canonical book is covered (FR + EN names, common abbreviations and
 * the VersyFlow id itself), so reference strings such as "1 Jean 1:1",
 * "2 Tim 3:16", "Ps 23" or "Jn 3:16" all resolve through `resolveBookId`.
 * Alias keys/values are lowercase; matching is case-insensitive.
 */
export const BOOK_ALIASES: Record<string, string[]> = {
  // Old Testament — Pentateuch
  gen: ['genèse', 'genesis', 'gn', 'ge'],
  exo: ['exode', 'exodus', 'ex', 'eo'],
  lev: ['lévitique', 'leviticus', 'lev'],
  num: ['nombres', 'numbers', 'num', 'nb'],
  deb: ['deutéronome', 'deuteronomy', 'deu', 'dt'],
  // Old Testament — History
  jos: ['josué', 'joshua', 'jos', 'js'],
  jug: ['juges', 'judges', 'jgd', 'jg'],
  rut: ['ruth', 'rut', 'ru'],
  '1sam': ['1 samuel', '1 sam', 'samuel 1', '1 sa', '1sa', '1sam'],
  '2sam': ['2 samuel', '2 sam', 'samuel 2', '2 sa', '2sa', '2sam'],
  '1roi': ['1 rois', '1 roi', '1 ro', 'rois 1', '1ki', '1 king', 'kings 1', '1 kings', '1roi'],
  '2roi': ['2 rois', '2 roi', '2 ro', 'rois 2', '2ki', '2 king', 'kings 2', '2 kings', '2roi'],
  '1chron': ['1 chroniques', '1 chron', 'chroniques 1', '1chr', '1ch', '1 chronicles', '1chron'],
  '2chron': ['2 chroniques', '2 chron', 'chroniques 2', '2chr', '2ch', '2 chronicles', '2chron'],
  esai: ['esdras', 'ezra', 'esd', 'ezr'],
  neh: ['néhémie', 'nehemiah', 'neh', 'ne'],
  est: ['esther', 'est'],
  // Old Testament — Wisdom / poetry
  job: ['job', 'jb'],
  psa: ['psaumes', 'psalms', 'psalm', 'ps', 'psz'],
  prov: ['proverbes', 'proverbs', 'pr', 'pv'],
  eccl: ['ecclésiaste', 'ecclésiastes', 'ecclesiastes', 'précheur', 'eccl'],
  cant: ['cantique des cantiques', 'cantique', 'song of solomon', 'song of songs', 'cantiques', 'cant'],
  // Old Testament — Prophets
  isa: ['ésaïe', 'isaïe', 'isaiah', 'is'],
  jer: ['jérémie', 'jeremiah', 'jr'],
  lament: ['lamentations', 'lam', 'lm'],
  ezek: ['ézéchiel', 'ezéchiel', 'ezechiel', 'ezekiel', 'ezek'],
  dan: ['daniel', 'dan', 'da'],
  os: ['osée', 'hosea', 'hos'],
  joel: ['joël', 'joel', 'joe'],
  amos: ['amos', 'amo'],
  abdj: ['abdias', 'abdiás', 'obadiah', 'oba'],
  jon: ['jonas', 'jonah', 'jo'],
  mich: ['michée', 'micah', 'mi'],
  nah: ['nahum', 'na'],
  hab: ['habacuc', 'habakkuk', 'hab'],
  sep: ['sophonie', 'zephaniah', 'zep'],
  ag: ['aggée', 'haggai', 'agg'],
  zach: ['zacharie', 'zechariah', 'zec', 'za'],
  mal: ['malachie', 'malachi', 'ml'],
  // New Testament — Gospels / Acts
  mat: ['matthieu', 'matthew', 'mt'],
  mar: ['marc', 'mark', 'mr', 'mc'],
  luk: ['luc', 'luke', 'lk'],
  joh: ['jean', 'john', 'jn', 'joh'],
  act: ['actes', 'acts', 'ac'],
  // New Testament — Pauline epistles
  rom: ['romains', 'romans', 'rm', 'ro'],
  '1cor': ['1 corinthiens', '1 cor', 'corinthiens 1', '1 co', '1 co.', '1co', '1cor', '1 corinthians'],
  '2cor': ['2 corinthiens', '2 cor', 'corinthiens 2', '2 co', '2 co.', '2co', '2cor', '2 corinthians'],
  gal: ['galates', 'galatians', 'ga'],
  eph: ['éphésiens', 'ephesiens', 'ephesians', 'ep'],
  phil: ['philippiens', 'philipiens', 'philippians', 'phl', 'pp'],
  col: ['colossiens', 'colossians', 'cl'],
  '1thes': ['1 thessaloniciens', '1 thess', 'thessaloniciens 1', '1th', '1tes', '1 thessalonians', '1thes'],
  '2thes': ['2 thessaloniciens', '2 thess', 'thessaloniciens 2', '2th', '2tes', '2 thessalonians', '2thes'],
  '1tim': ['1 timothée', '1 tim', 'timothée 1', '1tm', '1 timothy', '1tim'],
  '2tim': ['2 timothée', '2 tim', 'timothée 2', '2tm', '2 timothy', '2tim'],
  tit: ['tite', 'titus', 'ti'],
  philem: ['philémon', 'philemon', 'phlm', 'phm'],
  // New Testament — General epistles
  heb: ['hébreux', 'hebreux', 'hebrews', 'hb'],
  jac: ['jacques', 'james', 'jm', 'jas'],
  '1pet': ['1 pierre', '1 pier', 'pierre 1', '1pi', '1 peter', '1pet'],
  '2pet': ['2 pierre', '2 pier', 'pierre 2', '2pi', '2 peter', '2pet'],
  '1joh': ['1 jean', '1 je', 'jean 1', '1jn', '1 john', '1joh'],
  '2joh': ['2 jean', '2 je', 'jean 2', '2jn', '2 john', '2joh'],
  '3joh': ['3 jean', '3 je', 'jean 3', '3jn', '3 john', '3joh'],
  jud: ['jude', 'judas', 'ju'],
  rev: ['apocalypse', 'revelation', 'apc', 'rv'],
};

/**
 * Resolve a book ID from any alias (case-insensitive).
 *
 * Multi-word aliases ("1 jean", "rois 2", "jean 1") are matched after
 * whitespace is collapsed and lowercased, so `resolveBookId(' 1 Jean ')`
 * and `resolveBookId('1 jean')` both resolve to `1joh`.
 */
export function resolveBookId(alias: string): string | null {
  const lower = alias
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
  if (BIBLE_BOOKS.some(b => b.id === lower)) return lower;
  for (const [id, aliases] of Object.entries(BOOK_ALIASES)) {
    if (aliases.includes(lower)) return id;
  }
  return null;
}
