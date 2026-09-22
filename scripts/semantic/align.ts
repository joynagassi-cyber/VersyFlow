/**
 * Stage B — Align (DETERMINISTIC, no LLM).
 *
 * Two responsibilities, both pure:
 *
 * 1. Reference alignment (this file is the canonical home): every source-
 *    dataset reference is mapped to the VersyFlow book ID via
 *    `resolveBookId` + `BOOK_ALIASES` (src/domains/bible) plus the extended
 *    USFM/numeric alias map below. The output is the canonical
 *    `bookId:chapter:verse` key — no display strings ever leak.
 *
 * 2. Label canonicalization: casefold + NFC + accent-strip + BOOK_ALIASES-
 *    style alias tables + Nave/Torrey cross-mapping. The result of this
 *    stage is a `Record<canonicalKey, NormalizedLabel>` that Stage C
 *    consumes.
 */

import { BIBLE_BOOKS, BOOK_ALIASES, resolveBookId } from '../../src/domains/bible/entities';
import { casefold, stripDiacritics, jaccard, verseKey } from './helpers';

// ---------------------------------------------------------------------------
// Book-token alignment (canonical verse-reference system)
// ---------------------------------------------------------------------------

/** Extended alias table, BOOK_ALIASES-style. Merged over the domain map. */
export const BOOK_CODE_ALIASES: Record<string, string[]> = {
  gen: ['genesis', 'gn', 'genèse'],
  exo: ['exodus', 'ex', 'exod'],
  lev: ['leviticus', 'lev', 'lv'],
  nam: ['numbers', 'num', 'nm', 'nombres', 'nbres'],
  deb: ['deuteronomy', 'deu', 'déutéronome'],
  jos: ['joshua', 'josh'],
  jug: ['judges', 'judg', 'juges'],
  rut: ['ruth', 'ru'],
  '1sam': ['1 samuel', '1samuel', '1sa'],
  '2sam': ['2 samuel', '2samuel', '2sa'],
  '1roi': ['1 kings', '1rois', '1ki'],
  '2roi': ['2 kings', '2rois', '2ki'],
  '1chron': ['1 chronicles', '1chr'],
  '2chron': ['2 chronicles', '2chr'],
  esai: ['ezra', 'ezr', 'esdras'],
  neh: ['nehemiah', 'néhémie'],
  est: ['esther', 'eth'],
  job: ['job'],
  psa: ['psalms', 'psalm', 'ps', 'psaumes', 'psalmo'],
  prov: ['proverbs', 'prov', 'proverbes', 'proverbio'],
  eccl: ['ecclesiastes', 'coheleth', 'ecclésiaste'],
  cant: ['song of solomon', 'songs of solomon', 'song of songs', 'cantique'],
  isa: ['isaiah', 'isaïe', 'esaias'],
  jer: ['jeremiah', 'jérémie'],
  lament: ['lamentations', 'lamentation', 'lamentações'],
  ezek: ['ezekiel', 'eze', 'ézéchiel'],
  dan: ['daniel'],
  os: ['hosea', 'hos', 'osée'],
  joel: ['joel', 'joël'],
  amos: ['amos'],
  abdj: ['obadiah', 'obad', 'abdias', 'obadías'],
  jon: ['jonah', 'jonas'],
  mich: ['micah', 'miche', 'michée'],
  nah: ['nahum'],
  hab: ['habakkuk'],
  sep: ['zephaniah', 'zeph', 'sophonie'],
  ag: ['haggai', 'hag'],
  zach: ['zechariah', 'zech', 'zacarias', 'zacharie'],
  mal: ['malachi', 'malachie'],
  mat: ['matthew', 'mathieu', 'matheus', 'mateus'],
  mar: ['mark', 'marc', 'marcos'],
  luk: ['luke', 'luc', 'lucas'],
  joh: ['john', 'joão'],
  act: ['acts', 'actes', 'hechos', 'atos'],
  rom: ['romans', 'romains', 'romanos'],
  '1cor': ['1 corinthians', 'corinthiens'],
  '2cor': ['2 corinthians'],
  gal: ['galatians', 'galates', 'gálatas'],
  eph: ['ephesians', 'éphésiens', 'efesios', 'efésios'],
  phil: ['philippians', 'philippiens', 'filipenses'],
  col: ['colossians', 'colossiens', 'colossenses'],
  '1thes': ['1 thessalonians', 'thessaloniciens'],
  '2thes': ['2 thessalonians'],
  '1tim': ['1 timothy', 'timothée'],
  '2tim': ['2 timothy'],
  tit: ['titus', 'tite', 'tito'],
  philem: ['philemon', 'filêmon', 'filemon'],
  heb: ['hebrews', 'hébreux', 'hebreus'],
  jac: ['james', 'jacques', 'tiago'],
  '1pet': ['1 peter', 'pierre'],
  '2pet': ['2 peter'],
  '1joh': ['1 john'],
  '2joh': ['2 john'],
  '3joh': ['3 john'],
  jud: ['jude', 'judas', 'judeus'],
  rev: ['revelation', 'apc', 'rv', 'apocalyp', 'apocalipse'],
};

