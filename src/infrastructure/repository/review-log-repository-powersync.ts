/**
 * ReviewLogRepositoryPowerSync — PowerSync/SQLite repository for `review_logs`.
 *
 * Append-only fact table. Writes use the {@link reviewLogToRow} mapper to
 * produce the flat SQLite row and are inserted inside a
 * `writeTransaction`. `insertOnly: true` in the PowerSync schema means the
 * client can never `UPDATE`/`DELETE` existing rows, which matches the
 * domain invariant (a review log entry is immutable once written).
 */

import type { CommonPowerSyncDatabase } from '@powersync/common';
import { getPowerSyncDatabase } from '../sync/powersync-database';
import {
  reviewLogToRow,
  reviewLogRowToEntry,
  type ReviewLogRow,
} from '../sync/memorization-mapper';
import type { ISyncUserIdProvider } from '../sync/sync-user-id-provider';
import type { ReviewLogEntry } from '@/domains/memorization/entities';

export interface IReviewLogRepository {
  /** Insert a review log entry. Idempotent on `id`. */
  append(userId: string, entry: ReviewLogEntry): Promise<void>;
  /** All entries for a given memorization record, most recent first. */
  listByRecord(recordId: string): Promise<ReviewLogEntry[]>;
  /** All entries for a user, most recent first. */
  listByUser(userId: string): Promise<ReviewLogEntry[]>;
}

export class ReviewLogRepositoryPowerSync implements IReviewLogRepository {
  constructor(
    private readonly userIdProvider: ISyncUserIdProvider,
    private readonly dbFactory: () => CommonPowerSyncDatabase = getPowerSyncDatabase,
  ) {}

  async append(userId: string, entry: ReviewLogEntry): Promise<void> {
    const row = reviewLogToRow(userId, entry);
    const db = this.dbFactory();
    // PowerSync v2.x: `review_logs` is a read-only view over
    // `ps_data__review_logs`. A plain `INSERT` (with the random `id`) is
    // intercepted by the SDK and enqueued in `ps_crud`. Idempotency on
    // duplicate `id` is a no-op at the SDK level — a re-INSERT of the same
    // `id` simply overwrites the JSON blob in `ps_data__`.
    await db.writeTransaction(async (tx) => {
      await tx.execute(
        `INSERT INTO review_logs (
          id, user_id, memorization_record_id, answered_at, rating,
          actual_interval, predicted_interval,
          stability_before, stability_after,
          difficulty_before, difficulty_after,
          elapsed_days, repetitions, word_performance, created_at
        )
        VALUES (
          ?, ?, ?, ?, ?,
          ?, ?,
          ?, ?,
          ?, ?,
          ?, ?, ?, ?
        )`,
        [
          row.id,
          row.user_id,
          row.memorization_record_id,
          row.answered_at,
          row.rating,
          row.actual_interval,
          row.predicted_interval,
          row.stability_before,
          row.stability_after,
          row.difficulty_before,
          row.difficulty_after,
          row.elapsed_days,
          row.repetitions,
          row.word_performance,
          row.created_at,
        ],
      );
    });
  }

  async listByRecord(recordId: string): Promise<ReviewLogEntry[]> {
    const db = this.dbFactory();
    const rows = await db.getAll<ReviewLogRow>(
      `SELECT *
       FROM review_logs
       WHERE memorization_record_id = ?
       ORDER BY answered_at DESC`,
      [recordId],
    );
    return rows.map(reviewLogRowToEntry);
  }

  async listByUser(userId: string): Promise<ReviewLogEntry[]> {
    const db = this.dbFactory();
    const rows = await db.getAll<ReviewLogRow>(
      'SELECT * FROM review_logs WHERE user_id = ? ORDER BY answered_at DESC',
      [userId],
    );
    return rows.map(reviewLogRowToEntry);
  }

  async requireUserId(): Promise<string> {
    const id = await this.userIdProvider.resolveUserId();
    if (!id) {
      throw new Error(
        '[ReviewLogRepositoryPowerSync] append called without an authenticated user',
      );
    }
    return id;
  }
}
