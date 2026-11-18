/**
 * Onboarding — étape 5, « Rythme ».
 *
 * Deux réglages, pas plus : combien de versets par session, et le mode
 * concentration. Un objectif trop ambitieux dès le départ fait abandonner ;
 * l'échelle proposée va donc de 1 à 10 et rappelle ce que chaque choix
 * représente en minutes.
 */
import { useTranslation } from 'react-i18next';
import { DuoIcon } from '@/components/ui/DuoIcon';
import { CheckIcon, FocusIcon } from '@/components/ui/solar-icons';
import { cn } from '@/lib/utils';
import { useAppearanceStore } from '@/store/appearance-store';
import { OnboardingShell } from '@/components/onboarding/OnboardingShell';

const GOALS = [1, 3, 5, 7, 10];

export default function OnboardingSessionConfig() {
  const { t } = useTranslation();
  const sessionGoal = useAppearanceStore((s) => s.sessionGoal);
  const focusMode = useAppearanceStore((s) => s.focusMode);
  const setSessionGoal = useAppearanceStore((s) => s.setSessionGoal);
  const setFocusMode = useAppearanceStore((s) => s.setFocusMode);

  const minutes = Math.max(2, Math.round(sessionGoal * 1.5));

  return (
    <OnboardingShell
      stepId="rhythm"
      eyebrow={t('onboarding.stepRhythm', 'Rythme')}
      title={t('onboarding.sessionTitle', 'Votre rythme, pas celui d’un autre')}
      subtitle={t('onboarding.sessionDesc', 'Choisissez votre objectif de versets par session.')}
      nextLabel={t('onboarding.sessionCta', 'Garder ce rythme')}
      footerHint={t('onboarding.sessionMinutesHint', '≈ {{count}} min par session', {
        count: minutes,
      })}
    >
      <section aria-labelledby="onboarding-goal-title">
        <h2 id="onboarding-goal-title" className="mb-2 text-sm font-bold text-text-primary">
          {t('onboarding.sessionGoal', 'Objectif par session')}
        </h2>
        <div role="group" aria-labelledby="onboarding-goal-title" className="grid grid-cols-5 gap-2">
          {GOALS.map((goal) => {
            const selected = sessionGoal === goal;
            return (
              <button
                key={goal}
                type="button"
                onClick={() => setSessionGoal(goal)}
                aria-pressed={selected}
                className={cn(
                  'flex min-h-[56px] items-center justify-center gap-1 rounded-2xl border text-lg font-semibold transition-colors',
                  selected
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-surface text-text-secondary hover:border-primary/40',
                )}
              >
                {goal}
                {selected && <DuoIcon icon={CheckIcon} size={16} />}
              </button>
            );
          })}
        </div>
      </section>

      <section aria-labelledby="onboarding-focus-title" className="mt-6">
        <h2 id="onboarding-focus-title" className="mb-2 text-sm font-bold text-text-primary">
          {t('onboarding.sessionFocusTitle', 'Mode concentration')}
        </h2>
        <button
          type="button"
          onClick={() => setFocusMode(!focusMode)}
          aria-pressed={focusMode}
          className={cn(
            'flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition-colors',
            focusMode ? 'border-primary bg-primary/5' : 'border-border bg-surface hover:border-primary/40',
          )}
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
            <DuoIcon icon={FocusIcon} size={20} className="text-primary" />
          </span>
          <span className="flex-1">
            <span className="block text-[15px] font-semibold text-text-primary">
              {focusMode ? t('common.on', 'Activé') : t('common.off', 'Désactivé')}
            </span>
            <span className="mt-1 block text-[13px] leading-relaxed text-text-secondary">
              {t(
                'onboarding.sessionFocusDesc',
                'Masque automatiquement les mots les plus oubliés pour vous concentrer sur l’essentiel.',
              )}
            </span>
          </span>
          <span
            aria-hidden="true"
            className={cn(
              'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2',
              focusMode ? 'border-primary bg-primary' : 'border-text-muted',
            )}
          >
            {focusMode && <DuoIcon icon={CheckIcon} size={16} className="text-primary-foreground" />}
          </span>
        </button>
      </section>
    </OnboardingShell>
  );
}
