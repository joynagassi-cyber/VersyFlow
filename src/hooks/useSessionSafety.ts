/**
 * Session Safety Hook
 * Protège les sessions de mémorisation actives lors d'un changement de contexte
 * Phase 6: Session Safety (FAM-SS-001/002)
 */

import { useCallback } from 'react';
import { Alert, Platform } from 'react-native';
import { useMemoryCapability } from '@/capabilities/memory/store';
import { useContextStore } from '@/store/context-store';

export function useSessionSafety() {
  const { sessionState } = useMemoryCapability();
  const { switchToFamily, switchToPersonal } = useContextStore();

  /**
   * Check if there's an active session that should be protected
   */
  const hasActiveSession = useCallback(() => {
    if (!sessionState) return false;
    // Session is active if it's in preview or revealing phase
    return sessionState.phase === 'preview' || sessionState.phase === 'revealing';
  }, [sessionState]);

  /**
   * Safely switch to family context
   * Shows confirmation if session is active
   */
  const safeSwitchToFamily = useCallback((familyId: string) => {
    if (hasActiveSession()) {
      Alert.alert(
        'Session en cours',
        'Vous avez une session de mémorisation en cours. Voulez-vous la sauvegarder et changer de contexte ?',
        [
          {
            text: 'Annuler',
            style: 'cancel',
          },
          {
            text: 'Sauvegarder & Continuer',
            onPress: () => {
              // Session will be preserved by the context store
              switchToFamily(familyId);
            },
          },
        ],
        { cancelable: true }
      );
    } else {
      switchToFamily(familyId);
    }
  }, [hasActiveSession, switchToFamily]);

  /**
   * Safely switch to personal context
   * Shows confirmation if session is active
   */
  const safeSwitchToPersonal = useCallback(() => {
    if (hasActiveSession()) {
      Alert.alert(
        'Session en cours',
        'Vous avez une session de mémorisation en cours. Voulez-vous la sauvegarder et revenir au contexte personnel ?',
        [
          {
            text: 'Annuler',
            style: 'cancel',
          },
          {
            text: 'Sauvegarder & Continuer',
            onPress: () => {
              switchToPersonal();
            },
          },
        ],
        { cancelable: true }
      );
    } else {
      switchToPersonal();
    }
  }, [hasActiveSession, switchToPersonal]);

  return {
    hasActiveSession,
    safeSwitchToFamily,
    safeSwitchToPersonal,
  };
}
