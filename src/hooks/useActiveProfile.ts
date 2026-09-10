/**
 * useActiveProfile Hook
 * Provides active profile management for the application
 */

import { useCallback } from 'react';
import { useProfileStore } from '@/store/profile-store';
import { useAuthStore } from '@/store/auth-store';
import { useLearnerProfile } from './useLearnerProfile';

export function useActiveProfile() {
  const { activeProfileId, profiles, selectProfile, addProfile, removeProfile, autoSelectIfSingle } = useProfileStore();
  const { isAuthenticated, user } = useAuthStore();
  const { createProfile, getProfiles, deleteProfile, setActiveProfile } = useLearnerProfile();

  const activeProfile = profiles.find((p) => p.id === activeProfileId) || null;

  const handleSelectProfile = useCallback(
    (id: string) => {
      selectProfile(id);
      setActiveProfile(id);
    },
    [selectProfile, setActiveProfile],
  );

  const handleCreateProfile = useCallback(
    async (displayName: string, avatar?: string) => {
      const newProfile = await createProfile(displayName, avatar);
      addProfile(newProfile);
      return newProfile;
    },
    [createProfile, addProfile],
  );

  const handleDeleteProfile = useCallback(
    async (id: string) => {
      await deleteProfile(id);
      removeProfile(id);
    },
    [deleteProfile, removeProfile],
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
