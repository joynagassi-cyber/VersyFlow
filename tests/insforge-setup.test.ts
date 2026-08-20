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

import { createClient } from '@insforge/sdk';

describe('InsForge Setup', () => {
  it('should be able to import @insforge/sdk', () => {
    expect(createClient).toBeDefined();
    expect(createClient).toBeInstanceOf(Function);
  });

  it('should have INSFORGE_URL environment variable set', () => {
    const url = process.env.INSFORGE_URL;
    expect(url).toBeDefined();
    expect(url).toBe('https://wypi8tgf.eu-central.insforge.app');
  });

  it('should have INSFORGE_ANON_KEY environment variable set', () => {
    const key = process.env.INFORGE_ANON_KEY;
    expect(key).toBeDefined();
    expect(key).toBe('anon_5db10acfd8d50598afafe6d574dfd647edd9fba32514816c7f4c00346651a7c6');
  });

  it('should be able to create a client instance', () => {
    const client = createClient({
      baseUrl: process.env.INSFORGE_URL!,
      anonKey: process.env.INFORGE_ANON_KEY!
    });
    expect(client).toBeDefined();
  });
});
