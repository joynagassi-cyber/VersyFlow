/**
 * Icône Solar duotone — **l'unique système d'icônes de l'application**.
 *
 * Règles du playbook UX/UI appliquées ici (§26 « Iconography and imagery ») :
 *  - **une famille** (Solar), **trois tailles** (`ICON_SIZES`), **une graisse** :
 *    les appelants ne choisissent plus 13, 19 ou 22 px « au feeling » ; ils
 *    prennent `sm` (dans le texte), `md` (bouton, navigation) ou `lg` (en-tête
 *    de section, barre d'onglets). Les illustrations (≥ 40 px) ne sont pas des
 *    icônes et gardent leur taille.
 *  - une icône décorative est masquée aux lecteurs d'écran (`aria-hidden`) ;
 *    une icône porteuse de sens reçoit un `aria-label` et devient `role="img"`.
 *  - la couleur : `color` est **honoré** (il était ignoré, un `_color` mort),
 *    sinon l'icône hérite de l'accent de la charte via `.solar-accent`.
 *
 * Pourquoi la graisse est passée de 1,75 à 2 : à 16–24 px, 1,75 px de trait
 * disparaît sur les écrans denses et en contraste réduit. Une seule valeur,
 * plus franche, règle les deux problèmes (lisibilité + cohérence).
 */
import { forwardRef } from 'react';
import type { SVGProps } from 'react';
import type { Icon } from '@solar-icons/react/lib/types';

/** Échelle d'icônes — trois tailles, pas une de plus. */
export const ICON_SIZES = {
  /** Dans une phrase, une cellule de tableau, un badge. */
  sm: 16,
  /** Bouton, ligne de liste, formulaire, en-tête. */
  md: 20,
  /** Barre d'onglets, titre de section, action principale. */
  lg: 24,
  /**
   * Glyphe d'illustration dans un état vide ou une carte de tête. Ce n'est pas
   * une quatrième taille d'icône d'interface : le playbook sépare l'icône
   * (trois tailles) de l'imagerie, et un état vide a besoin d'un point focal.
   */
  illustration: 32,
} as const;

/** Graisse unique de la famille. */
export const ICON_STROKE = 2;

export interface DuoIconProps extends Omit<SVGProps<SVGSVGElement>, 'ref' | 'color'> {
  icon: Icon;
  /** Taille en px. Utiliser `ICON_SIZES` plutôt qu'un nombre arbitraire. */
  size?: number | string;
  strokeWidth?: number;
  secondaryOpacity?: number;
  /** Couleur explicite (jeton CSS). Par défaut : l'accent de la charte. */
  color?: string;
}

export const DuoIcon = forwardRef<SVGSVGElement, DuoIconProps>(function DuoIcon(
  {
    icon: SolarIcon,
    size = ICON_SIZES.lg,
    strokeWidth = ICON_STROKE,
    secondaryOpacity = 0.5,
    className,
    color,
    'aria-label': label,
    ...rest
  },
  ref,
) {
  return (
    <SolarIcon
      ref={ref}
      size={size}
      strokeWidth={strokeWidth}
      secondaryOpacity={secondaryOpacity}
      color={color}
      className={`solar-accent ${className ?? ''}`}
      aria-label={label}
      role={label ? 'img' : undefined}
      aria-hidden={label ? undefined : true}
      focusable="false"
      {...rest}
    />
  );
});
export default DuoIcon;
