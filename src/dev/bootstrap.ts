/**
 * Dev bootstrap — runs once at app boot (see `src/main.tsx`).
 *
 * In mock mode it:
 *   1. seeds the in-browser database if it is empty,
 *   2. prints a console banner so it is obvious which backend is active,
 *   3. sends an `app.boot` event to the local test collector.
 *
 * In live mode it does nothing at all.
 */

import {
  DATA_MODE_STORAGE_KEY,
  describeDataMode,
  getDataMode,
  isMockMode,
} from './mode';
import { ensureMockSeed } from './mock/seed';
import { mockDb } from './mock/db';
import { getMockIdentity } from './mock/identity';
import { localBackend, recordTestEvent } from './local-backend';

let booted = false;

export interface MockBootInfo {
  userId: string;
  profileId: string;
  records: number;
  reviewLogs: number;
  seeded: boolean;
}

let bootInfo: MockBootInfo | null = null;

/** Seed + announce the mock backend. Idempotent, never throws. */
export function bootstrapDevBackend(): MockBootInfo | null {
  if (!isMockMode()) return null;
  if (booted) return bootInfo;
  booted = true;

  try {
    const seed = ensureMockSeed();
    const identity = getMockIdentity();
    bootInfo = {
      userId: seed.userId,
      profileId: seed.profileId,
      records: seed.records,
      reviewLogs: seed.reviewLogs,
      seeded: seed.seeded,
    };

    // eslint-disable-next-line no-console
    console.info(
      '%c VersyFlow — mode MOCK ',
      'background:#D81B97;color:#fff;font-weight:700;border-radius:4px',
      `\n${describeDataMode()}`,
      `\nIdentité : ${identity.displayName} <${identity.email}> · ${identity.id}`,
      `\nDonnées : ${seed.records} versets, ${seed.reviewLogs} révisions`,
      `\nAPI de test : ${localBackend.getStats().baseUrl} · tableau de bord : ${localBackend.dashboardUrl()}`,
      `\nPanneau dev : /dev`,
    );

    startSnapshotHeartbeat();

    recordTestEvent('app.boot', {
      mode: getDataMode(),
      override: safeRead(DATA_MODE_STORAGE_KEY),
      seeded: seed.seeded,
      counts: mockDb.counts(),
      url: typeof window !== 'undefined' ? window.location.href : null,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
    });
  } catch (error) {
    console.warn('[dev] bootstrap mock impossible', error);
  }

  return bootInfo;
}

/**
 * Keep the collector's "instantané" view fresh: push the mock database
 * whenever it changed, at most once a minute (plus once shortly after boot).
 * Uses `updatedAt` as a cheap change token.
 */
function startSnapshotHeartbeat(): void {
  let lastPushedVersion = 0;
  const push = async () => {
    const snapshot = mockDb.snapshot();
    if (snapshot.updatedAt === lastPushedVersion) return;
    lastPushedVersion = snapshot.updatedAt;
    await localBackend.pushSnapshot(snapshot);
  };
  // First push shortly after boot so the dashboard has content immediately.
  setTimeout(() => void push(), 3_000);
  setInterval(() => void push(), 60_000);
  if (typeof window !== 'undefined') {
    window.addEventListener('pagehide', () => void push());
  }
}

function safeRead(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

/** Exposed for the Dev panel. */
export function getMockBootInfo(): MockBootInfo | null {
  return bootInfo;
}
