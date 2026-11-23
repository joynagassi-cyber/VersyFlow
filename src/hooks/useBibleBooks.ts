/**
 * useBibleBooks — liste de livres/chapitres de la traduction active.
 *
 * La source est l'index éclaté du dataset (`useBibleData`) : noms réels,
 * nombre de chapitres réel, nombre de versets par chapitre. `BIBLE_BOOKS`
 * (structure statique des 66 livres) ne sert plus que de repli pendant le
 * chargement, et de table d'ordre canonique.
 *
 * Retourne aussi `getChapter` et `loadAll` : les écrans qui affichent du texte
 * lisent un chapitre, ceux qui parcourent tout le corpus (recherche) le
 * demandent explicitement.
 */

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { BIBLE_BOOKS, type BibleBook } from '@/domains/bible/entities';
import { bibleBookName } from '@/lib/bible-book-name';
import { useBibleData, type BibleDataStatus } from '@/hooks/useBibleData';
import type { BibleBookData, BibleChapterData } from '@/domains/bible/repository-local';

export interface BookMeta {
  id: string;
  testament: 'old' | 'new';
  orderIndex: number;
  /** The *actual* chapter count in the dataset (or the static fallback). */
  chapterCount: number;
  /** `name[lang]` for the active UI language, with a fallback chain
   *  `<lang> → fr → en → id` (never empty). */
  displayName: string;
}

export interface UseBibleBooks {
  /** Dataset book structure (null while the index loads). */
  books: BookMeta[] | null;
  /** The static BIBLE_BOOKS structure — the navigation fallback. */
  structure: readonly BibleBook[];
  /** By-id lookup: dataset-derived when available, static fallback otherwise. */
  byId: ReadonlyMap<string, BookMeta>;
  /** Filtered dataset books by testament (used by the explorer's two-column view). */
  oldTestament: BookMeta[];
  newTestament: BookMeta[];
  /** The translation id actually in use. */
  translationId: string;
  /** Whether the structure is ready ('unavailable' when the translation is not delivered). */
  status: BibleDataStatus;
  /** One chapter, read on demand. */
  getChapter: (bookId: string, chapterNumber: number) => Promise<BibleChapterData | null>;
  /** The whole corpus — only for screens that walk every verse. */
  loadAll: () => Promise<BibleBookData[] | null>;
}

export function useBibleBooks(): UseBibleBooks {
  const data = useBibleData();
  const { i18n } = useTranslation();
  const lang = i18n.language ?? 'fr';

  const byId = useMemo(() => {
    const m = new Map<string, BookMeta>();
    for (const s of BIBLE_BOOKS) {
      m.set(s.id, {
        id: s.id,
        testament: s.testament,
        orderIndex: s.orderIndex,
        chapterCount: s.chapterCount,
        displayName: bibleBookName(s.id, lang, s.name),
      });
    }
    // Overlay the real dataset structure on top of the static one: when the
    // dataset has a book with the same id, its real chapter count and name win.
    if (data.index) {
      for (const b of data.index.books) {
        const fallback = m.get(b.id);
        m.set(b.id, {
          id: b.id,
          testament: b.testament,
          orderIndex: fallback?.orderIndex ?? m.size + 1,
          chapterCount: b.chapterCount,
          displayName: bibleBookName(b.id, lang, b.name),
        });
      }
    }
    return m;
  }, [data.index, lang]);

  const books = useMemo(() => [...byId.values()].sort((a, b) => a.orderIndex - b.orderIndex), [byId]);
  const oldTestament = useMemo(() => books.filter((m) => m.testament === 'old'), [books]);
  const newTestament = useMemo(() => books.filter((m) => m.testament === 'new'), [books]);

  return {
    books: data.index ? books : null,
    structure: BIBLE_BOOKS,
    byId,
    oldTestament,
    newTestament,
    translationId: data.translationId,
    status: data.status,
    getChapter: data.getChapter,
    loadAll: data.loadAll,
  };
}

/**
 * Un libellé de dataset est-il une abréviation ?
 *
 * Règle prudente : 4 caractères maximum **et** entièrement en capitales.
 * « GEN », « EXO », « PSA » → oui. « Job », « Ruth », « Marc » → non (casse
 * normale), donc un vrai nom court n'est jamais remplacé.
 */
export function looksAbbreviated(value: string | undefined | null): boolean {
  if (!value) return false;
  const trimmed = value.trim();
  if (trimmed.length === 0 || trimmed.length > 4) return false;
  return trimmed === trimmed.toUpperCase() && /[A-Z]/.test(trimmed);
}

/**
 * Nom affiché d'un livre : le dataset gagne **sauf** s'il n'apporte qu'un
 * sigle, auquel cas on garde le nom complet du catalogue statique.
 */
export function resolveBookName(
  datasetName: Record<string, string> | undefined,
  staticName: string | undefined,
  id: string,
  lang: string,
): string {
  const fromDataset = datasetName ? pickDisplayName(datasetName, id, lang) : '';
  if (!looksAbbreviated(fromDataset)) return fromDataset || staticName || id;
  return staticName || fromDataset || id;
}

/**
 * Localized name lookup with a graceful fallback chain.
 * Dataset `name` is a `Record<string, string>` with keys `fr`, `en`, and
 * sometimes the translation's own language code (`ar`, `ko`, …).
 */
function pickDisplayName(
  name: Record<string, string>,
  id: string,
  lang: string,
): string {
  const base = lang?.split('-')?.[0] ?? lang;
  return name[lang] ?? name[base] ?? name.fr ?? name.en ?? id;
}

export default useBibleBooks;
