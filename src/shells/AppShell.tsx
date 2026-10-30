/**
 * AppShell — le seul aiguillage de structure de l'application.
 *
 * Règle : **un seul shell monté à la fois**. Sous 768 px, aucun élément de
 * bureau n'existe dans le DOM (ni rail, ni en-tête de bureau) ; au-delà, ni
 * barre d'onglets basse, ni tiroir, ni dock. C'est ce qui évite les contrôles
 * dupliqués, les doubles `aria-label` et les pièges de focus que produirait un
 * rendu simultané des trois variantes masquées en CSS.
 *
 * Le choix est fait par `useShellKind()` (média queries réelles, seuils 768 et
 * 1024 déjà utilisés par le reste du produit) : redimensionner la fenêtre
 * change de shell sans rechargement, et l'iframe de prévisualisation déclenche
 * exactement la même bascule puisqu'elle a une largeur de viewport réelle.
 */

import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { MobileShell } from '@/shells/MobileShell';
import { DesktopShell } from '@/shells/DesktopShell';
import { ShellContext, type ShellContextValue } from '@/shells/shell-context';
import { useShellKind } from '@/hooks/useShell';
import { useIsDesktop } from '@/hooks/useIsDesktop';
import { isReadingRoute } from '@/shells/panel-routes';

export function AppShell() {
  const kind = useShellKind();
  const isDesktop = useIsDesktop();
  const { pathname } = useLocation();

  const hasSidePanel = isDesktop && isReadingRoute(pathname);

  const contextValue = useMemo<ShellContextValue>(
    () => ({ kind, hasSidePanel }),
    [kind, hasSidePanel],
  );

  return (
    <ShellContext.Provider value={contextValue}>
      {kind === 'mobile' ? <MobileShell /> : <DesktopShell />}
    </ShellContext.Provider>
  );
}

export default AppShell;
