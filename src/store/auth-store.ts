import { capacitorStorage } from '@/infrastructure/storage';
/**
 * Auth Store — User Authentication State Management
 * Handles login, signup, logout, and session persistence
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { UserProfile } from '@/auth';
import { SupabaseAuthService, AuthError } from '@/auth';
import { useSyncStore } from '@/store/sync-store';
import { getSyncUserIdProvider } from '@/infrastructure/repository/powersync-repositories';
import { invalidateSyncUserIdProvider } from '@/infrastructure/repository/powersync-repositories';

interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  activeProfileId: string | null;

  // Actions
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  checkSession: () => Promise<void>;
  clearError: () => void;
  setActiveProfileId: (id: string | null) => void;
}

// Auth service singleton
const authService = new SupabaseAuthService();

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      activeProfileId: null,

      signIn: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const { user, error: authErr } = await authService.signIn(email, password);
          if (authErr || !user) throw authErr || new AuthError('No user returned');
          set({
            user: {
              userId: user.id,
              email: user.email || email,
              display_name: (user as any).display_name,
              default_translation: (user as any).default_translation,
            },
            isAuthenticated: true,
            isLoading: false,
          });
          // First-launch migration: move any legacy MMKV data into PowerSync.
          // Idempotent — a no-op when there is nothing to migrate.
          void useSyncStore.getState().runMmkvMigrationOnce();
        } catch (err) {
          const error = err instanceof AuthError ? err : new AuthError('Failed to sign in');
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      signUp: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const { error: authErr } = await authService.signUp(email, password);
          if (authErr) throw authErr;
          set({ isLoading: false });
        } catch (err) {
          const error = err instanceof AuthError ? err : new AuthError('Failed to sign up');
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      signOut: async () => {
        set({ isLoading: true });
        try {
          const { error: authErr } = await authService.signOut();
          if (authErr) throw authErr;
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
          // Reset the MMKV → PowerSync migration flag so the next login
          // re-runs it for the new user.
          useSyncStore.getState().invalidateMigration();
          // Invalidate the cached user id so no in-flight PowerSync write
          // can resolve a stale user id after sign-out.
          invalidateSyncUserIdProvider();
        } catch (err) {
          set({ isLoading: false });
        }
      },

      checkSession: async () => {
        set({ isLoading: true });
        try {
          const user = await authService.getCurrentUser();
          if (user) {
            set({
              user: {
                userId: user.id,
                email: user.email || '',
                display_name: (user as any).display_name,
                default_translation: (user as any).default_translation,
              },
              isAuthenticated: true,
              isLoading: false,
            });
            // First-launch migration: move any legacy MMKV data into PowerSync.
            // Idempotent — a no-op when there is nothing to migrate.
            void useSyncStore.getState().runMmkvMigrationOnce();
          } else {
            set({ isLoading: false });
          }
        } catch {
          set({ isLoading: false });
        }
      },

      clearError: () => set({ error: null }),

      setActiveProfileId: (id) => set({ activeProfileId: id }),
    }),
    {
      name: 'versyflow-auth-storage',
      storage: createJSONStorage(() => ({
        getItem: async (key: string) => {
          const value = await capacitorStorage.get(key);
          return value ? JSON.parse(value) : null;
        },
        setItem: async (key: string, value: string) => {
          await capacitorStorage.set(key, value);
        },
        removeItem: async (key: string) => {
          await capacitorStorage.delete(key);
        },
      })),
    }
  )
);
