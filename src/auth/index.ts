/**
 * Auth composition root.
 *
 * `getAuthService()` returns the implementation matching the current data
 * mode:
 *
 *   - mock : `MockAuthService` (local identity, no network, no credentials)
 *   - live : `SupabaseAuthService` (real Supabase Auth)
 *
 * Screens and stores should call `getAuthService()`; `getSupabaseAuthService`
 * is kept as a backwards-compatible alias (same active implementation).
 */

import { isMockMode } from '@/dev/mode';
import { MockAuthService } from '@/dev/mock/auth';
import { SupabaseAuthService } from './SupabaseAuthService';
import type { IAuthService } from './types';

export { SupabaseAuthService } from './SupabaseAuthService';
export type { UserProfile, AuthSession } from './SupabaseAuthService';
export { AuthError } from './SupabaseAuthService';
export type {
  IAuthService,
  AuthUserLike,
  AuthSessionLike,
  LocalIdentity,
} from './types';

let _mockInstance: IAuthService | null = null;
let _liveInstance: IAuthService | null = null;

/**
 * The active auth implementation.
 *
 * Note: `SupabaseAuthService` is only *constructed* in live mode. Its
 * constructor is side-effect free (it logs a warning and disables itself
 * when `VITE_SUPABASE_*` is missing), so mock sessions never open a client.
 */
export function getAuthService(): IAuthService {
  if (isMockMode()) {
    if (!_mockInstance) _mockInstance = new MockAuthService();
    return _mockInstance;
  }
  if (!_liveInstance) _liveInstance = new SupabaseAuthService();
  return _liveInstance;
}

/** Backwards-compatible alias — returns the active implementation. */
export function getSupabaseAuthService(): IAuthService {
  return getAuthService();
}
