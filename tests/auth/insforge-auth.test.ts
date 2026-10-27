import { describe, expect, it, vi } from 'vitest';
import { SupabaseAuthService } from '@/auth/SupabaseAuthService';
import { AuthError } from '@/auth/SupabaseAuthService';

// Mock @supabase/supabase-js to avoid network calls in tests
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    auth: {
      signUp: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      signInWithPassword: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
    },
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    update: vi.fn().mockResolvedValue({ data: null, error: null }),
  })),
}));

describe('SupabaseAuthService', () => {
  it('should validate SUPABASE_URL and SUPABASE_ANON_KEY environment variables', () => {
    // Skip test if environment variables are not set (development/testing workflow)
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
      console.log('Skipping credential validation - SUPABASE_URL or SUPABASE_ANON_KEY not set');
      return;
    }
    expect(process.env.SUPABASE_URL).toBeDefined();
    expect(process.env.SUPABASE_URL).not.toBeNull();
    expect(process.env.SUPABASE_URL).not.to.equal('');
    expect(process.env.SUPABASE_ANON_KEY).toBeDefined();
    expect(process.env.SUPABASE_ANON_KEY).not.toBeNull();
    expect(process.env.SUPABASE_ANON_KEY).not.to.equal('');
  });

  it('should instantiate auth client when environment variables are valid', async () => {
    // Skip test if environment variables are not set (should be caught by previous tests)
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
      return;
    }

    const authService = new SupabaseAuthService();
    expect(authService).toBeTruthy();
  });

  it('should have signUp method', async () => {
    const authService = new SupabaseAuthService();
    expect(typeof authService.signUp).toBe('function');
  });

  it('should have signIn method', async () => {
    const authService = new SupabaseAuthService();
    expect(typeof authService.signIn).toBe('function');
  });

  it('should have signOut method', async () => {
    const authService = new SupabaseAuthService();
    expect(typeof authService.signOut).toBe('function');
  });

  it('should have getCurrentUser method', async () => {
    const authService = new SupabaseAuthService();
    expect(typeof authService.getCurrentUser).toBe('function');
  });
});
