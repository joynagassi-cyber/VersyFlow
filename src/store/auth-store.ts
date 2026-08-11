/**
 * Auth Store — User Authentication State Management
 * Handles login, signup, logout, and session persistence
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { InsForgeAuthService, UserProfile, AuthError } from '@/auth';

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
const authService = new InsForgeAuthService();

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
          const session = await authService.signIn(email, password);
          set({
            user: {
              userId: session.user.id,
              display_name: session.user.display_name,
              default_translation: session.user.default_translation,
            },
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (err) {
          const error = err instanceof AuthError ? err : new AuthError('Failed to sign in');
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      signUp: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          await authService.signUp(email, password);
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
          await authService.signOut();
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
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
                display_name: user.display_name,
                default_translation: user.default_translation,
              },
              isAuthenticated: true,
              isLoading: false,
            });
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
          const { default: AsyncStorage } = await import('@react-native-async-storage/async-storage');
          const value = await AsyncStorage.getItem(key);
          return value ? JSON.parse(value) : null;
        },
        setItem: async (key: string, value: string) => {
          const { default: AsyncStorage } = await import('@react-native-async-storage/async-storage');
          await AsyncStorage.setItem(key, value);
        },
        removeItem: async (key: string) => {
          const { default: AsyncStorage } = await import('@react-native-async-storage/async-storage');
          await AsyncStorage.removeItem(key);
        },
      })),
    }
  )
);
