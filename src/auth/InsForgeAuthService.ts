import { createClient } from '@insforge/sdk';

export interface UserProfile {
  userId: string;
  display_name?: string;
  default_translation?: string;
}

export class InsForgeAuthService {
  private client: any;

  constructor() {
    const INSFORGE_URL = process.env.EXPO_PUBLIC_INSFORGE_URL || 'https://wypi8tgf.eu-central.insforge.app';
    const INSFORGE_ANON_KEY = process.env.EXPO_PUBLIC_INSFORGE_ANON_KEY || 'anon_5db10acfd8d50598afafe6d574dfd647edd9fba32514816c7f4c00346651a7c6';

    this.client = createClient({
      baseUrl: INSFORGE_URL,
      anonKey: INSFORGE_ANON_KEY,
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
    await this.client.auth.updateUser(userId, data);
  }
}