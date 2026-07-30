import { InsForgeAuthService } from '@/auth/InsForgeAuthService';

describe('InsForgeAuthService', () => {
  it('should validate INFORGE_URL environment variable', () => {
    expect(process.env.INFORGE_URL).toBeDefined();
    expect(process.env.INFORGE_URL).not.toBeNull();
    expect(process.env.INFORGE_URL).not.to.equal('');
  });

  it('should validate INFORGE_ANON_KEY environment variable', () => {
    expect(process.env.INFORGE_ANON_KEY).toBeDefined();
    expect(process.env.INFORGE_ANON_KEY).not.toBeNull();
    expect(process.env.INFORGE_ANON_KEY).not.to.equal('');
  });

  it('should instantiate auth client when environment variables are valid', async () => {
    // Skip test if environment variables are not set (should be caught by previous tests)
    if (!process.env.INFORGE_URL || !process.env.INFORGE_ANON_KEY) {
      return;
    }

    const authService = new InsForgeAuthService();
    expect(authService).toBeTruthy();
    expect(authService.client).toBeTruthy();
  });
});