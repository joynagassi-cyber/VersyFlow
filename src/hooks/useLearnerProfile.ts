/**
 * useLearnerProfile Hook
 *
 * Composes LearnerProfileService with local adapter, derives accountId from auth store.
 */

import { useCallback } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { LearnerProfileService } from '@/services/learner-profile-service';
import { getLearnerProfileRepository } from '@/infrastructure/repository/powersync-repositories';

let _service: LearnerProfileService | null = null;

function getService(): LearnerProfileService {
  if (!_service) {
    _service = new LearnerProfileService(getLearnerProfileRepository());
  }
  return _service;
}

export function useLearnerProfile() {
  const { user } = useAuthStore();
  const accountId = user?.userId ?? null;
  const service = getService();

  const createProfile = useCallback(
    (displayName: string, avatar?: string) => {
      if (!accountId) throw new Error('Not authenticated');
      return service.create(accountId, displayName, avatar);
    },
    [accountId, service],
  );

  const getProfiles = useCallback(() => {
    if (!accountId) return [];
    return service.findByAccountId(accountId);
  }, [accountId, service]);

  const getScopedProfile = useCallback(
    (id: string) => {
      if (!accountId) return null;
      return service.getScopedProfile(id, accountId);
    },
    [accountId, service],
  );

  const updateProfile = useCallback(
    (id: string, updates: Partial<Record<string, unknown>>) => {
      if (!accountId) throw new Error('Not authenticated');
      return service.update(id, updates as any, accountId);
    },
    [accountId, service],
  );

  const deleteProfile = useCallback(
    (id: string) => {
      if (!accountId) throw new Error('Not authenticated');
      return service.delete(id, accountId);
    },
    [accountId, service],
  );

  const setActiveProfile = useCallback(
    (id: string) => {
      service.setActiveProfileId(id);
    },
    [service],
  );

  return {
    createProfile,
    getProfiles,
    getScopedProfile,
    updateProfile,
    deleteProfile,
    setActiveProfile,
    activeProfileId: service.getActiveProfileId(),
    accountId,
  };
}
