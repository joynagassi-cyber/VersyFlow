/**
 * MemorizationRepositoryPowerSync — PowerSync/SQLite repository for `memorization_records`.
 *
 * Implements {@link IMemorizationRepository} on top of the shared PowerSync
 * database. Writes use the deterministic record UUID from
 * {@link recordUuid} so that a save is a stable upsert on
 * `(user_id, book_id, chapter_number, verse_number, translation_id)`,
 * and the Postgres composite constraint is satisfied.
 *
 * `IMemorizationRepository` is a pure domain port. This adapter performs
 * I/O via `getPowerSyncDatabase().writeTransaction(...)` and therefore lives
 * in infrastructure.
 *
 * ⚠️ PowerSync v2.x stores rows in `ps_data__*` as JSON blobs. The schema
 * table name (e.g. `memorization_records`) is a READ-ONLY view on top of
 * that. The SDK intercepts `INSERT` on the view (with an explicit `id`) and
 * rewrites it into `ps_data__*` while enqueuing the op in `ps_crud` —
 * that is the supported write path. A bare `INSERT ... ON CONFLICT` against
 * the view fails with `cannot UPSERT a view`, so writes here use a plain
 * `INSERT` + the deterministic `id`, and the upsert semantics are achieved by
 * the SDK's op-log (a later re-INSERT with the same `id` becomes an update).
 */

import type { CommonPowerSyncDatabase } from '@powersync/common';
import { getPowerSyncDatabase } from '../sync/powersync-database';
import {
  memorizationRecordToRow,
  memorizationRowToRecord,
  recordUuid,
  type MemorizationRecordRow,
} from '../sync/memorization-mapper';
import type { ISyncUserIdProvider } from '../sync/sync-user-id-provider';
import type {
  MemorizationRecord,
  MemorizationStatus,
} from '@/domains/memorization/entities';

export interface IMemorizationRepository {
  /**
   * Upsert the record for a user + verse + translation. The `id` field of
   * the record is ignored and recomputed deterministically — see {@link recordUuid}.
   *
   * The input type omits `id`, `learnerProfileId` (LOCAL_ONLY) and `updatedAt`
   * (server-owned timestamp) to match the caller's domain surface. The
   * implementation recomputes `id` from the tuple and the mapper fills the
   * remaining fields.
   */
  upsert(
    userId: string,
    record: Omit<MemorizationRecord, 'id' | 'learnerProfileId' | 'updatedAt'>,
  ): Promise<void>;
  /** Read a single record by deterministic id, or `null` when absent. */
  getById(userId: string, recordId: string): Promise<MemorizationRecord | null>;
  /** All records for a user. */
  listByUser(userId: string): Promise<MemorizationRecord[]>;
  /** Records with a due review. `mastered` is excluded. */
  listDueByUser(userId: string, beforeMs?: number): Promise<MemorizationRecord[]>;
  /** Records matching a status. */
  listByStatus(userId: string, status: MemorizationStatus): Promise<MemorizationRecord[]>;
  /** Delete a record by its deterministic id. */
  remove(userId: string, recordId: string): Promise<void>;
  /**
   * Compute the deterministic record id for a given tuple. Callers use it
   * to look up the row by id without loading the whole table.
   */
  computeId(
    userId: string,
    record: Pick<
      MemorizationRecord,
      'bookId' | 'chapterNumber' | 'verseNumber' | 'endVerse' | 'translationId'
    >,
  ): string;
}

/**
 * PowerSync-backed repository. Reads are issued on the local SQLite database
 * so that offline access is guaranteed. Writes go through a
 * `writeTransaction` and are picked up by the upload queue.
 */
export class MemorizationRepositoryPowerSync implements IMemorizationRepository {
  constructor(
    private readonly userIdProvider: ISyncUserIdProvider,
    private readonly dbFactory: () => CommonPowerSyncDatabase = getPowerSyncDatabase,
  ) {}

  // ------------------------------------------------------------------
  // Writes
  // ------------------------------------------------------------------

