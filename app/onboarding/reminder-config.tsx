/**
 * Onboarding — étape 6, « Rappels ».
 *
 * L'interrupteur n'est pas un ornement : il conditionne la fréquence et
 * l'heure, qui restent visibles mais inactives quand il est coupé (jamais
 * masquées — on ne cache pas un réglage, on le désactive).
 */
import { useTranslation } from 'react-i18next';
import { DuoIcon } from '@/components/ui/DuoIcon';
import { BellIcon, BellRingIcon, CheckIcon, Clock01Icon } from '@/components/ui/solar-icons';
import { cn } from '@/lib/utils';
import { useAppearanceStore } from '@/store/appearance-store';
import { OnboardingShell } from '@/components/onboarding/OnboardingShell';

const FREQUENCIES = [1, 2, 3, 5];

export default function OnboardingReminderConfig() {
  const { t } = useTranslation();
  const reminderFrequency = useAppearanceStore((s) => s.reminderFrequency);
  const reminderEnabled = useAppearanceStore((s) => s.reminderEnabled);
  const reminderTime = useAppearanceStore((s) => s.reminderTime);
  const setReminderFrequency = useAppearanceStore((s) => s.setReminderFrequency);
  const toggleReminders = useAppearanceStore((s) => s.toggleReminders);
  const setReminderTime = useAppearanceStore((s) => s.setReminderTime);

  return (
    <OnboardingShell
      stepId="reminders"
      eyebrow={t('onboarding.stepReminders', 'Rappels')}
      title={t('onboarding.reminderTitle', 'Un rappel au bon moment')}
      subtitle={t('onboarding.reminderDesc', 'Choisissez quand et combien de fois nous vous rappelons.')}
      nextLabel={t('onboarding.saveReminderCta', 'Enregistrer mon rappel')}
    >
      <button
        type="button"
        onClick={toggleReminders}
        aria-pressed={reminderEnabled}
        className={cn(
          'flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition-colors',
          reminderEnabled
            ? 'border-primary bg-primary/5'
            : 'border-border bg-surface hover:border-primary/40',
        )}
      >
        <span
          className={cn(
            'flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl',
            reminderEnabled ? 'bg-primary text-primary-foreground' : 'bg-surface-tint text-primary',
          )}
        >
          <DuoIcon icon={reminderEnabled ? BellRingIcon : BellIcon} size={20} />
        </span>
        <span className="flex-1">
          <span className="block text-[15px] font-semibold text-text-primary">
            {t('onboarding.reminderEnabled', 'Rappels activés')}
          </span>
          <span className="mt-0.5 block text-[13px] text-text-secondary">
            {reminderEnabled ? t('common.on', 'Activé') : t('common.off', 'Désactivé')}
          </span>
        </span>
        <span
          aria-hidden="true"
          className={cn(
            'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2',
            reminderEnabled ? 'border-primary bg-primary' : 'border-text-muted',
          )}
        >
          {reminderEnabled && <DuoIcon icon={CheckIcon} size={16} className="text-primary-foreground" />}
        </span>
      </button>

      <section
        aria-labelledby="onboarding-frequency-title"
        className={cn('mt-6', !reminderEnabled && 'opacity-50')}
      >
        <h2 id="onboarding-frequency-title" className="mb-2 text-sm font-bold text-text-primary">
          {t('onboarding.reminderFrequency', 'Fréquence des rappels')}
        </h2>
        <div role="group" aria-labelledby="onboarding-frequency-title" className="grid grid-cols-4 gap-2">
          {FREQUENCIES.map((frequency) => {
            const selected = reminderFrequency === frequency;
            return (
              <button
                key={frequency}
                type="button"
                disabled={!reminderEnabled}
                onClick={() => setReminderFrequency(frequency)}
                aria-pressed={selected}
                className={cn(
                  'min-h-[52px] rounded-2xl border text-sm font-semibold transition-colors disabled:cursor-not-allowed',
                  selected
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-surface text-text-secondary hover:border-primary/40',
                )}
              >
                {t('onboarding.timesPerDay', '{{count}}×/jour', { count: frequency })}
              </button>
            );
          })}
        </div>
      </section>

      <section
        aria-labelledby="onboarding-time-title"
        className={cn('mt-6', !reminderEnabled && 'opacity-50')}
      >
        <h2 id="onboarding-time-title" className="mb-2 text-sm font-bold text-text-primary">
          {t('onboarding.reminderTime', 'Heure du rappel')}
        </h2>
        <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-surface-tint">
            <DuoIcon icon={Clock01Icon} size={20} className="text-primary" />
          </span>
          <label htmlFor="onboarding-reminder-time" className="flex-1 text-[15px] font-semibold text-text-primary">
            {t('onboarding.reminderTimeLabel', 'Premier rappel de la journée')}
          </label>
          <input
            id="onboarding-reminder-time"
            aria-labelledby="onboarding-time-title"
            type="time"
            value={reminderTime}
            disabled={!reminderEnabled}
            onChange={(event) => setReminderTime(event.target.value)}
            className="min-h-11 rounded-xl border border-border bg-surface px-3 text-base tabular-nums text-text-primary focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50"
          />
        </div>
      </section>
    </OnboardingShell>
  );
}
