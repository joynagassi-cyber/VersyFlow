import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { Logo } from '@/components/brand/Logo';
import { useAuthStore } from '@/store/auth-store';
import { useUiStore, ALL_MENU_ITEMS } from '@/store/ui-store';
import { cn } from '@/lib/utils';

const itemClass =
  'rounded-xl px-4 py-3 text-start text-sm font-medium text-text-primary transition active:bg-surface-tint';

/** Self-managed slide-in drawer (RTL-safe), driven by ui-store menuOpen. */
export function HamburgerMenu() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { menuOpen, closeMenu, visibleMenuPaths } = useUiStore();
  const { signOut, isAuthenticated, user } = useAuthStore();

  // The Navigation section is filtered by the user's per-page visibility
  // toggles (app/settings/navigation). The Account section below is always
  // shown so settings/sign-out stay reachable even when everything else
  // is hidden.
  const visibleItems = ALL_MENU_ITEMS.filter((item) => visibleMenuPaths.includes(item.path));

  const go = (p: string) => {
    closeMenu();
    navigate(p);
  };

  return (
    <div className={cn('fixed inset-0 z-50', !menuOpen && 'pointer-events-none')} aria-hidden={!menuOpen}>
      <div
        className={cn(
          'absolute inset-0 bg-black/40 transition-opacity duration-200',
          menuOpen ? 'opacity-100' : 'opacity-0',
        )}
        onClick={closeMenu}
      />
      <aside
        className={cn(
          'absolute inset-y-0 start-0 flex w-72 max-w-[80vw] flex-col bg-surface shadow-xl transition-transform duration-200',
          menuOpen ? 'translate-x-0' : '-translate-x-full rtl:translate-x-full',
        )}
      >
        <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
          <div className="flex items-center gap-3">
            <Logo size={38} />
            <div className="leading-tight">
              <span className="text-gradient-hero text-base font-extrabold">VersyFlow</span>
              <div className="text-xs text-text-muted">{user?.display_name || 'Mode local'}</div>
            </div>
          </div>
          <button
            onClick={closeMenu}
            className="rounded-full p-1.5 active:bg-surface-tint"
            aria-label="Fermer"
          >
            <X size={20} className="text-text-muted" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-3">
          <p className="px-2 pt-1 text-xs font-bold uppercase tracking-wide text-text-muted">
            {t('nav.menu', 'Navigation')}
          </p>
          <div className="mt-1 flex flex-col gap-1">
            {visibleItems.map(({ path, labelKey, label }) => (
              <button key={path} onClick={() => go(path)} className={itemClass}>
                {t(labelKey, label)}
              </button>
            ))}
          </div>

          <div className="my-2 h-px bg-border" />
          <p className="px-2 text-xs font-bold uppercase tracking-wide text-text-muted">
            {t('nav.account', 'Compte')}
          </p>
          <div className="mt-1 flex flex-col gap-1">
            <button onClick={() => go('/profile')} className={itemClass}>
              {t('nav.profile', 'Profil')}
            </button>
            <button onClick={() => go('/settings/appearance')} className={itemClass}>
              {t('nav.theme', 'Theme et Apparence')}
            </button>
            <button onClick={() => go('/settings/theme-picker')} className={itemClass}>
              {t('nav.themeImage', "Thèmes d'image")}
            </button>
            <button onClick={() => go('/settings')} className={itemClass}>
              {t('nav.settings', 'Reglages')}
            </button>
            {isAuthenticated && (
              <button
                onClick={() => {
                  closeMenu();
                  signOut();
                  navigate('/auth');
                }}
                className={cn(itemClass, 'text-error')}
              >
                {t('nav.signOut', 'Se deconnecter')}
              </button>
            )}
          </div>
        </nav>
      </aside>
    </div>
  );
}

export default HamburgerMenu;
