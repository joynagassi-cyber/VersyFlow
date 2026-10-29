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
  private supabase: SupabaseClient | null;

  /** False when no Supabase credentials are configured (local/offline mode). */
  readonly isConfigured: boolean;

  constructor() {
    const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || import.meta.env.SUPABASE_URL;
    const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.SUPABASE_ANON_KEY;

    // Ne jamais planter au démarrage : sans identifiants Supabase, l'app
    // fonctionne en mode local (identité locale, données on-device) et les
    // méthodes réseau renvoient une AuthError propre au lieu de lever.
    // (Avant : ce `throw` dans le constructeur, instancié au niveau module
    // par les stores, donnait un écran blanc « Uncaught AuthError ».)
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      console.warn('[auth] Supabase non configuré — mode local uniquement.');
      this.supabase = null;
      this.isConfigured = false;
      return;
    }

    this.supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    this.isConfigured = true;
  }

  private missingCredentials(): AuthError {
    return new AuthError('Supabase credentials not configured', 'CREDENTIALS_MISSING');
  }

  async signUp(email: string, password: string): Promise<{ user: User | null; error: AuthError | null }> {
    if (!this.supabase) return { user: null, error: this.missingCredentials() };
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
    if (!this.supabase) return { user: null, error: this.missingCredentials() };
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
    if (!this.supabase) { this.clearLocalIdentity(); return { error: null }; }
    const { error } = await this.supabase.auth.signOut();

    if (error) {
      return { error: new AuthError(error.message, error.code) };
    }

    return { error: null };
  }

  async getCurrentUser(): Promise<User | null> {
    if (!this.supabase) return null;
    const { data: { user } } = await this.supabase.auth.getUser();
    return user;
  }

  async getSession(): Promise<{ session: any; error: AuthError | null }> {
    if (!this.supabase) return { session: null, error: this.missingCredentials() };
    const { data, error } = await this.supabase.auth.getSession();

    if (error) {
      return { session: null, error: new AuthError(error.message, error.code) };
    }

    return { session: data.session, error: null };
  }

  /** Refresh the current access token (keeps long-lived sessions alive). */
  async refreshSession(): Promise<{ user: User | null; error: AuthError | null }> {
    if (!this.supabase) return { user: null, error: this.missingCredentials() };
    const { data, error } = await this.supabase.auth.refreshSession();
    if (error) {
      return { user: null, error: new AuthError(error.message, error.code) };
    }
    return { user: data.session?.user ?? null, error: null };
  }

  /**
   * Local, unvalidated identification: persist the user's chosen identity
   * (email + display name) without contacting Supabase, sending any email,
   * or verifying a code. Used for the frictionless "just enter your email
   * and name" onboarding — the value is a stable display name and a
   * placeholder account id; no cloud account is created.
   */
  async identifyLocal(email: string, displayName: string): Promise<{ error: AuthError | null }> {
    try {
      const identity = {
        email: email.trim(),
        display_name: displayName.trim(),
        identifiedAt: Date.now(),
      };
      localStorage.setItem('versyflow:local-identity', JSON.stringify(identity));
      return { error: null };
    } catch (e) {
      return { error: new AuthError(e instanceof Error ? e.message : 'Failed to save identity') };
    }
  }

  /** Load the locally-identified user (if any) without a network call. */
  getLocalIdentity(): { email: string; display_name: string; identifiedAt: number } | null {
    try {
      const raw = localStorage.getItem('versyflow:local-identity');
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (typeof parsed?.email !== 'string' || typeof parsed?.display_name !== 'string') return null;
      return parsed;
    } catch {
      return null;
    }
  }

  /** Clear the locally-identified user (called on sign-out). */
  clearLocalIdentity(): void {
    try {
      localStorage.removeItem('versyflow:local-identity');
    } catch {
      /* ignore */
    }
  }

  async getUserProfile(userId: string): Promise<UserProfile | null> {
    if (!this.supabase) return null;
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !data) return null;
    return data as UserProfile;
  }

  async updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<void> {
    if (!this.supabase) return;
    await this.supabase
      .from('users')
      .update(updates)
      .eq('id', userId);
  }
}
