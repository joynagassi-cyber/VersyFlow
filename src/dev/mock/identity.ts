/**
 * Mock identity — who the frontend thinks it is in mock mode.
 *
 * The app's "frictionless identification" flow (email + display name, no
 * password, no network) already exists in `SupabaseAuthService.identifyLocal`
 * and persists under `versyflow:local-identity`. Mock mode reuses that exact
 * key so the login / signup screens and the auth gate keep working
 * unchanged, then derives a *stable* account id from the email:
 *
 *   - every manual test session gets a deterministic `user_id`
 *     (`usr_<hash>`), so records keep matching across reloads,
 *   - no credentials, tokens, or network calls are involved.
 */

import { mockDb } from './db';

const LOCAL_IDENTITY_KEY = 'versyflow:local-identity';

export interface MockIdentity {
  /** Stable, email-derived account id (also stored as the DB owner key). */
  id: string;
  email: string;
  displayName: string;
}

/** Identity used when nobody filled the login form yet (Demo mode). */
export const DEMO_IDENTITY: MockIdentity = {
  id: 'usr_demo0000000000000000000000000',
  email: 'ami@versyflow.test',
  displayName: 'Ami de la Parole',
};

/** Stable 32-hex-char id derived from a seed string (FNV-1a, doubled). */
export function stableId(prefix: string, seed: string): string {
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193;
  for (let i = 0; i < seed.length; i += 1) {
    const code = seed.charCodeAt(i);
    h1 ^= code;
    h1 = Math.imul(h1, 0x01000193) >>> 0;
    h2 = (Math.imul(h2 ^ code, 0x85ebca6b) + i) >>> 0;
  }
  const a = h1.toString(16).padStart(8, '0');
  const b = h2.toString(16).padStart(8, '0');
  const c = (h1 ^ h2).toString(16).padStart(8, '0');
  const d = Math.imul(h1, h2).toString(16).padStart(8, '0').slice(-8);
  return `${prefix}${a}${b}${c}${d}`.slice(0, prefix.length + 32);
}

export interface StoredLocalIdentity {
  email: string;
  display_name: string;
  identifiedAt: number;
}

/** Read the same key `SupabaseAuthService.identifyLocal` writes. */
export function readLocalIdentity(): StoredLocalIdentity | null {
  try {
    if (typeof localStorage === 'undefined') return null;
    const raw = localStorage.getItem(LOCAL_IDENTITY_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return null;
    const candidate = parsed as Partial<StoredLocalIdentity>;
    if (typeof candidate.email !== 'string') return null;
    if (typeof candidate.display_name !== 'string') return null;
    return {
      email: candidate.email,
      display_name: candidate.display_name,
      identifiedAt: candidate.identifiedAt ?? Date.now(),
    };
  } catch {
    return null;
  }
}

export function saveLocalIdentity(email: string, displayName: string): void {
  try {
    localStorage.setItem(
      LOCAL_IDENTITY_KEY,
      JSON.stringify({
        email: email.trim(),
        display_name: displayName.trim(),
        identifiedAt: Date.now(),
      }),
    );
  } catch {
    /* ignore */
  }
}

export function clearLocalIdentity(): void {
  try {
    localStorage.removeItem(LOCAL_IDENTITY_KEY);
  } catch {
    /* ignore */
  }
}

/**
 * The identity the mock backend uses for ownership. Falls back to the demo
 * identity so a fresh browser can explore the app with seeded data before
 * filling the login form.
 */
export function getMockIdentity(): MockIdentity {
  const stored = readLocalIdentity();
  if (!stored) return DEMO_IDENTITY;
  const email = stored.email.trim().toLowerCase() || DEMO_IDENTITY.email;
  return {
    id: stableId('usr_', email),
    email: stored.email,
    displayName: stored.display_name || DEMO_IDENTITY.displayName,
  };
}

/**
 * The user id every mock repository stamps on its rows.
 *
 * The store's `activeUserId` wins when set (the seeder and the mock auth
 * service both write it), so a test session seeded for an explicit user
 * stays coherent. Falls back to the identity derived from the login form.
 */
export function getMockUserId(): string {
  const active = mockDb.activeUserId;
  if (active) return active;
  return getMockIdentity().id;
}