  async upsert(
    userId: string,
    record: Omit<MemorizationRecord, 'id' | 'learnerProfileId' | 'updatedAt'>,
  ): Promise<void> {
    // `learnerProfileId` is LOCAL_ONLY (domain invariant C-4) — the mapper
    // reconstructs it as an empty string; the `user_id` column carries the
    // ownership. `updatedAt` is server-owned and set by the mapper.
    const fullRecord = {
      ...record,
      id: '', // recomputed by the mapper from the deterministic tuple
      learnerProfileId: '',
    } as MemorizationRecord;
    const row = memorizationRecordToRow(userId, fullRecord);
    const db = this.dbFactory();
    // PowerSync v2.x: the schema table `memorization_records` is a read-only
    // view over `ps_data__memorization_records`. A plain `INSERT` (NOT an
    // `INSERT ... ON CONFLICT` upsert) with the explicit deterministic `id`
    // is intercepted by the SDK, rewritten into the `ps_data__` JSON store,
    // and enqueued in `ps_crud` — this is the documented write path.
    // Because `id` is deterministic, a second `upsert()` with the same tuple
    // simply re-enqueues an op with the same `id`, which the upload layer
    // resolves as an upsert on the server.
    await db.writeTransaction(async (tx) => {
      await tx.execute(
        `INSERT INTO memorization_records (
          id, user_id, book_id, chapter_number, verse_number, end_verse,
          translation_id, bible_verse_reference, bible_verse_text, status,
          fsrs_state, stability, difficulty, next_review_at,
          created_at, updated_at, last_reviewed_at, review_count,
          total_review_minutes, favorite, tags
        )
        VALUES (
          ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?,
          ?, ?, ?, ?,
          ?, ?, ?, ?,
          ?, ?, ?
        )`,
        [
          row.id,
          row.user_id,
          row.book_id,
          row.chapter_number,
          row.verse_number,
          row.end_verse,
          row.translation_id,
          row.bible_verse_reference,
          row.bible_verse_text,
          row.status,
          row.fsrs_state,
          row.stability,
          row.difficulty,
          row.next_review_at,
          row.created_at,
          row.updated_at,
          row.last_reviewed_at,
          row.review_count,
          row.total_review_minutes,
          row.favorite,
          row.tags,
        ],
      );
    });
  }

  async remove(userId: string, recordId: string): Promise<void> {
    const db = this.dbFactory();
    await db.writeTransaction(async (tx) => {
      await tx.execute(
        'DELETE FROM memorization_records WHERE id = ? AND user_id = ?',
        [recordId, userId],
      );
    });
  }

  // ------------------------------------------------------------------
  // Reads (offline-first, from local SQLite)
  // ------------------------------------------------------------------

  async getById(userId: string, recordId: string): Promise<MemorizationRecord | null> {
    const db = this.dbFactory();
    const rows = await db.getAll<MemorizationRecordRow>(
      'SELECT * FROM memorization_records WHERE id = ? AND user_id = ?',
      [recordId, userId],
    );
    if (rows.length === 0) return null;
    return memorizationRowToRecord(rows[0]);
  }

  async listByUser(userId: string): Promise<MemorizationRecord[]> {
    const db = this.dbFactory();
    const rows = await db.getAll<MemorizationRecordRow>(
      'SELECT * FROM memorization_records WHERE user_id = ? ORDER BY created_at DESC',
      [userId],
    );
    return rows.map(memorizationRowToRecord);
  }

  async listDueByUser(userId: string, beforeMs?: number): Promise<MemorizationRecord[]> {
    const cutoff = new Date(beforeMs ?? Date.now()).toISOString();
    const db = this.dbFactory();
    const rows = await db.getAll<MemorizationRecordRow>(
      `SELECT *
       FROM memorization_records
       WHERE user_id = ?
         AND status <> 'mastered'
         AND next_review_at IS NOT NULL
         AND next_review_at <= ?
       ORDER BY next_review_at ASC`,
      [userId, cutoff],
    );
    return rows.map(memorizationRowToRecord);
  }

  async listByStatus(userId: string, status: MemorizationStatus): Promise<MemorizationRecord[]> {
    const db = this.dbFactory();
    const rows = await db.getAll<MemorizationRecordRow>(
      'SELECT * FROM memorization_records WHERE user_id = ? AND status = ?',
      [userId, status],
    );
    return rows.map(memorizationRowToRecord);
  }

  // ------------------------------------------------------------------
  // Helpers
  // ------------------------------------------------------------------

  /**
   * Compute the deterministic record id for a given tuple. Callers use it
   * to look up the row by id without loading the whole table.
   */
  computeId(
    userId: string,
    record: Pick<
      MemorizationRecord,
      'bookId' | 'chapterNumber' | 'verseNumber' | 'endVerse' | 'translationId'
    >,
  ): string {
    return recordUuid(userId, record);
  }

  /**
   * Convenience for the composition root: resolve the current user id
   * (throws when no session, so writes fail fast in that state).
   */
  async requireUserId(): Promise<string> {
    const id = await this.userIdProvider.resolveUserId();
    if (!id) {
      throw new Error(
        '[MemorizationRepositoryPowerSync] upsert called without an authenticated user',
      );
    }
    return id;
  }
}
