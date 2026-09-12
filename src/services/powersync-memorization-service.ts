/**
 * PowerSyncMemorizationService — PowerSync/SQLite-backed MemorizationService.
 *
 * Extends the pure {@link MemorizationService} and re-targets every record
 * read/write onto the {@link IMemorizationRepository} (single PowerSync
 * write path, P0-B lot). Because it extends the domain service it is a
 * drop-in `ReviewQueueSource` (satisfies `getDueRecords(profileId)`), while
 * the underlying storage is the local SQLite database instead of MMKV.
 *
 * The constructor never touches storage: parent calls
 * `MemorizationService` with `NoopStorage`, and the override methods are the
 * ones actually used. This makes the service safe to construct in any
 * environment (it only issues I/O when a method is awaited).
 */

import {
  MemorizationService,
} from '@/domains/memorization/service';
import { fsrsRatingToString } from '@/domains/memorization/entities';
import type {
  MemorizationRecord,
  ReviewLogEntry,
  WordPerformance,
} from '@/domains/memorization/entities';
import type { IFsrsEngine, Rating as FsrsRating, FsrsState } from '@/domains/fsrs';
import type { IStorage } from '@/infrastructure/storage/storage-types';
import { getMemorizationRepository, getReviewLogRepository } from '@/infrastructure/repository/powersync-repositories';
import type { WordPerformanceSnapshot } from '@/domains/memorization/entities';

/**
 * Project a `WordPerformance` (record-level, aggregated) into the
 * per-review `WordPerformanceSnapshot` that `ReviewLogEntry` stores.
 *
 * The two shapes intentionally diverge:
 *   - `WordPerformance` is the running average kept on the record itself
 *     (correctRecalls / failedRecalls / avgRecallTimeMs)
 *   - `WordPerformanceSnapshot` is the per-review event (recalled /
 *     incorrect / timeToRevealMs / suggestedWord / expectedWord)
 *
 * Without an explicit per-review capture (no recall-capture engine yet),
 * we conservatively map "no data" to a neutral snapshot so the log row
 * is well-formed and the JSON column is valid.
 */
function toWordPerformanceSnapshot(w: WordPerformance): WordPerformanceSnapshot {
  const total = (w.totalAttempts ?? 0) || (w.correctRecalls + w.failedRecalls);
  const recalled = w.failedRecalls === 0 && total > 0;
  return {
    wordIndex: w.wordIndex,
    word: w.word,
    recalled,
    incorrect: !recalled,
    timeToRevealMs: w.avgRecallTimeMs || null,
    suggestedWord: w.word,
    expectedWord: w.word,
  };
}

/**
 * Minimal write surface of the repository used here. Keeps the class testable
 * with a stub and identical to the production `IMemorizationRepository`.
 */
export interface MemorizationRepoLike {
  getById(userId: string, recordId: string): Promise<MemorizationRecord | null>;
  listDueByUser(userId: string, beforeMs?: number): Promise<MemorizationRecord[]>;
  upsert(
    userId: string,
    record: Omit<MemorizationRecord, 'id' | 'learnerProfileId' | 'updatedAt'>,
  ): Promise<void>;
}

/** A no-op `IStorage` used only to satisfy the parent constructor. */
export const NoopStorage: IStorage = {
  async get() {
    return null;
  },
  async set() {},
  async delete() {},
  async getAllKeys() {
    return [];
  },
  async clear() {},
};

export class PowerSyncMemorizationService extends MemorizationService {
  private readonly repo: MemorizationRepoLike;
  private readonly userIdProvider: () => Promise<string | null>;
  private readonly myProfileId: string;
  private readonly reviewLogWriter: (
    userId: string,
    entry: Omit<ReviewLogEntry, 'id'>,
  ) => Promise<void>;

  constructor(
    fsrsEngine: IFsrsEngine,
    profileId: string = 'default',
    userIdProvider: () => Promise<string | null> = async () => null,
    repoFactory: () => MemorizationRepoLike = getMemorizationRepository,
    reviewLogWriter: (
      userId: string,
      entry: Omit<ReviewLogEntry, 'id'>,
    ) => Promise<void> = getReviewLogBridge,
  ) {
    // Parent wires a NoopStorage; it is never awaited in the overridden
    // methods below, so the service is safe to construct anywhere. The
    // fsrs engine is still passed through for `memorizeTarget` (new records).
    super(NoopStorage, fsrsEngine, profileId);
    this.repo = repoFactory();
    this.userIdProvider = userIdProvider;
    this.myProfileId = profileId;
    this.reviewLogWriter = reviewLogWriter;
  }

  private async ownerOrThrow(): Promise<string> {
    const id = await this.userIdProvider();
    if (!id) {
      throw new Error('[PowerSyncMemorizationService] no authenticated user; cannot persist review');
    }
    return id;
  }

  private toRepoRecord(record: MemorizationRecord) {
    return {
      bookId: record.bookId,
      chapterNumber: record.chapterNumber,
      verseNumber: record.verseNumber,
      endVerse: record.endVerse,
      translationId: record.translationId,
      bibleVerseReference: record.bibleVerseReference,
      bibleVerseText: record.bibleVerseText,
      verseTexts: record.verseTexts,
      status: record.status,
      fsrsState: record.fsrsState,
      nextReviewAt: record.nextReviewAt,
      createdAt: record.createdAt,
      lastReviewedAt: record.lastReviewedAt,
      reviewCount: record.reviewCount,
      totalReviewMinutes: record.totalReviewMinutes,
      wordPerformance: record.wordPerformance,
      favorite: record.favorite,
      tags: record.tags,
      targetId: record.targetId,
      targetType: record.targetType,
    } as Omit<MemorizationRecord, 'id' | 'learnerProfileId' | 'updatedAt'>;
  }

