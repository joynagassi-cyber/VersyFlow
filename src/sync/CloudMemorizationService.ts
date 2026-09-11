/**
 * CloudMemorizationService — Offline-first memorization with cloud sync
 *
 * Wraps the PowerSync memorization repositories (memorization + review log)
 * and keeps a `MemorizationStorageAdapter` (MMKV) as a transient fallback for
 * the rare "no authenticated session" path. Every write is scoped to the
 * current user (`user_id` ownership) so the sync stream can upload it.
 *
 * Non-profile-scoped (key prefix: 'versyflow:') — uses single-user model.
 */

import { MemorizationStorageAdapter } from '@/domains/memorization/storage-adapter';
import { fsrsRatingToString } from '@/domains/memorization/entities';
import type { ISyncService } from './ISyncService';
import type {
  MemorizationRecord,
  ReviewLogEntry,
  WordPerformance,
} from '@/domains/memorization/entities';
import type { IFsrsEngine } from '@/domains/fsrs';
import { Rating } from '@/domains/fsrs';
import type { IStorage } from '@/infrastructure/storage/storage-types';
import { MmkvStorage } from '@/infrastructure/storage';
import type { ISyncUserIdProvider } from '@/infrastructure/sync/sync-user-id-provider';
import {
  MemorizationRepositoryPowerSync,
  type IMemorizationRepository,
} from '@/infrastructure/repository/memorization-repository-powersync';
import {
  ReviewLogRepositoryPowerSync,
  type IReviewLogRepository,
} from '@/infrastructure/repository/review-log-repository-powersync';

export class CloudMemorizationService {
  private storageAdapter: MemorizationStorageAdapter;
  private syncService: ISyncService;
  private fsrsEngine: IFsrsEngine;
  private userIdProvider: ISyncUserIdProvider;
  private memorizationRepo: IMemorizationRepository;
  private reviewLogRepo: IReviewLogRepository;

  constructor(
    storage: IStorage,
    syncService: ISyncService,
    fsrsEngine: IFsrsEngine,
    userIdProvider: ISyncUserIdProvider,
    memorizationRepo: IMemorizationRepository,
    reviewLogRepo: IReviewLogRepository,
  ) {
    this.storageAdapter = new MemorizationStorageAdapter(storage, 'versyflow:');
    this.syncService = syncService;
    this.fsrsEngine = fsrsEngine;
    this.userIdProvider = userIdProvider;
    this.memorizationRepo = memorizationRepo;
    this.reviewLogRepo = reviewLogRepo;
  }

  // ------------------------------------------------------------------
  // Records
  // ------------------------------------------------------------------

  async saveMemorizedRecord(
    record: Omit<MemorizationRecord, 'id' | 'learnerProfileId' | 'updatedAt'>,
  ): Promise<void> {
    const userId = await this.userIdProvider.resolveUserId();

    // No session: transient MMKV fallback (data is not uploaded).
    if (!userId) {
      const recordId = `${record.bookId}:${record.chapterNumber}:${record.verseNumber}:${record.translationId}`;
      const fullRecord: MemorizationRecord = { id: recordId, learnerProfileId: '', ...record };
      await this.storageAdapter.saveRecord(fullRecord);
      return;
    }

    await this.memorizationRepo.upsert(userId, record);

    if (this.syncService.autoSyncEnabled && this.syncService.connected) {
      await this.syncService.syncRecordsToCloud();
    }
  }

  async getMemorizedRecord(
    bookId: string,
    chapter: number,
    verse: number,
    translationId: string,
  ): Promise<MemorizationRecord | null> {
    const userId = await this.userIdProvider.resolveUserId();
    if (!userId) {
      const recordId = `${bookId}:${chapter}:${verse}:${translationId}`;
      return this.storageAdapter.getRecord(recordId);
    }
    const recordId = this.memorizationRepo.computeId(userId, {
      bookId,
      chapterNumber: chapter,
      verseNumber: verse,
      endVerse: undefined,
      translationId,
    });
    return this.memorizationRepo.getById(userId, recordId);
  }

  async getAllMemorized(): Promise<MemorizationRecord[]> {
    const userId = await this.userIdProvider.resolveUserId();
    if (!userId) return this.storageAdapter.getAllRecords();
    return this.memorizationRepo.listByUser(userId);
  }

  async getDueRecords(): Promise<MemorizationRecord[]> {
    const userId = await this.userIdProvider.resolveUserId();
    if (!userId) return this.storageAdapter.getDueRecords();
    return this.memorizationRepo.listDueByUser(userId);
  }

