/**
 * Onboarding — Session Configuration Screen
 *
 * Lets the learner pick a verses-per-session goal and enable focus mode
 * before the final step. Accessible, large targets for elderly users.
 */

import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Target, Focus, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAppearanceStore } from '@/store/appearance-store';

const GOALS = [1, 3, 5, 7, 10];

export default function OnboardingSessionConfig() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const {
    sessionGoal,
    focusMode,
    setSessionGoal,
    setFocusMode,
  } = useAppearanceStore();

  return (
    <div className="flex min-h-full flex-col p-6">
      <header className="mb-6 flex items-center gap-3">
        <button
          onClick={() => navigate('/onboarding/translation-select')}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-surface shadow-sm"
          aria-label={t('common.back')}
        >
          <ArrowLeft size={20} className="text-text-secondary" />
        </button>
        <h1 className="text-2xl font-bold text-text-primary">
          {t('onboarding.sessionTitle')}
        </h1>
      </header>

      <p className="mb-6 text-sm leading-6 text-text-secondary">
        {t('onboarding.sessionDesc')}
      </p>

      <div className="flex flex-1 flex-col gap-6">
        <div>
          <div className="mb-3 flex items-center gap-2">
            <Target size={18} className="text-primary" />
            <span className="text-base font-semibold text-text-primary">
              {t('onboarding.sessionGoal')}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {GOALS.map((g) => {
              const selected = sessionGoal === g;
              return (
                <button
                  key={g}
                  onClick={() => setSessionGoal(g)}
                  className={cn(
                    'flex h-14 min-w-14 items-center justify-center rounded-2xl border-2 px-4 text-lg font-semibold transition-colors',
                    selected
                      ? 'border-primary bg-surface-tint text-primary'
                      : 'border-transparent bg-surface text-text-secondary shadow-sm',
                  )}
                >
                  {g}
                  {selected && <Check className="ml-1" size={16} />}
                </button>
              );
            })}
          </div>
        </div>

        <button
          onClick={() => setFocusMode(!focusMode)}
          className={cn(
            'flex items-center gap-4 rounded-2xl border-2 p-4 text-left transition-colors',
            focusMode
              ? 'border-primary bg-surface-tint'
              : 'border-transparent bg-surface shadow-sm',
          )}
        >
          <div
            className={cn(
              'flex h-12 w-12 shrink-0 items-center justify-center rounded-full',
              focusMode ? 'bg-primary text-white' : 'bg-surface-tint text-primary',
            )}
          >
            <Focus size={22} />
          </div>
          <div className="flex-1">
            <p className="text-base font-semibold text-text-primary">
              {t('onboarding.sessionFocusTitle')}
            </p>
            <p className="mt-1 text-sm leading-6 text-text-secondary">
              {t('onboarding.sessionFocusDesc')}
            </p>
          </div>
          <div
            className={cn(
              'flex h-6 w-6 items-center justify-center rounded-full border-2',
              focusMode ? 'border-primary bg-primary' : 'border-text-muted',
            )}
          >
            {focusMode && <Check size={14} className="text-white" />}
          </div>
        </button>
      </div>

      <div className="mt-6 flex gap-4">
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => navigate('/onboarding/translation-select')}
        >
          <ArrowLeft size={16} />
          {t('common.back')}
        </Button>
        <Button className="flex-1" onClick={() => navigate('/onboarding/reminder-config')}>
          {t('common.continue')}
          <ArrowRight size={16} />
        </Button>
      </div>
    </div>
  );
}
