/**
 * Onboarding — Reminder Configuration Screen (step 5/6)
 *
 * Configures how many reminders per day, the reminder time, and whether
 * reminders are on. Applies the schedule honestly (isolated in Demo mode,
 * Web fallback notice on browser).
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { DuoIcon } from '@/components/ui/DuoIcon';
import {
  ArrowLeft01Icon as ArrowLeft,
  ArrowRight01Icon as ArrowRight,
  BellIcon as Bell,
  BellRingIcon as BellRing,
  Clock01Icon as Clock,
  CheckIcon as Check,
} from '@/components/ui/solar-icons';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { useAppearanceStore, appearanceStorePersist } from '@/store/appearance-store';
import { settingsStorePersist } from '@/store/settings-store';
import { useAuthStore } from '@/store/auth-store';
import { useActiveProfile } from '@/hooks/useActiveProfile';
import { useLearnerProfile } from '@/hooks/useLearnerProfile';
import { markOnboardingReady } from '@/onboarding/progress';
import { isMockMode } from '@/dev/mode';
import { notificationService } from '@/services/notification-service';
import { isNativePlatform } from '@/lib/platform';

const FREQUENCIES = [1, 2, 3, 5];

export default function OnboardingReminderConfig() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const reminderFrequency = useAppearanceStore((s) => s.reminderFrequency);
  const reminderEnabled = useAppearanceStore((s) => s.reminderEnabled);
  const reminderTime = useAppearanceStore((s) => s.reminderTime);
  const setReminderFrequency = useAppearanceStore((s) => s.setReminderFrequency);
  const toggleReminders = useAppearanceStore((s) => s.toggleReminders);
  const setReminderTime = useAppearanceStore((s) => s.setReminderTime);
  const user = useAuthStore((s) => s.user);
  const { activeProfile } = useActiveProfile();
  const { getScopedProfile } = useLearnerProfile();
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const finish = async () => {
    setSaving(true);
    setSaveError(false);
    try {
      if (!user || !activeProfile || activeProfile.accountId !== user.userId || !await getScopedProfile(activeProfile.id)) throw new Error('Profile not saved');
      await settingsStorePersist.save();
      await appearanceStorePersist.save();
      if (!localStorage.getItem('versyflow-settings-storage') || !localStorage.getItem('versyflow:appearance:settings')) throw new Error('Settings not saved');
      if (!isMockMode()) {
        try {
          if (reminderEnabled) await notificationService.ensurePermissions(true);
          await notificationService.scheduleDailyReminders({ enabled: reminderEnabled, frequency: reminderFrequency, time: reminderTime }, t('reminders.notificationBody', 'Temps de révision !'));
        } catch { /* Preference remains saved if permissions are refused. */ }
      }
      markOnboardingReady(user.userId, activeProfile.id);
      navigate('/onboarding/journey/success');
    } catch { setSaveError(true); }
    finally { setSaving(false); }
  };

  return (
    <OnboardingShell
      step={5}
      title={t('onboarding.reminderTitle', 'Rappels quotidiens')}
      subtitle={t(
        'onboarding.reminderDesc',
        'Un rendez-vous régulier ancre durablement la Parole dans votre journée.',
      )}
      onBack={() => navigate('/onboarding/session-config')}
      backLabel={t('common.back', 'Retour')}
      footer={
        <div className="flex flex-col gap-3">
          {saveError && <p role="alert" className="text-error">{t('onboardingJourney.saveError', 'Impossible d’enregistrer votre espace. Réessayez.')}</p>}
          <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={() => navigate('/onboarding/session-config')}
          >
            <DuoIcon icon={ArrowLeft} size={16} />
            {t('common.back', 'Retour')}
          </Button>
          <Button type="button" className="flex-1" disabled={saving} onClick={() => void finish()}>
            {saving ? t('common.saving', 'Enregistrement…') : t('common.continue', 'Continuer')}
            <DuoIcon icon={ArrowRight} size={16} />
          </Button>
          </div>
        </div>
      }
    >
      <div className="flex flex-col gap-6">
        <button
          type="button"
          aria-pressed={reminderEnabled}
          onClick={toggleReminders}
          className={cn(
            'flex items-center gap-4 rounded-2xl border-2 p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
            reminderEnabled
              ? 'border-primary bg-surface-tint'
              : 'border-transparent bg-surface shadow-sm',
          )}
        >
          <div
            className={cn(
              'flex h-12 w-12 shrink-0 items-center justify-center rounded-full',
              reminderEnabled
                ? 'bg-primary text-on-primary'
                : 'bg-surface-tint text-primary',
            )}
          >
            {reminderEnabled ? (
              <DuoIcon icon={BellRing} size={22} />
            ) : (
              <DuoIcon icon={Bell} size={22} />
            )}
          </div>
          <div className="flex-1">
            <p className="text-base font-semibold text-text-primary">
              {t('onboarding.reminderEnabled', 'Activer les rappels')}
            </p>
            <p className="mt-1 text-sm text-text-secondary">
              {reminderEnabled ? t('common.on', 'Activé') : t('common.off', 'Désactivé')}
            </p>
          </div>
          <div
            className={cn(
              'flex h-6 w-6 items-center justify-center rounded-full border-2',
              reminderEnabled ? 'border-primary bg-primary' : 'border-text-muted',
            )}
          >
            {reminderEnabled && (
              <DuoIcon icon={Check} size={14} className="text-on-status" />
            )}
          </div>
        </button>

        <div className={cn(!reminderEnabled && 'opacity-40')}>
          <div className="mb-3 flex items-center gap-2">
            <DuoIcon icon={Bell} size={18} className="text-primary" />
            <span className="text-base font-semibold text-text-primary">
              {t('onboarding.reminderFrequency', 'Fréquence par jour')}
            </span>
          </div>
          <div
            className="flex flex-wrap gap-2"
            role="group"
            aria-label={t('onboarding.reminderFrequency', 'Fréquence par jour')}
          >
            {FREQUENCIES.map((f) => {
              const selected = reminderFrequency === f;
              return (
                <button
                  type="button"
                  key={f}
                  aria-pressed={selected}
                  disabled={!reminderEnabled}
                  onClick={() => setReminderFrequency(f)}
                  className={cn(
                    'flex h-14 min-w-14 items-center justify-center rounded-2xl border-2 px-4 text-lg font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-40',
                    selected
                      ? 'border-primary bg-surface-tint text-primary'
                      : 'border-transparent bg-surface text-text-secondary shadow-sm',
                  )}
                >
                  {f}
                  {selected && <DuoIcon icon={Check} className="ml-1" size={16} />}
                </button>
              );
            })}
          </div>
        </div>

        <div className={cn('flex items-center gap-4', !reminderEnabled && 'opacity-40')}>
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-surface-tint">
            <DuoIcon icon={Clock} size={22} className="text-primary" />
          </div>
          <div className="flex-1">
            <label
              htmlFor="onboarding-reminder-time"
              className="block text-base font-semibold text-text-primary"
            >
              {t('onboarding.reminderTime', 'Heure du premier rappel')}
            </label>
            <input
              id="onboarding-reminder-time"
              type="time"
              value={reminderTime}
              disabled={!reminderEnabled}
              onChange={(e) => setReminderTime(e.target.value)}
              className="mt-1 h-11 rounded-lg border border-border bg-surface px-3 text-base text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-40"
            />
          </div>
        </div>

        {!isNativePlatform() && (
          <p className="rounded-xl bg-surface-tint/60 p-3 text-xs leading-relaxed text-text-secondary">
            {t(
              'reminders.weeklySavedWeb',
              'Sur navigateur Web, votre horaire est enregistré localement ; les notifications en arrière-plan nécessitent l’application mobile.',
            )}
          </p>
        )}
      </div>
    </OnboardingShell>
  );
}
