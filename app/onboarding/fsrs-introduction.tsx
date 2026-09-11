/**
 * FSRS Introduction — Onboarding final step
 * Visual intro of the FSRS algorithm + 3 benefits + final CTA.
 */

import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Brain, CheckCircle, Timer, FlaskConical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSettingsStore } from '@/store/settings-store';

export default function FSRSIntroductionScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { completeOnboarding } = useSettingsStore();

  const handleStartMemorization = () => {
    void completeOnboarding();
    navigate('/tabs/home', { replace: true });
  };

  const benefits = [
    {
      icon: Timer,
      title: t('onboarding.benefit1Title', 'Rythme optimal'),
      desc: t('onboarding.benefit1Desc', 'Révisez chaque verset juste avant de l\'oublier, maximisant la rétention avec un effort minimal.'),
      bg: 'bg-icon-bg-rose',
      color: 'text-primary',
    },
    {
      icon: CheckCircle,
      title: t('onboarding.benefit2Title', 'Moins de révisions'),
      desc: t('onboarding.benefit2Desc', 'Ne perdez pas de temps sur ce que vous savez déjà. Concentrez-vous sur ce qui nécessite votre attention.'),
      bg: 'bg-icon-bg-purple',
      color: 'text-text-secondary',
    },
    {
      icon: FlaskConical,
      title: t('onboarding.benefit3Title', 'Scientifiquement prouvé'),
      desc: t('onboarding.benefit3Desc', 'Basé sur la recherche cognitive avancée (Free Spaced Repetition Scheduler).'),
      bg: 'bg-success',
      color: 'text-white',
    },
  ];

  return (
    <div className="relative flex min-h-full flex-col">
      {/* Hero */}
      <div className="flex flex-col items-center px-6 pb-6 pt-10">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-surface-tint">
          <Brain size={28} className="text-primary" />
        </div>
        <h1 className="text-center text-lg font-semibold text-text-primary">
          {t('onboarding.fsrsTitle', 'La science de la mémorisation')}
        </h1>
        <p className="mt-3 max-w-sm text-center text-sm leading-6 text-text-secondary">
          {t('onboarding.fsrsDesc', 'Découvrez FSRS : un algorithme intelligent qui s\'adapte à votre cerveau pour une mémorisation durable des Écritures.')}
        </p>
      </div>

      {/* Retention curve (simple SVG) */}
      <div className="mx-6 overflow-hidden rounded-3xl bg-surface p-6 shadow-sm">
        <div className="relative h-48">
          <svg viewBox="0 0 300 180" className="h-full w-full" aria-hidden>
            {/* grid lines */}
            {[0, 60, 120, 180].map((y) => (
              <line key={y} x1="0" y1={y} x2="300" y2={y} stroke="var(--color-divider)" strokeWidth="1" />
            ))}
            {/* natural forgetting curve */}
            <path
              d="M 0 20 C 80 40, 140 110, 300 165"
              fill="none"
              stroke="var(--color-text-muted)"
              strokeWidth="2"
              strokeDasharray="6 4"
            />
            {/* optimal retention curve with FSRS */}
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
          {/* X-axis labels */}
          <div className="absolute inset-x-8 bottom-0 flex justify-between text-[10px] text-text-secondary">
            <span>Jour 1</span>
            <span>Jour 7</span>
            <span>Mois 1</span>
          </div>
        </div>
        <div className="mt-4 flex gap-6">
          <div className="flex items-center gap-2">
            <span className="h-0.5 w-3 rounded-full bg-primary" />
            <span className="text-xs text-text-primary">Rétention Optimale</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-0.5 w-3 border-t-2 border-dashed border-text-muted" />
            <span className="text-xs text-text-secondary">Oubli Naturel</span>
          </div>
        </div>
      </div>

      {/* Benefits */}
      <div className="mt-8 flex flex-col gap-4 px-6">
        {benefits.map(({ icon: Icon, title, desc, bg, color }) => (
          <div key={title} className="flex items-start gap-4 rounded-2xl bg-surface p-4 shadow-sm">
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${bg}`}>
              <Icon size={22} className={color} />
            </div>
            <div className="flex-1">
              <p className="text-base font-semibold text-text-primary">{title}</p>
              <p className="mt-1 text-sm leading-6 text-text-secondary">{desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Fixed bottom CTA */}
      <div className="mt-8 border-t border-border/50 bg-surface/80 p-6 backdrop-blur">
        <Button className="w-full" onClick={handleStartMemorization}>
          {t('onboarding.getStarted', 'Commencer à mémoriser')}
          <ArrowRight size={16} />
        </Button>
      </div>
    </div>
  );
}
