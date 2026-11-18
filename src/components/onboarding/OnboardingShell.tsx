/**
 * OnboardingShell — la coquille du parcours d'entrée, dans SES DEUX MISES EN
 * PAGE. Le contenu des étapes est partagé ; la présentation, non :
 *
 *  · **Web (≥ 1100 px)** — deux colonnes. À gauche, un panneau teinté par le
 *    thème choisi : marque, sommaire numéroté des sept étapes (avec leur nom en
 *    clair, pas seulement des points), et le verset d'appui. À droite, l'étape
 *    dans une colonne de lecture confortable, avec son bouton d'action en bas.
 *    On peut revenir en arrière par le sommaire.
 *
 *  · **Mobile (< 1100 px)** — une seule colonne, plein écran : en-tête compact
 *    (marque, numéro d'étape, « Passer »), barre de progression segmentée,
 *    titre, contenu, puis action principale collée en bas, à portée de pouce.
 *
 * Les deux versions lisent la MÊME liste (`steps.ts`) : il n'existe pas deux
 * parcours à maintenir, seulement deux façons de le montrer.
 *
 * Aucune couleur en dur : tout vient des jetons du thème actif (`--color-*`),
 * pour que l'écran de personnalisation se voie immédiatement ici aussi.
 */
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { DuoIcon } from '@/components/ui/DuoIcon';
import { ArrowLeft01Icon, CheckIcon } from '@/components/ui/solar-icons';
import { Logo } from '@/components/brand/Logo';
import { cn } from '@/lib/utils';
import {
  ONBOARDING_STEPS,
  ONBOARDING_TOTAL_STEPS,
  onboardingNextPath,
  onboardingPreviousPath,
  onboardingStepIndex,
  type OnboardingStepId,
} from './steps';

interface OnboardingShellProps {
  stepId: OnboardingStepId;
  title: string;
  subtitle?: string;
  /** Précision affichée au-dessus du titre (« Étape 3 · Apparence »). */
  eyebrow?: string;
  children: ReactNode;
  /** Libellé de l'action principale (verbe + objet, jamais « Continuer »). */
  nextLabel: string;
  onNext?: () => void;
  nextDisabled?: boolean;
  /** Action secondaire sous le bouton principal (ex. « Plus tard »). */
  footerHint?: ReactNode;
  /** Bouton « Passer » : absent = on ne peut pas sauter cette étape. */
  onSkip?: () => void;
  skipLabel?: string;
  /** Complément affiché dans le panneau gauche, version web seulement. */
  asideExtra?: ReactNode;
}

