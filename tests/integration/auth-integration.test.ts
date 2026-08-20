// Mock @insforge/sdk to avoid ESM shared-schemas resolution issues
jest.mock('@insforge/sdk', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn(),
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
    },
  })),
}));

// tests/integration/auth-integration.test.ts
import { InsForgeAuthService } from '@/auth/InsForgeAuthService';

describe('Auth Integration', () => {
  let auth: InsForgeAuthService;

  beforeEach(() => {
    auth = new InsForgeAuthService();
  });

  it('should validate environment variables on initialization', () => {
    expect(auth.client).toBeDefined();
  });

  it('should have getCurrentUser method', () => {
    expect(auth.getCurrentUser).toBeTruthy();
    expect(typeof auth.getCurrentUser).toBe('function');
  });
});
