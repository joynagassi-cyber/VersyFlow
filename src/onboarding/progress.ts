/** Versioned, account-scoped route checkpoints; never stores credentials. */
const KEY = 'versyflow:onboarding:progress:v1:';
const routes = new Set([
  '/onboarding/language-select', '/onboarding/translation-select',
  '/onboarding/journey/intro', '/onboarding/journey/bible', '/onboarding/journey/memorize',
  '/onboarding/journey/review', '/onboarding/journey/progress', '/onboarding/journey/family',
  '/onboarding/journey/share', '/onboarding/journey/colors', '/onboarding/journey/profile',
  '/onboarding/session-config', '/onboarding/reminder-config',
]);
export function saveOnboardingProgress(accountId: string, path: string): void {
  if (!accountId || !routes.has(path)) return;
  localStorage.setItem(KEY + accountId, JSON.stringify({ version: 1, accountId, path }));
}
export function readOnboardingProgress(accountId: string | null | undefined): string {
  if (!accountId) return '/onboarding/language-select';
  try {
    const value: unknown = JSON.parse(localStorage.getItem(KEY + accountId) || 'null');
    if (value && typeof value === 'object' && 'version' in value && value.version === 1 && 'accountId' in value && value.accountId === accountId && 'path' in value && typeof value.path === 'string' && routes.has(value.path)) return value.path;
  } catch { /* A damaged checkpoint must not prevent login. */ }
  return '/onboarding/language-select';
}
export function clearOnboardingProgress(accountId: string): void { localStorage.removeItem(KEY + accountId); }
const READY = 'versyflow:onboarding:ready:v1:';
export function markOnboardingReady(accountId: string, profileId: string): void {
  localStorage.setItem(READY + accountId, JSON.stringify({ accountId, profileId }));
}
export function isOnboardingReady(accountId: string | undefined, profileId: string | undefined): boolean {
  if (!accountId || !profileId) return false;
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(READY + accountId) || 'null');
    return !!saved && typeof saved === 'object' && 'accountId' in saved && saved.accountId === accountId && 'profileId' in saved && saved.profileId === profileId;
  } catch { return false; }
}
export function clearOnboardingReady(accountId: string): void { localStorage.removeItem(READY + accountId); }
