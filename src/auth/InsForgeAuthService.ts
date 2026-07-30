import { createClient } from '@insforge/sdk';

export interface UserProfile {
  userId: string;
  display_name?: string;
  default_translation?: string;
}

export class InsForgeAuthService {
  private client: any;

  constructor() {
    if (!process.env.INFORGE_URL) {
      throw new Error('INFORGE_URL environment variable is required');
    }
    if (!process.env.INFORGE_ANON_KEY) {
      throw new Error('INFORGE_ANON_KEY environment variable is required');
    }

    this.client = createClient({
      baseUrl: process.env.INFORGE_URL,
      anonKey: process.env.INFORGE_ANON_KEY,
    });
  }

  async signUp(email: string, password: string) {
    return this.client.auth.signUp({ email, password });
  }

  async signIn(email: string, password: string) {
    return this.client.auth.signInWithPassword({ email, password });
  }

  async signOut() {
    return this.client.auth.signOut();
  }

  async getCurrentUser() {
    const session = await this.client.auth.getSession();
    return session?.user;
  }

  async getUserEmail() {
    const user = await this.getCurrentUser();
    return user?.email || null;
  }

  async updateUserProfile(userId: string, data: { display_name?: string, default_translation?: string }) {
    // Update user profile in the user_profiles table
    await this.client.auth.updateUser(userId, data);
  }
}