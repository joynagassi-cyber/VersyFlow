/**
 * Onboarding — Reminder Configuration Screen
 *
 * Configures how many reminders per day ("nombre de fois par jour"), the
 * reminder time, and whether reminders are on. Final onboarding step before
 * reaching the FSRS intro / start.
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
import { useAppearanceStore, appearanceStorePersist } from '@/store/appearance-store';
import { settingsStorePersist } from '@/store/settings-store';
import { useAuthStore } from '@/store/auth-store';
import { useActiveProfile } from '@/hooks/useActiveProfile';
import { useLearnerProfile } from '@/hooks/useLearnerProfile';
import { markOnboardingReady } from '@/onboarding/progress';

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
    setSaving(true); setSaveError(false);
    try {
      if (!user || !activeProfile || activeProfile.accountId !== user.userId || !await getScopedProfile(activeProfile.id)) throw new Error('Profile not saved');
      await settingsStorePersist.save();
      await appearanceStorePersist.save();
      if (!localStorage.getItem('versyflow-settings-storage') || !localStorage.getItem('versyflow:appearance:settings')) throw new Error('Settings not saved');
      markOnboardingReady(user.userId, activeProfile.id);
      navigate('/onboarding/journey/success');
    } catch { setSaveError(true); }
    finally { setSaving(false); }
  };

  return (
    <div className="screen-column-narrow flex min-h-full flex-col p-6">
      <header className="mb-6 flex items-center gap-3">
        <button
          onClick={() => navigate('/onboarding/session-config')}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-surface shadow-sm"
          aria-label={t('common.back')}
        >
          <DuoIcon icon={ArrowLeft} size={20} className="text-text-secondary" />
        </button>
        <h1 className="text-2xl font-bold text-text-primary">
          {t('onboarding.reminderTitle')}
        </h1>
      </header>

      <p className="mb-6 text-sm leading-6 text-text-secondary">
        {t('onboarding.reminderDesc')}
      </p>

      <div className="flex flex-1 flex-col gap-6">
        {/* On / off toggle */}
        <button
          onClick={toggleReminders}
          className={cn(
            'flex items-center gap-4 rounded-2xl border-2 p-4 text-left transition-colors',
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
            {reminderEnabled ? <DuoIcon icon={BellRing} size={22} /> : <DuoIcon icon={Bell} size={22} />}
          </div>
          <div className="flex-1">
            <p className="text-base font-semibold text-text-primary">
              {t('onboarding.reminderEnabled')}
            </p>
            <p className="mt-1 text-sm text-text-secondary">
              {reminderEnabled ? t('common.on') : t('common.off')}
            </p>
          </div>
          <div
            className={cn(
              'flex h-6 w-6 items-center justify-center rounded-full border-2',
              reminderEnabled
                ? 'border-primary bg-primary'
                : 'border-text-muted',
            )}
          >
            {reminderEnabled && <DuoIcon icon={Check} size={14} className="text-[color:var(--on)]" />}
          </div>
        </button>

        {/* Frequency — how many reminders per day */}
        <div className={cn(!reminderEnabled && 'opacity-40')}>
          <div className="mb-3 flex items-center gap-2">
            <DuoIcon icon={Bell} size={18} className="text-primary" />
            <span className="text-base font-semibold text-text-primary">
              {t('onboarding.reminderFrequency')}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {FREQUENCIES.map((f) => {
              const selected = reminderFrequency === f;
              return (
                <button
                  key={f}
                  disabled={!reminderEnabled}
                  onClick={() => setReminderFrequency(f)}
                  className={cn(
                    'flex h-14 min-w-14 items-center justify-center rounded-2xl border-2 px-4 text-lg font-semibold transition-colors disabled:opacity-40',
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

        {/* Reminder time */}
        <div className={cn('flex items-center gap-4', !reminderEnabled && 'opacity-40')}>
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-surface-tint">
            <DuoIcon icon={Clock} size={22} className="text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-base font-semibold text-text-primary">
              {t('onboarding.reminderTime')}
            </p>
            <input
              type="time"
              value={reminderTime}
              disabled={!reminderEnabled}
              onChange={(e) => setReminderTime(e.target.value)}
              className="mt-1 h-11 rounded-lg border border-border bg-surface px-3 text-base text-text-primary disabled:opacity-40"
            />
          </div>
        </div>
      </div>

      {saveError && <p role="alert" className="text-error">{t('onboardingJourney.saveError', 'Impossible d’enregistrer votre espace. Réessayez.')}</p>}
      <div className="mt-6 flex gap-4">
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => navigate('/onboarding/session-config')}
        >
          <DuoIcon icon={ArrowLeft} size={16} />
          {t('common.back')}
        </Button>
        <Button className="flex-1" disabled={saving} onClick={() => { void finish(); }}>
          {saving ? t('common.saving', 'Enregistrement…') : t('common.continue')}
          <DuoIcon icon={ArrowRight} size={16} />
        </Button>
      </div>
    </div>
  );
}
