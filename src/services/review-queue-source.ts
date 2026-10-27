/**
 * ReviewQueueSource — port (interface) for the review queue data source.
 *
 * Decouples `ReviewQueueService` from any concrete storage: the service used
 * to depend on the MMKV-backed `MemorizationService` directly. Now it depends
 * on this minimal port, so a PowerSync-backed source can be injected
 * (single SYNCED write path, see P0-B lot) without the service knowing where
 * the records actually live.
 */

import type { MemorizationRecord } from '@/domains/memorization/entities';

export interface ReviewQueueSource {
  /** Records due for review, scoped to the given learner profile. */
  getDueRecords(profileId: string): Promise<MemorizationRecord[]>;
}
