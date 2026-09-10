/**
 * ISyncService — Interface générique pour le service de synchronisation cloud
 * Permet de découpler CloudMemorizationService de l'implémentation concrète
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
