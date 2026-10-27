/**
 * ISyncService — Interface générique pour le service de synchronisation cloud
 * Découple le service de synchronisation (`PowerSyncSyncService`) de ses
 * consommateurs — PowerSync est le seul chemin de write.
 */

export interface SyncStatus {
  connected: boolean;
  autoSyncEnabled: boolean;
  lastSyncAt: number | null;
  pendingOperations: number;
}

export interface ISyncService {
  /** Force a full sync */
  sync(): Promise<void>;

  /** Sync memorization records to cloud */
  syncRecordsToCloud(): Promise<void>;

  /** Sync review logs to cloud */
  syncLogsToCloud(): Promise<void>;

  /** Enable/disable auto-sync */
  setAutoSync(enabled: boolean): void;

  /** Get current sync status */
  getStatus(): SyncStatus;

  /** Whether currently connected to cloud */
  readonly connected: boolean;

  /** Whether auto-sync is enabled */
  readonly autoSyncEnabled: boolean;
}
