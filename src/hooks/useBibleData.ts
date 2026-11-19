/**
 * useBibleData — l'index d'une traduction, et ses chapitres à la demande.
 *
 * Le lecteur n'a pas besoin de 31 170 versets pour afficher la liste des
 * livres ou les 23 premiers versets d'un psaume. Ce hook expose donc trois
 * niveaux, alignés sur ceux du service :
 *
 *   - `index`      structure des 66 livres (nom, chapitres, versets par
 *                  chapitre) : ~37 Ko, chargée d'office.
 *   - `getChapter` un chapitre, lu au moment où il devient visible et gardé
 *                  en mémoire pour la session.
 *   - `books` / `loadAll` le corpus complet, uniquement pour les écrans qui
 *                  parcourent tous les versets (recherche, statistiques).
 *
 * La traduction active vient des réglages ; un id peut être forcé.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSettingsStore } from '@/store/settings-store';
import {
  findRemoteDatasetEntry,
  loadBibleChapter,
  loadBibleIndex,
  loadTranslationBooks,
} from '@/services/bible-text-service';
import type { BibleBookData, BibleChapterData } from '@/domains/bible/repository-local';
import type { BookMeta, SplitBibleIndex } from '@/domains/bible/split-index';

export type BibleDataStatus = 'loading' | 'ready' | 'unavailable' | 'error';

export interface UseBibleData {
  /** The translation id actually used (explicit arg or the active setting). */
  translationId: string;
  /** Structure of the translation (null while loading / when unavailable). */
  index: SplitBibleIndex | null;
  /** Structure of the 66 books, canonically ordered (null while loading). */
  books: BookMeta[] | null;
  /** The same structure keyed by book id, for O(1) lookups. */
  byId: ReadonlyMap<string, BookMeta> | null;
  status: BibleDataStatus;
  error: string | null;
  /** Catalogue entry for this translation (null when not delivered). */
  remoteEntry: ReturnType<typeof findRemoteDatasetEntry>;
  /** One chapter, read on demand (cached for the session). */
  getChapter: (bookId: string, chapterNumber: number) => Promise<BibleChapterData | null>;
  /** The whole corpus — only for screens that walk every verse. */
  loadAll: () => Promise<BibleBookData[] | null>;
  /** Retry the structure load after a failure. */
  reload: () => void;
}

export function useBibleData(explicitTranslationId?: string): UseBibleData {
  const activeTranslation = useSettingsStore((s) => s.bibleTranslation);
  const translationId = explicitTranslationId || activeTranslation || 'lsg';

  const [index, setIndex] = useState<SplitBibleIndex | null>(null);
  const [status, setStatus] = useState<BibleDataStatus>('loading');
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const chaptersRef = useRef(new Map<string, BibleChapterData>());

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    setIndex(null);
    setError(null);
    chaptersRef.current.clear();

    void loadBibleIndex(translationId)
      .then((loaded) => {
        if (cancelled) return;
        if (!loaded) {
          setStatus(findRemoteDatasetEntry(translationId) ? 'unavailable' : 'error');
          if (!findRemoteDatasetEntry(translationId)) {
            setError(`Traduction « ${translationId} » inconnue.`);
          }
          return;
        }
        setIndex(loaded);
        setStatus('ready');
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : String(e));
        setStatus('error');
      });

    return () => {
      cancelled = true;
    };
  }, [translationId, attempt]);

  const byId = useMemo(() => {
    if (!index) return null;
    return new Map(index.books.map((book) => [book.id, book]));
  }, [index]);

  const getChapter = useCallback(
    async (bookId: string, chapterNumber: number) => {
      const key = `${bookId}:${chapterNumber}`;
      const cached = chaptersRef.current.get(key);
      if (cached) return cached;
      const chapter = await loadBibleChapter(translationId, bookId, chapterNumber);
      if (chapter) chaptersRef.current.set(key, chapter);
      return chapter;
    },
    [translationId],
  );

  const loadAll = useCallback(
    () => loadTranslationBooks(translationId),
    [translationId],
  );

  const reload = useCallback(() => setAttempt((n) => n + 1), []);

  return {
    translationId,
    index,
    books: index?.books ?? null,
    byId,
    status,
    error,
    remoteEntry: findRemoteDatasetEntry(translationId),
    getChapter,
    loadAll,
    reload,
  };
}

export default useBibleData;
