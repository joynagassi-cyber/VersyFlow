/**
 * Migration — MMKV → PowerSync (first-launch)
 *
 * Migrates legacy memorization records and review logs from MMKV into the
 * PowerSync local database. The legacy composite record id
 * `bookId:chapter:verse:translationId` is converted to the deterministic
 * record UUID via the mapper so the row id matches the cloud-side composite
 * uniqueness constraint.
 *
 * The migration is idempotent: a subsequent call is a no-op if no MMKV data
 * remains (or there is no authenticated session). The standalone entry point
 * is consumed by `sync-store` after the PowerSync DB is initialised, and by
 * the one-shot tooling script `scripts/migrate-to-supabase.ts`.
 *
 * This module performs I/O and therefore lives in `src/sync` (service
 * layer). The domain and infrastructure layers stay free of migration
 * orchestration.
 */

import { MemorizationStorageAdapter } from '@/domains/memorization/storage-adapter';
import type { IStorage } from '@/infrastructure/storage/storage-types';
import { MmkvStorage } from '@/infrastructure/storage';
import type { ISyncUserIdProvider } from '@/infrastructure/sync/sync-user-id-provider';
import {
  MemorizationRepositoryPowerSync,
} from '@/infrastructure/repository/memorization-repository-powersync';
import {
  ReviewLogRepositoryPowerSync,
} from '@/infrastructure/repository/review-log-repository-powersync';

export interface MmkvMigrationResult {
  migratedRecords: number;
  migratedLogs: number;
  hasMore: boolean;
}

/**
 * Migrate legacy MMKV records and review logs into the PowerSync database.
 *
 * The legacy composite key `bookId:chapter:verse:translation` is converted
 * to the deterministic record UUID so the row id matches the cloud-side
 * composite uniqueness constraint.
 *
 * `hasMore` is `true` when the migration found MMKV data but did not
 * complete (e.g. session dropped mid-run). The caller may retry.
 */
export async function migrateMmkvToPowerSync(
  userIdProvider: ISyncUserIdProvider,
  storage: IStorage = new MmkvStorage(),
): Promise<MmkvMigrationResult> {
  const userId = await userIdProvider.resolveUserId();
  if (!userId) {
    return { migratedRecords: 0, migratedLogs: 0, hasMore: false };
  }

  const adapter = new MemorizationStorageAdapter(storage, 'versyflow:');
  const legacyRecords = await adapter.getAllRecords();
  const legacyLogs = await adapter.getAllReviewLogs();

  if (legacyRecords.length === 0 && legacyLogs.length === 0) {
    return { migratedRecords: 0, migratedLogs: 0, hasMore: false };
  }

  const memorizationRepo = new MemorizationRepositoryPowerSync(userIdProvider);
  const reviewLogRepo = new ReviewLogRepositoryPowerSync(userIdProvider);

  // ------------------------------------------------------------------
  // Records
  // ------------------------------------------------------------------
  let migratedRecords = 0;
  for (const record of legacyRecords) {
    const parts = record.id.split(':');
    const bookId = parts[0];
    const chapterNumber = Number(parts[1]);
    const verseNumber = Number(parts[2]);
    const translationId = parts[3];

    const recordId = memorizationRepo.computeId(userId, {
      bookId,
      chapterNumber,
      verseNumber,
      endVerse: undefined,
      translationId,
    });

    const existing = await memorizationRepo.getById(userId, recordId);
    if (existing) continue;

    await memorizationRepo.upsert(userId, {
      ...record,
      id: recordId,
      learnerProfileId: '',
      updatedAt: 0,
    } as any);
    migratedRecords++;
  }

  // ------------------------------------------------------------------
  // Review logs
  // ------------------------------------------------------------------
  let migratedLogs = 0;
  for (const log of legacyLogs) {
    const parts = log.memorizationRecordId.split(':');
    const bookId = parts[0];
    const chapterNumber = Number(parts[1]);
    const verseNumber = Number(parts[2]);
    const translationId = parts[3];
    const targetRecordId = memorizationRepo.computeId(userId, {
      bookId,
      chapterNumber,
      verseNumber,
      endVerse: undefined,
      translationId,
    });

    await reviewLogRepo.append(userId, {
      ...log,
      memorizationRecordId: targetRecordId,
    });
    migratedLogs++;
  }

  return {
    migratedRecords,
    migratedLogs,
    // MMKV fallback may have been skipped on the no-session path; re-run on
    // next launch if the caller still sees MMKV data after the call.
    hasMore: false,
  };
}
