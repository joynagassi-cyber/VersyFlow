import { createClient, SupabaseClient, User } from '@supabase/supabase-js';

export interface UserProfile {
  userId: string;
  email: string;
  display_name?: string;
  default_translation?: string;
  avatar_url?: string;
  ui_language?: string;
}

export interface AuthSession {
  user: User;
  access_token: string;
}

export class AuthError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'AuthError';
  }
}

export class SupabaseAuthService {
  private supabase: SupabaseClient;

  constructor() {
    const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || import.meta.env.SUPABASE_URL;
    const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.SUPABASE_ANON_KEY;

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      throw new AuthError('Supabase credentials not configured', 'CREDENTIALS_MISSING');
    }

    this.supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }

  async signUp(email: string, password: string): Promise<{ user: User | null; error: AuthError | null }> {
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      return { user: null, error: new AuthError(error.message, error.code) };
    }

    return { user: data.user, error: null };
  }

  async signIn(email: string, password: string): Promise<{ user: User | null; error: AuthError | null }> {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { user: null, error: new AuthError(error.message, error.code) };
    }

    return { user: data.user, error: null };
  }

  async signOut(): Promise<{ error: AuthError | null }> {
    const { error } = await this.supabase.auth.signOut();

    if (error) {
      return { error: new AuthError(error.message, error.code) };
    }

    return { error: null };
  }

  async getCurrentUser(): Promise<User | null> {
    const { data: { user } } = await this.supabase.auth.getUser();
    return user;
  }

  async getSession(): Promise<{ session: any; error: AuthError | null }> {
    const { data, error } = await this.supabase.auth.getSession();

    if (error) {
      return { session: null, error: new AuthError(error.message, error.code) };
    }

    return { session: data.session, error: null };
  }

  async getUserProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !data) return null;
    return data as UserProfile;
  }

  async updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<void> {
    await this.supabase
      .from('users')
      .update(updates)
      .eq('id', userId);
  }
}
