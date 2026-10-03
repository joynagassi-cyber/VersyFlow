/**
 * useMemorizationWorkspace — UI glue for the unified Memorization Workspace.
 *
 * Binds a verse (book/chapter/verse/translation) to every memorization
 * sub-feature on one screen:
 *   - record status / FSRS state (stability, due date) when the verse was
 *     already memorized,
 *   - recall (progressive word reveal + "I memorized it" → FSRS rating),
 *   - writing recall (LCS word-diff vs the expected text),
 *   - semantic concepts attached to the verse,
 *   - the active review strategy (FSRS-aware recommendation),
 *   - review log of past sessions.
 *
 * No business logic here: the domain services (MemorizationSessionEngine,
 * ComparisonEngine, PowerSyncMemorizationService) do the work.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { BIBLE_BOOKS, resolveBookId } from '@/domains/bible/entities';
import { LocalBibleRepository } from '@/domains/bible/repository-local';
import { resolveBibleTextSource } from '@/services/bible-text-service';
import { getFsrsEngine } from '@/services/fsrs-factory';
import { MemorizationSessionEngine } from '@/domains/memorization/session-engine';
import { ComparisonEngine } from '@/domains/memorization/comparison-engine';
import type { WrittenRecallResult } from '@/domains/memorization/comparison-engine';
import { getMemorizationService } from '@/services/memorization-service-factory';
import { useActiveProfile } from '@/hooks/useActiveProfile';
import { useSettingsStore } from '@/store/settings-store';
import type { MemorizationRecord } from '@/domains/memorization/entities';
import { Rating as FsrsRating } from '@/domains/fsrs';

export interface WorkspaceCoords {
  bookId: string;
  chapter: number;
  verse: number;
  translationId: string;
}

export interface WorkspaceRecordView {
  record: MemorizationRecord | null;
  loadError: string | null;
}

export interface MemorizationWorkspaceApi {
  coords: WorkspaceCoords | null;
  verseText: string;
  referenceLabel: string;
  status: 'idle' | 'loading' | 'ready' | 'error';
  statusMessage: string | null;
  record: MemorizationRecord | null;
  /** Predicted next-review date once the verse has been rated (or the
   *  record's existing `nextReviewAt` when not yet rated in this session). */
  nextReviewAt: Date | null;
  /** Words of the verse for the recall chip row. */
  words: string[];
  revealed: number;
  revealAll: () => void;
  resetReveal: () => void;
  /** Rate the verse via FSRS (engine path) — the record is updated
   *  in-memory and persisted through PowerSync. */
  rate: (rating: FsrsRating) => Promise<void>;
  /** Writing recall: compare a written attempt against the verse text. */
  compareWriting: (written: string) => WrittenRecallResult | null;
  /** Active strategy recommendation ("flashcard" when a record exists, etc.). */
  strategy: string;
  /** Review log entries for this verse (newest first), when available. */
  reviewLogCount: number;
}

