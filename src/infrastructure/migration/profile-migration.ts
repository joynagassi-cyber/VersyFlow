/**
 * Profile Migration — Migrate legacy data to profile-scoped storage
 *
 * Handles the transition from flat storage keys (no profile) to
 * profile-namespaced keys. Creates a default profile for existing users.
 */

import { LearnerProfile } from '@/domains/learner-profile';
import { MmkvStorage } from '@/infrastructure/storage';

export interface MigrationResult {
  /** Number of records migrated */
  recordsMigrated: number;
  /** Number of review logs migrated */
  logsMigrated: number;
  /** Default profile ID created */
  defaultProfileId: string | null;
  /** Whether migration was needed */
  wasMigrationNeeded: boolean;
}

/**
 * Check if migration is needed by looking for legacy keys
 */
export async function needsMigration(storage: MmkvStorage): Promise<boolean> {
  const keys = await storage.getAllKeys();
  // Check for legacy record keys (without profile prefix)
  const hasLegacyRecords = keys.some((key) => key.startsWith('versyflow:record:'));
  const hasLegacyLogs = keys.some((key) => key.startsWith('versyflow:reviewlog:'));
  const hasNoProfiles = !keys.some((key) => key.startsWith('versyflow:profile:'));
  return hasLegacyRecords || hasLegacyLogs ? hasNoProfiles : false;
}

/**
 * Create a default profile for an existing user
 */
export async function createDefaultProfile(
  storage: MmkvStorage,
  accountId: string,
  displayName?: string,
): Promise<LearnerProfile> {
  const now = Date.now();
  const profile: Omit<LearnerProfile, 'id'> = {
    accountId,
    displayName: displayName || 'Default',
    createdAt: now,
    updatedAt: now,
    status: 'active',
  };

  // Store the default profile
  const profileId = `default-${accountId}`;
  const profileKey = `versyflow:profile:${profileId}`;
  await storage.set(profileKey, JSON.stringify({ ...profile, id: profileId }));

  // Mark migration as done
  await storage.set('versyflow:migration:done', 'true');
  await storage.set('versyflow:migration:profileId', profileId);

  return { ...profile, id: profileId };
}

/**
 * Migrate a single record from legacy key to profile-scoped key
 */
export async function migrateRecord(
  storage: MmkvStorage,
  profileId: string,
  recordKey: string,
): Promise<boolean> {
  const value = await storage.get(recordKey);
  if (!value) return false;

  const profileKey = MmkvStorage.prefixedKey(profileId, recordKey.replace('versyflow:record:', ''));
  await storage.set(profileKey, value);

  // Update record to include profileId
  try {
    const record = JSON.parse(value);
    record.learnerProfileId = profileId;
    await storage.set(profileKey, JSON.stringify(record));
  } catch {
    // Parse error, keep original
  }

  return true;
}

/**
 * Migrate a single review log from legacy key to profile-scoped key
 */
export async function migrateReviewLog(
  storage: MmkvStorage,
  profileId: string,
  logKey: string,
): Promise<boolean> {
  const value = await storage.get(logKey);
  if (!value) return false;

  const profileKey = MmkvStorage.prefixedKey(profileId, logKey.replace('versyflow:reviewlog:', ''));
  await storage.set(profileKey, value);

  // Also migrate the array key
  const arrayKey = logKey.replace('reviewlog:', 'reviewlogs:');
  const profileArrayKey = MmkvStorage.prefixedKey(profileId, arrayKey.replace('versyflow:', ''));
  const arrayValue = await storage.get(arrayKey);
  if (arrayValue) {
    await storage.set(profileArrayKey, arrayValue);
  }

  return true;
}

/**
 * Full migration: scan legacy keys, create default profile, re-index all data
 */
export async function runProfileMigration(
  storage: MmkvStorage,
  accountId: string,
  displayName?: string,
): Promise<MigrationResult> {
  const keys = await storage.getAllKeys();

  // Check if already migrated
  const migrationDone = await storage.get('versyflow:migration:done');
  if (migrationDone === 'true') {
    const profileId = (await storage.get('versyflow:migration:profileId')) || null;
    return {
      recordsMigrated: 0,
      logsMigrated: 0,
      defaultProfileId: profileId,
      wasMigrationNeeded: false,
    };
  }

  // Create default profile
  const profile = await createDefaultProfile(storage, accountId, displayName);
  const profileId = profile.id;

  // Migrate records
  let recordsMigrated = 0;
  for (const key of keys) {
    if (key.startsWith('versyflow:record:')) {
      const migrated = await migrateRecord(storage, profileId, key);
      if (migrated) recordsMigrated++;
    }
  }

  // Migrate review logs
  let logsMigrated = 0;
  for (const key of keys) {
    if (key.startsWith('versyflow:reviewlog:')) {
      const migrated = await migrateReviewLog(storage, profileId, key);
      if (migrated) logsMigrated++;
    }
  }

  return {
    recordsMigrated,
    logsMigrated,
    defaultProfileId: profileId,
    wasMigrationNeeded: true,
  };
}
