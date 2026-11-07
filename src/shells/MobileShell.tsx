import { BackgroundPanel } from '@/components/ui/BackgroundPanel';
/**
 * MobileShell — la structure mobile, extraite telle quelle de
 * `app/(tabs)/_layout.tsx` (aucun changement de comportement).
 *
 * Principes préservés :
 *  - une seule barre d'onglets basse, compacte, atteignable au pouce ;
 *  - bouton de menu (tiroir) et FAB « nouvelle session » à portée de pouce ;
 *  - `pb-[env(safe-area-inset-bottom)]` sur la barre basse : pas de commande
 *    sous l'indicateur d'accueil iOS ;
 *  - le clavier : Ionic (`IonPage`) gère le redimensionnement, la zone de
 *    contenu est `min-h-0 flex-1 overflow-hidden` pour que le scroll reste
 *    interne et que le champ actif ne soit jamais masqué ;
 *  - aucune barre latérale de bureau n'est montée ici.
 */

import { IonFab, IonFabButton, IonPage } from '@ionic/react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { DuoIcon } from '@/components/ui/DuoIcon';
import { Menu01Icon, PlusSignIcon } from '@/components/ui/solar-icons';
import { BottomTabs } from '@/components/navigation/BottomTabs';
import { QuickDock } from '@/components/navigation/QuickDock';
import { HamburgerMenu } from '@/components/navigation/HamburgerMenu';
import { Logo } from '@/components/brand/Logo';
import { useUiStore } from '@/store/ui-store';
import { DemoModeBadge } from '@/components/dev/DemoModeBadge';

export function MobileShell() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const openMenu = useUiStore((s) => s.openMenu);

  return (
    <>
      <HamburgerMenu />
      <IonPage>
        <div
          id="main-content"
          className="app-main app-canvas relative flex h-full flex-col overflow-hidden bg-background"
        >
          <div className="mobile-header g1 flex items-center justify-between px-4 py-2">
            <button
              onClick={openMenu}
              className="touch-target rounded-full active:bg-surface-tint"
              aria-label={t('shell.openMenu', 'Ouvrir le menu')}
            >
              <DuoIcon icon={Menu01Icon} size={23} color="var(--color-text-primary)" />
            </button>
            <div className="flex items-center gap-2">
              <span className="brand-tile"><Logo size={24} /></span>
              <span className="text-primary text-base font-extrabold">VersyFlow</span>
            </div>
            <div className="flex items-center justify-end gap-1.5">
              <DemoModeBadge />
              <BackgroundPanel />
            </div>
          </div>

          <div className="mobile-content min-h-0 flex-1 overflow-hidden">
            <Outlet />
          </div>

          <IonFab horizontal="end" vertical="bottom" style={{ marginBottom: '116px' }}>
            <IonFabButton
              onClick={() => navigate('/memorization/session')}
              aria-label={t('shell.newSession', 'Nouvelle session de mémorisation')}
            >
              <DuoIcon icon={PlusSignIcon} size={24} />
            </IonFabButton>
          </IonFab>

          <QuickDock />
          <BottomTabs />
        </div>
      </IonPage>
    </>
  );
}

export default MobileShell;