export function OnboardingShell({
  stepId,
  title,
  subtitle,
  eyebrow,
  children,
  nextLabel,
  onNext,
  nextDisabled = false,
  footerHint,
  onSkip,
  skipLabel,
  asideExtra,
}: OnboardingShellProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const index = onboardingStepIndex(stepId);
  const step = index + 1;
  const total = ONBOARDING_TOTAL_STEPS;
  const currentStep = ONBOARDING_STEPS[index];
  const nextPath = onboardingNextPath(stepId);
  const previousPath = onboardingPreviousPath(stepId);

  const goNext = () => {
    if (nextDisabled) return;
    if (onNext) {
      onNext();
      return;
    }
    if (nextPath) navigate(nextPath);
  };

  return (
    <div className="min-h-full bg-background">
      <div className="mx-auto flex min-h-full w-full max-w-6xl flex-col lg:min-h-screen lg:flex-row">
        {/* ── Panneau gauche : web uniquement ───────────────────────────── */}
        <aside className="onboarding-aside relative hidden w-[38%] shrink-0 flex-col justify-between overflow-hidden p-10 lg:flex xl:p-12">
          <div className="onboarding-orb" aria-hidden="true" />
          <div className="relative">
            <div className="flex items-center gap-3">
              <Logo size={32} />
              <span className="text-lg font-extrabold tracking-tight text-text-primary">VersyFlow</span>
            </div>

            <ol className="mt-12 space-y-1" aria-label={t('onboarding.progressLabel', 'Étapes du parcours')}>
              {ONBOARDING_STEPS.map((item, position) => {
                const state =
                  position + 1 === step ? 'current' : position + 1 < step ? 'done' : 'todo';
                const reachable = position + 1 < step && item.path !== undefined;
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => reachable && navigate(item.path)}
                      disabled={!reachable}
                      aria-current={state === 'current' ? 'step' : undefined}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition-colors',
                        state === 'current' && 'bg-surface shadow-sm',
                        reachable ? 'hover:bg-surface/60' : 'cursor-default',
                      )}
                    >
                      <span
                        aria-hidden="true"
                        className={cn(
                          'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                          state === 'current' && 'bg-primary text-primary-foreground',
                          state === 'done' && 'bg-primary/15 text-primary',
                          state === 'todo' && 'bg-border/60 text-text-muted',
                        )}
                      >
                        {state === 'done' ? <DuoIcon icon={CheckIcon} size={16} /> : position + 1}
                      </span>
                      <span
                        className={cn(
                          'text-sm',
                          state === 'current' && 'font-semibold text-text-primary',
                          state === 'done' && 'text-text-secondary',
                          state === 'todo' && 'text-text-muted',
                        )}
                      >
                        {t(item.labelKey, item.fallback)}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </div>

          <div className="relative mt-10">
            {asideExtra}
            <figure className="mt-8 border-t border-border pt-6">
              <blockquote className="font-serif text-[15px] italic leading-relaxed text-text-secondary">
                {t(
                  'onboarding.asideVerse',
                  '« Ta parole est une lampe à mes pieds, et une lumière sur mon sentier. »',
                )}
              </blockquote>
              <figcaption className="mt-2 text-2xs font-bold uppercase tracking-[0.08em] text-primary">
                {t('onboarding.asideVerseRef', 'Psaumes 119:105 · LSG')}
              </figcaption>
            </figure>
          </div>
        </aside>

        {/* ── Colonne principale : mobile d'abord, élargie sur web ──────── */}
        <section className="screen-column-narrow flex min-h-full flex-1 flex-col px-5 pb-6 pt-4 sm:px-8 lg:justify-between lg:px-12 lg:py-12">
          {/* En-tête mobile : marque, étape, passer */}
          <header className="flex items-center justify-between lg:hidden">
            <div className="flex items-center gap-2">
              <Logo size={32} />
              <span className="text-base font-extrabold tracking-tight text-text-primary">VersyFlow</span>
            </div>
            {onSkip ? (
              <button
                type="button"
                onClick={onSkip}
                className="min-h-11 rounded-full px-3 text-sm font-semibold text-text-muted active:opacity-60"
              >
                {skipLabel ?? t('common.skip', 'Passer')}
              </button>
            ) : (
              <span className="text-sm font-semibold tabular-nums text-text-muted">
                {t('onboarding.stepCounter', '{{current}}/{{total}}', { current: step, total })}
              </span>
            )}
          </header>

          {/* Progression mobile : segments + compteur */}
          <div className="mt-4 lg:hidden">
            <div
              className="flex gap-1.5"
              role="progressbar"
              aria-valuemin={1}
              aria-valuemax={total}
              aria-valuenow={step}
              aria-label={t('onboarding.progressLabel', 'Étapes du parcours')}
            >
              {ONBOARDING_STEPS.map((item, position) => (
                <span
                  key={item.id}
                  className={cn(
                    'h-1.5 flex-1 rounded-full transition-colors',
                    position + 1 <= step ? 'bg-primary' : 'bg-border',
                  )}
                />
              ))}
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-2xs font-semibold uppercase tracking-[0.14em] text-text-muted">
                {t('onboarding.stepOf', 'Étape {{current}} sur {{total}}', { current: step, total })}
              </span>
              <span className="text-2xs text-text-muted">
                {t(currentStep.labelKey, currentStep.fallback)}
              </span>
            </div>
          </div>

          {/* Contenu de l'étape */}
          <div key={stepId} className="onboarding-enter mt-7 flex-1 lg:mt-0">
            {previousPath && (
              <button
                type="button"
                onClick={() => navigate(previousPath)}
                className="mb-4 hidden min-h-11 items-center gap-2 rounded-full pe-3 text-sm font-semibold text-text-secondary transition hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary lg:inline-flex"
              >
                <DuoIcon icon={ArrowLeft01Icon} size={20} />
                {t('common.back', 'Retour')}
              </button>
            )}

            {eyebrow && (
              <p className="mb-2 text-2xs font-bold uppercase tracking-[0.16em] text-primary">{eyebrow}</p>
            )}
            <h1 className="text-[30px] font-extrabold leading-[1.1] tracking-tight text-text-primary sm:text-[34px] lg:text-[36px]">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-3 max-w-[46ch] text-[15px] leading-relaxed text-text-secondary">{subtitle}</p>
            )}
            <div className="mt-7">{children}</div>
          </div>

          {/* Actions — collées en bas sur mobile, alignées à droite sur web */}
          <footer className="onboarding-footer sticky bottom-0 mt-8 bg-background/95 pb-1 pt-3 backdrop-blur lg:static lg:mt-10 lg:bg-transparent lg:p-0 lg:backdrop-blur-none">
            {previousPath && (
              <button
                type="button"
                onClick={() => navigate(previousPath)}
                className="mb-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-border text-sm font-semibold text-text-secondary active:opacity-70 lg:hidden"
              >
                <DuoIcon icon={ArrowLeft01Icon} size={20} />
                {t('common.back', 'Retour')}
              </button>
            )}
            <button
              type="button"
              onClick={goNext}
              disabled={nextDisabled}
              className={cn(
                'flex min-h-[54px] w-full items-center justify-center gap-2 rounded-full bg-primary px-6 text-[15px] font-bold text-primary-foreground transition active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background lg:w-auto lg:min-w-[240px] lg:self-end',
                nextDisabled && 'cursor-not-allowed opacity-50 active:scale-100',
              )}
            >
              {nextLabel}
            </button>
            {footerHint && <div className="mt-3 text-center text-2xs text-text-muted lg:text-end">{footerHint}</div>}
          </footer>
        </section>
      </div>
    </div>
  );
}

export default OnboardingShell;
