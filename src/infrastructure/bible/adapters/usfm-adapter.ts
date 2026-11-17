/**
 * Bible Infrastructure — USFM Adapter (structural, §46/§48/§49)
 *
 * A single generic, line-oriented state machine that converts USFM text into
 * the canonical `BibleDocument` (source book codes preserved). It is
 * translation-agnostic: it understands USFM structure, not any specific
 * translation. The 5 USFM "styles" (§50) differ only in which inline markers
 * appear; the rules below keep the meaningful ones (word/division/italics)
 * and strip the rest (footnotes, cross-refs, section titles), applied in a
 * fixed, readable order.
 *
 * Design notes:
 * - Structural tags (`\id`, `\c`, `\v`) drive book/chapter/verse boundaries.
 * - Verse text spans from a `\v N` line until the next structural tag; poetry
 *   lines (`\q`, `\q1`, `\q2`, bare `\p`) and wrapped continuations are joined
 *   into one verse.
 * - Section/outline tags (`\ms`, `\s`, `\r`, `\m`, `\io`, `\ib`, `\h`, …)
 *   carry titles/introductions, NOT verse text — they are dropped on the spot.
 * - All marker cleaning is done with plain, readable regexes (no
 *   `String.fromCharCode` obfuscation), applied most-specific-first so nested
 *   markers (e.g. italics inside a footnote) resolve correctly.
 */

import type { BibleBookDoc, BibleChapterDoc, BibleDocument, BibleVerseDoc } from '@/domains/bible/document';

const V_TAG = /^\\v\s+(\d+)/;
/** USFM verse-range tag: `\v 24-25 …` covers TWO verses (24 and 25). */
const V_RANGE_TAG = /^\\v\s+(\d+)-(\d+)/;
const C_TAG = /^\\c\s+(\d+)/;
/**
 * USFM `\id` book declaration. The first token after `\id` is the book code
 * (e.g. `GEN`, `1SA`, `OBA`); many eBible corpora append a description
 * (`\id GEN - Biblica® Open Nueva Biblia Viva 2008`) or source-file
 * provenance (`\id OBA 31-OBA-web.sfm World English Bible (WEB)`), which
 * MUST NOT leak into the book id.
 */
const ID_TAG = /^\\id\s+([A-Z0-9]{1,3})(\s|$)/;

/**
 * Tags that introduce a title / introduction / outline, whose payload is NOT
 * verse text. A line beginning with one of these is dropped wholesale.
 */
const SECTION_LINE =
  /^\\(h|toc\d?|mt\d?|ims\d?|ms\d?|mr\d?|s\d?|r\d?|m\d?|ip|ie|io\d?|ib|cl\d?|par)\b/;

/**
 * Paragraph / poetry tags: strip the leading marker, keep the rest of the line
 * as verse content.
 */
const PARAGRAPH_LINE = /^\\(q\d?|p)\b/;

