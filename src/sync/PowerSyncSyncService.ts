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
import type { SyncStreamSubscription } from '@powersync/common';
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
  /** Live on-demand stream subscriptions, keyed by stream name. */
  private streams = new Map<string, SyncStreamSubscription>();

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

  /**
   * Whether this instance has a configured PowerSync endpoint. An empty URL
   * means the service can neither open a stream nor upload — callers (e.g.
   * `sync-store`) use this to report an honest `isConfigured` flag instead of
   * treating "no endpoint" as "configured but offline".
   */
  isConfigured(): boolean {
    return this.powersyncUrl.length > 0;
  }

  /**
   * Active connectivity check. `true` only when the underlying database
   * reports it is connected to PowerSync Cloud; `false` when not connected,
   * still connecting, or the database has not been opened yet. Used by
   * `sync()`/reads to distinguish "offline read from the local DB" from
   * "the cloud link is down".
   */
  isLive(): boolean {
    return peekPowerSyncDatabase()?.connected ?? false;
  }

  /**
   * Best-effort health probe: ensure the DB is initialized and the stream is
   * connected, then report whether the connection is up. Swallows the
   * internal error so callers get a boolean instead of an exception.
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.ensureStream();
      return peekPowerSyncDatabase()?.connected ?? false;
    } catch (error) {
      console.warn('[PowerSyncSyncService] testConnection failed:', error);
      return false;
    }
  }

  // ------------------------------------------------------------------
  // On-demand sync streams (O-1)
  // ------------------------------------------------------------------

  /**
   * Names of the sync streams that must be started on connect. In PowerSync
   * "on-demand" streams only flow while the app is actively using them.
   *
   * Each stream is registered with `db.syncStream(name, params).subscribe()`
   * — the returned `SyncStreamSubscription` yields rows as the Supabase
   * table changes. The SDK reuses the stream if it is already started.
   */
  async startStream(name: string, params: Record<string, unknown> = {}): Promise<void> {
    await this.ensureStream();
    const db = peekPowerSyncDatabase();
    if (!db) return;
    // `syncStream(...).subscribe()` is async and resolves to the live
    // subscription. Await it so callers know the stream is really open.
    const subscription = await db.syncStream(name, params as Record<string, any>).subscribe();
    this.streams.set(name, subscription);
  }

  /**
   * Stop an on-demand stream. Rows already received stay in the local
   * database; the stream simply stops updating them.
   */
  stopStream(name: string): void {
    const sub = this.streams.get(name);
    if (!sub) return;
    sub.unsubscribe();
    this.streams.delete(name);
  }

  /**
   * Open the streams for the current user. The user id is required so the
   * stream can be scoped to that user's data only (RLS + on-demand pattern).
   */
  async startUserStreams(userId: string): Promise<void> {
    await this.startStream('memorization_records', { userId });
    await this.startStream('review_logs', { userId });
    await this.startStream('learner_profiles', { userId });
    await this.startStream('families', { userId });
    await this.startStream('family_invitations', { userId });
    await this.startStream('family_memberships', { userId });
    await this.startStream('settings', { userId });
    await this.startStream('user_achievements', { userId });
    await this.startStream('streaks', { userId });
    await this.startStream('collections', { userId });
    await this.startStream('word_performance', { userId });
    await this.startStream('users', { userId });
  }

  /** Stop all on-demand streams (call on logout / dispose). */
  stopAllStreams(): void {
    for (const sub of this.streams.values()) {
      sub.unsubscribe();
    }
    this.streams.clear();
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
    this.stopAllStreams();
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
