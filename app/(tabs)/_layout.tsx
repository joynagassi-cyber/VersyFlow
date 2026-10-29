import { IonPage, IonFab, IonFabButton } from '@ionic/react';
import { Outlet, useNavigate } from 'react-router-dom';
import { HugeiconsIcon } from '@hugeicons/react';
import { Menu01Icon, PlusSignIcon } from '@hugeicons/core-free-icons';
import SyncStatusIndicator from '@/components/common/SyncStatusIndicator';
import { BottomTabs } from '@/components/navigation/BottomTabs';
import { QuickDock } from '@/components/navigation/QuickDock';
import { HamburgerMenu } from '@/components/navigation/HamburgerMenu';
import { DesktopRail } from '@/components/navigation/DesktopRail';
import { Logo } from '@/components/brand/Logo';
import { useIsDesktop, useIsRail } from '@/hooks/useIsDesktop';
import { useUiStore } from '@/store/ui-store';

/**
 * Coquille de l'application.
 *
 * Deux mises en page, jamais les deux en même temps :
 *  - < 1024 px : barre de marque + tiroir + barre d'onglets basse (existant) ;
 *  - ≥ 1024 px : rail de navigation à gauche (DesktopRail) + colonne de
 *    contenu. La barre basse, le tiroir et le dock flottant ne sont PAS
 *    montés : pas de navigation en double dans le DOM ni dans l'arbre
 *    d'accessibilité.
 *
 * La largeur du rail est entièrement décidée par le CSS (`--rail`), posée sur
 * <html data-rail> par DesktopRail ; ce composant ne fait qu'ouvrir la marge.
 */
export default function TabLayout() {
  const navigate = useNavigate();
  const openMenu = useUiStore((s) => s.openMenu);
  const isDesktop = useIsDesktop();
  // Tablette (768–1023 px) : rail replié, pas de barre d'onglets basse.
  const isRail = useIsRail();

  return (
    <>
      {!isRail && <HamburgerMenu />}
      {isRail && <DesktopRail />}
      <IonPage>
        <div
          id="main-content"
          className="app-main app-canvas relative flex h-full flex-col overflow-hidden bg-background"
        >
          <div className="flex items-center justify-between px-4 py-2">
            {isDesktop ? (
              <div className="flex min-h-[40px] items-center gap-2">
                <span className="text-sm font-semibold text-text-secondary">
                  {/* En-tête de bureau : la page se nomme elle-même, pas le produit. */}
                  Espace de travail
                </span>
              </div>
            ) : (
              <button
                onClick={openMenu}
                className="rounded-full p-1.5 active:bg-surface-tint"
                aria-label="Ouvrir le menu"
              >
                <HugeiconsIcon icon={Menu01Icon} size={23} color="var(--color-text-primary)" />
              </button>
            )}
            {!isDesktop && (
              <div className="flex items-center gap-2">
                <Logo size={24} />
                <span className="text-primary text-base font-extrabold">VersyFlow</span>
              </div>
            )}
            <div className="flex w-12 items-center justify-end">
              <SyncStatusIndicator />
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-hidden">
            <Outlet />
          </div>

          {!isRail && (
            <IonFab horizontal="end" vertical="bottom" style={{ marginBottom: '116px' }}>
              <IonFabButton
                onClick={() => navigate('/memorization/session')}
                aria-label="Nouvelle session de memorisation"
              >
                <HugeiconsIcon icon={PlusSignIcon} size={24} />
              </IonFabButton>
            </IonFab>
          )}

          {!isRail && <QuickDock />}
          {!isRail && <BottomTabs />}
        </div>
      </IonPage>
    </>
  );
}
