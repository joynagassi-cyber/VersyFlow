/**
 * Palette d'identité des familles.
 *
 * Ces valeurs ne sont PAS des couleurs d'interface : ce sont des **données**
 * choisies par l'utilisateur à la création d'une famille et stockées dans
 * l'entité `Family` (`color`), puis utilisées en teinte d'avatar et de bordure.
 * Elles vivent donc dans `src/theme/` (comme le catalogue de thèmes) et non
 * dans un écran : un écran qui écrirait `#...` en dur serait signalé par
 * l'audit C08.
 *
 * Chaque entrée porte un nom traduit (`labelKey`) pour que l'écran de création
 * n'ait jamais à connaître la valeur hexadécimale.
 */

export interface FamilySwatch {
  /** Clé stable stockée à côté de la couleur (aucun impact sur l'entité). */
  id: string;
  /** Couleur d'identité enregistrée dans `Family.color`. */
  value: string;
  labelKey: string;
  label: string;
}

export const FAMILY_SWATCHES: FamilySwatch[] = [
  { id: 'rose', value: '#DC1478', labelKey: 'familyPlus.colorRose', label: 'Rose' },
  { id: 'indigo', value: '#4F46E5', labelKey: 'familyPlus.colorIndigo', label: 'Indigo' },
  { id: 'emerald', value: '#0E9F6E', labelKey: 'familyPlus.colorEmerald', label: 'Émeraude' },
  { id: 'amber', value: '#D97706', labelKey: 'familyPlus.colorAmber', label: 'Ambre' },
  { id: 'sky', value: '#0284C7', labelKey: 'familyPlus.colorSky', label: 'Ciel' },
  { id: 'violet', value: '#7C3AED', labelKey: 'familyPlus.colorViolet', label: 'Violet' },
];

export const DEFAULT_FAMILY_COLOR = FAMILY_SWATCHES[0].value;

/** Teinte douce d'une couleur d'identité (16 %) pour les fonds d'avatar. */
export function familyTint(color: string, percent = 16): string {
  return `color-mix(in srgb, ${color} ${percent}%, transparent)`;
}
