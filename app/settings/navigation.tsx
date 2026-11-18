/**
 * Barre d'onglets — la vraie configuration, pas un simple interrupteur.
 *
 * Avant : deux cases « Bible : visible / Masquée ». L'utilisateur ne pouvait
 * ni épingler une fonction qu'il utilise tous les jours (réviser, chercher,
 * la famille), ni choisir l'ordre, ni alléger la barre.
 *
 * Maintenant :
 *   · un catalogue d'entrées épinglables, chacune décrite en une phrase ;
 *   · l'ordre se règle au glisser-déposer **et** aux boutons ← → (le clavier
 *     et les lecteurs d'écran n'ont pas de souris) ;
 *   · plafond de cinq entrées, compteur visible, Accueil et Réglages
 *     verrouillés — on ne peut pas se couper la porte de sortie ;
 *   · deux réglages de forme : libellés affichés ou non, barre compacte ;
 *   · remise à zéro de la barre, indépendante du reste des réglages.
 *
 * Le menu hamburger garde sa section dédiée plus bas, inchangée.
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DuoIcon } from '@/components/ui/DuoIcon';
import {
  BarChartIcon as BarChart3,
  BookOpen01Icon as BookOpen,
  SlidersHorizontalIcon as SlidersHorizontal,
  BrainCircuitIcon as BrainCircuit,
  Folder01Icon as Folder,
  TrophyIcon as Trophy,
  Search01Icon as Search,
  Target01Icon as Target,
  BellIcon as Bell,
  HistoryIcon as History,
  GitCompareIcon as GitCompare,
  UsersIcon as Users,
  CheckIcon as Check,
  PlusSignIcon as Plus,
  ChevronLeftIcon as MoveLeft,
  ChevronRightIcon as MoveRight,
  RefreshIcon as Refresh,
  Menu01Icon as DragHandle,
  LockIcon as Lock,
} from '@/components/ui/solar-icons';
import type { EyeIcon } from '@/components/ui/solar-icons';
import { FullScreenPage } from '@/components/layout/FullScreenPage';
import { useUiStore, ALL_MENU_ITEMS, type TabId } from '@/store/ui-store';
import {
  BOTTOM_BAR_ENTRIES,
  BOTTOM_BAR_MAX,
  isLocked,
  resolveEntries,
} from '@/domains/navigation/bottom-bar';
import { iconFor } from '@/components/navigation/nav-icons';
import { cn } from '@/lib/utils';

/** One icon per hamburger-menu item, keyed by route path. */
const MENU_ITEM_ICONS: Record<string, typeof EyeIcon> = {
  '/bible/explorer': BookOpen,
  '/memorization/session': BrainCircuit,
  '/review/queue': History,
  '/semantic': BrainCircuit,
  '/analytics/dashboard': BarChart3,
  '/collections': Folder,
  '/achievements': Trophy,
  '/search': Search,
  '/mastery': Target,
  '/notifications': Bell,
  '/review/history': History,
  '/comparison/translation': GitCompare,
  '/family/home': Users,
};