/** Casefold a book token: trim, lowercase, collapse whitespace. */
export function casefoldBookToken(token: string): string {
  return token.trim().toLowerCase().replace(/\s+/g, ' ');
}

/** NFC-normalize + strip accents (é→e, ü→u, …) → canonical-key form. */
export function stripAccents(s: string): string {
  return s.normalize('NFC').normalize('NFD').replace(/\p{Diacritic}/gu, '');
}

function mergeAliases(): Record<string, string[]> {
  // Start with the domain map, extend with the code aliases.
  const merged: Record<string, string[]> = {};
  for (const [id, aliases] of Object.entries(BOOK_ALIASES)) {
    merged[id] = aliases.slice();
  }
  for (const [id, aliases] of Object.entries(BOOK_CODE_ALIASES)) {
    const existing = merged[id];
    if (existing) {
      for (const a of aliases) if (!existing.includes(a)) existing.push(a);
    } else {
      merged[id] = aliases;
    }
  }
  // Numeric book numbers (1..66) by orderIndex.
  for (const b of BIBLE_BOOKS) {
    merged[b.id] = merged[b.id] || [];
    if (!merged[b.id].includes(String(b.orderIndex))) merged[b.id].push(String(b.orderIndex));
  }
  return merged;
}

const MERGED_ALIASES = mergeAliases();

/**
 * Resolve a book token to a VersyFlow book ID.
 *
 * Strategy:
 *  1. direct BIBLE_BOOKS id match (case-insensitive)
 *  2. domain `resolveBookId` (BOOK_ALIASES)
 *  3. extended alias map (USFM codes, numeric, accent-stripped forms)
 *
 * Returns `null` when no alias maps — callers record unresolved refs
 * instead of throwing.
 */
export function alignBookId(bookToken: string): string | null {
  const raw = String(bookToken ?? '').trim();
  if (!raw) return null;

  // 1. direct canonical id
  const lower = casefoldBookToken(raw);
  if (BIBLE_BOOKS.some((b) => b.id === lower)) return lower;

  // 2. domain resolver
  const domainHit = resolveBookId(raw) ?? resolveBookId(lower);
  if (domainHit) return domainHit;

  // 3. extended alias lookup (try lower and accent-stripped forms)
  const candidates = [lower, stripAccents(lower)];
  for (const c of candidates) {
    for (const [id, aliases] of Object.entries(MERGED_ALIASES)) {
      if (aliases.includes(c)) return id;
    }
  }
  return null;
}

export interface RefSpec {
  book: string;
  chapter: number;
  verse: number;
}

/**
 * Align a single source reference `{ book, chapter, verse }` (as produced by
 * any source dataset — Nave, Torrey, cross-refs, …) to the canonical
 * `bookId:chapter:verse` key.
 *
 * Returns `null` when the book token cannot be resolved to a VersyFlow book
 * (typo, out-of-canon code, etc.).
 */
export function alignReference(ref: RefSpec): { verseId: string; bookId: string } | null {
  const bookId = alignBookId(ref.book);
  if (!bookId) return null;
  if (!Number.isInteger(ref.chapter) || ref.chapter <= 0) return null;
  if (ref.verse !== undefined && (!Number.isInteger(ref.verse) || ref.verse <= 0)) return null;
  const v = ref.verse ?? 0;
  return { verseId: verseKey(bookId, ref.chapter, v), bookId };
}

// ---------------------------------------------------------------------------
// Stage B — label canonicalization
// ---------------------------------------------------------------------------

/** Alias table, BOOK_ALIASES-style: canonical label → list of aliases. */
export interface AliasTable {
  [canonical: string]: string[];
}

/** Stage B output: canonical key → normalized label. */
export interface NormalizedLabel {
  canonicalKey: string;
  label: string;
  labelsByLanguage: Record<string, string>;
  /** Set when the label is actually a book name/alias (book facet). */
  bookId?: string;
}

export interface AlignOptions {
  /** Explicit alias overrides (merged over the default table). */
  aliases?: AliasTable;
  /** Minimum Jaccard similarity to consider two labels aliases. */
  similarityThreshold?: number;
}

/**
 * Default cross-dataset alias table. Deterministic, curated, no LLM.
 * Keyed by the canonical key `source:casefold(label)`; values are the list
 * of raw keys that all normalize to the same canonical label.
 */
export const DEFAULT_ALIAS_TABLE: AliasTable = {
  'nave:foi': ['torrey:foi', 'nave:faith'],
  'nave:faith': ['torrey:faith', 'openbible:faith'],
  'nave:esperanza': ['nave:hope', 'torrey:hope'],
  'nave:hope': ['torrey:hope'],
  'nave:amor': ['nave:love', 'torrey:love'],
  'nave:love': ['torrey:love', 'openbible:love'],
  'nave:gracia': ['nave:grace', 'torrey:grace'],
  'nave:grace': ['torrey:grace'],
  'nave:justicia': ['nave:justice', 'torrey:justice'],
  'nave:justice': ['torrey:justice'],
  'nave:verdad': ['nave:truth', 'torrey:truth'],
  'nave:truth': ['torrey:truth'],
  'nave:pecado': ['nave:sin', 'torrey:sin'],
  'nave:sin': ['torrey:sin'],
  'nave:salvacion': ['nave:salvation', 'torrey:salvation'],
  'nave:salvation': ['torrey:salvation'],
  'nave:redencion': ['nave:redemption', 'torrey:redemption'],
  'nave:redemption': ['torrey:redemption'],
  'nave:dios': ['nave:god', 'torrey:god'],
  'nave:god': ['torrey:god'],
  'nave:jesucristo': ['nave:jesus christ', 'torrey:jesus christ', 'nave:jesus'],
  'nave:jesus': ['torrey:jesus'],
};

