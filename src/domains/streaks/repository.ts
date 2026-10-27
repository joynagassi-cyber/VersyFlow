/**
 * Streak Domain — Repository Port (P2-4)
 *
 * Append-only daily streak fact: one row per (user, day). Write-only from
 * the client (insertOnly in the PowerSync schema); reads go through the
 * local SQLite replica.
 */

export interface StreakRecord {
  id: string;
  userId: string;
  streakDate: string; // 'YYYY-MM-DD'
  versesMemorized: number;
  reviewsCompleted: number;
  sessionDurationMinutes: number;
  createdAt: string; // ISO-8601
}

export interface IStreakRepository {
  /**
   * Insert a daily streak fact. Idempotent: the client generates a
   * deterministic id so re-inserting the same day is a no-op on sync.
   */
  insert(record: Omit<StreakRecord, 'id' | 'createdAt'>): Promise<void>;

  /**
   * Read today's fact (0 rows → null). The UI uses this to know whether a
   * streak day has already been recorded.
   */
  getForDate(userId: string, streakDate: string): Promise<StreakRecord | null>;
}
