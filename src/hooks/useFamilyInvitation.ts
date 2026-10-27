/**
 * useFamilyInvitation Hook
 *
 * Convenience hook for invitation token generation and display.
 */

import { useCallback, useState } from 'react';
import { useFamilyService } from './useFamilyService';

export function useFamilyInvitation() {
  const { createInvitation, revokeInvitation } = useFamilyService();
  const [currentToken, setCurrentToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateNewToken = useCallback(
    async (familyId: string) => {
      setIsLoading(true);
      setError(null);
      try {
        const invitation = await createInvitation(familyId);
        setCurrentToken(invitation.token);
        return invitation;
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Failed to generate invitation';
        setError(msg);
        throw e;
      } finally {
        setIsLoading(false);
      }
    },
    [createInvitation],
  );

  const revokeCurrent = useCallback(
    async (invitationId: string) => {
      try {
        await revokeInvitation(invitationId);
        setCurrentToken(null);
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Failed to revoke invitation';
        setError(msg);
        throw e;
      }
    },
    [revokeInvitation],
  );

  return {
    currentToken,
    isLoading,
    error,
    generateNewToken,
    revokeCurrent,
  };
}
