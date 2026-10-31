/**
 * OnboardingShell — coquille premium de l'onboarding, entièrement pilotée
 * par le thème actif (preset tweakcn / fond personnalisé) : grand titre
 * serif, carte en verre teinté, progression animée (Motion, respectant
 * `prefers-reduced-motion`), retour arrière et CTA pill accessibles.
 * Aucune couleur propre : tout vient des variables du thème.
 */
import type { ReactNode } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { DuoIcon } from '@/components/ui/DuoIcon';
import { ArrowLeft01Icon, SparklesIcon } from '@/components/ui/solar-icons';
import { cn } from '@/lib/utils';

interface OnboardingShellProps {
  step: number;
  totalSteps?: number;
  title: string;
  subtitle?: string;
  onBack?: () => void;
  backLabel?: string;
  onSkip?: () => void;
  skipLabel?: string;
  children?: ReactNode;
  footer: ReactNode;
}

export function OnboardingShell({
  step,
  totalSteps = 6,
  title,
  subtitle,
  onBack,
  backLabel = 'Retour',
  onSkip,
  skipLabel = 'Passer',
  children,
  footer,
}: OnboardingShellProps) {
  const reducedMotion = useReducedMotion();

  return (
    <div className="screen-column-narrow flex min-h-full flex-col px-6 pb-8 pt-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              aria-label={backLabel}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-surface text-text-secondary shadow-sm transition hover:bg-surface-tint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <DuoIcon icon={ArrowLeft01Icon} size={20} />
            </button>
          )}
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-2xs font-bold text-primary">
            <DuoIcon icon={SparklesIcon} size={13} />
            VersyFlow · {step}/{totalSteps}
          </span>
        </div>
        {onSkip && (
          <button
            type="button"
            onClick={onSkip}
            className="rounded-lg px-2 py-1 text-sm font-semibold text-text-muted transition hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary active:opacity-60"
          >
            {skipLabel}
          </button>
        )}
      </div>

      <motion.div
        initial={reducedMotion ? false : { opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={reducedMotion ? { duration: 0 } : { duration: 0.45, ease: 'easeOut' }}
        className="mt-8"
      >
        <h1 className="font-serif text-display font-normal leading-[1.08] tracking-tight text-text-primary">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-3 text-sm leading-relaxed text-text-secondary">{subtitle}</p>
        )}
      </motion.div>

      <motion.div
        initial={reducedMotion ? false : { opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={reducedMotion ? { duration: 0 } : { duration: 0.5, delay: 0.08, ease: 'easeOut' }}
        className="mt-6 flex-1"
      >
        {children}
      </motion.div>

      <div className="mt-8">
        <div
          className="mb-6 flex items-center gap-1.5"
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={totalSteps}
          aria-valuenow={step}
          aria-label={`Étape ${step} sur ${totalSteps}`}
        >
          {Array.from({ length: totalSteps }).map((_, i) => (
            <span
              key={i}
              className={cn(
                'h-1.5 rounded-full transition-all duration-300',
                i < step ? 'w-6 bg-primary' : 'w-1.5 bg-border',
              )}
            />
          ))}
        </div>
        {footer}
      </div>
    </div>
  );
}

export default OnboardingShell;
