/**
 * OnboardingShell — coquille premium de l'onboarding, entièrement pilotée
 * par le thème actif (preset tweakcn / fond personnalisé) : grand titre
 * serif, carte en verre teinté, progression animée (Motion), CTA pill.
 * Aucune couleur propre : tout vient des variables du thème.
 */
import type { ReactNode } from 'react';
import { motion } from 'motion/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { SparklesIcon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';

interface OnboardingShellProps {
  step: number;
  totalSteps?: number;
  title: string;
  subtitle?: string;
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
  onSkip,
  skipLabel = 'Passer',
  children,
  footer,
}: OnboardingShellProps) {
  return (
    <div className="screen-column-narrow flex min-h-full flex-col px-6 pb-8 pt-4">
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-bold text-primary">
          <HugeiconsIcon icon={SparklesIcon} size={13} />
          VersyFlow
        </span>
        {onSkip && (
          <button
            onClick={onSkip}
            className="text-sm font-semibold text-text-muted transition active:opacity-60"
          >
            {skipLabel}
          </button>
        )}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="mt-10"
      >
        <h1 className="text-[34px] font-extrabold leading-[1.08] tracking-tight text-text-primary">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-3 text-[15px] leading-relaxed text-text-secondary">{subtitle}</p>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.08, ease: 'easeOut' }}
        className="mt-8 flex-1"
      >
        {children}
      </motion.div>

      <div className="mt-8">
        <div className="mb-6 flex items-center gap-1.5" aria-hidden>
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
