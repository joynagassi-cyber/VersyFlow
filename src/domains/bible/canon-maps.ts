/**
 * Bible Domain — Canonical book code ↔ VersyFlow id maps (§49, D4)
 *
 * These 66-book canonical maps are GENERIC corpus data (USFM 3-letter book
 * codes → VersyFlow ids, and VersyFlow id → localized display name). They are
 * NOT translation-specific: every Bible translation uses the same book set,
 * so they are seeded once here and injected into the normalizer rather than
 * hardcoded per translation. The Old/New Testament split follows the
 * PROTESTANT_66 canon (39 OT + 27 NT) matching `BIBLE_BOOKS` order.
 */

/** USFM 3-letter book code → VersyFlow id (66-book Protestant canon). */
export const USFM_TO_VFLOW: Record<string, string> = {
  GEN: 'gen', EXO: 'exo', LEV: 'lev', NUM: 'num', DEU: 'deb',
  JOS: 'jos', JDG: 'jug', RUT: 'rut', '1SA': '1sam', '2SA': '2sam',
  '1KI': '1roi', '2KI': '2roi', '1CH': '1chron', '2CH': '2chron',
  EZR: 'esai', NEH: 'neh', EST: 'est', JOB: 'job', PSA: 'psa',
  PRO: 'prov', ECC: 'eccl', SNG: 'cant', ISA: 'isa', JER: 'jer',
  LAM: 'lament', EZK: 'ezek', DAN: 'dan', HOS: 'os', JOL: 'joel',
  AMO: 'amos', OBA: 'abdj', JON: 'jon', MIC: 'mich', NAM: 'nah',
  HAB: 'hab', ZEP: 'sep', HAG: 'ag', ZEC: 'zach', MAL: 'mal',
  MAT: 'mat', MRK: 'mar', LUK: 'luk', JHN: 'joh', ACT: 'act',
  ROM: 'rom', '1CO': '1cor', '2CO': '2cor', GAL: 'gal',
  EPH: 'eph', PHP: 'phil', COL: 'col', '1TH': '1thes', '2TH': '2thes',
  '1TI': '1tim', '2TI': '2tim', TIT: 'tit', PHM: 'philem', HEB: 'heb',
  JAS: 'jac', '1PE': '1pet', '2PE': '2pet', '1JN': '1joh', '2JN': '2joh',
  '3JN': '3joh', JUD: 'jud', REV: 'rev',
};

/** The 39 Old-Testament USFM codes (canon split for the PROTESTANT_66). */
export const OLD_TESTAMENT_USFM_CODES: ReadonlySet<string> = new Set([
  'GEN', 'EXO', 'LEV', 'NUM', 'DEU', 'JOS', 'JDG', 'RUT',
  '1SA', '2SA', '1KI', '2KI', '1CH', '2CH', 'EZR', 'NEH',
  'EST', 'JOB', 'PSA', 'PRO', 'ECC', 'SNG', 'ISA', 'JER',
  'LAM', 'EZK', 'DAN', 'HOS', 'JOL', 'AMO', 'OBA', 'JON',
  'MIC', 'NAM', 'HAB', 'ZEP', 'HAG', 'ZEC', 'MAL',
]);

/** The 27 New-Testament USFM codes (complement of the OT set, PROTESTANT_66). */
export const NEW_TESTAMENT_USFM_CODES: ReadonlySet<string> = new Set([
  'MAT', 'MRK', 'LUK', 'JHN', 'ACT', 'ROM', '1CO', '2CO', 'GAL',
  'EPH', 'PHP', 'COL', '1TH', '2TH', '1TI', '2TI', 'TIT', 'PHM',
  'HEB', 'JAS', '1PE', '2PE', '1JN', '2JN', '3JN', 'JUD', 'REV',
]);

/**
 * eBible book code → VersyFlow id (66-book Protestant canon).
 *
 * eBible mobile-HTML archives use their own 3-letter codes, most of which
 * MATCH the USFM codes but differ on six:
 *   DAG = Daniel, ESG = Ezra, OBA = Obadiah, PHM = Philemon,
 *   ZEP = Zephaniah, 1TH/2TH = Thessalonians.
 * Unknown codes fall through to `code.toLowerCase()` in the normalizer (§49 D4).
 */
