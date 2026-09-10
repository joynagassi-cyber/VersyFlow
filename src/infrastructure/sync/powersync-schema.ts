/**
 * powersync-schema — Local PowerSync schema (tables SYNCED)
 *
 * Mirrors the Supabase schema from `supabase/migrations/001` + `002`.
 * Only SYNCED-classified tables are registered. The Bible registry (migration
 * 004) is LOCAL_ONLY and is intentionally NOT part of this schema.
 *
 * `insertOnly` is set on append-only fact tables so the client never attempts
 * to update/delete rows it does not own.
 *
 * NOTE: `id` is declared on NO table — PowerSync adds an `id` column
 * automatically to every synced table (custom `id` columns are rejected by the
 * SDK: "An id column is automatically added"). The primary key is a UUID text
 * column by convention, matching Supabase. Primitives are imported from
 * `@powersync/common` (Node-safe) so this schema can also be reused by the
 * headless wire-check script (`scripts/powersync-wire-check.ts`).
 */

import { Schema, Table, column } from '@powersync/common';

/**
 * Build the PowerSync `Schema` covering every SYNCED table.
 */
export function buildPowerSyncSchema(): Schema {
  return new Schema({
    users: new Table({
      email: column.text,
      display_name: column.text,
      avatar_url: column.text,
      default_translation: column.text,
      ui_language: column.text,
      created_at: column.text,
      updated_at: column.text,
      last_login_at: column.text,
    }),

    learner_profiles: new Table({
      user_id: column.text,
      display_name: column.text,
      avatar_url: column.text,
      status: column.text,
      created_at: column.text,
      updated_at: column.text,
    }, { indexes: { by_user: ['user_id'], by_name: ['display_name'] } }),

    memorization_records: new Table({
      user_id: column.text,
      book_id: column.text,
      chapter_number: column.integer,
      verse_number: column.integer,
      end_verse: column.integer,
      translation_id: column.text,
      bible_verse_reference: column.text,
      bible_verse_text: column.text,
      status: column.text,
      fsrs_state: column.text,
      stability: column.real,
      difficulty: column.real,
      next_review_at: column.text,
      created_at: column.text,
      updated_at: column.text,
      last_reviewed_at: column.text,
      review_count: column.integer,
      total_review_minutes: column.real,
      favorite: column.integer,
      tags: column.text,
    }, {
      indexes: {
        by_user: ['user_id'],
        by_status: ['status'],
        by_next_review: ['next_review_at'],
      },
    }),

    review_logs: Table.createInsertOnly({
      user_id: column.text,
      memorization_record_id: column.text,
      answered_at: column.text,
      rating: column.text,
      actual_interval: column.integer,
      predicted_interval: column.integer,
      stability_before: column.real,
      stability_after: column.real,
      difficulty_before: column.real,
      difficulty_after: column.real,
      elapsed_days: column.integer,
      repetitions: column.integer,
      word_performance: column.text,
      created_at: column.text,
    }, {
      indexes: {
        by_user: ['user_id'],
        by_record: ['memorization_record_id'],
        by_answered: ['answered_at'],
      },
    }),

    word_performance: Table.createInsertOnly({
      memorization_record_id: column.text,
      word: column.text,
      error_count: column.integer,
      total_attempts: column.integer,
      last_reviewed_at: column.text,
      created_at: column.text,
    }, { indexes: { by_record: ['memorization_record_id'] } }),

    streaks: Table.createInsertOnly({
      user_id: column.text,
      streak_date: column.text,
      verses_memorized: column.integer,
      reviews_completed: column.integer,
      session_duration_minutes: column.integer,
      created_at: column.text,
    }, {
      indexes: {
        by_user: ['user_id'],
        by_date: ['streak_date'],
      },
    }),

    collections: new Table({
      user_id: column.text,
      name: column.text,
      description: column.text,
      color: column.text,
      icon: column.text,
      created_at: column.text,
      updated_at: column.text,
    }, { indexes: { by_user: ['user_id'] } }),

    collection_verses: Table.createInsertOnly({
      collection_id: column.text,
      memorization_record_id: column.text,
      added_at: column.text,
    }, {
      indexes: {
        by_collection: ['collection_id'],
        by_record: ['memorization_record_id'],
      },
    }),

    achievements: Table.createInsertOnly({
      key: column.text,
      title: column.text,
      description: column.text,
      icon: column.text,
      color: column.text,
      category: column.text,
      requirement: column.text,
      created_at: column.text,
    }, { indexes: { by_key: ['key'] } }),

    user_achievements: new Table({
      user_id: column.text,
      achievement_id: column.text,
      unlocked: column.integer,
      unlocked_at: column.text,
      progress: column.integer,
      created_at: column.text,
    }, {
      indexes: {
        by_user: ['user_id'],
        by_user_unlocked: ['user_id', 'unlocked'],
      },
    }),

    settings: new Table({
      user_id: column.text,
      theme: column.text,
      notification_enabled: column.integer,
      daily_reminder_time: column.text,
      created_at: column.text,
      updated_at: column.text,
    }, { indexes: { by_user: ['user_id'] } }),

    // -- migration 002 -------------------------------------------------------
    families: new Table({
      owner_id: column.text,
      name: column.text,
      color: column.text,
      icon: column.text,
      created_at: column.text,
      updated_at: column.text,
    }, { indexes: { by_owner: ['owner_id'] } }),

    family_memberships: new Table({
      family_id: column.text,
      user_id: column.text,
      role: column.text,
      status: column.text,
      invited_at: column.text,
      joined_at: column.text,
    }, {
      indexes: {
        by_family: ['family_id'],
        by_user: ['user_id'],
      },
    }),

    family_invitations: new Table({
      family_id: column.text,
      token: column.text,
      invited_by: column.text,
      invited_at: column.text,
      expires_at: column.text,
      status: column.text,
      accepted_by: column.text,
    }, {
      indexes: {
        by_token: ['token'],
        by_family: ['family_id'],
      },
    }),
  });
}
