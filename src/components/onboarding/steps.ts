/**
 * Le parcours d'entrée — une seule liste, lue par la coquille.
 *
 * L'ordre EST le parcours : la coquille en déduit le numéro d'étape, le total,
 * le bouton « Retour » et l'étape suivante. Ajouter une étape ici suffit à la
 * faire apparaître dans la progression du web comme dans celle du mobile —
 * aucune des deux mises en page ne tient sa propre copie de la liste.
 */
export const ONBOARDING_STEPS = [
  { id: 'welcome', path: '/onboarding/welcome', labelKey: 'onboarding.stepWelcome', fallback: 'Bienvenue' },
  {
    id: 'language',
    path: '/onboarding/language-select',
    labelKey: 'onboarding.stepLanguage',
    fallback: 'Langue',
  },
  {
    id: 'appearance',
    path: '/onboarding/personalization',
    labelKey: 'onboarding.stepAppearance',
    fallback: 'Apparence',
  },
  {
    id: 'translation',
    path: '/onboarding/translation-select',
    labelKey: 'onboarding.stepTranslation',
    fallback: 'Traduction',
  },
  {
    id: 'rhythm',
    path: '/onboarding/session-config',
    labelKey: 'onboarding.stepRhythm',
    fallback: 'Rythme',
  },
  {
    id: 'reminders',
    path: '/onboarding/reminder-config',
    labelKey: 'onboarding.stepReminders',
    fallback: 'Rappels',
  },
  {
    id: 'ready',
    path: '/onboarding/fsrs-introduction',
    labelKey: 'onboarding.stepReady',
    fallback: 'Prêt',
  },
] as const;

export type OnboardingStepId = (typeof ONBOARDING_STEPS)[number]['id'];

export const ONBOARDING_TOTAL_STEPS = ONBOARDING_STEPS.length;

export function onboardingStepIndex(id: OnboardingStepId): number {
  return ONBOARDING_STEPS.findIndex((step) => step.id === id);
}

/** Chemin de l'étape suivante, ou `null` si c'est la dernière. */
export function onboardingNextPath(id: OnboardingStepId): string | null {
  const index = onboardingStepIndex(id);
  return ONBOARDING_STEPS[index + 1]?.path ?? null;
}

/** Chemin de l'étape précédente, ou `null` si c'est la première. */
export function onboardingPreviousPath(id: OnboardingStepId): string | null {
  const index = onboardingStepIndex(id);
  return index > 0 ? ONBOARDING_STEPS[index - 1].path : null;
}