  // ---- ReviewQueueSource surface ----

  async getDueRecords(profileId?: string): Promise<MemorizationRecord[]> {
    void profileId;
    const userId = await this.userIdProvider();
    if (!userId) return []; // offline + not signed in → nothing to review
    return this.repo.listDueByUser(userId);
  }

  async getMemorizedRecord(
    bookId: string,
    chapter: number,
    verse: number,
    translationId: string,
    profileId?: string,
  ): Promise<MemorizationRecord | null> {
    void profileId;
    const userId = await this.userIdProvider();
    if (!userId) return null;
    const recordId = `${bookId}:${chapter}:${verse}:${translationId}`;
    return this.repo.getById(userId, recordId);
  }

  // ---- Persistence (single PowerSync write path) ----

  async saveMemorizedRecord(
    record: Omit<MemorizationRecord, 'id' | 'learnerProfileId'>,
    profileId?: string,
  ): Promise<void> {
    void profileId;
    const userId = await this.ownerOrThrow();
    const full: MemorizationRecord = {
      id: recordUuidOf(record),
      ...record,
      learnerProfileId: profileId ?? this.myProfileId,
    };
    await this.repo.upsert(userId, this.toRepoRecord(full));
  }

  async updateRecordAfterReview(
    recordId: string,
    rating: FsrsRating,
    newFsrsState: FsrsState,
    newNextReviewAt: number,
    wordPerformance?: WordPerformance[],
    stabilityBefore?: number,
    difficultyBefore?: number,
    predictedInterval?: number,
    actualInterval?: number | null,
    profileId?: string,
  ): Promise<boolean> {
    const userId = await this.ownerOrThrow();
    const existing = await this.repo.getById(userId, recordId);
    if (!existing) return false;

    // Mirror the domain service's record mutation, then write the single row.
    existing.fsrsState = newFsrsState;
    existing.nextReviewAt = newNextReviewAt;
    existing.lastReviewedAt = Date.now();
    existing.reviewCount = (existing.reviewCount || 0) + 1;
    if (wordPerformance) existing.wordPerformance = wordPerformance;

    await this.repo.upsert(userId, this.toRepoRecord(existing));

    const logEntry: Omit<ReviewLogEntry, 'id'> = {
      memorizationRecordId: recordId,
      answeredAt: Date.now(),
      rating: fsrsRatingToString(rating),
      actualInterval: actualInterval ?? existing.fsrsState?.lastInterval ?? null,
      predictedInterval: predictedInterval ?? 0,
      stabilityBefore: stabilityBefore ?? 0,
      stabilityAfter: newFsrsState.stability,
      difficultyBefore: difficultyBefore ?? 0,
      difficultyAfter: newFsrsState.difficulty,
      wordPerformance: (wordPerformance ?? []).map(toWordPerformanceSnapshot),
    };
    // Persist the review log through the review-log repository (PowerSync).
    await this.reviewLogWriter(userId, logEntry);

    // Preserve the domain events the MMKV service used to emit so downstream
    // telemetry is unchanged.
    emitReviewEvents(recordId, rating, newFsrsState, logEntry);

    return true;
  }
}

// ---- Helpers ----

/** Deterministic record id used to look up the PowerSync row by composite key. */
function recordUuidOf(
  record: Omit<MemorizationRecord, 'id' | 'learnerProfileId'>,
): string {
  return `${record.bookId}:${record.chapterNumber}:${record.verseNumber}:${record.translationId}`;
}

/**
 * Write a review log entry through the PowerSync review-log repository.
 * Kept as a small bridge so the class stays focused on records.
 */
async function getReviewLogBridge(
  userId: string,
  entry: Omit<ReviewLogEntry, 'id'>,
): Promise<void> {
  const full: ReviewLogEntry = { id: crypto.randomUUID(), ...entry };
  await getReviewLogRepository().append(userId, full);
}

/** Emit the same domain events the MMKV service emitted. */
function emitReviewEvents(
  recordId: string,
  rating: FsrsRating,
  newFsrsState: FsrsState,
  logEntry: Omit<ReviewLogEntry, 'id'>,
): void {
  // Deferred import avoids a circular dependency at module load.
  import('@/domains/events').then(({ eventBus, DomainEventTypes }) => {
    const payload = {
      recordId,
      rating,
      previousStability: logEntry.stabilityBefore,
      newStability: newFsrsState.stability,
      previousDifficulty: logEntry.difficultyBefore,
      newDifficulty: newFsrsState.difficulty,
      predictedInterval: logEntry.predictedInterval,
    };
    eventBus.emit({
      id: crypto.randomUUID(),
      type: DomainEventTypes.RECORD_REVIEWED,
      timestamp: Date.now(),
      payload,
    });
    eventBus.emit({
      id: crypto.randomUUID(),
      type: DomainEventTypes.REVIEW_COMPLETED,
      timestamp: Date.now(),
      payload: { ...payload, timeSpentMs: 0 },
    });
  });
}
