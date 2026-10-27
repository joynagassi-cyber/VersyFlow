/**
 * SupabasePowerSyncConnector — PowerSync backend connector for Supabase.
 *
 * Implements `PowerSyncBackendConnector` (from `@powersync/web`):
 *   - `fetchCredentials()` returns the PowerSync endpoint + the *current user's*
 *     Supabase JWT. PowerSync Cloud is configured to verify Supabase access
 *     tokens, so no custom backend is required.
 *   - `uploadData()` replays the local CRUD queue into Postgres through
 *     `@supabase/supabase-js` using the user's JWT, so RLS stays authoritative.
 *
 * Security rules (non-negotiables):
 *   - NEVER use the service-role key in the client.
 *   - Uploads go through the user-scoped client → RLS is enforced server-side.
 *   - Row writes made locally MUST set ownership columns (e.g. `user_id`) to
 *     the authenticated user before committing, otherwise the corresponding
 *     RLS `INSERT`/`WITH CHECK` policy rejects the upload.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type {
  CommonPowerSyncDatabase,
  PowerSyncBackendConnector,
} from '@powersync/common';
import type { CrudEntry } from '@powersync/common';
import { UpdateType } from '@powersync/common';

import { SupabaseAuthService } from '@/auth';

const DEFAULT_BATCH_SIZE = 50;

export interface PowerSyncSyncError {
  table: string;
  op: UpdateType;
  id: string;
  cause: unknown;
}

/**
 * PowerSync connector bound to a Supabase project.
 *
 * @param auth       - The app's Supabase auth service (provides the user session).
 * @param powersyncUrl - The PowerSync Cloud endpoint (`VITE_POWERSYNC_URL`).
 */
export class SupabasePowerSyncConnector implements PowerSyncBackendConnector {
  private readonly supabase: SupabaseClient;
  private readonly powersyncUrl: string;

  constructor(auth: SupabaseAuthService, powersyncUrl: string) {
    const url = import.meta.env.VITE_SUPABASE_URL || import.meta.env.SUPABASE_URL;
    const anonKey =
      import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.SUPABASE_ANON_KEY;

    if (!url || !anonKey) {
      throw new Error('[PowerSync] Supabase credentials not configured');
    }
    if (!powersyncUrl) {
      throw new Error('[PowerSync] PowerSync endpoint (VITE_POWERSYNC_URL) not configured');
    }

    // Data-API client created with the anon (publishable) key. The user JWT is
    // bound per-operation via setSession so RLS applies. Never the service key.
    this.supabase = createClient(url, anonKey);
    this.powersyncUrl = powersyncUrl;
  }

  /**
   * Return the PowerSync endpoint + the current user's Supabase JWT.
   * Returns `null` when the user is not signed in (PowerSync then stays idle).
   * Throws on a transient error so PowerSync retries later.
   */
  async fetchCredentials(): Promise<{ endpoint: string; token: string } | null> {
    // supabase-js v2 returns `{ data: { session }, error }` — destructure `data`.
    const { data, error } = await this.supabase.auth.getSession();
    if (error) {
      // Transient error reading the local session — let PowerSync retry.
      throw new Error(`[PowerSync] Could not read Supabase session: ${error.message}`);
    }
    if (!data?.session) {
      return null;
    }
    return { endpoint: this.powersyncUrl, token: data.session.access_token };
  }

  /**
   * Replay the local CRUD queue into Postgres. Each batch is uploaded with the
   * user's JWT so RLS enforces ownership; a failed batch is left in the queue
   * and retried after the configured wait period.
   */
  async uploadData(database: CommonPowerSyncDatabase): Promise<void> {
    // Bind the user session so PostgREST requests are signed with the user JWT.
    const { data, error } = await this.supabase.auth.getSession();
    const session = data?.session;
    if (error || !session) {
      throw new Error('[PowerSync] No active Supabase session for upload');
    }
    await this.supabase.auth.setSession({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
    });

    for (;;) {
      const batch = await database.getCrudBatch(DEFAULT_BATCH_SIZE);
      if (!batch) {
        break;
      }
      await this.uploadBatch(batch.crud);
      // Only mark the batch complete once every entry has been accepted; a
      // thrown error leaves the queue intact for the next retry.
      await batch.complete();
    }
  }

  /**
   * Upload a single batch, grouped by table. PUT/PATCH → upsert, DELETE → delete.
   * All entries in a batch are applied; the caller retries the whole batch if
   * any supabase call rejects (RLS / network), which is idempotent because the
   * upserts key on the stable `id`.
   */
  private async uploadBatch(entries: CrudEntry[]): Promise<void> {
    const byTable = new Map<string, CrudEntry[]>();
    for (const entry of entries) {
      const bucket = byTable.get(entry.table);
      if (bucket) {
        bucket.push(entry);
      } else {
        byTable.set(entry.table, [entry]);
      }
    }

    for (const [table, tableEntries] of byTable) {
      const upserts: Record<string, unknown>[] = [];
      const deletes: string[] = [];

      for (const entry of tableEntries) {
        switch (entry.op) {
          case UpdateType.PUT:
          case UpdateType.PATCH:
            // `id` is always present on a CrudEntry; merging it guarantees the
            // upsert has a conflict target even for partial PATCH data.
            upserts.push({ ...entry.opData, id: entry.id });
            break;
          case UpdateType.DELETE:
            deletes.push(entry.id);
            break;
        }
      }

      if (upserts.length > 0) {
        const { error } = await this.supabase
          .from(table)
          .upsert(upserts, { onConflict: 'id' });
        if (error) {
          throw new Error(
            `[PowerSync] upsert into ${table} failed: ${error.message}`,
          );
        }
      }

      if (deletes.length > 0) {
        const { error } = await this.supabase
          .from(table)
          .delete()
          .in('id', deletes);
        if (error) {
          throw new Error(
            `[PowerSync] delete from ${table} failed: ${error.message}`,
          );
        }
      }
    }
  }
}
