/**
 * DesktopShell — la structure de bureau (et de tablette) de VersyFlow.
 *
 * Différence avec la version mobile, et pourquoi elle existe :
 *  - `DesktopRail` (déjà présent) donne une navigation **persistante**, avec un
 *    état actif signalé par `aria-current` *et* un trait plus épais — pas par
 *    la seule couleur ;
 *  - `DesktopHeader` porte les actions **globales** (recherche, sync,
 *    notifications, profil) une fois, en haut ;
 *  - la zone principale garde la mesure de lecture : les écrans portent
 *    `.screen-column` / `.screen-column-narrow`, on ne les étire pas ;
 *  - `ReadingPanel` n'est monté que là où il sert.
 *
 * Ce que ce fichier ne fait pas : monter un écran. Le `Outlet` est le même que
 * celui de `MobileShell` — donc les mêmes composants, les mêmes hooks, les
 * mêmes services, les mêmes règles métier.
 */

import { IonPage } from '@ionic/react';
import { Outlet, useLocation } from 'react-router-dom';
import { DesktopRail } from '@/components/navigation/DesktopRail';
import { DesktopHeader } from '@/shells/DesktopHeader';
import { ReadingPanel } from '@/shells/ReadingPanel';
import { useIsDesktop } from '@/hooks/useIsDesktop';
import { isReadingRoute } from '@/shells/panel-routes';

export function DesktopShell() {
  const location = useLocation();
  const isDesktop = useIsDesktop();

  // Le panneau n'apparaît qu'au bureau ET sur une route de lecture : sous
  // 1024 px il volerait la largeur du texte (voir `panel-routes.ts`).
  const hasPanel = isDesktop && isReadingRoute(location.pathname);

  return (
    <>
      <DesktopRail />
      <IonPage>
        <div
          id="main-content"
          className="app-main app-canvas flex h-full flex-col overflow-hidden bg-background"
        >
          <DesktopHeader />

          <div className="flex min-h-0 flex-1">
            <main className="min-h-0 min-w-0 flex-1 overflow-hidden">
              <Outlet />
            </main>
            {hasPanel && <ReadingPanel />}
          </div>
        </div>
      </IonPage>
    </>
  );
}

export default DesktopShell;
