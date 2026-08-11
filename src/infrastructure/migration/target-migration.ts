/**
 * Target Migration — Migrate legacy MemorizationRecords to target-oriented format
 *
 * Handles the transition from verse-only records to MemorizationTarget-based records.
 * Migration is idempotent and backward-compatible.
 */

import { MemorizationRecord } from '@/domains/memorization/entities';
import { MmkvStorage } from '@/infrastructure/storage';

export interface TargetMigrationResult {
  recordsMigrated: number;
  recordsSkipped: number;
  errors: string[];
}

/**
 * Check if a record needs migration (missing target fields)
 */
export function needsTargetMigration(record: MemorizationRecord): boolean {
  return !record.targetId || !record.targetType;
}

/**
 * Migrate a single record to the target-oriented format
 */
export function migrateRecordToTarget(record: MemorizationRecord): MemorizationRecord {
  const now = Date.now();

  // Build content reference
  const contentReference = {
    bookId: record.bookId,
    chapter: record.chapterNumber,
    startVerse: record.verseNumber,
    endVerse: record.endVerse || record.verseNumber,
    translationId: record.translationId,
  };

  // Generate target ID (use existing ID for backward compat)
  const targetId = record.id;

  // Determine target type
  const targetType: 'single-verse' | 'passage' = record.endVerse && record.endVerse > record.verseNumber
    ? 'passage'
    : 'single-verse';

  // Build verse texts if passage
  const verseTexts = targetType === 'passage' && record.verseTexts
    ? record.verseTexts
    : undefined;

  return {
    ...record,
    targetId,
    targetType,
    contentReference,
    verseTexts,
    createdAt: record.createdAt || now,
    updatedAt: now,
  };
}

/**
 * Scan storage for legacy records and migrate them
 */
export async function runTargetMigration(
  storage: MmkvStorage,
  dryRun = false,
): Promise<TargetMigrationResult> {
  const keys = await storage.getAllKeys();
  const recordKeys = keys.filter((key) => key.startsWith('versyflow:record:'));

  let recordsMigrated = 0;
  let recordsSkipped = 0;
  const errors: string[] = [];

  for (const key of recordKeys) {
    try {
      const recordStr = await storage.get(key);
      if (!recordStr) continue;

      const record = JSON.parse(recordStr) as MemorizationRecord;

      if (!needsTargetMigration(record)) {
        recordsSkipped++;
        continue;
      }

      const migrated = migrateRecordToTarget(record);

      if (!dryRun) {
        // Update the record in storage
        await storage.set(key, JSON.stringify(migrated));
      }

      recordsMigrated++;
    } catch (error) {
      errors.push(`Failed to migrate record at key ${key}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  return {
    recordsMigrated,
    recordsSkipped,
    errors,
  };
}

/**
 * Check if migration has already been run
 */
export async function isMigrationDone(storage: MmkvStorage): Promise<boolean> {
  const migrationDone = await storage.get('versyflow:migration:target:done');
  return migrationDone === 'true';
}

/**
 * Mark migration as done
 */
export async function markMigrationDone(storage: MmkvStorage): Promise<void> {
  await storage.set('versyflow:migration:target:done', 'true');
}
