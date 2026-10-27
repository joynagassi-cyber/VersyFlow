import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Logo } from '@/components/brand/Logo';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useSettingsStore } from '@/store/settings-store';

const TOTAL_STEPS = 6;

export default function WelcomeScreen() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const completeOnboarding = useSettingsStore((s) => s.completeOnboarding);

  const skip = () => {
    completeOnboarding();
    navigate('/tabs/home', { replace: true });
  };

  return (
    <div className="flex min-h-full flex-col items-center justify-between p-6 animate-fade-in-up">
      <div className="flex w-full justify-end">
        <button
          onClick={skip}
          className="text-sm font-medium text-text-muted active:opacity-70"
        >
          {t('common.skip', 'Passer')}
        </button>
      </div>

      <div className="flex flex-col items-center text-center">
        <div className="mb-6 mt-4 flex h-28 w-28 items-center justify-center">
          <Logo size={116} />
        </div>
        <h1 className="text-gradient-hero text-4xl font-extrabold tracking-tight">
          {t('common.appName', 'VersyFlow')}
        </h1>
        <p className="mt-3 text-base text-text-tertiary">
          {t('onboarding.welcome', 'Bienvenue')}
        </p>

        <div className="mt-10 w-full rounded-3xl bg-surface p-6 text-center shadow-md">
          <p className="text-lg font-semibold text-text-primary">
            {t('onboarding.slide1Title', "Mémorisez la Parole avec science")}
          </p>
          <p className="mt-2 text-sm text-text-muted">
            {t(
              'onboarding.slide1Desc',
              'Un moteur de répétition espacée au service de votre foi.',
            )}
          </p>
        </div>
      </div>

      <div className="mb-6 w-full">
        <div className="mb-6 flex items-center justify-center gap-1.5">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <span
              key={i}
              className={cn(
                'h-1.5 rounded-full transition-all',
                i === 0 ? 'w-6 bg-primary' : 'w-1.5 bg-border',
              )}
            />
          ))}
        </div>
        <Button
          variant="default"
          className="w-full"
          onClick={() => navigate('/onboarding/language-select')}
        >
          {t('common.continue', 'Continuer')}
        </Button>
      </div>
    </div>
  );
}