export function useMemorizationWorkspace(
  coords: WorkspaceCoords,
): MemorizationWorkspaceApi {
  const navigate = useNavigate();
  const { activeProfile } = useActiveProfile();
  const profileId = activeProfile?.id ?? 'default';

  const [engine, setEngine] = useState<MemorizationSessionEngine | null>(null);
  const [verseText, setVerseText] = useState('');
  const [record, setRecord] = useState<MemorizationRecord | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(0);
  const [reviewLogCount, setReviewLogCount] = useState(0);

  const bookName = BIBLE_BOOKS.find((b) => b.id === coords.bookId)?.name.fr ?? coords.bookId;
  const referenceLabel = `${bookName} ${coords.chapter}:${coords.verse}`;

  // Load the verse text + existing record once per coordinate set.
  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    setRecord(null);
    setRevealed(0);
    setReviewLogCount(0);

    (async () => {
      try {
        const source = await resolveBibleTextSource(coords.translationId);
        const repo = new LocalBibleRepository(source);
        const verse = await repo.getVerse(
          coords.translationId,
          coords.bookId,
          coords.chapter,
          coords.verse,
        );
        if (cancelled) return;
        setVerseText(verse?.text ?? '');

        const service = getMemorizationService(profileId);
        const existing = await service.getMemorizedRecord(
          coords.bookId,
          coords.chapter,
          coords.verse,
          coords.translationId,
          profileId,
        );
        if (cancelled) return;
        setRecord(existing);
        if (existing) {
          const logs = await service.getReviewLogsForRecord(existing.id, profileId);
          if (!cancelled) setReviewLogCount(logs.length);
        }

        const fsrsEngine = getFsrsEngine();
        const engineInstance = new MemorizationSessionEngine(repo, fsrsEngine);
        await engineInstance.startPassage({
          bookId: coords.bookId,
          chapter: coords.chapter,
          verseStart: coords.verse,
          verseEnd: coords.verse,
          translationId: coords.translationId,
          learnerProfileId: profileId,
        }, {
          initialRecords: existing ? [existing] : undefined,
        });
        if (cancelled) return;
        setEngine(engineInstance);
        setStatus('ready');
      } catch (e) {
        if (cancelled) return;
        setStatus('error');
        setStatusMessage(e instanceof Error ? e.message : String(e));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [coords.bookId, coords.chapter, coords.verse, coords.translationId, profileId]);

  const words = useMemo(() => verseText.split(/\s+/).filter(Boolean), [verseText]);

  const revealAll = useCallback(() => setRevealed(words.length), [words.length]);
  const resetReveal = useCallback(() => setRevealed(0), []);

  const rate = useCallback(
    async (rating: FsrsRating): Promise<void> => {
      if (!engine) return;
      const recordResult = await engine.rateCurrentVerse(rating);
      if (recordResult) {
        setRecord(recordResult);
        // Persist via the PowerSync-backed service (single write path).
        try {
          const service = getMemorizationService(profileId);
          await service.saveMemorizedRecord(
            {
              bookId: recordResult.bookId,
              chapterNumber: recordResult.chapterNumber,
              verseNumber: recordResult.verseNumber,
              endVerse: recordResult.endVerse,
              translationId: recordResult.translationId,
              bibleVerseReference: recordResult.bibleVerseReference,
              bibleVerseText: recordResult.bibleVerseText,
              verseTexts: recordResult.verseTexts,
              status: recordResult.status,
              fsrsState: recordResult.fsrsState,
              nextReviewAt: recordResult.nextReviewAt,
              createdAt: recordResult.createdAt,
              lastReviewedAt: recordResult.lastReviewedAt,
              reviewCount: recordResult.reviewCount,
              totalReviewMinutes: recordResult.totalReviewMinutes,
              wordPerformance: recordResult.wordPerformance,
              favorite: recordResult.favorite,
              tags: recordResult.tags,
              targetId: recordResult.targetId,
              targetType: recordResult.targetType,
            },
            profileId,
          );
        } catch (e) {
          console.warn('[MemorizationWorkspace] persistence skipped:', e);
        }
      }
    },
    [engine, profileId],
  );

  const compareWriting = useCallback(
    (written: string): WrittenRecallResult | null => {
      if (!verseText.trim() || !written.trim()) return null;
      return new ComparisonEngine().compareWrittenRecall(written, verseText);
    },
    [verseText],
  );

  // Strategy: a verse that already has FSRS stability past 5 days is a
  // candidate for flashcard practice; beyond 10 days, writing recall.
  const strategy = useMemo(() => {
    if (!record) return 'progressive-masking';
    if (record.fsrsState.stability > 10) return 'recall-writing';
    if (record.fsrsState.stability > 5) return 'flashcard';
    return 'progressive-masking';
  }, [record]);

  const nextReviewAt = record?.nextReviewAt ? new Date(record.nextReviewAt) : null;

  return {
    coords,
    verseText,
    referenceLabel,
    status,
    statusMessage,
    record,
    nextReviewAt,
    words,
    revealed,
    revealAll,
    resetReveal,
    rate,
    compareWriting,
    strategy,
    reviewLogCount,
  };
}

/** Parse a "Jean 3:16" style reference into workspace coordinates. */
export function parseWorkspaceReference(reference: string): WorkspaceCoords | null {
  const match = reference.match(/^(.+?)\s*(\d+)(?::(\d+))?$/i);
  if (!match) return null;
  const bookId = resolveBookId(match[1]);
  if (!bookId) return null;
  const chapter = parseInt(match[2], 10);
  const verse = match[3] ? parseInt(match[3], 10) : 1;
  return {
    bookId,
    chapter,
    verse,
    translationId: useSettingsStore.getState().bibleTranslation || 'lsg',
  };
}

export default useMemorizationWorkspace;