/**
 * Canonicalize one label. Returns the canonical key + display label +
 * per-language labels. Pure.
 */
export function normalizeLabel(
  source: string,
  label: string,
  aliases: AliasTable = DEFAULT_ALIAS_TABLE
): NormalizedLabel {
  const cf = casefold(label);
  const stripped = stripDiacritics(cf);
  const rawKey = `${source}:${stripped}`;

  // 1. Direct alias-table hit (rawKey folds into an existing canonical key).
  for (const [canonical, list] of Object.entries(aliases)) {
    if (list.includes(rawKey)) {
      const canonicalLabel = canonical.split(':')[1] ?? canonical;
      return {
        canonicalKey: canonical,
        label: canonicalLabel,
        labelsByLanguage: { [source]: label },
      };
    }
  }
  // 2. Fallback: the label is its own canonical form.
  return {
    canonicalKey: rawKey,
    label,
    labelsByLanguage: { [source]: label },
  };
}

/**
 * Full Stage B run over a set of raw topics. Returns `canonicalKey →
 * NormalizedLabel` plus the stats the report wants.
 *
 * Per-language labels are merged across all sources that share a
 * canonical key, so a Nave "foi" and a Torrey "faith" end up with one
 * entry.
 */
export function alignTopics(
  rawTopics: Array<{ key: string; label: string; labelsByLanguage?: Record<string, string> }>,
  opts: AlignOptions = {}
): { normalized: Record<string, NormalizedLabel>; stats: Record<string, number> } {
  const aliases: AliasTable = { ...DEFAULT_ALIAS_TABLE, ...(opts.aliases ?? {}) };
  const threshold = opts.similarityThreshold ?? 0.9;

  const normalized: Record<string, NormalizedLabel> = {};
  let aliasHits = 0;
  let selfCanonical = 0;

  for (const t of rawTopics) {
    const src = t.key.split(':')[0] ?? t.key;
    const nl = normalizeLabel(src, t.label, aliases);
    if (nl.canonicalKey !== `${src}:${stripDiacritics(casefold(t.label))}`) aliasHits++;
    else selfCanonical++;

    const existing = normalized[nl.canonicalKey];
    if (!existing) {
      normalized[nl.canonicalKey] = {
        ...nl,
        labelsByLanguage: { ...nl.labelsByLanguage, ...(t.labelsByLanguage ?? {}) },
      };
    } else {
      // Merge per-language labels (first write wins — deterministic order
      // comes from the rawTopics array order).
      for (const [lang, lbl] of Object.entries(nl.labelsByLanguage ?? {})) {
        if (!existing.labelsByLanguage[lang]) existing.labelsByLanguage[lang] = lbl;
      }
    }
  }

  // 3. String-similarity pass: catch near-duplicates that the alias table
  //    missed. Only merges above the threshold (default 0.9) — anything
  //    lower is left to Stage D's dedup, which has more context.
  const keys = Object.keys(normalized);
  const keyToLabel: Record<string, string> = {};
  for (const k of keys) keyToLabel[k] = normalized[k].label;

  const folded: Record<string, string> = {};
  for (let i = 0; i < keys.length; i++) {
    if (folded[keys[i]]) continue;
    for (let j = i + 1; j < keys.length; j++) {
      if (folded[keys[j]]) continue;
      const sim = jaccard(keyToLabel[keys[i]], keyToLabel[keys[j]]);
      if (sim >= threshold) folded[keys[j]] = keys[i];
    }
  }
  let similarityMerges = 0;
  for (const [loser, winner] of Object.entries(folded)) {
    if (!normalized[winner]) continue;
    const loserEntry = normalized[loser];
    for (const [lang, lbl] of Object.entries(loserEntry?.labelsByLanguage ?? {})) {
      if (!normalized[winner].labelsByLanguage[lang]) normalized[winner].labelsByLanguage[lang] = lbl;
    }
    delete normalized[loser];
    similarityMerges++;
  }

  // 4. Book-id sanity pass: any label that is actually a book name/alias
  //    gets its canonical book id attached, so Stage C can seed the
  //    concept with a book facet. Deterministic via alignBookId.
  for (const entry of Object.values(normalized)) {
    const hit = alignBookId(entry.label);
    if (hit) entry.bookId = hit;
  }

  return {
    normalized,
    stats: {
      total_raw: rawTopics.length,
      alias_hits: aliasHits,
      self_canonical: selfCanonical,
      similarity_merges: similarityMerges,
      canonical: Object.keys(normalized).length,
    },
  };
}
