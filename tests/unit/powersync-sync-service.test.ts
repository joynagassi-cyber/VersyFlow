/**
 * PowerSyncSyncService — unit tests
 *
 * Verifies the app-level sync service:
 *  - getStatus shape
 *  - setAutoSync toggles the flag and calls disconnect when appropriate
 *  - dispose releases the shared database
 *
 * The PowerSync database + connector are mocked so no native SQLite / network
 * is required.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// --- Mocks (module level; vi.mock is hoisted) ------------------------------

const mockDb: any = {
  connected: false,
  connecting: false,
  currentStatus: { lastSyncedAt: undefined },
  init: vi.fn().mockResolvedValue(undefined),
  connect: vi.fn().mockResolvedValue(undefined),
  disconnect: vi.fn().mockResolvedValue(undefined),
  getUploadQueueStats: vi.fn().mockResolvedValue({ count: 0 }),
  close: vi.fn().mockResolvedValue(undefined),
};

const mockPeek = vi.fn();
const mockClose = vi.fn();

vi.mock('@/infrastructure/sync/powersync-database', () => ({
  getPowerSyncDatabase: () => mockDb,
  closePowerSyncDatabase: (...args: unknown[]) => mockClose(...args),
  peekPowerSyncDatabase: (...args: unknown[]) => mockPeek(...args),
}));

vi.mock('@/infrastructure/sync/supabase-power-sync-connector', () => ({
  SupabasePowerSyncConnector: vi.fn().mockImplementation(() => ({})),
}));

vi.mock('@/auth', () => ({
  SupabaseAuthService: vi.fn(),
}));

// --- SUT -------------------------------------------------------------------

import { PowerSyncSyncService } from '@/sync/PowerSyncSyncService';
import { SupabaseAuthService } from '@/auth';

describe('PowerSyncSyncService', () => {
  let service: PowerSyncSyncService;

  beforeEach(() => {
    vi.clearAllMocks();
    mockDb.connected = false;
    mockDb.connecting = false;
    mockDb.currentStatus = { lastSyncedAt: undefined };
    mockDb.init.mockResolvedValue(undefined);
    mockDb.connect.mockResolvedValue(undefined);
    mockDb.disconnect.mockResolvedValue(undefined);
    mockDb.getUploadQueueStats.mockResolvedValue({ count: 0 });
    mockPeek.mockReset().mockReturnValue(mockDb);
    mockClose.mockReset();

    service = new PowerSyncSyncService(
      new (SupabaseAuthService as any)(),
      'https://example.powersync.com',
    );
  });

  it('returns a well-formed status by default', () => {
    const status = service.getStatus();
    expect(status.connected).toBe(false);
    expect(status.autoSyncEnabled).toBe(false);
    expect(status.lastSyncAt).toBeNull();
    expect(status.pendingOperations).toBe(0);
  });

  it('exposes the connected getter from the shared DB', () => {
    mockDb.connected = true;
    expect(service.connected).toBe(true);
    mockDb.connected = false;
    expect(service.connected).toBe(false);
  });

  it('setAutoSync(true) opens the stream; setAutoSync(false) closes it', async () => {
    // No stream yet: enabling should trigger connect() (fire-and-forget, so flush)
    service.setAutoSync(true);
    expect(service.autoSyncEnabled).toBe(true);
    await new Promise((r) => setTimeout(r, 0));
    expect(mockDb.connect).toHaveBeenCalled();

    // Simulate that the stream is now open
    mockDb.connected = true;
    service.setAutoSync(false);
    expect(service.autoSyncEnabled).toBe(false);
    await new Promise((r) => setTimeout(r, 0));
    expect(mockDb.disconnect).toHaveBeenCalled();
  });

  it('does not crash when no DB has been opened yet', () => {
    mockPeek.mockReturnValue(null);
    const fresh = new PowerSyncSyncService(
      new (SupabaseAuthService as any)(),
      'https://example.powersync.com',
    );
    fresh.setAutoSync(true); // should not throw
    expect(fresh.autoSyncEnabled).toBe(true);
    expect(fresh.connected).toBe(false);
  });

  it('dispose closes the shared database and resets counters', async () => {
    await service.dispose();
    expect(mockClose).toHaveBeenCalled();
    const status = service.getStatus();
    expect(status.pendingOperations).toBe(0);
    expect(status.lastSyncAt).toBeNull();
  });

  it('sync() initializes the DB and refreshes the upload queue depth', async () => {
    mockDb.getUploadQueueStats.mockResolvedValue({ count: 3 });
    await service.sync();
    expect(mockDb.init).toHaveBeenCalled();
    expect(service.getStatus().pendingOperations).toBe(3);
  });

  it('syncRecordsToCloud / syncLogsToCloud delegate to the unified stream', async () => {
    await service.syncRecordsToCloud();
    await service.syncLogsToCloud();
    // Both go through ensureStream -> db.init
    expect(mockDb.init).toHaveBeenCalledTimes(2);
  });
});
