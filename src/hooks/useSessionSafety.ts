/**
 * Session Safety Hook
 * Protège les sessions de mémorisation actives lors d'un changement de contexte
 * Phase 6: Session Safety (FAM-SS-001/002)
 */

import { useCallback } from 'react';
import { Alert, Platform } from '@/components/ui/Primitives';
import { useMemoryCapability } from '@/capabilities/memory/store';
import { useContextStore } from '@/store/context-store';
import { useTranslation } from 'react-i18next';

export function useSessionSafety() {
  const { sessionState } = useMemoryCapability();
  const { switchToFamily, switchToPersonal } = useContextStore();
  const { t } = useTranslation();

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
        t('session.activeSessionTitle'),
        t('session.activeSessionDescription'),
        [
          {
            text: t('common.cancel'),
            style: 'cancel',
          },
          {
            text: t('session.saveAndContinue'),
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
  }, [hasActiveSession, switchToFamily, t]);

  /**
   * Safely switch to personal context
   * Shows confirmation if session is active
   */
  const safeSwitchToPersonal = useCallback(() => {
    if (hasActiveSession()) {
      Alert.alert(
        t('session.activeSessionTitle'),
        t('session.activeSessionPersonalDescription'),
        [
          {
            text: t('common.cancel'),
            style: 'cancel',
          },
          {
            text: t('session.saveAndContinue'),
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
  }, [hasActiveSession, switchToPersonal, t]);

  return {
    hasActiveSession,
    safeSwitchToFamily,
    safeSwitchToPersonal,
  };
}
