/**
 * useActiveProfile Hook
 * Provides active profile management for the application
 */

import { useCallback } from 'react';
import { useProfileStore } from '@/store/profile-store';
import { useAuthStore } from '@/store/auth-store';

export function useActiveProfile() {
  const { activeProfileId, profiles, selectProfile, addProfile, removeProfile, autoSelectIfSingle } = useProfileStore();
  const { isAuthenticated, user } = useAuthStore();

  const activeProfile = profiles.find((p) => p.id === activeProfileId) || null;

  const handleSelectProfile = useCallback(
    (id: string) => {
      selectProfile(id);
    },
    [selectProfile],
  );

  const handleCreateProfile = useCallback(
    async (displayName: string, avatar?: string) => {
      // In a real implementation, this would call the service
      // For now, we simulate profile creation
      const newProfile = {
        id: `profile-${Date.now()}`,
        accountId: user?.userId || 'local',
        displayName,
        avatar,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        status: 'active' as const,
      };
      addProfile(newProfile);
      return newProfile;
    },
    [user, addProfile],
  );

  const handleDeleteProfile = useCallback(
    (id: string) => {
      removeProfile(id);
    },
    [removeProfile],
  );

  const shouldShowSelector = useCallback(() => {
    return profiles.length === 0 || profiles.length > 1;
  }, [profiles]);

  return {
    activeProfile,
    profiles,
    activeProfileId,
    isAuthenticated,
    selectProfile: handleSelectProfile,
    createProfile: handleCreateProfile,
    deleteProfile: handleDeleteProfile,
    shouldShowSelector,
    autoSelectIfSingle,
  };
}
