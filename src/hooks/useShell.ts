/**
 * useShell — les trois contextes de présentation, à partir des seuils qui
 * existent déjà dans le dépôt.
 *
 * Pourquoi ce fichier plutôt qu'un nouveau couple de seuils ?
 * `useIsDesktop.ts` porte déjà **une seule** source de vérité pour 768 px et
 * 1024 px (elle est vérifiée par l'audit C09). Ce module ne réinvente rien :
 * il compose ces deux booléens en un nom de contexte, ce qui évite qu'un
 * écran écrive `isRail && !isDesktop ? … : …` et se trompe de borne.
 *
 *   mobile  : < 768 px  → barre d'onglets basse, tiroir, FAB
 *   tablet  : 768–1023 px → rail replié (icônes), pas de barre basse
 *   desktop : ≥ 1024 px → rail dépliable, en-tête global, panneau secondaire
 *
 * Le CSS reste l'arbitre de la mise en page (`.app-main`, `--rail`,
 * `.screen-column`) ; ce hook ne sert qu'aux décisions de **structure**
 * (quel shell monter), jamais au style.
 */

import { useIsDesktop, useIsRail } from '@/hooks/useIsDesktop';

export type ShellKind = 'mobile' | 'tablet' | 'desktop';

export function useShellKind(): ShellKind {
  const isRail = useIsRail();
  const isDesktop = useIsDesktop();

  if (isDesktop) return 'desktop';
  if (isRail) return 'tablet';
  return 'mobile';
}

/** Vrai quand une navigation latérale existe (tablette et bureau). */
export function useHasRail(): boolean {
  return useIsRail();
}