function cleanVerseText(raw: string): string {
  let text = raw;

  // 1. Footnote / cross-ref blocks are removed entirely, INCLUDING nested
  //    markers inside them. Run first so nested content (e.g. italics inside a
  //    footnote) is stripped with the block.
  text = stripBlock(text, '\\f', '\\f*');
  text = stripBlock(text, '\\x', '\\x*');

  // 2. Division markers \d .. \d* and \nd .. \nd*: keep inner text.
  text = stripBlockKeep(text, '\\nd', '\\nd*');
  text = stripBlockKeep(text, '\\d', '\\d*');

  // 3. Word markers: \w..\w* and \+w..\+w* — keep the word, drop the marker
  //    and its attributes (|strong="H7225", |lemma="…").
  //
  //    CORRECTIF 2026-10-30 — deux défauts se cumulaient :
  //      a) cette ligne retirait TOUS les backslash avant le nettoyage des
  //         marqueurs, si bien que `\w` ne laissait qu'un « w » nu ;
  //      b) le nettoyage suivant rendait le backslash optionnel et supprimait
  //         donc ce « w » nu — c'est-à-dire la lettre « w » de TOUS les mots
  //         du texte (« New world of wonder » → « Ne orld of onder »).
  //    Désormais : marqueurs d'abord (backslash obligatoire), attributs
  //    ensuite, backslash résiduels en tout dernier (étape 7 bis).
  text = text.replace(/\\\+?w\*?/g, '');
  text = text.replace(/\|[a-z][a-z0-9-]*="[^"]*"/gi, '');

  // 4. Italics / emphasis: \it..\it*, \+it..\+it* — keep inner text.
  text = stripBlockKeep(text, '\\+it', '\\+it*');
  text = stripBlockKeep(text, '\\it', '\\it*');

  // 5. Pronunciation \j..\j* — keep inner text.
  text = stripBlockKeep(text, '\\j', '\\j*');

  // 6. Residual poetry / paragraph markers that slipped into the verse text.
  text = text.replace(/\\(q\d?|p)\b/g, ' ');

  // 7 bis. Backslash résiduels (marqueur USFM inconnu) : retirés en dernier,
  //        une fois tous les marqueurs connus traités.
  text = text.replace(/\\/g, '');

  // 8. Residual closing asterisks / stray markers.
  text = text.replace(/\\\*/g, '');

  // 9. Drop control characters, normalize whitespace + typographic apostrophe.
  // eslint-disable-next-line no-control-regex -- intentionnel : retrait des caracteres de controle USFM
  text = text.replace(/[\u0000-\u001F\u007F]/g, '');
  text = text.replace(/\s+/g, ' ').trim();
  return normalizeElisions(text.replace(/[’‘']/g, '’').normalize('NFC'));
}

/**
 * Tokens d'élision dont l'apostrophe ne doit jamais être suivie d'une espace.
 *
 * Les corpus USFM francophones contiennent couramment `l' abîme`, `j' ai`,
 * `qu' il`. Rendus tels quels, ils affichent une lettre orpheline (« l »,
 * « j ») au milieu de la phrase — c'est le défaut constaté dans les versets.
 *
 * Seuls ces tokens sont traités (et non « toute apostrophe suivie d'espace »),
 * pour ne jamais souder l'apostrophe de citation d'une autre langue
 * (`‘Peace’ and` resterait intact).
 */
const ELISION_TOKENS = 'jusqu|lorsqu|puisqu|quoiqu|qu|l|d|j|s|n|c|m|t';
const ELISION_RE = new RegExp(`(^|[\\s(«“"'])((?:${ELISION_TOKENS})’)[ ]+(?=[\\p{L}])`, 'giu');

export function normalizeElisions(text: string): string {
  return text.replace(ELISION_RE, '$1$2');
}

/** Remove paired blocks `open...close`, discarding the inner content. */
function stripBlock(text: string, open: string, close: string): string {
  const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return text.replace(new RegExp(`${esc(open)}.*?${esc(close)}`, 'g'), '');
}

/** Remove paired markers but keep the inner content. */
function stripBlockKeep(text: string, open: string, close: string): string {
  const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return text.replace(new RegExp(`${esc(open)}(.*)${esc(close)}`, 'g'), '$1');
}

export class USFMAdapter {
  /**
   * Parse USFM text (one or more book files concatenated, each starting with
   * `\id`). Returns a canonical `BibleDocument` whose book `id`s are the USFM
   * source codes (the normalizer maps those to VersyFlow ids later).
   */
  static parse(source: string): BibleDocument {
    const lines = source.split(/\r?\n/);
    const doc: BibleDocument = { books: [] };

    let currentBook: BibleBookDoc | null = null;
    let currentChapter: BibleChapterDoc | null = null;
    let currentVerse: BibleVerseDoc | null = null;

    for (const rawLine of lines) {
      const line = rawLine.replace(/\s+$/, '');

      const idMatch = line.match(ID_TAG);
      if (idMatch) {
        // Book id = the USFM code (e.g. `1SA`, `SNG`, `OBA`); trailing
        // description / provenance text is NOT part of the code
        // (`\id GEN - Biblica® …`, `\id OBA 31-OBA-web.sfm …`).
        currentBook = { id: idMatch[1], chapters: [] };
        doc.books.push(currentBook);
        currentChapter = null;
        currentVerse = null;
        continue;
      }

      const cMatch = line.match(C_TAG);
      if (cMatch) {
        if (!currentBook) continue;
        currentChapter = { number: Number(cMatch[1]), verses: [] };
        currentBook.chapters.push(currentChapter);
        currentVerse = null;
        continue;
      }

      // Verse tags below only make sense inside an open chapter.
      if (!currentChapter) continue;
      // `currentChapter` is narrowed above but the closure keeps its declared
      // type (`| null`); rebind to a local const so the helper compiles.
      const chapter = currentChapter;

      // §55: a verse N is renumbered down to the previous verse's number
      // + 1 whenever the canonical N is absent from the source corpus
      // (the eBible USFM corpus drops verses silently in places — webu
      // EST ch. 4 omits \v 6, arbnav ACT ch. 15 omits \v 26, pesopcb
      // GEN ch. 25 omits \v 8, swe drops ~400 verses total). Bridging
      // the gap keeps the document canonical and numbering consecutive.
      const renumber = (n: number): number =>
        chapter.verses.length > 0 &&
        n - chapter.verses[chapter.verses.length - 1].number > 1
          ? chapter.verses[chapter.verses.length - 1].number + 1
          : n;

      // USFM range tag `\v 24-25 …` covers two verses: both 24 and 25
      // share this text. Must be tested BEFORE the single-verse V_TAG,
      // which would otherwise match the first number of the range and
      // treat `-25` as verse text.
      const rangeMatch = line.match(V_RANGE_TAG);
      if (rangeMatch) {
        const requestedFrom = Number(rangeMatch[1]);
        const requestedTo = Number(rangeMatch[2]);
        // §55: renumber down when the canonical span is missing.
        const from = renumber(requestedFrom);
        // Preserve the span length after the bridge, not the raw `to`.
        const to = from + (requestedTo - requestedFrom);
        const tail = line.slice(rangeMatch[0].length);
        const text = tail.trim() || '';
        currentVerse = { number: from, text };
        chapter.verses.push(currentVerse);
        for (let n = from + 1; n <= to; n++) {
          currentVerse = { number: n, text };
          chapter.verses.push(currentVerse);
        }
        continue;
      }

      const vMatch = line.match(V_TAG);
      if (vMatch) {
        currentVerse = { number: renumber(Number(vMatch[1])), text: '' };
        chapter.verses.push(currentVerse);
        const tail = line.slice(vMatch[0].length);
        if (tail.trim()) currentVerse.text = tail;
        continue;
      }

      // Between verses: either a poetry/paragraph continuation, a section
      // title to drop, or a plain text continuation.
      if (!currentVerse) continue;

      if (SECTION_LINE.test(line)) continue; // title/intro, no verse text

      let payload = line;
      if (PARAGRAPH_LINE.test(payload)) {
        payload = payload.replace(PARAGRAPH_LINE, '');
      }
      payload = payload.trim();
      if (payload) currentVerse.text += ' ' + payload;
    }

    for (const book of doc.books) {
      for (const chapter of book.chapters) {
        for (const verse of chapter.verses) {
          verse.text = cleanVerseText(verse.text);
        }
      }
    }

    return doc;
  }
}
