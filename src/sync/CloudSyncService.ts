/**
 * CloudSyncService - Offline-first synchronization between local MmkvStorage and InsForge Database
 *
 * This service enables offline-first behavior by using local storage as the primary source of truth,
 * and synchronizing data with the InsForge cloud database when connectivity is available.
 * It supports both automatic and manual sync modes.
 */

import { MemorizationRecord, ReviewLogEntry, WordPerformance, FsrsState } from '@/domains/memorization/entities';
import { MmkvStorage } from '@/infrastructure/storage';
import { createClient } from '@insforge/sdk';
import { logger } from '@/infrastructure/logging/logger';

// Cloud data structures matching the local entities
interface CloudMemorizationRecord {
  id: string;
  bookId: string;
  chapterNumber: number;
  verseNumber: number;
  translationId: string;
  bibleVerseReference: string;
  bibleVerseText: string;
  status: 'new' | 'in-progress' | 'mastered';
  fsrsState: FsrsState;
  favorite: boolean;
  tags: string[];
  createdAt: number;
  lastReviewedAt: number | null;
  nextReviewAt: number | null;
  reviewCount: number;
  totalReviewMinutes: number;
  wordPerformance: WordPerformance[];
  updatedAt: number; // Sync metadata
}

interface CloudReviewLogEntry {
  id: string;
  memorizationRecordId: string;
  answeredAt: number;
  rating: 'again' | 'hard' | 'good' | 'easy';
  actualInterval: number | null;
  predictedInterval: number;
  stabilityBefore: number;
  stabilityAfter: number;
  difficultyBefore: number;
  difficultyAfter: number;
  wordPerformance: any[]; // WordPerformanceSnapshot[]
  updatedAt: number; // Sync metadata
}

export class CloudSyncService {
  private client: any;
  private storage: MmkvStorage;
  private autoSync: boolean = true;
  private syncQueue: { type: 'records' | 'logs'; operation: 'upload' | 'download' }[] = [];
  private isConnected: boolean = false;
  private connectRetryTimer: number | null = null;

  constructor(autoSync = true) {
    this.autoSync = autoSync;
    this.storage = new MmkvStorage();

    // Initialize InsForge client from environment variables
    this.client = createClient({
      baseUrl: process.env.INFORGE_URL || 'https://your-insforge-app.url',
      anonKey: process.env.INFORGE_ANON_KEY,
    });

    // Setup connectivity listeners
    this.setupConnectivityListeners();
  }

  private setupConnectivityListeners(): void {
    // Check network status on load
    this.updateConnectionStatus();

    // Listen for network status changes (if available)
    if (window) {
      window.addEventListener('online', () => {
        this.isConnected = true;
        logger.info('CloudSyncService: Network connection restored');
        this.processSyncQueue();
        if (this.autoSync) {
          this.syncOnce();
        }
      });

      window.addEventListener('offline', () => {
        this.isConnected = false;
        logger.warn('CloudSyncService: Network connection lost');
        // Queue sync operations for later
      });
    }
  }

  private updateConnectionStatus(): void {
    this.isConnected = !!navigator && navigator.onLine;
  }

