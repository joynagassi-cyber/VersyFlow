/**
 * Icône d'une famille — un nom stable, jamais un caractère.
 *
 * `Family.icon` est une colonne texte. Les familles de démonstration y
 * stockaient un caractère emoji, affiché tel quel : il change de
 * dessin selon la plateforme, ne suit pas la couleur du thème, ne s'aligne pas
 * sur la typographie et n'est pas rendu par toutes les polices système.
 *
 * La colonne contient désormais un **nom d'icône** (`users`, `home`, `star`…).
 * `resolveFamilyIcon` accepte aussi les valeurs héritées (emoji, libellé
 * libre) et retombe sur `users`, l'icône neutre « groupe » : jamais le
 * caractère brut, jamais un carré vide.
 *
 * Module sans dépendance React : les services et les graines peuvent le lire.
 */

import {
  UsersIcon as Users,
  Home01Icon as Home,
  StarIcon as Star,
  HeartIcon as Heart,
  Leaf01Icon as Leaf,
  Sun01Icon as Sun,
  Moon01Icon as Moon,
  FireIcon as Fire,
  BookMarkedIcon as BookMarked,
} from '@/components/ui/solar-icons';
import type { Icon } from '@solar-icons/react/lib/types';

/** Icône par défaut : le groupe, sans connotation. */
export const DEFAULT_FAMILY_ICON = 'users';

/** Icônes proposées à la création d'une famille (nom stable → composant). */
export const FAMILY_ICONS: { name: string; labelKey: string; label: string; icon: Icon }[] = [
  { name: DEFAULT_FAMILY_ICON, labelKey: 'familyPlus.iconUsers', label: 'Famille', icon: Users },
  { name: 'home', labelKey: 'familyPlus.iconHome', label: 'Maison', icon: Home },
  { name: 'star', labelKey: 'familyPlus.iconStar', label: 'Étoile', icon: Star },
  { name: 'heart', labelKey: 'familyPlus.iconHeart', label: 'Cœur', icon: Heart },
  { name: 'leaf', labelKey: 'familyPlus.iconLeaf', label: 'Feuille', icon: Leaf },
  { name: 'sun', labelKey: 'familyPlus.iconSun', label: 'Soleil', icon: Sun },
  { name: 'moon', labelKey: 'familyPlus.iconMoon', label: 'Lune', icon: Moon },
  { name: 'fire', labelKey: 'familyPlus.iconFire', label: 'Flamme', icon: Fire },
  { name: 'book', labelKey: 'familyPlus.iconBook', label: 'Livre', icon: BookMarked },
];

const BY_NAME = new Map(FAMILY_ICONS.map((entry) => [entry.name, entry.icon]));

/**
 * Composant d'icône pour une valeur stockée.
 *
 * Une valeur héritée (emoji, libellé libre, chaîne vide) rend `Users`.
 */
export function resolveFamilyIcon(value: string | null | undefined): Icon {
  if (!value) return Users;
  return BY_NAME.get(value.trim().toLowerCase()) ?? Users;
}
