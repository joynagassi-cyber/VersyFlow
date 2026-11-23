/**
 * Auth composition root.
 *
 * VersyFlow is frontend-only: the only implementation is `MockAuthService`,
 * a frictionless local identity (email + display name, persisted on the
 * device, no network, no credentials).
 *
 * Screens and stores call `getAuthService()` and depend on `IAuthService`;
 * a future backend plugs in here and nowhere else.
 */

import { MockAuthService } from '@/dev/mock/auth';
import type { IAuthService } from './types';

export { AuthError } from './types';
export type {
  IAuthService,
  AuthUserLike,
  AuthSessionLike,
  LocalIdentity,
  UserProfile,
  AuthSession,
} from './types';

let _instance: IAuthService | null = null;

/** The active auth implementation — local identity, no cloud provider. */
export function getAuthService(): IAuthService {
  if (!_instance) _instance = new MockAuthService();
  return _instance;
}
