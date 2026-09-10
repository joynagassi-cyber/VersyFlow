// tests/integration/auth-integration.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock Supabase client to avoid needing real credentials in tests
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn(),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      getSession: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
      update: vi.fn(),
    })),
  })),
}));

import { SupabaseAuthService } from '@/auth/SupabaseAuthService';

describe('Auth Integration', () => {
  let auth: SupabaseAuthService;

  beforeEach(() => {
    process.env.VITE_SUPABASE_URL = 'http://test-url';
    process.env.VITE_SUPABASE_ANON_KEY = 'test-key';
    auth = new SupabaseAuthService();
  });

  afterEach(() => {
    delete process.env.VITE_SUPABASE_URL;
    delete process.env.VITE_SUPABASE_ANON_KEY;
  });

  it('should validate environment variables on initialization', () => {
    expect(auth).toBeDefined();
  });

  it('should have getCurrentUser method', () => {
    expect(auth.getCurrentUser).toBeTruthy();
    expect(typeof auth.getCurrentUser).toBe('function');
  });

  it('should throw AuthError when credentials are missing', () => {
    delete process.env.VITE_SUPABASE_URL;
    delete process.env.VITE_SUPABASE_ANON_KEY;
    expect(() => new SupabaseAuthService()).toThrow('Supabase credentials not configured');
  });
});
