/**
 * StreakRepositoryPowerSync — PowerSync/SQLite adapter for `streaks`.
 *
 * `streaks` is registered as `createInsertOnly` in `powersync-schema.ts`, so
 * the client never UPDATEs/DELETEs rows it does not own. A plain INSERT with
 * a deterministic `id` (user + day) is intercepted by the SDK into
 * `ps_data__streaks` + `ps_crud` and upserted on the server — idempotent per
 * (user, day), matching the `UNIQUE (user_id, streak_date)` constraint.
 */

import type { CommonPowerSyncDatabase } from '@powersync/common';
import { getPowerSyncDatabase } from '@/infrastructure/sync/powersync-database';
import { recordUuid } from '@/infrastructure/sync/memorization-mapper';
import type { ISyncUserIdProvider } from '@/infrastructure/sync/sync-user-id-provider';
import type { IStreakRepository, StreakRecord } from '@/domains/streaks/repository';

interface StreakRow {
  id: string;
  user_id: string;
  streak_date: string;
  verses_memorized: number;
  reviews_completed: number;
  session_duration_minutes: number;
  created_at: string;
}

export class StreakRepositoryPowerSync implements IStreakRepository {
  constructor(
    private readonly userIdProvider: ISyncUserIdProvider,
    private readonly dbFactory: () => CommonPowerSyncDatabase = getPowerSyncDatabase,
  ) {}

  async insert(record: Omit<StreakRecord, 'id' | 'createdAt'>): Promise<void> {
    const db = this.dbFactory();
    const nowIso = new Date().toISOString();
    try {
      await db.writeTransaction(async (tx) => {
        await tx.execute(
          `INSERT INTO streaks (
            id, user_id, streak_date, verses_memorized, reviews_completed,
            session_duration_minutes, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            this.streakRecordId(record.userId, record.streakDate),
            record.userId,
            record.streakDate,
            record.versesMemorized,
            record.reviewsCompleted,
            record.sessionDurationMinutes,
            nowIso,
          ],
        );
      });
    } catch {
      // Write failed (offline / DB not ready) — the SDK queues it in
      // ps_crud and retries on reconnect. Swallow here: streak facts are
      // non-critical and must never block the caller.
    }
  }

  async getForDate(userId: string, streakDate: string): Promise<StreakRecord | null> {
    const db = this.dbFactory();
    const rows = await db.getAll<StreakRow>(
      'SELECT * FROM streaks WHERE user_id = ? AND streak_date = ?',
      [userId, streakDate],
    );
    if (rows.length === 0) return null;
    const row = rows[0];
    return {
      id: row.id,
      userId: row.user_id,
      streakDate: row.streak_date,
      versesMemorized: row.verses_memorized,
      reviewsCompleted: row.reviews_completed,
      sessionDurationMinutes: row.session_duration_minutes,
      createdAt: row.created_at,
    };
  }

  /**
   * Deterministic id per (user, day): re-inserting the same fact is a
   * no-op on the server upsert path.
   */
  private streakRecordId(userId: string, streakDate: string): string {
    // Reuse the recordUuid helper (deterministic 128-bit hash → UUIDv5).
    // streakDate encodes into bookId, so the tuple is unique per day.
    return recordUuid(userId, {
      bookId: `streak:${streakDate}`,
      chapterNumber: 0,
      verseNumber: 0,
      endVerse: undefined,
      translationId: 'streak',
    });
  }
}
