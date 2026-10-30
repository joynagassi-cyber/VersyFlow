/**
 * MockAuthService — offline identity provider for mock mode.
 *
 * Drop-in replacement for `SupabaseAuthService` (same public surface, see
 * `IAuthService` in `@/auth/types`). It never touches the network:
 *
 *   - `signIn` / `signUp` / `identifyLocal` simply persist the email + name
 *     under the same `versyflow:local-identity` key the real service uses,
 *   - `getCurrentUser` always returns a user derived from that identity
 *     (or the demo identity), with a stable `usr_…` id,
 *   - profile reads/writes go to the mock DB (`users` collection).
 *
 * The password argument is intentionally ignored — manual testers should be
 * able to log in with anything.
 */

import type {
  AuthError as AuthErrorType,
  AuthSessionLike,
  AuthUserLike,
  IAuthService,
  UserProfile,
} from '@/auth/types';
import { AuthError } from '@/auth/types';
import { mockDb } from './db';
import {
  DEMO_IDENTITY,
  clearLocalIdentity,
  getMockIdentity,
  readLocalIdentity,
  saveLocalIdentity,
} from './identity';
import { reassignMockOwner, seedMockDatabase } from './seed';
import { recordTestEvent } from '../local-backend';

interface MockUserRow {
  id: string;
  email: string;
  display_name: string;
  default_translation: string;
  ui_language: string;
  created_at: string;
}

function toAuthUser(row: MockUserRow): AuthUserLike & { display_name: string } {
  return {
    id: row.id,
    email: row.email,
    display_name: row.display_name,
  };
}

function ensureUserRow(): MockUserRow {
  const identity = getMockIdentity();
  const rows = mockDb.list<MockUserRow>('users');
  const existing = rows.find((row) => row.id === identity.id);
  if (existing) return existing;

  const row: MockUserRow = {
    id: identity.id,
    email: identity.email,
    display_name: identity.displayName,
    default_translation: 'lsg',
    ui_language: 'fr',
    created_at: new Date().toISOString(),
  };
  mockDb.put('users', row);
  return row;
}

export class MockAuthService implements IAuthService {
  /** Always "configured": the mock backend needs no credentials. */
  readonly isConfigured = true;

  private async identity(): Promise<MockUserRow> {
    const row = ensureUserRow();
    this.adoptDataFor(row.id);
    mockDb.setActiveUserId(row.id);
    // A brand-new tester should land on seeded content, not an empty app.
    if (!seedMockDatabase({ userId: row.id }).seeded) {
      /* already seeded for this user (or the store has data) */
    }
    return row;
  }

  /**
   * Move the existing mock rows to the account that just identified itself,
   * so exploring the demo data before logging in does not empty the app.
   */
  private adoptDataFor(nextUserId: string): void {
    const previous = mockDb.activeUserId;
    if (!previous || previous === nextUserId) return;
    const hasOwnRecords = mockDb
      .list<{ userId?: string }>('memorization_records')
      .some((row) => row.userId === nextUserId);
    if (hasOwnRecords) return;
    const moved = reassignMockOwner(previous, nextUserId);
    if (moved > 0) {
      recordTestEvent('mock.reown', { from: previous, to: nextUserId, rows: moved });
    }
  }

  async signUp(
    email: string,
    _password: string,
  ): Promise<{ user: AuthUserLike | null; error: AuthErrorType | null }> {
    const name = email.split('@')[0] || 'Nouveau profil';
    saveLocalIdentity(email, name);
    const row = await this.identity();
    recordTestEvent('auth.signup', { email, userId: row.id });
    return { user: toAuthUser(row), error: null };
  }

  async signIn(
    email: string,
    _password: string,
  ): Promise<{ user: AuthUserLike | null; error: AuthErrorType | null }> {
    const stored = readLocalIdentity();
    const displayName = stored?.display_name || email.split('@')[0] || 'Ami';
    saveLocalIdentity(email, displayName);
    const row = await this.identity();
    recordTestEvent('auth.login', { email, userId: row.id, mode: 'mock' });
    return { user: toAuthUser(row), error: null };
  }

  async signOut(): Promise<{ error: AuthErrorType | null }> {
    recordTestEvent('auth.logout', {});
    clearLocalIdentity();
    mockDb.setActiveUserId(DEMO_IDENTITY.id);
    return { error: null };
  }

  async getCurrentUser(): Promise<AuthUserLike | null> {
    try {
      const row = await this.identity();
      return toAuthUser(row);
    } catch (error) {
      console.warn('[mock-auth] getCurrentUser failed', error);
      return null;
    }
  }

  async getSession(): Promise<{
    session: AuthSessionLike | null;
    error: AuthErrorType | null;
  }> {
    const user = await this.getCurrentUser();
    if (!user) return { session: null, error: null };
    return {
      session: { access_token: 'mock-access-token', user },
      error: null,
    };
  }

  async refreshSession(): Promise<{
    user: AuthUserLike | null;
    error: AuthErrorType | null;
  }> {
    return { user: await this.getCurrentUser(), error: null };
  }

  async identifyLocal(
    email: string,
    displayName: string,
  ): Promise<{ error: AuthErrorType | null }> {
    try {
      saveLocalIdentity(email, displayName);
      const row = await this.identity();
      recordTestEvent('auth.identify', {
        email: row.email,
        displayName: row.display_name,
        userId: row.id,
      });
      return { error: null };
    } catch (error) {
      return {
        error: new AuthError(
          error instanceof Error ? error.message : 'Failed to save identity',
        ),
      };
    }
  }

  getLocalIdentity(): { email: string; display_name: string; identifiedAt: number } | null {
    return readLocalIdentity();
  }

  clearLocalIdentity(): void {
    clearLocalIdentity();
  }

  async getUserProfile(userId: string): Promise<UserProfile | null> {
    const row = mockDb
      .list<MockUserRow>('users')
      .find((u) => u.id === (userId || getMockIdentity().id));
    if (!row) return null;
    return {
      userId: row.id,
      email: row.email,
      display_name: row.display_name,
      default_translation: row.default_translation,
      ui_language: row.ui_language,
    };
  }

  async updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<void> {
    const rows = mockDb.list<MockUserRow>('users');
    const row = rows.find((u) => u.id === userId);
    if (!row) return;
    mockDb.patch<MockUserRow>('users', row.id, {
      display_name: updates.display_name ?? row.display_name,
      default_translation: updates.default_translation ?? row.default_translation,
      ui_language: updates.ui_language ?? row.ui_language,
    });
    recordTestEvent('auth.profile.updated', { userId, fields: Object.keys(updates) });
  }
}
