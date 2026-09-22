/**
 * useBibleData — loads the active translation's book corpus for a screen.
 *
 * Resolution: bundled local dataset → download-on-demand cache → "unavailable".
 * When unavailable, `download()` pulls the remote dataset from the Supabase
 * Storage public bucket `bible-datasets` (progress callback supported).
 */

import { useCallback, useEffect, useState } from 'react';
import type { BibleBookData } from '@/domains/bible/repository-local';
import { useSettingsStore } from '@/store/settings-store';
import {
  downloadAndLoadTranslationBooks,
  findRemoteDatasetEntry,
  loadTranslationBooks,
} from '@/services/bible-text-service';

export type BibleDataStatus =
  | 'loading'
  | 'ready'
  | 'unavailable'
  | 'downloading'
  | 'error';

export interface UseBibleData {
  /** The translation id actually used (explicit arg or the active setting). */
  translationId: string;
  books: BibleBookData[] | null;
  status: BibleDataStatus;
  error: string | null;
  /** Catalog entry when the translation is available as a remote dataset. */
  remoteEntry: ReturnType<typeof findRemoteDatasetEntry>;
  /** Download the dataset (instant no-op when cached); fills `books` on success. */
  download: (onProgress?: (percent: number) => void) => Promise<void>;
}

export function useBibleData(explicitTranslationId?: string): UseBibleData {
  const activeTranslation = useSettingsStore((s) => s.bibleTranslation);
  const translationId = explicitTranslationId || activeTranslation || 'lsg';

  const [books, setBooks] = useState<BibleBookData[] | null>(null);
  const [status, setStatus] = useState<BibleDataStatus>('loading');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    setBooks(null);
    setError(null);

    loadTranslationBooks(translationId).then((data) => {
      if (cancelled) return;
      if (data) {
        setBooks(data);
        setStatus('ready');
      } else {
        setStatus('unavailable');
      }
    });

    return () => {
      cancelled = true;
    };
  }, [translationId]);

  const remoteEntry = findRemoteDatasetEntry(translationId);

  const download = useCallback(
    async (onProgress?: (percent: number) => void) => {
      setStatus('downloading');
      setError(null);
      try {
        const data = await downloadAndLoadTranslationBooks(
          translationId,
          onProgress,
        );
        setBooks(data);
        setStatus('ready');
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
        setStatus('error');
      }
    },
    [translationId],
  );

  return { translationId, books, status, error, remoteEntry, download };
}

export default useBibleData;
