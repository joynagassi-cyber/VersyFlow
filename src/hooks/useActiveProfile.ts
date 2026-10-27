/**
 * useActiveProfile Hook
 * Provides active profile management for the application
 */

import { useCallback } from 'react';
import { useProfileStore } from '@/store/profile-store';
import { useAuthStore } from '@/store/auth-store';
import { useLearnerProfile } from './useLearnerProfile';

export function useActiveProfile() {
  const activeProfileId = useProfileStore((s) => s.activeProfileId);
  const profiles = useProfileStore((s) => s.profiles);
  const selectProfile = useProfileStore((s) => s.selectProfile);
  const addProfile = useProfileStore((s) => s.addProfile);
  const removeProfile = useProfileStore((s) => s.removeProfile);
  const autoSelectIfSingle = useProfileStore((s) => s.autoSelectIfSingle);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
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
    async (displayName: string, avatar?: string, slogan?: string) => {
      const newProfile = await createProfile(displayName, avatar, slogan);
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
