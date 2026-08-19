/**
 * MemorizationStorageAdapter — Shared storage adapter for memorization data
 *
 * Encapsulates key formatting, read-modify-write retry logic, and JSON serialization
 * shared between MemorizationService (profile-scoped) and CloudMemorizationService.
 *
 * The MemorizationService passes a keyPrefix (profile-scoped) or empty prefix (cloud).
 */

import { IStorage } from '@/infrastructure/storage/storage-types';
import { MemorizationRecord, ReviewLogEntry } from './entities';

/** Maximum retry count for read-modify-write operations */
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 100;

/**
 * Helper: serialize and persist a review log entry with read-modify-write retry
 */
async function saveReviewLogWithRetry(
  storage: IStorage,
  logEntry: ReviewLogEntry,
  arrayKey: string,
  recordKey: string,
): Promise<void> {
  await storage.set(recordKey, JSON.stringify(logEntry));

  let retries = 0;
  while (retries < MAX_RETRY_ATTEMPTS) {
    try {
      const existingStr = await storage.get(arrayKey);
      const existing: ReviewLogEntry[] = existingStr ? JSON.parse(existingStr) : [];
      if (!existing.some(l => l.id === logEntry.id)) {
        existing.push(logEntry);
      }
      await storage.set(arrayKey, JSON.stringify(existing));
      return;
    } catch (error) {
      retries++;
      if (retries >= MAX_RETRY_ATTEMPTS) throw error;
      await new Promise(r => setTimeout(r, RETRY_DELAY_MS * retries));
    }
  }
}

/**
 * Helper: deserialize and parse review logs from storage
 */
async function loadReviewLogs(storage: IStorage, keyPrefix: string, recordId: string): Promise<ReviewLogEntry[]> {
  const arrayKey = keyPrefix + 'reviewlogs:' + recordId;
  const str = await storage.get(arrayKey);
  return str ? (JSON.parse(str) as ReviewLogEntry[]) : [];
}

/**
 * Helper: deserialize and parse all review logs for a profile
 */
async function loadAllReviewLogs(storage: IStorage, keyPrefix: string): Promise<ReviewLogEntry[]> {
  const allKeys = await storage.getAllKeys();
  const logPrefix = keyPrefix + 'reviewlog:';
  const logKeys = allKeys.filter(k => k.startsWith(logPrefix));

  const logs: ReviewLogEntry[] = [];
  for (const key of logKeys) {
    const str = await storage.get(key);
    if (str) logs.push(JSON.parse(str) as ReviewLogEntry);
  }
  return logs.sort((a, b) => b.answeredAt - a.answeredAt);
}

/**
 * Helper: deserialize and parse all memorization records for a profile
 */
async function loadAllRecords(storage: IStorage, keyPrefix: string): Promise<MemorizationRecord[]> {
  const allKeys = await storage.getAllKeys();
  const recordPrefix = keyPrefix + 'record:';
  const recordKeys = allKeys.filter(k => k.startsWith(recordPrefix));

  const records: MemorizationRecord[] = [];
  for (const key of recordKeys) {
    const str = await storage.get(key);
    if (str) records.push(JSON.parse(str) as MemorizationRecord);
  }
  return records;
}

export class MemorizationStorageAdapter {
  constructor(
    protected storage: IStorage,
    protected keyPrefix: string = '',
  ) {}

  async saveRecord(record: MemorizationRecord): Promise<void> {
    await this.storage.set(this.keyPrefix + 'record:' + record.id, JSON.stringify(record));
  }

  async saveReviewLog(logEntry: ReviewLogEntry): Promise<void> {
    const arrayKey = this.keyPrefix + 'reviewlogs:' + logEntry.memorizationRecordId;
    const recordKey = this.keyPrefix + 'reviewlog:' + logEntry.memorizationRecordId + ':' + logEntry.answeredAt;
    await saveReviewLogWithRetry(this.storage, logEntry, arrayKey, recordKey);
  }

  async getRecord(recordId: string): Promise<MemorizationRecord | null> {
    const str = await this.storage.get(this.keyPrefix + 'record:' + recordId);
    return str ? JSON.parse(str) as MemorizationRecord : null;
  }

  async getAllRecords(): Promise<MemorizationRecord[]> {
    return loadAllRecords(this.storage, this.keyPrefix);
  }

  async getDueRecords(): Promise<MemorizationRecord[]> {
    try {
      const all = await this.getAllRecords();
      const now = Date.now();
      return all.filter(r => r.nextReviewAt && r.nextReviewAt <= now && r.status !== 'mastered');
    } catch (error) {
      console.error('[MemorizationStorageAdapter] getDueRecords failed:', error);
      return [];
    }
  }

  async getReviewLogs(recordId: string): Promise<ReviewLogEntry[]> {
    return loadReviewLogs(this.storage, this.keyPrefix, recordId);
  }

  async getAllReviewLogs(): Promise<ReviewLogEntry[]> {
    return loadAllReviewLogs(this.storage, this.keyPrefix);
  }
}
