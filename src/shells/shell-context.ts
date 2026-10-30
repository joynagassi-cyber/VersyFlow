/**
 * Contexte de coquille — la seule chose qu'un écran a besoin de savoir sur la
 * structure qui le contient.
 *
 * Un écran ne doit **jamais** refaire `matchMedia` pour décider de sa mise en
 * page : le CSS s'en charge (`@media`, `.screen-column`). Ce contexte existe
 * pour les rares cas où la *structure* change réellement — par exemple un
 * écran qui affiche une colonne de commentaires uniquement au bureau, ou qui
 * remplace une feuille modale par une boîte de dialogue.
 *
 * Fichier séparé du composant `AppShell` volontairement : un contexte dans un
 * fichier qui exporte aussi un composant casse le Fast Refresh de Vite.
 */

import { createContext, useContext } from 'react';
import type { ShellKind } from '@/hooks/useShell';

export interface ShellContextValue {
  /** Contexte de présentation courant. */
  kind: ShellKind;
  /** Vrai quand un panneau secondaire est monté à côté du contenu. */
  hasSidePanel: boolean;
}

const DEFAULT_SHELL: ShellContextValue = { kind: 'mobile', hasSidePanel: false };

export const ShellContext = createContext<ShellContextValue>(DEFAULT_SHELL);

export function useShellContext(): ShellContextValue {
  return useContext(ShellContext);
}
