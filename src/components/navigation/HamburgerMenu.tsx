import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { DuoIcon } from '@/components/ui/DuoIcon';
import {
  BookOpen01Icon,
  Cards01Icon,
  ChartLineData01Icon,
  ChevronDownIcon,
  Cancel01Icon as X,
  LogOutIcon,
  Medal01Icon,
  Search01Icon,
  Settings02Icon,
  StarIcon,
  TrophyIcon,
  UserGroupIcon,
  UserIcon,
} from '@/components/ui/solar-icons';
import { Logo } from '@/components/brand/Logo';
import { useAuthStore } from '@/store/auth-store';
import { useUiStore } from '@/store/ui-store';
import { cn } from '@/lib/utils';
import type { Icon } from '@solar-icons/react/lib/types';

/**
 * Menu mobile — refonte 2026-10-30.
 *
 * Objectifs (demande produit) :
 *  - ne plus afficher une liste plate de dix entrées ;
 *  - **regrouper** les fonctions qui vont ensemble et rendre chaque groupe
 *    **dépliable** (accordéon, un seul ouvert, clavier + lecteur d'écran) ;
 *  - garder **le profil, le nom de la personne et les réglages fixes**, hors
 *    de la zone qui défile, pour qu'on puisse taper dessus sans faire défiler.
 *
 * Le filtrage par `visibleMenuPaths` (Réglages → Navigation) est conservé : un
 * groupe dont plus aucune entrée n'est visible disparaît entièrement.
 */

interface MenuItem {
  path: string;
  labelKey: string;
  label: string;
  icon: Icon;
  /** `true` = l'entrée respecte les interrupteurs de visibilité de Réglages. */
  gated: boolean;
}

interface MenuSection {
  id: string;
  labelKey: string;
  label: string;
  icon: Icon;
  items: MenuItem[];
}

const item = (
  path: string,
  labelKey: string,
  label: string,
  icon: Icon,
  gated = true,
): MenuItem => ({ path, labelKey, label, icon, gated });

const MENU_SECTIONS: MenuSection[] = [
  {
    id: 'read',
    labelKey: 'nav.sectionRead',
    label: 'Lire',
    icon: BookOpen01Icon,
    items: [
      item('/bible/explorer', 'nav.explore', 'Bible', BookOpen01Icon),
      item('/search', 'nav.search', 'Recherche', Search01Icon),
      item('/comparison/translation', 'nav.compare', 'Comparer les traductions', Cards01Icon),
    ],
  },
  {
    id: 'memorize',
    labelKey: 'nav.sectionMemorize',
    label: 'Mémoriser',
    icon: Cards01Icon,
    items: [
      item('/memorization/session', 'nav.memorize', 'Mémorisation', Cards01Icon),
      item('/semantic', 'nav.semantic', 'Mémoire sémantique', StarIcon),
      item('/mastery', 'nav.mastery', 'Maîtrise', Medal01Icon),
    ],
  },
  {
    id: 'progress',
    labelKey: 'nav.sectionProgress',
    label: 'Progression',
    icon: ChartLineData01Icon,
    items: [
      item('/review/queue', 'nav.review', 'Révisions', ChartLineData01Icon),
      item('/review/history', 'nav.history', 'Historique des révisions', ChartLineData01Icon),
      item('/analytics/dashboard', 'nav.analytics', 'Analytique', ChartLineData01Icon),
      item('/notifications', 'nav.notifications', 'Notifications', Settings02Icon),
    ],
  },
  {
    id: 'collection',
    labelKey: 'nav.sectionCollection',
    label: 'Ma collection',
    icon: TrophyIcon,
    items: [
      item('/collections', 'nav.collections', 'Collections', TrophyIcon),
      item('/achievements', 'nav.achievements', 'Succès', Medal01Icon),
    ],
  },
  {
    id: 'community',
    labelKey: 'nav.sectionCommunity',
    label: 'Communauté',
    icon: UserGroupIcon,
    items: [item('/family/home', 'nav.family', 'Famille', UserGroupIcon)],
  },
  {
    id: 'appearance',
    labelKey: 'nav.sectionAppearance',
    label: 'Apparence',
    icon: Settings02Icon,
    // Ces entrées ne dépendent pas des interrupteurs de navigation : les
    // réglages doivent rester atteignables même quand tout le reste est masqué.
    items: [
      item('/profile', 'nav.profile', 'Profil', UserIcon, false),
      item('/settings/appearance', 'nav.theme', 'Thème et apparence', Settings02Icon, false),
      item('/settings/theme-picker', 'nav.themeImage', "Thèmes d'image", StarIcon, false),
    ],
  },
];

