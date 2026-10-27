/**
 * Telemetry Events — PowerSync/SQLite repository for `telemetry_events`.
 *
 * Implements the {@link ITelemetryUploadPort} contract on top of the shared
 * PowerSync database. Each event is INSERTed into the `ps_data__telemetry_events`
 * view with a client-generated deterministic UUID, so the write is idempotent
 * (re-INSERT of the same id is a no-op) and is enqueued in `ps_crud` for
 * server sync — the single sync write path, no ad-hoc network call.
 *
 * No PII or verse text may reach this adapter: callers are expected to
 * pass already-redacted events (see `src/domains/telemetry/entities.redact`).
 */

import type { CommonPowerSyncDatabase } from '@powersync/common';
import { getPowerSyncDatabase } from '../sync/powersync-database';
import { randomUUID } from '../sync/uuid';
import type { ISyncUserIdProvider } from '../sync/sync-user-id-provider';
import type { TelemetryEvent } from '@/domains/telemetry/entities';
import type { ITelemetryUploadPort } from './upload-adapter';

/**
 * PowerSync-backed telemetry upload port.
 *
 * Constructor injects:
 *   - `userIdProvider` — resolves the authenticated user id (null when offline / signed out).
 *   - `dbFactory` — factory returning the shared PowerSync DB (defaults to `getPowerSyncDatabase`).
 */
export class TelemetryEventsRepositoryPowerSync implements ITelemetryUploadPort {
  constructor(
    private readonly userIdProvider: ISyncUserIdProvider,
    private readonly dbFactory: () => CommonPowerSyncDatabase = getPowerSyncDatabase,
  ) {}

  async upload(events: TelemetryEvent[]): Promise<void> {
    if (events.length === 0) return;

    // A throwing resolver is treated as "no session" (e.g. auth store not
    // ready) — skip the write. Telemetry is best-effort and must never
    // crash the flush / memorization flow.
    let userId: string | null;
    try {
      userId = await this.userIdProvider.resolveUserId();
    } catch {
      userId = null;
    }
    if (!userId) {
      // No authenticated session — drop the batch. Telemetry is best-effort
      // and never blocks the critical path; offline events remain in the
      // local queue (see `TelemetryService`) until a session is available.
      return;
    }

    const db = this.dbFactory();

    await db.writeTransaction(async (tx) => {
      for (const event of events) {
        const id = randomUUID();
        const payloadJson = JSON.stringify(event.payload ?? {});
        await tx.execute(
          `INSERT INTO telemetry_events (
            id, user_id, event_type, payload, session_id, created_at
          ) VALUES (?, ?, ?, ?::jsonb, ?, ?)`,
          [
            id,
            userId,
            event.eventType,
            payloadJson,
            event.sessionId ?? null,
            new Date(event.timestamp).toISOString(),
          ],
        );
      }
    });
  }
}
