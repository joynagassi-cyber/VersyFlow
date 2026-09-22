/**
 * useBibleData — loads the active translation's book corpus for a screen.
 *
 * Resolution:
 *   - Dev (Vite): the REAL Supabase Storage bucket is the source of truth.
 *     A cache miss triggers an automatic download from the bucket (with
 *     progress), so the Bible renders out of the box without any mock data.
 *   - Production / offline: bundled dataset → download cache → "unavailable".
 *
 * `download()` is also exposed for manual retry; `downloadPercent` tracks the
 * in-flight transfer.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
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
  /** 0–100 while a download is in flight; null otherwise. */
  downloadPercent: number | null;
  /** Catalog entry when the translation is available as a remote dataset. */
  remoteEntry: ReturnType<typeof findRemoteDatasetEntry>;
  /** Fetch the dataset from the Supabase bucket (no-op when cached). */
  download: (onProgress?: (percent: number) => void) => Promise<void>;
}

export function useBibleData(explicitTranslationId?: string): UseBibleData {
  const activeTranslation = useSettingsStore((s) => s.bibleTranslation);
  const translationId = explicitTranslationId || activeTranslation || 'lsg';

  const [books, setBooks] = useState<BibleBookData[] | null>(null);
  const [status, setStatus] = useState<BibleDataStatus>('loading');
  const [error, setError] = useState<string | null>(null);
  const [downloadPercent, setDownloadPercent] = useState<number | null>(null);
  const autoStartedFor = useRef<string | null>(null);

  const download = useCallback(
    async (onProgress?: (percent: number) => void) => {
      setStatus('downloading');
      setError(null);
      setDownloadPercent(0);
      try {
        const data = await downloadAndLoadTranslationBooks(
          translationId,
          (p) => {
            setDownloadPercent(p);
            onProgress?.(p);
          },
        );
        setBooks(data);
        setStatus('ready');
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
        setStatus('error');
      } finally {
        setDownloadPercent(null);
      }
    },
    [translationId],
  );

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    setBooks(null);
    setError(null);

    loadTranslationBooks(translationId).then(async (data) => {
      if (cancelled) return;
      if (data) {
        setBooks(data);
        setStatus('ready');
        return;
      }
      // Not resolvable from the cache. If a remote dataset is registered,
      // pull it from the real Supabase bucket automatically (once per
      // translation per mount) so the content appears without user action.
      if (findRemoteDatasetEntry(translationId) && autoStartedFor.current !== translationId) {
        autoStartedFor.current = translationId;
        await download();
      } else {
        setStatus('unavailable');
      }
    });

    return () => {
      cancelled = true;
    };
  }, [translationId, download]);

  const remoteEntry = findRemoteDatasetEntry(translationId);

  return {
    translationId,
    books,
    status,
    error,
    downloadPercent,
    remoteEntry,
    download,
  };
}

export default useBibleData;
