/**
 * FSRS Introduction — Onboarding final step (step 6/6)
 * Visual intro of the FSRS algorithm + 3 benefits + Back & Start CTAs.
 */

import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { DuoIcon } from '@/components/ui/DuoIcon';
import {
  ArrowLeft01Icon as ArrowLeft,
  ArrowRight01Icon as ArrowRight,
  CheckmarkCircle01Icon as CheckCircle,
  Timer01Icon as Timer,
  FlaskConicalIcon as FlaskConical,
} from '@/components/ui/solar-icons';
import { Button } from '@/components/ui/button';
import { OnboardingShell } from '@/components/onboarding/OnboardingShell';

export default function FSRSIntroductionScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleStartMemorization = () => {
    navigate('/onboarding/journey/success', { replace: true });
  };

  const benefits = [
    {
      icon: Timer,
      title: t('onboarding.benefit1Title', 'Rythme optimal'),
      desc: t(
        'onboarding.benefit1Desc',
        "Révisez chaque verset juste avant de l'oublier, maximisant la rétention avec un effort minimal.",
      ),
    },
    {
      icon: CheckCircle,
      title: t('onboarding.benefit2Title', 'Moins de révisions'),
      desc: t(
        'onboarding.benefit2Desc',
        'Ne perdez pas de temps sur ce que vous savez déjà. Concentrez-vous sur ce qui nécessite votre attention.',
      ),
    },
    {
      icon: FlaskConical,
      title: t('onboarding.benefit3Title', 'Scientifiquement prouvé'),
      desc: t(
        'onboarding.benefit3Desc',
        'Basé sur la recherche cognitive avancée (Free Spaced Repetition Scheduler).',
      ),
    },
  ];

  return (
    <OnboardingShell
      step={6}
      title={t('onboarding.fsrsTitle', 'La science de la mémorisation')}
      subtitle={t(
        'onboarding.fsrsDesc',
        "Découvrez FSRS : un algorithme intelligent qui s'adapte à votre mémoire pour retenir durablement les Écritures.",
      )}
      onBack={() => navigate('/onboarding/reminder-config')}
      backLabel={t('common.back', 'Retour')}
      footer={
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={() => navigate('/onboarding/reminder-config')}
          >
            <DuoIcon icon={ArrowLeft} size={16} />
            {t('common.back', 'Retour')}
          </Button>
          <Button type="button" className="flex-[1.5]" onClick={handleStartMemorization}>
            {t('onboarding.getStarted', 'Commencer à mémoriser')}
            <DuoIcon icon={ArrowRight} size={16} />
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-5">
        <div className="overflow-hidden rounded-3xl bg-surface p-5 shadow-sm">
          <div className="relative h-44">
            <svg viewBox="0 0 300 180" className="h-full w-full" aria-hidden="true">
              {[0, 60, 120, 180].map((y) => (
                <line
                  key={y}
                  x1="0"
                  y1={y}
                  x2="300"
                  y2={y}
                  stroke="var(--color-divider)"
                  strokeWidth="1"
                />
              ))}
              <path
                d="M 0 20 C 80 40, 140 110, 300 165"
                fill="none"
                stroke="var(--color-text-muted)"
                strokeWidth="2"
                strokeDasharray="6 4"
              />
              <path
                d="M 0 40 L 60 38 L 120 36 L 180 34 L 240 32 L 300 30"
                fill="none"
                stroke="var(--color-primary)"
                strokeWidth="3"
              />
              {[60, 120, 180, 240].map((x) => (
                <circle key={x} cx={x} cy="38" r="4" fill="var(--color-primary)" />
              ))}
            </svg>
            <div className="absolute inset-x-6 bottom-0 flex justify-between text-2xs font-medium text-text-secondary">
              <span>{t('onboarding.day1', 'Jour 1')}</span>
              <span>{t('onboarding.day7', 'Jour 7')}</span>
              <span>{t('onboarding.month1', 'Mois 1')}</span>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-5">
            <div className="flex items-center gap-2">
              <span className="h-0.5 w-3 rounded-full bg-primary" />
              <span className="text-xs font-medium text-text-primary">
                {t('onboarding.optimalRetention', 'Rétention optimale')}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-0.5 w-3 border-t-2 border-dashed border-text-muted" />
              <span className="text-xs text-text-secondary">
                {t('onboarding.naturalForgetting', 'Oubli naturel')}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {benefits.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="flex items-start gap-4 rounded-2xl bg-surface p-4 shadow-sm"
            >
              <div className="icon-chip flex h-11 w-11 shrink-0 items-center justify-center rounded-full">
                <DuoIcon icon={Icon} size={20} />
              </div>
              <div className="flex-1">
                <p className="text-base font-semibold text-text-primary">{title}</p>
                <p className="mt-1 text-sm leading-6 text-text-secondary">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </OnboardingShell>
  );
}
