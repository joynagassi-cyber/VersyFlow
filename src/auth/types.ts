/**
 * Auth layer — shared types and the `IAuthService` port.
 *
 * The app has two interchangeable implementations:
 *
 *   - `SupabaseAuthService` — real accounts through Supabase Auth (live mode)
 *   - `MockAuthService`     — frictionless local identity (mock mode)
 *
 * Consumers (`useAuthStore`, the PowerSync user-id provider, settings screens)
 * depend on `IAuthService` and receive whichever is active from
 * `getAuthService()` — so the frontend never hard-codes the cloud provider.
 */

export interface UserProfile {
  userId: string;
  email?: string;
  display_name?: string;
  default_translation?: string;
  avatar_url?: string;
  ui_language?: string;
}

export interface AuthSession {
  user: {
    id: string;
    email: string;
    display_name?: string;
  };
  token: string;
}

/**
 * Minimal user shape consumed by the app. Both Supabase's `User` and the
 * mock user satisfy it structurally.
 */
export interface AuthUserLike {
  id: string;
  email?: string | null;
}

/** Minimal session shape (an access token is all the sync layer needs). */
export interface AuthSessionLike {
  access_token?: string;
  user?: AuthUserLike | null;
}

export interface LocalIdentity {
  email: string;
  display_name: string;
  identifiedAt: number;
}

export class AuthError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'AuthError';
  }
}

/**
 * The auth port. Every method is safe to call when no backend is configured
 * (they resolve to a clean `AuthError` instead of throwing).
 */
export interface IAuthService {
  /** `false` when the implementation has no credentials (live mode only). */
  readonly isConfigured: boolean;

  signUp(
    email: string,
    password: string,
  ): Promise<{ user: AuthUserLike | null; error: AuthError | null }>;

  signIn(
    email: string,
    password: string,
  ): Promise<{ user: AuthUserLike | null; error: AuthError | null }>;

  signOut(): Promise<{ error: AuthError | null }>;

  getCurrentUser(): Promise<AuthUserLike | null>;

  getSession(): Promise<{
    session: AuthSessionLike | null;
    error: AuthError | null;
  }>;

  refreshSession(): Promise<{
    user: AuthUserLike | null;
    error: AuthError | null;
  }>;

  /** Save a local identity (email + display name) without any network call. */
  identifyLocal(
    email: string,
    displayName: string,
  ): Promise<{ error: AuthError | null }>;

  getLocalIdentity(): LocalIdentity | null;

  clearLocalIdentity(): void;

  getUserProfile(userId: string): Promise<UserProfile | null>;

  updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<void>;
}
