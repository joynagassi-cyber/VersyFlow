/**
 * Integration — the app's composition roots in MOCK mode.
 *
 * The point of the frontend-only mode is that nothing above the composition
 * roots changes: screens keep calling `getMemorizationService()`, hooks keep
 * calling `getFamilyRepository()`, and the data just comes from the browser
 * store. This test proves that contract end-to-end:
 *
 *   memorization-service-factory → repositories → mock adapters → MockDb
 *
 * and that the PowerSync singleton refuses to start in mock mode.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/dev/local-backend', () => ({
  localBackend: {
    record: vi.fn(),
    getStats: () => ({ baseUrl: '/api', queued: 0, sent: 0, failed: 0 }),
    dashboardUrl: () => '/mock-dashboard/',
    pushSnapshot: vi.fn().mockResolvedValue(true),
    flush: vi.fn().mockResolvedValue({ sent: 0 }),
    checkHealth: vi.fn().mockResolvedValue('online'),
    recentEvents: vi.fn().mockResolvedValue([]),
    subscribe: () => () => {},
  },
  recordTestEvent: vi.fn(),
}));

describe('mock mode composition', () => {
  beforeEach(async () => {
    localStorage.clear();
    localStorage.setItem('versyflow:data-mode', 'mock');
    const { mockDb } = await import('@/dev/mock/db');
    mockDb.reset();
  });

  it('serves due records through the memorization service factory', async () => {
    const { seedMockDatabase } = await import('@/dev/mock/seed');
    seedMockDatabase({ force: true });

    const { getMemorizationService } = await import(
      '@/services/memorization-service-factory'
    );
    const service = getMemorizationService('default');

    const due = await service.getDueRecords();
    expect(due.length).toBeGreaterThan(0);
    expect(due.every((record) => record.status !== 'mastered')).toBe(true);

    const all = await service.getAllMemorized();
    expect(all.length).toBeGreaterThanOrEqual(due.length);
  });

  it('exposes the seeded profiles and family through the repository root', async () => {
    const { seedMockDatabase } = await import('@/dev/mock/seed');
    seedMockDatabase({ force: true });

    const repos = await import('@/infrastructure/repository/powersync-repositories');
    const userId = await repos.getSyncUserIdProvider().resolveUserId();
    expect(userId).toBeTruthy();

    const profiles = await repos.getLearnerProfileRepository().findByAccountId(userId!);
    expect(profiles.length).toBeGreaterThan(0);

    const families = await repos.getFamilyRepository().findByOwnerId(userId!);
    expect(families.length).toBeGreaterThan(0);
  });

  it('refuses to open a PowerSync database in mock mode', async () => {
    const { getPowerSyncDatabase, peekPowerSyncDatabase } = await import(
      '@/infrastructure/sync/powersync-database'
    );
    expect(peekPowerSyncDatabase()).toBeNull();
    expect(() => getPowerSyncDatabase()).toThrow(/mode MOCK/);
  });

  it('uses the mock auth service (no network, stable id)', async () => {
    const { getAuthService } = await import('@/auth');
    const auth = getAuthService();
    expect(auth.isConfigured).toBe(true);

    const { error } = await auth.identifyLocal('testeur@versyflow.test', 'Testeur');
    expect(error).toBeNull();
    const user = await auth.getCurrentUser();
    expect(user?.id).toMatch(/^usr_/);

    const second = await auth.getCurrentUser();
    expect(second?.id).toBe(user?.id);
  });
});