export default function NavigationSettingsScreen() {
  const { t } = useTranslation();
  const barItems = useUiStore((s) => s.barItems);
  const enableBarItem = useUiStore((s) => s.enableBarItem);
  const disableBarItem = useUiStore((s) => s.disableBarItem);
  const moveBarItem = useUiStore((s) => s.moveBarItem);
  const moveBarItemTo = useUiStore((s) => s.moveBarItemTo);
  const barLabels = useUiStore((s) => s.barLabels);
  const barCompact = useUiStore((s) => s.barCompact);
  const setBarLabels = useUiStore((s) => s.setBarLabels);
  const setBarCompact = useUiStore((s) => s.setBarCompact);
  const resetBar = useUiStore((s) => s.resetBar);
  const visibleMenuPaths = useUiStore((s) => s.visibleMenuPaths);
  const toggleMenuPath = useUiStore((s) => s.toggleMenuPath);

  const [dragging, setDragging] = useState<string | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);

  const active = resolveEntries(barItems);
  const inactive = BOTTOM_BAR_ENTRIES.filter((entry) => !barItems.includes(entry.id));
  const full = active.length >= BOTTOM_BAR_MAX;

  const pillClass = (visible: boolean) =>
    'rounded-full px-3 py-1 text-xs font-bold ' +
    (visible ? 'bg-success-light text-success' : 'bg-surface-tint text-text-muted');

  return (
    <FullScreenPage title={t('settings.navigationBottomBarTitle', 'Barre d’onglets')} showBack backPath="/settings">
      <div className="screen-column space-y-5">
        <p className="px-1 text-sm text-text-muted">
          {t(
            'settings.navBarHint',
            'Choisissez ce qui apparaît dans la barre du bas et dans quel ordre. Désactiver une entrée ne supprime pas la fonction : elle reste joignable depuis le menu.',
          )}
        </p>

        {/* Compteur + plafond */}
        <div className="flex items-center justify-between rounded-2xl bg-surface px-4 py-3 shadow-sm">
          <span className="text-sm text-text-secondary">
            {t('settings.navBarCount', {
              count: active.length,
              max: BOTTOM_BAR_MAX,
              defaultValue: '{{count}} / {{max}} onglets actifs',
            })}
          </span>
          <span
            className={cn(
              'rounded-full px-2.5 py-1 text-2xs font-bold',
              full ? 'bg-surface-tint text-text-muted' : 'bg-success-light text-success',
            )}
          >
            {full
              ? t('settings.navBarFull', 'Complet')
              : t('settings.navBarRoom', { count: BOTTOM_BAR_MAX - active.length, defaultValue: '{{count}} place(s) libre(s)' })}
          </span>
        </div>

        {/* Activés — ordre réglable */}
        <section>
          <p className="mb-2 flex items-center gap-2 px-1 text-xs font-bold uppercase tracking-wide text-text-muted">
            <DuoIcon icon={Check} size={16} className="text-primary" />
            {t('settings.navBarActive', 'Activé')}
          </p>
          <div className="overflow-hidden rounded-2xl bg-surface shadow-sm">
            {active.map((entry, index) => {
              const Icon = iconFor(entry.path);
              const locked = isLocked(entry.id);
              return (
                <div
                  key={entry.id}
                  draggable
                  onDragStart={() => setDragging(entry.id)}
                  onDragEnd={() => {
                    setDragging(null);
                    setDropIndex(null);
                  }}
                  onDragOver={(event) => {
                    event.preventDefault();
                    setDropIndex(index);
                  }}
                  onDrop={(event) => {
                    event.preventDefault();
                    if (dragging && dragging !== entry.id) moveBarItemTo(dragging, index);
                    setDragging(null);
                    setDropIndex(null);
                  }}
                  className={cn(
                    'flex items-center gap-3 px-3 py-3',
                    index > 0 && 'border-t border-[color:var(--color-divider)]',
                    dragging === entry.id && 'opacity-60',
                    dropIndex === index && dragging && dragging !== entry.id && 'bg-surface-tint',
                  )}
                >
                  <span className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      aria-label={t('settings.navBarToggle', { name: entry.label, defaultValue: 'Désactiver {{name}}' })}
                      aria-pressed
                      disabled={locked}
                      onClick={() => disableBarItem(entry.id)}
                      className={cn(
                        'flex h-6 w-6 items-center justify-center rounded-full',
                        locked ? 'bg-surface-tint text-text-muted' : 'bg-primary text-on-primary',
                      )}
                    >
                      <DuoIcon icon={Check} size={16} />
                    </button>
                  </span>

                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-tint">
                    <DuoIcon icon={Icon} size={20} className="text-text-secondary" />
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5">
                      <span className="truncate text-[15px] text-text-primary">
                        {t(entry.labelKey, entry.label)}
                      </span>
                      {locked && <DuoIcon icon={Lock} size={16} className="shrink-0 text-text-muted" />}
                    </span>
                    <span className="block text-xs leading-snug text-text-muted">
                      {t(entry.descriptionKey, entry.description)}
                    </span>
                  </span>

                  <span className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => moveBarItem(entry.id, -1)}
                      disabled={index === 0}
                      aria-label={t('settings.navBarMoveLeft', { name: entry.label, defaultValue: 'Déplacer {{name}} vers la gauche' })}
                      className="flex h-8 w-8 items-center justify-center rounded-full text-text-muted disabled:opacity-30"
                    >
                      <DuoIcon icon={MoveLeft} size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveBarItem(entry.id, 1)}
                      disabled={index === active.length - 1}
                      aria-label={t('settings.navBarMoveRight', { name: entry.label, defaultValue: 'Déplacer {{name}} vers la droite' })}
                      className="flex h-8 w-8 items-center justify-center rounded-full text-text-muted disabled:opacity-30"
                    >
                      <DuoIcon icon={MoveRight} size={16} />
                    </button>
                    <span
                      aria-hidden="true"
                      className="flex h-8 w-6 cursor-grab items-center justify-center text-text-muted"
                      title={t('settings.navBarDrag', 'Glisser pour réordonner')}
                    >
                      <DuoIcon icon={DragHandle} size={16} />
                    </span>
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Désactivés — pool de fonctions à épingler */}
        <section>
          <p className="mb-2 flex items-center gap-2 px-1 text-xs font-bold uppercase tracking-wide text-text-muted">
            <DuoIcon icon={Plus} size={16} className="text-text-muted" />
            {t('settings.navBarInactive', 'Désactivé')}
          </p>
          <div className="overflow-hidden rounded-2xl bg-surface shadow-sm">
            {inactive.length === 0 && (
              <p className="px-4 py-4 text-sm text-text-muted">
                {t('settings.navBarAllActive', 'Toutes les entrées sont déjà dans la barre.')}
              </p>
            )}
            {inactive.map((entry, index) => {
              const Icon = iconFor(entry.path);
              return (
                <button
                  key={entry.id}
                  type="button"
                  disabled={full}
                  onClick={() => enableBarItem(entry.id)}
                  className={cn(
                    'flex w-full items-center gap-3 px-3 py-3 text-left',
                    index > 0 && 'border-t border-[color:var(--color-divider)]',
                    full && 'opacity-50',
                  )}
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-success-light text-success">
                    <DuoIcon icon={Plus} size={16} />
                  </span>
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-tint">
                    <DuoIcon icon={Icon} size={20} className="text-text-muted" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] text-text-secondary">
                      {t(entry.labelKey, entry.label)}
                    </span>
                    <span className="block text-xs leading-snug text-text-muted">
                      {t(entry.descriptionKey, entry.description)}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
          {full && inactive.length > 0 && (
            <p className="px-1 pt-2 text-xs text-text-muted">
              {t('settings.navBarFullHint', 'Cinq onglets au maximum : désactivez-en un pour en ajouter un autre.')}
            </p>
          )}
        </section>

        {/* Réglages de forme */}
        <section>
          <p className="mb-2 flex items-center gap-2 px-1 text-xs font-bold uppercase tracking-wide text-text-muted">
            <DuoIcon icon={SlidersHorizontal} size={16} className="text-primary" />
            {t('settings.navBarForm', 'Barre & affichage')}
          </p>
          <div className="overflow-hidden rounded-2xl bg-surface shadow-sm">
            {[
              {
                key: 'labels',
                label: t('settings.navBarLabels', 'Afficher les libellés'),
                hint: t('settings.navBarLabelsHint', 'Sous chaque icône. Masqués, l’icône garde son nom pour les lecteurs d’écran.'),
                on: barLabels,
                onChange: setBarLabels,
              },
              {
                key: 'compact',
                label: t('settings.navBarCompact', 'Barre compacte'),
                hint: t('settings.navBarCompactHint', 'Icônes plus petites, hauteur réduite : plus de place pour le contenu.'),
                on: barCompact,
                onChange: setBarCompact,
              },
            ].map((row, index) => (
              <div
                key={row.key}
                className={cn('flex items-center gap-3 px-4 py-3.5', index > 0 && 'border-t border-[color:var(--color-divider)]')}
              >
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] text-text-primary">{row.label}</span>
                  <span className="block text-xs leading-snug text-text-muted">{row.hint}</span>
                </span>
                <button
                  type="button"
                  onClick={() => row.onChange(!row.on)}
                  aria-pressed={row.on}
                  aria-label={row.label}
                  className={cn('relative h-6 w-11 shrink-0 rounded-full transition-colors', row.on ? 'bg-primary' : 'bg-border')}
                >
                  <span
                    className={cn(
                      'absolute top-0.5 h-5 w-5 rounded-full bg-surface shadow transition-all',
                      row.on ? 'start-[22px]' : 'start-0.5',
                    )}
                  />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={resetBar}
              className="flex w-full items-center gap-3 border-t border-[color:var(--color-divider)] px-4 py-3.5 text-left"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-tint">
                <DuoIcon icon={Refresh} size={20} className="text-text-secondary" />
              </span>
              <span className="text-[15px] text-text-primary">
                {t('settings.navBarReset', 'Rétablir la barre par défaut')}
              </span>
            </button>
          </div>
        </section>

        {/* Section historique — menu hamburger, inchangé */}
        <section>
          <p className="mb-2 flex items-center gap-2 px-1 text-xs font-bold uppercase tracking-wide text-text-muted">
            <DuoIcon icon={SlidersHorizontal} size={16} className="text-text-muted" />
            {t('settings.navigationMenu', 'Menu hamburger')}
          </p>
          <p className="mb-2 px-1 text-xs text-text-muted">
            {t('settings.navMenuToggleHint', 'Réglez chaque page du menu. La section Compte reste toujours visible.')}
          </p>
          <div className="overflow-hidden rounded-2xl bg-surface shadow-sm">
            {ALL_MENU_ITEMS.map(({ path, labelKey, label }, index) => {
              const Icon = MENU_ITEM_ICONS[path] ?? SlidersHorizontal;
              const visible = visibleMenuPaths.includes(path);
              return (
                <button
                  key={path}
                  type="button"
                  onClick={() => toggleMenuPath(path)}
                  className={cn(
                    'flex w-full items-center justify-between px-4 py-3.5 text-left',
                    index > 0 && 'border-t border-[color:var(--color-divider)]',
                  )}
                >
                  <span className="flex items-center gap-3">
                    <DuoIcon icon={Icon} size={20} className={visible ? 'text-primary' : 'text-text-muted'} />
                    <span className="text-[15px] text-text-primary">{t(labelKey, label)}</span>
                  </span>
                  <span className={pillClass(visible)}>
                    {visible ? t('common.on', 'Visible') : t('common.off', 'Masquée')}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      </div>
    </FullScreenPage>
  );
}

/* `TabId` reste importé pour la compatibilité des signatures du store. */
export type { TabId };
