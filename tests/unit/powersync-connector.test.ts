/**
 * SupabasePowerSyncConnector — unit tests
 *
 * Verifies the PowerSync connector against a mocked Supabase client:
 *  - fetchCredentials returns { endpoint, token } for a signed-in session
 *  - fetchCredentials returns null when there is no session
 *  - uploadData replays the local CRUD queue (PUT/PATCH upsert, DELETE delete)
 *  - uploadData propagates Supabase errors so PowerSync retries
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const mockSupabase: any = {
  auth: {
    getSession: vi.fn(),
    setSession: vi.fn(),
  },
};

// Captures the per-table builder so tests can assert exact upsert/delete args.
const builders: Record<string, any> = {};
const mockFrom = vi.fn();

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => mockSupabase),
}));

function resetFromMock({
  upsert = vi.fn().mockResolvedValue({ data: null, error: null }),
  deleteIn = vi.fn().mockResolvedValue({ data: null, error: null }),
} = {}) {
  builders.upsert = upsert;
  builders.deleteIn = deleteIn;
  Object.keys(builders).forEach((k) => {
    if (k !== 'upsert' && k !== 'deleteIn') delete builders[k];
  });
  mockFrom.mockImplementation((table: string) => ({
    upsert: (...a: unknown[]) => builders.upsert(...a),
    delete: () => ({
      in: (...a: unknown[]) => builders.deleteIn(...a),
    }),
  }));
}

// --- SUT -------------------------------------------------------------------

import { SupabasePowerSyncConnector } from '@/infrastructure/sync/supabase-power-sync-connector';
import { UpdateType } from '@powersync/common';
import type { SupabaseAuthService } from '@/auth';

// Stub import.meta.env before the SUT reads it
const origMetaEnv = (import.meta as any).env;
const POWERSYNC_URL = 'https://example.powersync.com';
const SUPABASE_URL = 'https://example.supabase.co';
const SUPABASE_KEY = 'anon-key';

describe('SupabasePowerSyncConnector', () => {
  let connector: SupabasePowerSyncConnector;

  beforeEach(() => {
    vi.clearAllMocks();
    resetFromMock();
    (import.meta as any).env = {
      ...origMetaEnv,
      VITE_SUPABASE_URL: SUPABASE_URL,
      VITE_SUPABASE_ANON_KEY: SUPABASE_KEY,
    };
    mockSupabase.from = mockFrom;
    mockSupabase.auth.getSession.mockResolvedValue({
      session: { access_token: 'jwt', refresh_token: 'refresh' },
      error: null,
    });
    mockSupabase.auth.setSession.mockResolvedValue({ data: null, error: null });

    connector = new SupabasePowerSyncConnector(
      {} as SupabaseAuthService,
      POWERSYNC_URL,
    );
  });

  afterEach(() => {
    (import.meta as any).env = origMetaEnv;
  });

  it('constructs and throws when the PowerSync URL is missing', () => {
    expect(() => new SupabasePowerSyncConnector({} as any, '')).toThrow(
      /VITE_POWERSYNC_URL/,
    );
  });

  it('fetchCredentials returns endpoint + user JWT', async () => {
    const credentials = await connector.fetchCredentials();
    expect(credentials).toEqual({
      endpoint: POWERSYNC_URL,
      token: 'jwt',
    });
  });

  it('fetchCredentials returns null when there is no session', async () => {
    mockSupabase.auth.getSession.mockResolvedValue({ session: null, error: null });
    await expect(connector.fetchCredentials()).resolves.toBeNull();
  });

  it('fetchCredentials throws on a session read error', async () => {
    mockSupabase.auth.getSession.mockResolvedValue({
      session: null,
      error: new Error('boom'),
    });
    await expect(connector.fetchCredentials()).rejects.toThrow(/session/i);
  });

  it('uploadData binds the session then uploads PUT/PATCH as upserts and DELETEs', async () => {
    resetFromMock();
    const crud = [
      {
        clientId: 1,
        id: 'row-1',
        op: UpdateType.PUT,
        opData: { user_id: 'u1', name: 'a' },
        table: 'collections',
      },
      {
        clientId: 2,
        id: 'row-2',
        op: UpdateType.PATCH,
        opData: { name: 'b' },
        table: 'collections',
      },
      {
        clientId: 3,
        id: 'row-3',
        op: UpdateType.DELETE,
        table: 'collections',
      },
    ] as any;

    const mockDb = {
      getCrudBatch: vi
        .fn()
        .mockResolvedValueOnce({
          crud,
          haveMore: false,
          complete: vi.fn().mockResolvedValue(undefined),
        })
        .mockResolvedValue(null) as any,
    } as any;

    await connector.uploadData(mockDb);

    expect(mockSupabase.auth.setSession).toHaveBeenCalledWith({
      access_token: 'jwt',
      refresh_token: 'refresh',
    });
    // The table is targeted through supabase.from('collections')
    expect(mockFrom).toHaveBeenCalledWith('collections');

    // PUT + PATCH collapse into a single upsert (id merged so conflict key exists)
    expect(builders.upsert).toHaveBeenCalledWith(
      [
        { id: 'row-1', user_id: 'u1', name: 'a' },
        { id: 'row-2', name: 'b' },
      ],
      { onConflict: 'id' },
    );
    // DELETE issued against id
    expect(builders.deleteIn).toHaveBeenCalledWith('id', ['row-3']);
  });

  it('uploadData throws when a Supabase upsert rejects (RLS / network)', async () => {
    resetFromMock({
      upsert: vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'new row violates row-level security policy' },
      }),
    });
    const crud = [
      {
        clientId: 1,
        id: 'row-1',
        op: UpdateType.PUT,
        opData: { user_id: 'u1' },
        table: 'collections',
      },
    ] as any;

    const mockDb = {
      getCrudBatch: vi
        .fn()
        .mockResolvedValue({
          crud,
          haveMore: false,
          complete: vi.fn().mockResolvedValue(undefined),
        }) as any,
    } as any;

    await expect(connector.uploadData(mockDb)).rejects.toThrow(
      /upsert into collections failed/,
    );
  });

  it('uploadData throws when there is no active session', async () => {
    mockSupabase.auth.getSession.mockResolvedValue({ session: null, error: null });
    const mockDb = { getCrudBatch: vi.fn() } as any;
    await expect(connector.uploadData(mockDb)).rejects.toThrow(
      /No active Supabase session/,
    );
  });
});
