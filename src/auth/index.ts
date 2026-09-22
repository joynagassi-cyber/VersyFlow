export { SupabaseAuthService } from './SupabaseAuthService';
export type { UserProfile, AuthSession } from './SupabaseAuthService';
export { AuthError } from './SupabaseAuthService';

import { SupabaseAuthService } from './SupabaseAuthService';

let _instance: SupabaseAuthService | null = null;

/** Shared auth service instance (safe across screens; throws if env missing). */
export function getSupabaseAuthService(): SupabaseAuthService {
  if (!_instance) _instance = new SupabaseAuthService();
  return _instance;
}