  // ------------------------------------------------------------------
  // Review logs
  // ------------------------------------------------------------------

  async saveReviewLog(logEntry: Omit<ReviewLogEntry, 'id'>): Promise<void> {
    const userId = await this.userIdProvider.resolveUserId();
    const entry: ReviewLogEntry = { id: crypto.randomUUID(), ...logEntry };

    if (!userId) {
      // MMKV fallback when offline with no session.
      await this.storageAdapter.saveReviewLog(entry);
      if (this.syncService.autoSyncEnabled && this.syncService.connected) {
        await this.syncService.syncLogsToCloud();
      }
      return;
    }

    await this.reviewLogRepo.append(userId, entry);
    if (this.syncService.autoSyncEnabled && this.syncService.connected) {
      await this.syncService.syncLogsToCloud();
    }
  }

  async getReviewLogsForRecord(recordId: string): Promise<ReviewLogEntry[]> {
    return this.reviewLogRepo.listByRecord(recordId);
  }

  async getAllReviewLogs(): Promise<ReviewLogEntry[]> {
    const userId = await this.userIdProvider.resolveUserId();
    if (!userId) return this.storageAdapter.getAllReviewLogs();
    return this.reviewLogRepo.listByUser(userId);
  }

  // ------------------------------------------------------------------
  // Review cycle
  // ------------------------------------------------------------------

  async updateRecordAfterReview(
    recordId: string,
    rating: Rating,
    newFsrsState: any,
    newNextReviewAt: number,
    wordPerformance?: WordPerformance[],
    stabilityBefore?: number,
    difficultyBefore?: number,
    predictedInterval?: number,
    actualInterval?: number | null,
  ): Promise<boolean> {
    try {
      const userId = await this.userIdProvider.resolveUserId();
      const record = userId
        ? await this.memorizationRepo.getById(userId, recordId)
        : await this.storageAdapter.getRecord(recordId);
      if (!record) return false;

      const stabilityBeforeValue = stabilityBefore ?? record.fsrsState.stability;
      const difficultyBeforeValue = difficultyBefore ?? record.fsrsState.difficulty;
      const actualIntervalValue =
        actualInterval !== undefined
          ? actualInterval
          : (record.fsrsState.lastInterval ?? null);
      const predictedIntervalValue =
        predictedInterval !== undefined
          ? predictedInterval
          : record.fsrsState.nextInterval ?? 0;

      const updatedRecord: Omit<MemorizationRecord, 'id' | 'learnerProfileId'> = {
        ...record,
        fsrsState: newFsrsState,
        nextReviewAt: newNextReviewAt,
        lastReviewedAt: Date.now(),
        reviewCount: (record.reviewCount || 0) + 1,
        ...(wordPerformance ? { wordPerformance } : {}),
      };

      if (userId) {
        await this.memorizationRepo.upsert(userId, updatedRecord);
      } else {
        await this.storageAdapter.saveRecord({ ...record, id: recordId, learnerProfileId: '' } as MemorizationRecord);
      }

      const reviewLog: Omit<ReviewLogEntry, 'id'> = {
        memorizationRecordId: recordId,
        answeredAt: Date.now(),
        rating: fsrsRatingToString(rating),
        actualInterval: actualIntervalValue,
        predictedInterval: predictedIntervalValue,
        stabilityBefore: stabilityBeforeValue,
        stabilityAfter: newFsrsState.stability,
        difficultyBefore: difficultyBeforeValue,
        difficultyAfter: newFsrsState.difficulty,
        wordPerformance: (wordPerformance as any) || [],
      };

      if (userId) {
        await this.reviewLogRepo.append(userId, {
          id: crypto.randomUUID(),
          ...reviewLog,
        });
      } else {
        await this.storageAdapter.saveReviewLog({
          id: crypto.randomUUID(),
          ...reviewLog,
        });
      }

      if (this.syncService.autoSyncEnabled && this.syncService.connected) {
        await this.syncService.syncLogsToCloud();
      }
      return true;
    } catch (error) {
      console.error('[CloudMemorizationService] updateRecordAfterReview failed:', error);
      return false;
    }
  }

  // ------------------------------------------------------------------
  // High-level actions
  // ------------------------------------------------------------------

