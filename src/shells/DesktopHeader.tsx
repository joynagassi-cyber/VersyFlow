import { BackgroundPanel } from '@/components/ui/BackgroundPanel';
import { DemoModeBadge } from '@/components/dev/DemoModeBadge';
/**
 * DesktopHeader — l'en-tête de bureau (et de tablette) de VersyFlow.
 *
 * Ce que la maquette mobile ne peut pas porter, et qui a une vraie valeur ici :
 *  - **où je suis** : le libellé vient de la route réelle, pas d'un texte fixe ;
 *  - **une commande globale** : la recherche s'ouvre au clic ou au clavier
 *    (`⌘K` / `Ctrl K`), sans ajouter une barre d'outils supplémentaire ;
 *  - **l'état du système** : synchronisation, notifications, profil.
 *
 * Contraintes respectées :
 *  - aucune couleur littérale : uniquement les jetons du thème actif ;
 *  - une seule barre : les actions vivent dans l'en-tête, jamais dupliquées
 *    dans une seconde rangée ;
 *  - ordinateur **et** tablette : sous 1024 px le libellé de page se replie,
 *    les commandes restent, la barre de commande devient un bouton carré ;
 *  - accessibilité : chaque commande a un `aria-label`, le raccourci est
 *    annoncé, et le focus clavier est visible (anneau du design system).
 */

import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { DuoIcon } from '@/components/ui/DuoIcon';
import {
  Search01Icon as Search,
  Notification01Icon as Bell,
  UserCircleIcon as UserCircle,
} from '@/components/ui/solar-icons';
import SyncStatusIndicator from '@/components/common/SyncStatusIndicator';
import { useIsDesktop } from '@/hooks/useIsDesktop';

/**
 * Libellé de l'écran courant. On ne traduit que ce qui est stable : les
 * entrées de premier niveau. Les écrans profonds gardent le libellé de leur
 * section (c'est ce qu'on lit dans un fil d'Ariane) ; aucun nom inventé.
 */
const SECTION_LABELS: { prefix: string; key: string; fallback: string }[] = [
  { prefix: '/tabs/home', key: 'nav.home', fallback: 'Accueil' },
  { prefix: '/tabs/explore', key: 'nav.explore', fallback: 'Explorer' },
  { prefix: '/tabs/progress', key: 'nav.progress', fallback: 'Progrès' },
  { prefix: '/tabs/settings', key: 'nav.settings', fallback: 'Réglages' },
  { prefix: '/settings', key: 'nav.settings', fallback: 'Réglages' },
  { prefix: '/bible', key: 'nav.bible', fallback: 'Bible' },
  { prefix: '/memorization', key: 'shell.memorization', fallback: 'Mémorisation' },
  { prefix: '/memory', key: 'shell.memorization', fallback: 'Mémorisation' },
  { prefix: '/review', key: 'nav.review', fallback: 'Révisions' },
  { prefix: '/family', key: 'nav.family', fallback: 'Famille' },
  { prefix: '/semantic', key: 'nav.semantic', fallback: 'Sémantique' },
  { prefix: '/comparison', key: 'nav.compare', fallback: 'Comparer' },
  { prefix: '/profile', key: 'nav.profile', fallback: 'Profil' },
  { prefix: '/notes', key: 'notes.title', fallback: 'Notes' },
  { prefix: '/search', key: 'shell.search', fallback: 'Recherche' },
  { prefix: '/notifications', key: 'notifications.title', fallback: 'Notifications' },
];

function labelFor(pathname: string): { key: string; fallback: string } | null {
  const match = SECTION_LABELS.find(
    (entry) => pathname === entry.prefix || pathname.startsWith(`${entry.prefix}/`),
  );
  return match ? { key: match.key, fallback: match.fallback } : null;
}

export function DesktopHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const isDesktop = useIsDesktop();
  const current = labelFor(location.pathname);

  // Raccourci global : ⌘K / Ctrl K ouvre la recherche. Ignoré quand la
  // frappe a lieu dans un champ, sinon on volerait la saisie du verset.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== 'k') return;
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || target?.isContentEditable) return;
      event.preventDefault();
      navigate('/search');
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [navigate]);

  return (
    <header className="desktop-header g1 sticky top-0 z-10 flex h-14 shrink-0 items-center gap-3 px-4">
      <div className="min-w-0">
        {isDesktop ? (
          <p className="truncate text-sm font-semibold text-text-primary">
            {current ? t(current.key, current.fallback) : t('shell.workspace', 'Espace de travail')}
          </p>
        ) : (
          <p className="truncate text-sm font-semibold text-text-primary">
            {t('shell.workspace', 'Espace de travail')}
          </p>
        )}
      </div>

      {/* Barre de commande : une seule, toujours au même endroit. */}
      <div className="ms-auto flex items-center gap-1.5">
        <DemoModeBadge />
        <BackgroundPanel />
        <button
          type="button"
          onClick={() => navigate('/search')}
          aria-label={t('shell.search', 'Recherche')}
          className="flex h-9 items-center gap-2 rounded-xl bg-surface-tint px-2.5 text-sm text-text-muted transition-colors hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <DuoIcon icon={Search} size={18} />
          {isDesktop && (
            <>
              <span className="hidden xl:inline">
                {t('shell.searchPlaceholder', 'Rechercher un verset, un concept…')}
              </span>
              <kbd className="hidden rounded border border-border px-1.5 py-0.5 text-[10px] font-semibold xl:inline">
                ⌘K
              </kbd>
            </>
          )}
        </button>

        <div className="hidden h-6 w-px bg-border sm:block" role="presentation" />
        <div className="hidden sm:flex">
          <SyncStatusIndicator />
        </div>

        <button
          type="button"
          onClick={() => navigate('/notifications')}
          aria-label={t('shell.notifications', 'Notifications')}
          className="flex h-9 w-9 items-center justify-center rounded-xl text-text-secondary transition-colors hover:bg-surface-tint hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <DuoIcon icon={Bell} size={19} />
        </button>

        <button
          type="button"
          onClick={() => navigate('/profile')}
          aria-label={t('shell.profile', 'Profil')}
          className="flex h-9 w-9 items-center justify-center rounded-xl text-text-secondary transition-colors hover:bg-surface-tint hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <DuoIcon icon={UserCircle} size={20} />
        </button>
      </div>
    </header>
  );
}

export default DesktopHeader;
