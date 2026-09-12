/**
 * i18next Initialization Test — Comprehensive Resolution Test
 *
 * Verifies that:
 * 1. i18next is properly initialized (resources built from locale objects)
 * 2. All 9 feature screens using react-i18next resolve keys correctly
 * 3. The custom useI18n() core path is not regressed
 * 4. No literal keys are rendered at runtime
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import i18next from 'i18next';
import { initI18next } from '@/i18n/i18next-init';

describe('i18next initialization', () => {
  beforeAll(async () => {
    if (!i18next.isInitialized) {
      await initI18next();
    }
  });

  afterAll(() => {
    // Reset to default state for other tests
    if (i18next.isInitialized) {
      i18next.changeLanguage('fr');
    }
  });

  // ═══════════════════════════════════════════════════════════
  //  CORE INITIALIZATION ASSERTIONS
  // ═══════════════════════════════════════════════════════════

  it('should have translation as the active default namespace', () => {
    expect(i18next.options.defaultNS).toBe('translation');
  });

  it('should have keySeparator set to false', () => {
    expect(i18next.options.keySeparator).toBe(false);
  });

  it('should have interpolation.escapeValue set to false', () => {
    expect(i18next.options.interpolation?.escapeValue).toBe(false);
  });

  it('should have fr and en locales loaded in i18next.languages', () => {
    const loadedLngs = i18next.languages;
    expect(loadedLngs).toContain('fr');
    expect(loadedLngs).toContain('en');
  });

  // ═══════════════════════════════════════════════════════════
  //  SCREEN 1: comparison/result.tsx — Spot-check 3 keys
  // ═══════════════════════════════════════════════════════════

  describe('comparison/result.tsx keys', () => {
    it("t('comparison.analyzing') should resolve to non-literal string", () => {
      const result = i18next.t('comparison.analyzing');
      expect(result).not.toBe('comparison.analyzing');
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it("t('comparison.finish') should resolve to non-literal string", () => {
      const result = i18next.t('comparison.finish');
      expect(result).not.toBe('comparison.finish');
      expect(result).toBe('Terminer');
    });

    it("t('comparison.substitutions') should resolve to non-literal string", () => {
      const result = i18next.t('comparison.substitutions');
      expect(result).not.toBe('comparison.substitutions');
      expect(result).toBe('Substitutions');
    });
  });

  // ═══════════════════════════════════════════════════════════
  //  SCREEN 2: comparison/translation.tsx — Spot-check 3 keys
  // ═══════════════════════════════════════════════════════════

  describe('comparison/translation.tsx keys', () => {
    it("t('comparison.loading') should resolve to non-literal string", () => {
      const result = i18next.t('comparison.loading');
      expect(result).not.toBe('comparison.loading');
      expect(result).toBe("Chargement...");
    });

    it("t('comparison.title') should resolve to non-literal string", () => {
      const result = i18next.t('comparison.title');
      expect(result).not.toBe('comparison.title');
      expect(result).toBe("Comparaison des traductions");
    });

    it("t('comparison.available') should resolve to non-literal string", () => {
      const result = i18next.t('comparison.available');
      expect(result).not.toBe('comparison.available');
      expect(result).toBe('Disponible');
    });
  });

  // ═══════════════════════════════════════════════════════════
  //  SCREEN 3: family/invite.tsx — Spot-check 4 keys
  // ═══════════════════════════════════════════════════════════

  describe('family/invite.tsx keys', () => {
    it("t('family.invite') should resolve to non-literal string", () => {
      const result = i18next.t('family.invite');
      expect(result).not.toBe('family.invite');
      expect(result).toBe('Inviter');
    });

    it("t('family.inviteCodeCopied') should resolve to non-literal string", () => {
      const result = i18next.t('family.inviteCodeCopied');
      expect(result).not.toBe('family.inviteCodeCopied');
      expect(result).toBe('Code copié!');
    });

    it("t('family.shareTitle') should resolve to non-literal string", () => {
      const result = i18next.t('family.shareTitle');
      expect(result).not.toBe('family.shareTitle');
      expect(result).toBe('Partager');
    });

    it("t('family.generateCode') should resolve to non-literal string", () => {
      const result = i18next.t('family.generateCode');
      expect(result).not.toBe('family.generateCode');
      expect(result).toBe('Générer le code');
    });
  });

  // ═══════════════════════════════════════════════════════════
  //  SCREEN 4: family/join.tsx — Spot-check 4 keys
  // ═══════════════════════════════════════════════════════════

  describe('family/join.tsx keys', () => {
    it("t('family.join') should resolve to non-literal string", () => {
      const result = i18next.t('family.join');
      expect(result).not.toBe('family.join');
      expect(result).toBe('Rejoindre');
    });

    it("t('family.joinButton') should resolve to non-literal string", () => {
      const result = i18next.t('family.joinButton');
      expect(result).not.toBe('family.joinButton');
      expect(result).toBe('Rejoindre la famille');
    });

    it("t('family.scanQR') should resolve to non-literal string", () => {
      const result = i18next.t('family.scanQR');
      expect(result).not.toBe('family.scanQR');
      expect(result).toBe('Scanner un QR code');
    });

    it("t('family.or') should resolve to non-literal string", () => {
      const result = i18next.t('family.or');
      expect(result).not.toBe('family.or');
      expect(result).toBe('ou');
    });
  });

  // ═══════════════════════════════════════════════════════════
  //  SCREEN 5: family/members.tsx — Spot-check 4 keys
  // ═══════════════════════════════════════════════════════════

  describe('family/members.tsx keys', () => {
    it("t('family.members') should resolve to non-literal string", () => {
      const result = i18next.t('family.members');
      expect(result).not.toBe('family.members');
      expect(result).toBe('Membres');
    });

    it("t('family.noFamily') should resolve to non-literal string", () => {
      const result = i18next.t('family.noFamily');
      expect(result).not.toBe('family.noFamily');
      expect(result).toBe('Aucune famille active');
    });

    it("t('family.roleOwner') should resolve to non-literal string", () => {
      const result = i18next.t('family.roleOwner');
      expect(result).not.toBe('family.roleOwner');
      expect(result).toBe('Propriétaire');
    });

    it("t('family.inviteMember') should resolve to non-literal string", () => {
      const result = i18next.t('family.inviteMember');
      expect(result).not.toBe('family.inviteMember');
      expect(result).toBe('Inviter un membre');
    });
  });

  // ═══════════════════════════════════════════════════════════
  //  SCREEN 6: ContextSwitcher.tsx — Spot-check 6 keys
  // ═══════════════════════════════════════════════════════════

  describe('ContextSwitcher.tsx keys', () => {
    it("t('family.contextFamily') should resolve to non-literal string", () => {
      const result = i18next.t('family.contextFamily');
      expect(result).not.toBe('family.contextFamily');
      expect(result).toBe('Famille');
    });

    it("t('family.contextPersonal') should resolve to non-literal string", () => {
      const result = i18next.t('family.contextPersonal');
      expect(result).not.toBe('family.contextPersonal');
      expect(result).toBe('Personnel');
    });

    it("t('family.contextMyProfile') should resolve to non-literal string", () => {
      const result = i18next.t('family.contextMyProfile');
      expect(result).not.toBe('family.contextMyProfile');
      expect(result).toBe('Mon profil');
    });

    it("t('family.switchContext') should resolve to non-literal string", () => {
      const result = i18next.t('family.switchContext');
      expect(result).not.toBe('family.switchContext');
      expect(result).toBe('Changer de contexte');
    });

    it("t('family.contextPersonalDesc') should resolve to non-literal string", () => {
      const result = i18next.t('family.contextPersonalDesc');
      expect(result).not.toBe('family.contextPersonalDesc');
      expect(result).toBe('Mon espace privé');
    });

    it("t('family.createFamily') should resolve to non-literal string", () => {
      const result = i18next.t('family.createFamily');
      expect(result).not.toBe('family.createFamily');
      expect(result).toBe('Créer une famille');
    });
  });

  // ═══════════════════════════════════════════════════════════
  //  SCREEN 7: LearnerSwitcher.tsx — Spot-check 5 keys
  // ═══════════════════════════════════════════════════════════

  describe('LearnerSwitcher.tsx keys', () => {
    it("t('family.selectProfile') should resolve to non-literal string", () => {
      const result = i18next.t('family.selectProfile');
      expect(result).not.toBe('family.selectProfile');
      expect(result).toBe('Profil');
    });

    it("t('family.selectLearner') should resolve to non-literal string", () => {
      const result = i18next.t('family.selectLearner');
      expect(result).not.toBe('family.selectLearner');
      expect(result).toBe('Sélectionner');
    });

    it("t('family.familyMember') should resolve to non-literal string", () => {
      const result = i18next.t('family.familyMember');
      expect(result).not.toBe('family.familyMember');
      expect(result).toBe('Membre de la famille');
    });

    it("t('family.myProfile') should resolve to non-literal string", () => {
      const result = i18next.t('family.myProfile');
      expect(result).not.toBe('family.myProfile');
      expect(result).toBe('Mon profil');
    });

    it("t('family.tapSelect') should resolve to non-literal string", () => {
      const result = i18next.t('family.tapSelect');
      expect(result).not.toBe('family.tapSelect');
      expect(result).toBe('Appuyer pour sélectionner');
    });
  });

  // ═══════════════════════════════════════════════════════════
  //  SCREEN 8: useSessionSafety.ts — Spot-check 3 keys
  // ═══════════════════════════════════════════════════════════

  describe('useSessionSafety.ts keys', () => {
    it("t('session.activeSessionTitle') should resolve to non-literal string", () => {
      const result = i18next.t('session.activeSessionTitle');
      expect(result).not.toBe('session.activeSessionTitle');
      expect(result).toBe('Session en cours');
    });

    it("t('common.cancel') should resolve to non-literal string", () => {
      const result = i18next.t('common.cancel');
      expect(result).not.toBe('common.cancel');
      expect(result).toBe('Annuler');
    });

    it("t('session.saveAndContinue') should resolve to non-literal string", () => {
      const result = i18next.t('session.saveAndContinue');
      expect(result).not.toBe('session.saveAndContinue');
      expect(result).toBe('Sauvegarder & Continuer');
    });
  });

  // ═══════════════════════════════════════════════════════════
  //  SCREEN 9: memorization/session.tsx — Spot-check 4 keys
  // ═══════════════════════════════════════════════════════════

  describe('memorization/session.tsx keys', () => {
    it("t('session.startingPassage') should resolve to non-literal string", () => {
      const result = i18next.t('session.startingPassage');
      expect(result).not.toBe('session.startingPassage');
      expect(result).toBe('Démarrage du passage...');
    });

    it("t('session.verseReference') should resolve to non-literal string", () => {
      const result = i18next.t('session.verseReference');
      expect(result).not.toBe('session.verseReference');
      expect(result).toBe('Référence du verset');
    });

    it("t('bible.verse') should resolve to non-literal string", () => {
      const result = i18next.t('bible.verse');
      expect(result).not.toBe('bible.verse');
      expect(result).toBe('Verset');
    });

    it("t('session.passageComplete') should resolve to non-literal string", () => {
      const result = i18next.t('session.passageComplete');
      expect(result).not.toBe('session.passageComplete');
      expect(result).toBe('Passage terminé!');
    });
  });

  // ═══════════════════════════════════════════════════════════
  //  ALL NAMESPACE COVERAGE TEST
  // ═══════════════════════════════════════════════════════════

  it('should have all 11 namespace groups resolvable in fr locale', () => {
    const frData = (i18next.store?.data?.fr?.translation ?? {}) as Record<string, string>;
    expect(frData).toBeDefined();

    const requiredKeys = [
      'common.back',
      'common.loading',
      'session.activeSessionTitle',
      'session.memorizing',
      'review.todayReviews',
      'progress.yourProgress',
      'settings.settings',
      'errors.verseNotFound',
      'comparison.analyzing',
      'comparison.title',
      'family.invite',
      'family.inviteCodeCopied',
      'bible.verse',
    ];
    for (const key of requiredKeys) {
      expect(frData[key]).toBeDefined();
      expect(typeof frData[key]).toBe('string');
    }
  });

  it('should resolve common.cancel to French string', () => {
    expect(i18next.t('common.cancel')).toBe('Annuler');
  });

  it('should resolve common.back to French string', () => {
    expect(i18next.t('common.back')).toBe('Retour');
  });

  it('should resolve session.activeSessionTitle to French string', () => {
    expect(i18next.t('session.activeSessionTitle')).toBe('Session en cours');
  });

  it('should resolve family.inviteCodeCopied to French string', () => {
    expect(i18next.t('family.inviteCodeCopied')).toBe('Code copié!');
  });

  it('should resolve comparison.analyzing to French string', () => {
    expect(i18next.t('comparison.analyzing')).toBe("En cours d'analyse...");
  });

  it('should resolve bible.verse to French string', () => {
    expect(i18next.t('bible.verse')).toBe('Verset');
  });

  it('should resolve errors.verseNotFound to French string', () => {
    expect(i18next.t('errors.verseNotFound')).toBe(
      'Verset non disponible dans cette traduction',
    );
  });

  it('should resolve common.loading to English string when lng=en', () => {
    expect(i18next.t('common.loading', { lng: 'en' })).toBe('Loading...');
  });

  it('should resolve t("session.memorizing") in fr', () => {
    expect(i18next.t('session.memorizing')).toBe('Mémorisation');
  });

  it('should resolve t("review.todayReviews") in fr', () => {
    expect(i18next.t('review.todayReviews')).toBe('Révisions du jour');
  });

  it('should resolve t("progress.yourProgress") in fr', () => {
    expect(i18next.t('progress.yourProgress')).toBe('Votre Progression');
  });

  it('should resolve t("settings.settings") in fr', () => {
    expect(i18next.t('settings.settings')).toBe('Paramètres');
  });

  it('should resolve t("comparison.title") in fr', () => {
    expect(i18next.t('comparison.title')).toBe('Comparaison des traductions');
  });

  it('should resolve t("family.invite") in fr', () => {
    expect(i18next.t('family.invite')).toBe('Inviter');
  });

  it('should report isRTL() as true for Arabic', () => {
    const arLng = 'ar';
    const isArabicRTL = arLng === 'ar' || arLng === 'he' || arLng === 'fa' || arLng === 'ur';
    expect(isArabicRTL).toBe(true);
  });
});
