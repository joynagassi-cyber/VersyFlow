/**
 * Une seule table d'icônes de navigation, pour les deux coquilles.
 *
 * Le 30/10, la barre d'onglets, le rail de bureau et le tiroir mobile
 * déclaraient chacun leurs icônes : « Réglages » existait en `Settings01Icon`
 * ici et en `Settings02Icon` là, « Notifications » changeait de signe d'une
 * coquille à l'autre, et « Collections » troquait `Layers01Icon` contre
 * `TrophyIcon`. L'utilisateur voyait deux applications.
 *
 * Désormais : **une destination = une icône**, quel que soit le point
 * d'entrée. Les composants ne déclarent plus d'icône ; ils lisent cette table.
 * `tests/design/nav-icons.test.ts` vérifie qu'aucune coquille ne réintroduit
 * sa propre copie.
 */

import type { Icon as IconSvgElement } from '@solar-icons/react/lib/types';
import {
  Home01Icon,
  BookOpen01Icon,
  ChartBarLineIcon,
  Settings01Icon,
  Cards01Icon,
  Clock01Icon,
  SparklesIcon,
  Analytics01Icon,
  Layers01Icon,
  Medal01Icon,
  Search01Icon,
  DashboardSquare01Icon,
  Notification01Icon,
  HistoryIcon,
  GitCompareIcon,
  UserGroupIcon,
  UserCircleIcon,
  ChartLineData01Icon,
  StarIcon,
  TrophyIcon,
  Bookmark01Icon,
} from '@/components/ui/solar-icons';
import type { TabId } from '@/store/ui-store';

export type NavIcon = IconSvgElement;

/** Onglets (barre basse mobile **et** rail de bureau : mêmes signes). */
export const TAB_ICONS: Record<TabId, NavIcon> = {
  home: Home01Icon,
  explore: BookOpen01Icon,
  progress: ChartBarLineIcon,
  settings: Settings01Icon,
};

/** Réglages : un seul glyphe partout (onglet, rail, tiroir, en-têtes). */
export const SETTINGS_ICON: NavIcon = Settings01Icon;

/** Une entrée de menu = une icône, indexée par sa route. */
export const MENU_ICONS: Record<string, NavIcon> = {
  '/bible/explorer': BookOpen01Icon,
  '/memorization/session': Cards01Icon,
  '/review/queue': Clock01Icon,
  '/review/history': HistoryIcon,
  '/semantic': SparklesIcon,
  '/analytics/dashboard': Analytics01Icon,
  '/collections': Layers01Icon,
  '/achievements': Medal01Icon,
  '/search': Search01Icon,
  '/mastery': DashboardSquare01Icon,
  '/notifications': Notification01Icon,
  '/comparison/translation': GitCompareIcon,
  '/family/home': UserGroupIcon,
  '/profile': UserCircleIcon,
  '/settings/appearance': SETTINGS_ICON,
  '/settings/theme-picker': Bookmark01Icon,
  '/tabs/home': Home01Icon,
  '/tabs/explore': BookOpen01Icon,
  '/tabs/progress': ChartLineData01Icon,
  '/tabs/settings': SETTINGS_ICON,
};

/**
 * L'icône d'une destination. `fallback` ne sert qu'aux routes très
 * secondaires ajoutées après coup — jamais pour diverger d'une coquille.
 */
export function iconFor(path: string, fallback: NavIcon = BookOpen01Icon): NavIcon {
  return MENU_ICONS[path] ?? fallback;
}

/** Icône d'onglet par identifiant. */
export function tabIcon(id: TabId): NavIcon {
  return TAB_ICONS[id] ?? StarIcon;
}

/** Exporté pour les écrans qui affichent un succès de collection. */
export const COLLECTION_ICON: NavIcon = TrophyIcon;