export const EBIBLE_TO_VFLOW: Record<string, string> = {
  GEN: 'gen', EXO: 'exo', LEV: 'lev', NUM: 'num', DEU: 'deb',
  JOS: 'jos', JDG: 'jug', RUT: 'rut', '1SA': '1sam', '2SA': '2sam',
  '1KI': '1roi', '2KI': '2roi', '1CH': '1chron', '2CH': '2chron',
  ESG: 'esai', NEH: 'neh', EST: 'est', JOB: 'job', PSA: 'psa',
  PRO: 'prov', ECC: 'eccl', SNG: 'cant', ISA: 'isa', JER: 'jer',
  LAM: 'lament', EZK: 'ezek', DAG: 'dan', HOS: 'os', JOL: 'joel',
  AMO: 'amos', OBA: 'abdj', JON: 'jon', MIC: 'mich', NAM: 'nah',
  HAB: 'hab', ZEP: 'sep', HAG: 'ag', ZEC: 'zach', MAL: 'mal',
  MAT: 'mat', MRK: 'mar', LUK: 'luk', JHN: 'joh', ACT: 'act',
  ROM: 'rom', '1CO': '1cor', '2CO': '2cor', GAL: 'gal',
  EPH: 'eph', PHP: 'phil', COL: 'col', '1TH': '1thes', '2TH': '2thes',
  '1TI': '1tim', '2TI': '2tim', TIT: 'tit', PHM: 'philem', HEB: 'heb',
  JAS: 'jac', '1PE': '1pet', '2PE': '2pet', '1JN': '1joh', '2JN': '2joh',
  '3JN': '3joh', JUD: 'jud', REV: 'rev',
};
/** VersyFlow id → localized display name (fr/en seed; extend per UI lang). */
export const VFLOW_DISPLAY_NAMES: Record<string, { fr: string; en: string }> = {
  gen: { fr: 'Genèse', en: 'Genesis' }, exo: { fr: 'Exode', en: 'Exodus' },
  lev: { fr: 'Lévitique', en: 'Leviticus' }, num: { fr: 'Nombres', en: 'Numbers' },
  deb: { fr: 'Deutéronome', en: 'Deuteronomy' }, jos: { fr: 'Josué', en: 'Joshua' },
  jug: { fr: 'Juges', en: 'Judges' }, rut: { fr: 'Ruth', en: 'Ruth' },
  '1sam': { fr: '1 Samuel', en: '1 Samuel' }, '2sam': { fr: '2 Samuel', en: '2 Samuel' },
  '1roi': { fr: '1 Rois', en: '1 Kings' }, '2roi': { fr: '2 Rois', en: '2 Kings' },
  '1chron': { fr: '1 Chroniques', en: '1 Chronicles' }, '2chron': { fr: '2 Chroniques', en: '2 Chronicles' },
  esai: { fr: 'Esdras', en: 'Ezra' }, neh: { fr: 'Néhémie', en: 'Nehemiah' },
  est: { fr: 'Esther', en: 'Esther' }, job: { fr: 'Job', en: 'Job' },
  psa: { fr: 'Psaumes', en: 'Psalms' }, prov: { fr: 'Proverbes', en: 'Proverbs' },
  eccl: { fr: 'Ecclésiaste', en: 'Ecclesiastes' }, cant: { fr: 'Cantique des Cantiques', en: 'Song of Songs' },
  isa: { fr: 'Ésaïe', en: 'Isaiah' }, jer: { fr: 'Jérémie', en: 'Jeremiah' },
  lament: { fr: 'Lamentations', en: 'Lamentations' }, ezek: { fr: 'Ézéchiel', en: 'Ezekiel' },
  dan: { fr: 'Daniel', en: 'Daniel' }, os: { fr: 'Osée', en: 'Hosea' },
  joel: { fr: 'Joël', en: 'Joel' }, amos: { fr: 'Amos', en: 'Amos' },
  abdj: { fr: 'Abdias', en: 'Obadiah' }, jon: { fr: 'Jonas', en: 'Jonah' },
  mich: { fr: 'Michée', en: 'Micah' }, nah: { fr: 'Nahum', en: 'Nahum' },
  hab: { fr: 'Habacuc', en: 'Habakkuk' }, sep: { fr: 'Sophonie', en: 'Zephaniah' },
  ag: { fr: 'Aggée', en: 'Haggai' }, zach: { fr: 'Zacharie', en: 'Zechariah' },
  mal: { fr: 'Malachie', en: 'Malachi' }, mat: { fr: 'Matthieu', en: 'Matthew' },
  mar: { fr: 'Marc', en: 'Mark' }, luk: { fr: 'Luc', en: 'Luke' },
  joh: { fr: 'Jean', en: 'John' }, act: { fr: 'Actes', en: 'Acts' },
  rom: { fr: 'Romains', en: 'Romans' }, '1cor': { fr: '1 Corinthiens', en: '1 Corinthians' },
  '2cor': { fr: '2 Corinthiens', en: '2 Corinthians' }, gal: { fr: 'Galates', en: 'Galatians' },
  eph: { fr: 'Éphésiens', en: 'Ephesians' }, phil: { fr: 'Philippiens', en: 'Philippians' },
  col: { fr: 'Colossiens', en: 'Colossians' }, '1thes': { fr: '1 Thessaloniciens', en: '1 Thessalonians' },
  '2thes': { fr: '2 Thessaloniciens', en: '2 Thessalonians' }, '1tim': { fr: '1 Timothée', en: '1 Timothy' },
  '2tim': { fr: '2 Timothée', en: '2 Timothy' }, tit: { fr: 'Tite', en: 'Titus' },
  philem: { fr: 'Philémon', en: 'Philemon' }, heb: { fr: 'Hébreux', en: 'Hebrews' },
  jac: { fr: 'Jacques', en: 'James' }, '1pet': { fr: '1 Pierre', en: '1 Peter' },
  '2pet': { fr: '2 Pierre', en: '2 Peter' }, '1joh': { fr: '1 Jean', en: '1 John' },
  '2joh': { fr: '2 Jean', en: '2 John' }, '3joh': { fr: '3 Jean', en: '3 John' },
  jud: { fr: 'Jude', en: 'Jude' }, rev: { fr: 'Apocalypse', en: 'Revelation' },
};

/** USFM code → Old/New Testament (from the PROTESTANT_66 canon split). */
export function usfmTestament(code: string): 'old' | 'new' {
  return OLD_TESTAMENT_USFM_CODES.has(code) ? 'old' : 'new';
}