  async memorizeVerse(params: {
    bookId: string;
    chapterNumber: number;
    verseNumber: number;
    translationId: string;
    verseText: string;
    referenceDisplay: string;
  }): Promise<{ success: boolean; rating: Rating; nextReviewAt: number }> {
    try {
      const newFsrsState = await this.fsrsEngine.newState(0);
      const review = await this.fsrsEngine.review(newFsrsState, Rating.GOOD);

      await this.saveMemorizedRecord({
        bookId: params.bookId,
        chapterNumber: params.chapterNumber,
        verseNumber: params.verseNumber,
        translationId: params.translationId,
        bibleVerseReference: params.referenceDisplay,
        bibleVerseText: params.verseText,
        status: 'mastered',
        fsrsState: review.state,
        nextReviewAt: review.due.getTime(),
        createdAt: Date.now(),
        lastReviewedAt: null,
        reviewCount: 0,
        totalReviewMinutes: 0,
        wordPerformance: [],
        favorite: false,
        tags: [],
      });

      return { success: true, rating: Rating.GOOD, nextReviewAt: review.due.getTime() };
    } catch (error) {
      console.error('[CloudMemorizationService] memorizeVerse failed:', error);
      return { success: false, rating: Rating.AGAIN, nextReviewAt: Date.now() };
    }
  }

  async triggerSync(): Promise<void> {
    await this.syncService.sync();
  }

  getSyncStatus() {
    return this.syncService.getStatus();
  }

  setAutoSync(enabled: boolean): void {
    this.syncService.setAutoSync(enabled);
  }

  // ------------------------------------------------------------------
  // First-launch migration: MMKV → PowerSync
  // ------------------------------------------------------------------

  /**
   * Migrate legacy MMKV records and review logs into the PowerSync database.
   * The legacy composite key `bookId:chapter:verse:translation` is converted
   * to the deterministic record UUID via the mapper so the row id matches the
   * cloud-side composite uniqueness constraint.
   *
   * This is idempotent: it runs once at startup and a subsequent call is a
   * no-op if no MMKV data remains (or there is no authenticated session).
   */
  async migrateFromMmkvToPowerSync(): Promise<{
    migratedRecords: number;
    migratedLogs: number;
  }> {
    const userId = await this.userIdProvider.resolveUserId();
    if (!userId) {
      return { migratedRecords: 0, migratedLogs: 0 };
    }

    const legacyRecords = await this.storageAdapter.getAllRecords();
    const legacyLogs = await this.storageAdapter.getAllReviewLogs();

    for (const record of legacyRecords) {
      const recordKey = record.id.split(':');
      const candidate = {
        bookId: recordKey[0],
        chapterNumber: Number(recordKey[1]),
        verseNumber: Number(recordKey[2]),
        translationId: recordKey[3],
      };
      const { bookId, chapterNumber, verseNumber, translationId } = candidate;
      const existing = await this.memorizationRepo.getById(
        userId,
        this.memorizationRepo.computeId(userId, {
          bookId,
          chapterNumber,
          verseNumber,
          endVerse: undefined,
          translationId,
        }),
      );
      if (!existing) {
        await this.memorizationRepo.upsert(userId, record);
      }
    }

    for (const log of legacyLogs) {
      // Resolve the memorization_record_id deterministically when the legacy
      // composite key is known; otherwise leave it as-is.
      const targetRecordId = this.memorizationRepo.computeId(userId, {
        bookId: log.memorizationRecordId.split(':')[0],
        chapterNumber: Number(log.memorizationRecordId.split(':')[1]),
        verseNumber: Number(log.memorizationRecordId.split(':')[2]),
        endVerse: undefined,
        translationId: log.memorizationRecordId.split(':')[3],
      });
      await this.reviewLogRepo.append(userId, {
        ...log,
        memorizationRecordId: targetRecordId,
      });
    }

    return { migratedRecords: legacyRecords.length, migratedLogs: legacyLogs.length };
  }
}

/**
 * Default composition for `CloudMemorizationService` (used by callers that do
 * not want to inject their own repositories).
 */
export function createDefaultCloudMemorizationService(
  syncService: ISyncService,
  userIdProvider: ISyncUserIdProvider,
  fsrsEngine: IFsrsEngine,
): CloudMemorizationService {
  const storage = new MmkvStorage();
  const memorizationRepo = new MemorizationRepositoryPowerSync(userIdProvider);
  const reviewLogRepo = new ReviewLogRepositoryPowerSync(userIdProvider);
  return new CloudMemorizationService(
    storage,
    syncService,
    fsrsEngine,
    userIdProvider,
    memorizationRepo,
    reviewLogRepo,
  );
}
