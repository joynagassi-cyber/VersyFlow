import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { DuoIcon } from '@/components/ui/DuoIcon';
import { ArrowRight01Icon, BookOpen01Icon } from '@hugeicons/core-free-icons';
import { Logo } from '@/components/brand/Logo';
import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { useSettingsStore } from '@/store/settings-store';

export default function WelcomeScreen() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const completeOnboarding = useSettingsStore((s) => s.completeOnboarding);

  const skip = () => {
    completeOnboarding();
    navigate('/tabs/home', { replace: true });
  };

  return (
    <OnboardingShell
      step={1}
      title={t('onboarding.welcomeTitle', 'Mémorisez la Parole, à votre rythme')}
      subtitle={t(
        'onboarding.welcomeSubtitle',
        'VersyFlow adapte chaque révision à votre mémoire — et son apparence à votre goût.',
      )}
      onSkip={skip}
      skipLabel={t('common.skip', 'Passer')}
      footer={
        <button
          onClick={() => navigate('/onboarding/language-select')}
          className="flex min-h-[54px] w-full items-center justify-center gap-2 rounded-full bg-primary text-[15px] font-bold text-primary-foreground shadow-[0_8px_24px_-6px_var(--ring)] transition active:scale-[0.98]"
        >
          {t('common.continue', 'Continuer')}
          <DuoIcon icon={ArrowRight01Icon} size={19} />
        </button>
      }
    >
      <div className="card-glass p-6">
        <div className="mb-5 flex items-center gap-4">
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-primary/10">
            <Logo size={44} />
          </span>
          <div>
            <p className="flex items-center gap-1.5 text-sm font-bold text-text-primary">
              <DuoIcon icon={BookOpen01Icon} size={16} color="var(--color-primary)" />
              {t('onboarding.slide1Title', 'Mémorisez la Parole avec science')}
            </p>
            <p className="mt-1 text-[13px] leading-relaxed text-text-secondary">
              {t(
                'onboarding.slide1Desc',
                'Un moteur de répétition espacée (FSRS) au service de votre foi.',
              )}
            </p>
          </div>
        </div>
        <p className="border-t border-[var(--color-border)] pt-4 font-serif text-[17px] italic leading-relaxed text-text-primary">
          « Ta parole est une lampe à mes pieds, et une lumière sur mon sentier. »
        </p>
        <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.08em] text-primary">
          Psaumes 119:105 · LSG
        </p>
      </div>
    </OnboardingShell>
  );
}