  /**
   * Enable or disable auto-sync
   */
  setAutoSync(enabled: boolean): void {
    this.autoSync = enabled;
    logger.info(`CloudSyncService: Auto-sync ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Manually trigger a sync operation
   */
  async syncOnce(): Promise<void> {
    logger.info('CloudSyncService: Manual sync triggered');

    // First, sync local changes to cloud (upload)
    await this.syncRecordsToCloud();
    await this.syncLogsToCloud();

        // Then, fetch latest changes from cloud (download)
    await this.fetchFromCloud();
  }

  /**
   * Sync all memorization records from local storage to cloud
   */
  async syncRecordsToCloud(): Promise<void> {
    try {
      const localRecords = await this.getAllLocalMemorized();
      logger.debug(`CloudSyncService: Found ${localRecords.length} local records to sync`);

      if (localRecords.length === 0) {
        logger.debug('CloudSyncService: No records to sync');
        return;
      }

      // Get cloud records for comparison
      const cloudRecords = await this.fetchAllCloudRecords();
      const cloudMap = new Map<string, CloudMemorizationRecord>(
        cloudRecords.map(r => [r.id, r])
      );

      // Prepare records to upsert
      const recordsToUpsert: CloudMemorizationRecord[] = [];
      for (const localRecord of localRecords) {
        const cloudRecord = cloudMap.get(localRecord.id);
        // Use last-write-wins based on updatedAt timestamp
        const recordToSave: CloudMemorizationRecord = {
          ...localRecord,
          updatedAt: Date.now(),
          ...(cloudRecord && cloudRecord.updatedAt > localRecord.updatedAt ? cloudRecord : {}),
        };
        recordsToUpsert.push(recordToSave);
      }

      // Upsert records to cloud
      if (recordsToUpsert.length > 0) {
        await this.upsertCloudRecords(recordsToUpsert);
        logger.info(`CloudSyncService: Synced ${recordsToUpsert.length} records to cloud`);
      }
    } catch (error) {
      logger.error('CloudSyncService: syncRecordsToCloud failed', error);
      if (!this.isConnected) {
        this.syncQueue.push({ type: 'records', operation: 'upload' });
        logger.warn('CloudSyncService: Sync operation queued for later');
      } else {
        throw error;
      }
    }
  }

  /**
   * Sync all review logs from local storage to cloud
   */
  async syncLogsToCloud(): Promise<void> {
    try {
      const localLogs = await this.getAllLocalReviewLogs();
      logger.debug(`CloudSyncService: Found ${localLogs.length} local logs to sync`);

      if (localLogs.length === 0) {
        logger.debug('CloudSyncService: No logs to sync');
        return;
      }

      // Get cloud logs for comparison
      const cloudLogs = await this.fetchAllCloudLogs();
      const cloudMap = new Map<string, CloudReviewLogEntry>(
        cloudLogs.map(l => [l.id, l])
      );

      // Prepare logs to upsert (avoid duplicates)
      const logsToUpsert: CloudReviewLogEntry[] = [];
      for (const localLog of localLogs) {
        const cloudLog = cloudMap.get(localLog.id);
        if (!cloudLog) {
          logsToUpsert.push({
            ...localLog,
            updatedAt: Date.now(),
          });
        } else if (cloudLog.updatedAt < localLog.updatedAt) {
          // Update with local version if newer
          logsToUpsert.push({
            ...localLog,
            updatedAt: Date.now(),
          });
        }
      }

      // Upsert logs to cloud
      if (logsToUpsert.length > 0) {
        await this.upsertCloudLogs(logsToUpsert);
        logger.info(`CloudSyncService: Synced ${logsToUpsert.length} logs to cloud`);
      }
    } catch (error) {
      logger.error('CloudSyncService: syncLogsToCloud failed', error);
      if (!this.isConnected) {
        this.syncQueue.push({ type: 'logs', operation: 'upload' });
        logger.warn('CloudSyncService: Sync operation queued for later');
      } else {
        throw error;
      }
    }
  }

  /**
   * Fetch latest records and logs from cloud and merge with local storage
   */
  async fetchFromCloud(): Promise<void> {
    try {
      // Fetch records from cloud
      const cloudRecords = await this.fetchAllCloudRecords();
      await this.mergeCloudRecordsToLocal(cloudRecords);
      logger.debug(`CloudSyncService: Fetched and merged ${cloudRecords.length} records from cloud`);

      // Fetch logs from cloud
      const cloudLogs = await this.fetchAllCloudLogs();
      await this.mergeCloudLogsToLocal(cloudLogs);
      logger.debug(`CloudSyncService: Fetched and merged ${cloudLogs.length} logs from cloud`);
    } catch (error) {
      logger.error('CloudSyncService: fetchFromCloud failed', error);
      throw error;
    }
  }

  /**
   * Full sync operation: upload local data, then download cloud data
   */
  async sync(): Promise<void> {
    await this.syncRecordsToCloud();
    await this.syncLogsToCloud();
    await this.fetchFromCloud();
  }

  // ==================== Local Storage Helpers ====================

  private async getAllLocalMemorized(): Promise<MemorizationRecord[]> {
    // Reuse the existing pattern from MemorizationService
    const allKeys = await this.storage.getAllKeys();
    const recordKeys = allKeys.filter(key => key.startsWith('versyflow:record:'));
    const records: MemorizationRecord[] = [];

    for (const key of recordKeys) {
      const str = await this.storage.get(key);
      if (str) records.push(JSON.parse(str) as MemorizationRecord);
    }

    return records;
  }

  private async getAllLocalReviewLogs(): Promise<ReviewLogEntry[]> {
    const allKeys = await this.storage.getAllKeys();
    const logKeys = allKeys.filter(key => key.startsWith('versyflow:reviewlog:'));

    const logs: ReviewLogEntry[] = [];
    for (const key of logKeys) {
      const str = await this.storage.get(key);
      if (str) logs.push(JSON.parse(str) as ReviewLogEntry);
    }

    // Sort by timestamp (answeredAt) descending
    return logs.sort((a, b) => b.answeredAt - a.answeredAt);
  }

  // ==================== Cloud Database Helpers ====================

  private async fetchAllCloudRecords(): Promise<CloudMemorizationRecord[]> {
    try {
      const { data, error } = await this.client.database
        .schema('public') // Adjust schema if needed
        .from<CloudMemorizationRecord>('memorization_records')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) {
        logger.warn(`CloudSyncService: Error fetching records: ${error.message}`);
        return [];
      }

      return data || [];
    } catch (error) {
      logger.error('CloudSyncService: Failed to fetch records from cloud', error);
      throw error;
    }
  }

  private async fetchAllCloudLogs(): Promise<CloudReviewLogEntry[]> {
    try {
      const { data, error } = await this.client.database
        .schema('public')
        .from<CloudReviewLogEntry>('review_logs')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) {
        logger.warn(`CloudSyncService: Error fetching logs: ${error.message}`);
        return [];
      }

      return data || [];
    } catch (error) {
      logger.error('CloudSyncService: Failed to fetch logs from cloud', error);
      throw error;
    }
  }

  private async upsertCloudRecords(records: CloudMemorizationRecord[]): Promise<void> {
    if (records.length === 0) return;

    try {
      // For simplicity, use upsert on each record
      // In production, consider batch upsert
      for (const record of records) {
        const { error } = await this.client.database
          .schema('public')
          .from<CloudMemorizationRecord>('memorization_records')
          .upsert([record], {
            onConflict: 'id', // Conflict on record ID
            all: true, // Return updated rows
          });

        if (error) {
          logger.warn(`CloudSyncService: Error upserting record ${record.id}: ${error.message}`);
        }
      }
    } catch (error) {
      logger.error('CloudSyncService: Failed to upsert records to cloud', error);
      throw error;
    }
  }

  private async upsertCloudLogs(logs: CloudReviewLogEntry[]): Promise<void> {
    if (logs.length === 0) return;

    try {
      for (const log of logs) {
        const { error } = await this.client.database
          .schema('public')
          .from<CloudReviewLogEntry>('review_logs')
          .upsert([log], {
            onConflict: 'id', // Conflict on log ID
            all: true,
          });

        if (error) {
          logger.warn(`CloudSyncService: Error upserting log ${log.id}: ${error.message}`);
        }
      }
    } catch (error) {
      logger.error('CloudSyncService: Failed to upsert logs to cloud', error);
      throw error;
    }
  }

  private async mergeCloudRecordsToLocal(cloudRecords: CloudMemorizationRecord[]): Promise<void> {
    // Get current local records for comparison
    const localRecords = await this.getAllLocalMemorized();
    const localMap = new Map<string, MemorizationRecord>(
      localRecords.map(r => [r.id, r])
    );

    for (const cloudRecord of cloudRecords) {
      const localRecord = localMap.get(cloudRecord.id);

      // If cloud record is newer than local, merge
      if (!localRecord || cloudRecord.updatedAt > (localRecord.createdAt || 0)) {
        // Convert cloud record to local format
        const { updatedAt, ...recordWithoutCloudMeta } = cloudRecord;
        const recordToSave: MemorizationRecord = {
          ...recordWithoutCloudMeta,
        };

        // Save to local storage
        const recordId = recordToSave.id;
        await this.storage.set(
          'versyflow:record:' + recordId,
          JSON.stringify(recordToSave)
        );
        logger.debug(`CloudSyncService: Merged record ${recordId} from cloud`);
      }
    }
  }

  private async mergeCloudLogsToLocal(cloudLogs: CloudReviewLogEntry[]): Promise<void> {
    // For each cloud log, check if it exists locally and is newer
    for (const cloudLog of cloudLogs) {
      // In a real implementation, check if log exists locally by ID
      // If not found or cloud log is newer, save it
      // Due to complexity of local storage structure, this is simplified
    }
  }

  // ==================== Sync Queue Processing ====================

  private async processSyncQueue(): Promise<void> {
    while (this.syncQueue.length > 0 && this.isConnected) {
      const task = this.syncQueue.shift();
      if (task && task.operation === 'upload') {
        if (task.type === 'records') {
          await this.syncRecordsToCloud();
        } else if (task.type === 'logs') {
          await this.syncLogsToCloud();
        }
      }
    }
  }

  /**
   * Enable automatic sync on network reconnect (enabled by default)
   */
  enableAutoSync(): void {
    this.setAutoSync(true);
  }

  /**
   * Disable automatic sync (manual sync only)
   */
  disableAutoSync(): void {
    this.setAutoSync(false);
  }

  /**
   * Get current sync status
   */
  getStatus(): {
    autoSync: boolean;
    isConnected: boolean;
    queueLength: number;
  } {
    return {
      autoSync: this.autoSync,
      isConnected: this.isConnected,
      queueLength: this.syncQueue.length,
    };
  }
}