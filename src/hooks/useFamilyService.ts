/**
 * useFamilyService Hook
 *
 * Composes FamilyService with local in-memory adapter and derives accountId from auth store.
 */

import { useCallback } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { FamilyService } from '@/services/family-service';
import {
  getFamilyRepository,
  getFamilyInvitationRepository,
  getLearnerProfileRepository,
} from '@/infrastructure/repository/powersync-repositories';

let _service: FamilyService | null = null;

function getService(): FamilyService {
  if (!_service) {
    _service = new FamilyService(
      getFamilyRepository(),
      getFamilyInvitationRepository(),
      getLearnerProfileRepository(),
    );
  }
  return _service;
}

export function useFamilyService() {
  const { user } = useAuthStore();
  const accountId = user?.userId ?? null;

  const service = getService();

  const acceptInvitation = useCallback(
    (token: string, defaultDisplayName?: string) => {
      if (!accountId) throw new Error('Not authenticated');
      return service.acceptInvitation(token, accountId, defaultDisplayName);
    },
    [accountId, service],
  );

  const declineInvitation = useCallback(
    (token: string) => {
      if (!accountId) throw new Error('Not authenticated');
      return service.declineInvitation(token, accountId);
    },
    [accountId, service],
  );

  const getMembersScoped = useCallback(
    (familyId: string) => {
      if (!accountId) throw new Error('Not authenticated');
      return service.getMembersScoped(familyId, accountId);
    },
    [accountId, service],
  );

  const leaveFamily = useCallback(
    (familyId: string) => {
      if (!accountId) throw new Error('Not authenticated');
      return service.leaveFamily(familyId, accountId);
    },
    [accountId, service],
  );

  const removeMember = useCallback(
    (familyId: string, targetAccountId: string) => {
      if (!accountId) throw new Error('Not authenticated');
      return service.removeMember(familyId, targetAccountId, accountId);
    },
    [accountId, service],
  );

  const createInvitation = useCallback(
    (familyId: string, expiresInDays?: number) => {
      if (!accountId) throw new Error('Not authenticated');
      return service.createInvitation(familyId, accountId, expiresInDays);
    },
    [accountId, service],
  );

  const revokeInvitation = useCallback(
    (invitationId: string) => {
      if (!accountId) throw new Error('Not authenticated');
      return service.revokeInvitation(invitationId, accountId);
    },
    [accountId, service],
  );

  return {
    acceptInvitation,
    declineInvitation,
    getMembersScoped,
    leaveFamily,
    removeMember,
    createInvitation,
    revokeInvitation,
    accountId,
  };
}
