/**
 * PowerSyncSyncService — `ISyncService` implementation backed by PowerSync.
 *
 * This is the single sync implementation for the app (single-sync invariant).
 * It wires the shared PowerSync database (`powersync-database.ts`) to the
 * Supabase PowerSync connector and exposes the app-level `ISyncService`
 * surface consumed by `CloudMemorizationService`.
 *
 * Model:
 *   - All business writes are made to the LOCAL PowerSync SQLite database
 *     (via repositories). PowerSync uploads the local CRUD queue to Supabase
 *     asynchronously through `SupabasePowerSyncConnector.uploadData`.
 *   - `connect()` opens the local DB and opens the sync stream. The stream
 *     keeps data flowing in both directions; there is no second custom sync.
 *   - When `autoSync` is disabled (or the user logs out) the stream is closed
 *     but the local database remains available for reads (offline-first).
 *
 * The legacy `syncRecordsToCloud` / `syncLogsToCloud` split no longer exists
 * — PowerSync uses one unified CRUD queue. Both are retained on the interface
 * for `CloudMemorizationService` compatibility and resolve to "ensure the
 * stream is active so pending writes get uploaded".
 */

import type { ISyncService, SyncStatus } from '@/sync/ISyncService';
import type { SupabaseAuthService } from '@/auth';
import {
  getPowerSyncDatabase,
  closePowerSyncDatabase,
  peekPowerSyncDatabase,
} from '@/infrastructure/sync/powersync-database';
import { SupabasePowerSyncConnector } from '@/infrastructure/sync/supabase-power-sync-connector';

export class PowerSyncSyncService implements ISyncService {
  private readonly authService: SupabaseAuthService;
  private readonly powersyncUrl: string;
  private readonly connector: SupabasePowerSyncConnector;

  /** Backing field for the {@link autoSyncEnabled} getter (renamed to avoid
   *  a duplicate-member collision with the getter of the same name). */
  private autoSync = false;
  /** Last measured upload-queue depth; updated on each sync/flush. */
  private lastPendingOperations = 0;
  /** Last successful sync timestamp (epoch ms); null if none yet. */
  private lastSyncAt: number | null = null;

  constructor(authService: SupabaseAuthService, powersyncUrl: string) {
    this.authService = authService;
    this.powersyncUrl = powersyncUrl;
    this.connector = new SupabasePowerSyncConnector(authService, powersyncUrl);
  }

  // ------------------------------------------------------------------
  // ISyncService
  // ------------------------------------------------------------------

  get connected(): boolean {
    return peekPowerSyncDatabase()?.connected ?? false;
  }

  get autoSyncEnabled(): boolean {
    return this.autoSync;
  }

  /**
   * Force a full sync cycle: ensure the database is initialized and the sync
   * stream is active so that pending local writes are uploaded.
   */
  async sync(): Promise<void> {
    await this.ensureStream();
    await this.refreshQueueDepth();
  }

  /**
   * Ensure pending memorization writes are uploaded. With PowerSync this is a
   * single queue shared by all tables, so this only guarantees the stream is
   * active; the SDK performs the actual upload.
   */
  async syncRecordsToCloud(): Promise<void> {
    await this.ensureStream();
    await this.refreshQueueDepth();
  }

  /**
   * Ensure pending review-log writes are uploaded. Same unified queue as
   * {@link syncRecordsToCloud}.
   */
  async syncLogsToCloud(): Promise<void> {
    await this.ensureStream();
    await this.refreshQueueDepth();
  }

  /**
   * Enable or disable the automatic sync stream.
   *
   * - `true`: open the stream if it is not already open.
   * - `false`: close the stream; the local database stays available for
   *   offline reads and queued writes are retained for the next connection.
   *
   * Note: the underlying connection lifecycle is fire-and-forget here
   * (the interface signature is synchronous), so callers that need the
   * result should follow up with {@link sync}.
   */
  setAutoSync(enabled: boolean): void {
    this.autoSync = enabled;
    const db = peekPowerSyncDatabase();
    if (!db) {
      // Nothing opened yet — the flag will take effect on the next sync.
      return;
    }
    if (enabled && !db.connected) {
      void this.ensureStream();
    } else if (!enabled && db.connected) {
      void db.disconnect();
    }
  }

  getStatus(): SyncStatus {
    const db = peekPowerSyncDatabase();
    let lastSyncAt = this.lastSyncAt;
    if (db) {
      const sdkLast = db.currentStatus.lastSyncedAt;
      if (sdkLast && sdkLast.getTime() > (lastSyncAt ?? 0)) {
        lastSyncAt = sdkLast.getTime();
      }
    }
    return {
      connected: db?.connected ?? false,
      autoSyncEnabled: this.autoSyncEnabled,
      lastSyncAt,
      pendingOperations: this.lastPendingOperations,
    };
  }

  // ------------------------------------------------------------------
  // Lifecycle (not part of ISyncService, used by auth/logout flows)
  // ------------------------------------------------------------------

  /**
   * Close the sync stream and dispose the local database. Call on logout to
   * avoid leaking another user's data. The next {@link sync} call creates a
   * fresh database.
   */
  async dispose(): Promise<void> {
    await closePowerSyncDatabase();
    this.lastPendingOperations = 0;
    this.lastSyncAt = null;
  }

  // ------------------------------------------------------------------
  // Internals
  // ------------------------------------------------------------------

  private async ensureStream(): Promise<void> {
    const db = getPowerSyncDatabase();
    await db.init();
    if (!db.connected && !db.connecting) {
      await db.connect(this.connector, {
        appMetadata: { app: 'versyflow' },
      });
    }
    // Refresh the SDK-reported last-sync timestamp so `getStatus` stays live.
    const sdkLast = db.currentStatus.lastSyncedAt;
    if (sdkLast && sdkLast.getTime() > (this.lastSyncAt ?? 0)) {
      this.lastSyncAt = sdkLast.getTime();
    }
  }

  private async refreshQueueDepth(): Promise<void> {
    const db = peekPowerSyncDatabase();
    if (!db) {
      this.lastPendingOperations = 0;
      return;
    }
    const stats = await db.getUploadQueueStats();
    this.lastPendingOperations = stats.count;
  }
}
