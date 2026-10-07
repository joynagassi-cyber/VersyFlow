/**
 * useBibleBooks — data-driven book/chapter list for the active translation.
 *
 * `BIBLE_BOOKS` (in `src/domains/bible/entities.ts`) is a static 66-book
 * structure (id, orderIndex, testament, *hardcoded* fr/en names,
 * *hardcoded* chapterCount). It was historically the source for the book /
 * chapter lists in every Bible screen. In practice, the REAL chapter
 * counts, book names, and verse data come from the downloaded / bundled
 * dataset (per translation). Using the static list is what the audit
 * flagged as "language technique de code" — hardcoded values that can
 * disagree with the actual dataset.
 *
 * This hook reconciles the two:
 *   - `books`   — `BibleBookData[]` from `useBibleData`, i.e. the dataset
 *                 actually loaded for the active translation.
 *   - `byId`    — an O(1) lookup `{ [id]: { chapterCount, testament, orderIndex } }`
 *                 built from the dataset.
 *   - `fallback` — `BIBLE_BOOKS` — still kept as a structural fallback for
 *                  the *navigation* UI (book picker, chapters list) so the
 *                  user can still browse even when the dataset is not yet
 *                  resolvable. The `byId` map wins whenever available.
 *
 * Callers:
 *   - `app/bible/explorer.tsx` — book picker + chapter grid
 *   - `app/bible/book.tsx`     — chapters list for one book
 *   - `app/bible/chapter.tsx`  — book + chapter title
 *   - `src/components/bible/VerseActionBar.tsx` — book display name
 */

import { useMemo } from 'react';
import { useBibleData } from '@/hooks/useBibleData';
import { useTranslation } from 'react-i18next';
import { BIBLE_BOOKS, type BibleBook } from '@/domains/bible/entities';
import type { BibleBookData } from '@/domains/bible/repository-local';

export interface BookMeta {
  id: string;
  testament: 'old' | 'new';
  orderIndex: number;
  /** The *actual* chapter count in the loaded dataset (or the static
   *  fallback count when the dataset has no entry for this id). */
  chapterCount: number;
  /** `name[lang]` for the active UI language, with a fallback chain
   *  `<lang> → fr → en → id` (never empty). */
  displayName: string;
}

export interface UseBibleBooks {
  /** The dataset books for the active translation (null while loading). */
  books: BibleBookData[] | null;
  /** The static BIBLE_BOOKS structure — the navigation fallback. */
  structure: readonly BibleBook[];
  /** By-id lookup: dataset-derived when available, static fallback otherwise. */
  byId: ReadonlyMap<string, BookMeta>;
  /** Filtered dataset books by testament (used by the explorer's two-column view). */
  oldTestament: BookMeta[];
  newTestament: BookMeta[];
  /** The translation id actually in use (same as `useBibleData().translationId`). */
  translationId: string;
}

export function useBibleBooks(): UseBibleBooks {
  const data = useBibleData();
  const books = data.books;
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
        displayName: pickDisplayName(s.name, s.id, lang),
      });
    }
    // Overlay the real dataset book structure on top of the static one:
    // when the dataset has a book with the same id, its `chapters.length`
    // and `name[lang]` win.
    if (books) {
      for (const b of books) {
        const fallback = m.get(b.id);
        m.set(b.id, {
          id: b.id,
          testament: b.testament,
          orderIndex: b.orderIndex ?? fallback?.orderIndex ?? m.size + 1,
          chapterCount: b.chapters.length,
          displayName: pickDisplayName(b.name, b.id, lang),
        });
      }
    }
    return m;
  }, [books, lang]);

  const oldTestament = useMemo(
    () => [...byId.values()].filter((m) => m.testament === 'old'),
    [byId],
  );
  const newTestament = useMemo(
    () => [...byId.values()].filter((m) => m.testament === 'new'),
    [byId],
  );

  return {
    books,
    structure: BIBLE_BOOKS,
    byId,
    oldTestament,
    newTestament,
    translationId: data.translationId,
  };
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