const rowClass =
  'flex min-h-11 w-full items-center gap-3 rounded-lg px-3 py-2.5 text-start text-sm text-text-primary transition-colors active:bg-surface-tint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--acc)]';

const iconButtonClass =
  'grid h-11 w-11 shrink-0 place-items-center rounded-full text-text-muted transition-colors active:bg-surface-tint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--acc)]';

/** Self-managed slide-in drawer (RTL-safe), driven by ui-store menuOpen. */
export function HamburgerMenu() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const menuOpen = useUiStore((s) => s.menuOpen);
  const closeMenu = useUiStore((s) => s.closeMenu);
  const visibleMenuPaths = useUiStore((s) => s.visibleMenuPaths);
  const signOut = useAuthStore((s) => s.signOut);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  // Accessibilité : à l'ouverture, le focus entre dans le tiroir ; Échap le
  // referme. Sans cela, un utilisateur au clavier reste bloqué derrière le
  // scrim (les 90 routes restent focusables sous le menu).
  useEffect(() => {
    if (!menuOpen) return;
    closeButtonRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeMenu();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [menuOpen, closeMenu]);

  const sections = useMemo(
    () =>
      MENU_SECTIONS.map((section) => ({
        ...section,
        items: section.items.filter((entry) => !entry.gated || visibleMenuPaths.includes(entry.path)),
      })).filter((section) => section.items.length > 0),
    [visibleMenuPaths],
  );

  // Accordéon : un seul groupe ouvert à la fois. Ouvert par défaut : le
  // premier groupe disponible, pour que le menu ne s'ouvre jamais vide.
  const [openSection, setOpenSection] = useState<string | null>(sections[0]?.id ?? null);
  // `null` = tout replié (l'utilisateur peut fermer le dernier groupe ouvert).
  // Si le groupe mémorisé a disparu (entrées masquées dans Réglages), on
  // retombe sur le premier groupe disponible plutôt que d'afficher du vide.
  const activeSection =
    openSection === null
      ? null
      : sections.some((section) => section.id === openSection)
        ? openSection
        : sections[0]?.id ?? null;

  const go = (path: string) => {
    closeMenu();
    navigate(path);
  };

  const displayName = user?.display_name || t('nav.localMode', 'Mode local');

  return (
    <div className={cn('fixed inset-0 z-50', !menuOpen && 'pointer-events-none')} aria-hidden={!menuOpen}>
      <div
        className={cn(
          'absolute inset-0 bg-[color:var(--scrim)] transition-opacity duration-200 motion-reduce:transition-none',
          menuOpen ? 'opacity-100' : 'opacity-0',
        )}
        onClick={closeMenu}
      />

      <aside
        className={cn(
          'absolute inset-y-0 start-0 flex w-80 max-w-[85vw] flex-col bg-surface shadow-xl transition-transform duration-200 motion-reduce:transition-none',
          menuOpen ? 'translate-x-0' : '-translate-x-full rtl:translate-x-full',
        )}
        aria-label={t('nav.menu', 'Navigation')}
        role="dialog"
        aria-modal="true"
      >
        {/* ── En-tête FIXE : profil + nom + réglages, jamais recouverts ────── */}
        <div className="shrink-0 border-b border-border px-3 pb-2 pt-3">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => go('/profile')}
              className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl px-2 py-1.5 text-start transition-colors active:bg-surface-tint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--acc)]"
              aria-label={t('nav.openProfile', 'Ouvrir mon profil')}
            >
              <span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full bg-surface-tint ring-1 ring-border">
                <Logo size={30} />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-base font-extrabold leading-tight text-primary">
                  VersyFlow
                </span>
                <span className="block truncate text-xs leading-tight text-text-muted">
                  {displayName}
                </span>
              </span>
            </button>

            <button
              type="button"
              onClick={() => go('/settings')}
              className={iconButtonClass}
              aria-label={t('nav.settings', 'Réglages')}
              title={t('nav.settings', 'Réglages')}
            >
              <DuoIcon icon={Settings02Icon} size={22} />
            </button>
            <button
              type="button"
              ref={closeButtonRef}
              onClick={closeMenu}
              className={iconButtonClass}
              aria-label={t('nav.closeMenu', 'Fermer le menu')}
              title={t('nav.closeMenu', 'Fermer le menu')}
            >
              <DuoIcon icon={X} size={22} />
            </button>
          </div>
        </div>

        {/* ── Corps DÉFILANT : groupes dépliables ──────────────────────────── */}
        <nav
          className="flex-1 overflow-y-auto overscroll-contain px-2 py-3"
          aria-label={t('nav.primary', 'Navigation principale')}
        >
          {sections.map((section) => {
            const open = activeSection === section.id;
            const panelId = `menu-section-${section.id}`;
            const buttonId = `menu-section-${section.id}-button`;
            return (
              <div key={section.id} className="mb-1">
                <button
                  type="button"
                  id={buttonId}
                  aria-expanded={open}
                  aria-controls={panelId}
                  onClick={() => setOpenSection(open ? null : section.id)}
                  className={cn(
                    'flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-2.5 text-start text-sm font-semibold text-text-primary transition-colors active:bg-surface-tint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--acc)]',
                    open && 'bg-surface-tint',
                  )}
                >
                  <DuoIcon icon={section.icon} size={22} strokeWidth={2} className="text-primary" />
                  <span className="truncate">{t(section.labelKey, section.label)}</span>
                  <span className="ms-auto rounded-full bg-surface px-2 py-0.5 text-2xs font-bold text-text-muted">
                    {section.items.length}
                  </span>
                  <DuoIcon
                    icon={ChevronDownIcon}
                    size={18}
                    strokeWidth={2}
                    className={cn(
                      'text-text-muted transition-transform duration-200 motion-reduce:transition-none',
                      open && 'rotate-180',
                    )}
                  />
                </button>

                {open && (
                  <div
                    id={panelId}
                    role="region"
                    aria-labelledby={buttonId}
                    className="mt-0.5 flex flex-col gap-0.5 ps-3"
                  >
                    {section.items.map((entry) => (
                      <button
                        key={entry.path}
                        type="button"
                        onClick={() => go(entry.path)}
                        className={rowClass}
                      >
                        <DuoIcon icon={entry.icon} size={20} strokeWidth={1.9} className="shrink-0" />
                        <span className="truncate">{t(entry.labelKey, entry.label)}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* ── Pied FIXE : déconnexion (compte réel uniquement) ─────────────── */}
        {isAuthenticated && (
          <div className="shrink-0 border-t border-border px-2 py-2">
            <button
              type="button"
              onClick={() => {
                closeMenu();
                void signOut();
                navigate('/auth');
              }}
              className={cn(rowClass, 'text-error')}
            >
              <DuoIcon icon={LogOutIcon} size={20} strokeWidth={1.9} className="shrink-0" />
              <span>{t('nav.signOut', 'Se déconnecter')}</span>
            </button>
          </div>
        )}
      </aside>
    </div>
  );
}

export default HamburgerMenu;

/** Chemins exposés par le menu, dans l'ordre d'affichage (tests / doc). */
export const MENU_PATHS_IN_ORDER: string[] = MENU_SECTIONS.flatMap((s) => s.items.map((i) => i.path));
