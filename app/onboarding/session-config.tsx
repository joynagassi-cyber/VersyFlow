/**
 * Onboarding — Session Configuration Screen (step 4/6)
 *
 * Lets the learner pick a verses-per-session goal and enable focus mode
 * before reminders & FSRS introduction. Accessible, large targets.
 */

import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { DuoIcon } from '@/components/ui/DuoIcon';
import {
  ArrowLeft01Icon as ArrowLeft,
  ArrowRight01Icon as ArrowRight,
  Target01Icon as Target,
  FocusIcon as Focus,
  CheckIcon as Check,
} from '@/components/ui/solar-icons';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { useAppearanceStore } from '@/store/appearance-store';
import { useSettingsStore } from '@/store/settings-store';

const GOALS = [1, 3, 5, 7, 10];

export default function OnboardingSessionConfig() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const sessionGoal = useAppearanceStore((s) => s.sessionGoal);
  const focusMode = useAppearanceStore((s) => s.focusMode);
  const setSessionGoal = useAppearanceStore((s) => s.setSessionGoal);
  const setFocusMode = useAppearanceStore((s) => s.setFocusMode);
  const completeOnboarding = useSettingsStore((s) => s.completeOnboarding);

  const skip = () => {
    completeOnboarding();
    navigate('/tabs/home', { replace: true });
  };

  return (
    <OnboardingShell
      step={4}
      title={t('onboarding.sessionTitle', 'Votre rythme de session')}
      subtitle={t(
        'onboarding.sessionDesc',
        'Choisissez un objectif quotidien réaliste et activez le mode concentration si vous le souhaitez.',
      )}
      onBack={() => navigate('/onboarding/translation-select')}
      backLabel={t('common.back', 'Retour')}
      onSkip={skip}
      skipLabel={t('common.skip', 'Passer')}
      footer={
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={() => navigate('/onboarding/translation-select')}
          >
            <DuoIcon icon={ArrowLeft} size={16} />
            {t('common.back', 'Retour')}
          </Button>
          <Button
            type="button"
            className="flex-1"
            onClick={() => navigate('/onboarding/reminder-config')}
          >
            {t('common.continue', 'Continuer')}
            <DuoIcon icon={ArrowRight} size={16} />
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-6">
        <div>
          <div className="mb-3 flex items-center gap-2">
            <DuoIcon icon={Target} size={18} className="text-primary" />
            <span className="text-base font-semibold text-text-primary">
              {t('onboarding.sessionGoal', 'Versets par session')}
            </span>
          </div>
          <div
            className="flex flex-wrap gap-2"
            role="group"
            aria-label={t('onboarding.sessionGoal', 'Versets par session')}
          >
            {GOALS.map((g) => {
              const selected = sessionGoal === g;
              return (
                <button
                  type="button"
                  key={g}
                  aria-pressed={selected}
                  onClick={() => setSessionGoal(g)}
                  className={cn(
                    'flex h-14 min-w-14 items-center justify-center rounded-2xl border-2 px-4 text-lg font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                    selected
                      ? 'border-primary bg-surface-tint text-primary'
                      : 'border-transparent bg-surface text-text-secondary shadow-sm',
                  )}
                >
                  {g}
                  {selected && <DuoIcon icon={Check} className="ml-1" size={16} />}
                </button>
              );
            })}
          </div>
        </div>

        <button
          type="button"
          aria-pressed={focusMode}
          onClick={() => setFocusMode(!focusMode)}
          className={cn(
            'flex items-center gap-4 rounded-2xl border-2 p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
            focusMode
              ? 'border-primary bg-surface-tint'
              : 'border-transparent bg-surface shadow-sm',
          )}
        >
          <div
            className={cn(
              'flex h-12 w-12 shrink-0 items-center justify-center rounded-full',
              focusMode ? 'bg-primary text-on-primary' : 'bg-surface-tint text-primary',
            )}
          >
            <DuoIcon icon={Focus} size={22} />
          </div>
          <div className="flex-1">
            <p className="text-base font-semibold text-text-primary">
              {t('onboarding.sessionFocusTitle', 'Mode concentration')}
            </p>
            <p className="mt-1 text-sm leading-6 text-text-secondary">
              {t(
                'onboarding.sessionFocusDesc',
                'Masque les éléments secondaires pendant la récitation.',
              )}
            </p>
          </div>
          <div
            className={cn(
              'flex h-6 w-6 items-center justify-center rounded-full border-2',
              focusMode ? 'border-primary bg-primary' : 'border-text-muted',
            )}
          >
            {focusMode && <DuoIcon icon={Check} size={14} className="text-[color:var(--on)]" />}
          </div>
        </button>
      </div>
    </OnboardingShell>
  );
}
