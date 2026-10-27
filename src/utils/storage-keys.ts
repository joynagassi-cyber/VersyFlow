/**
 * Storage Utility — Default MMKV storage key prefix
 */

export const STORAGE_KEYS = {
  SETTINGS: 'versyflow:settings',
  BIBLE_TRANSLATIONS: 'versyflow:bible:',
  MEMORIZED: (recordId: string) => `versyflow:user:memorized:${recordId}`,
  REVIEW_LOG: (logId: string) => `versyflow:user:review:${logId}`,
  NEXT_REVIEW_CACHE: 'versyflow:cache:nextReviewAt',
  APP_VERSION: 'versyflow:app:version',
  ONBOARDING_COMPLETED: 'versyflow:app:onboarding_completed',
  WASM_AVAILABLE: 'versyflow:app:wasm_available',
} as const;
