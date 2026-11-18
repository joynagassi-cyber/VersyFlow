/** Icône Solar duotone ; la couleur suit les états de la charte. */
import { forwardRef } from 'react';
import type { SVGProps } from 'react';
import type { Icon } from '@solar-icons/react/lib/types';

export interface DuoIconProps extends Omit<SVGProps<SVGSVGElement>, 'ref' | 'color'> {
  icon: Icon;
  size?: number | string;
  strokeWidth?: number;
  secondaryOpacity?: number;
  color?: string;
}

/**
 * Icône Solar duotone.
 *
 * `secondaryOpacity` n'a **pas** de valeur par défaut, et c'est volontaire.
 * La bibliothèque écrit la valeur reçue en style EN LIGNE sur le SVG
 * (`--solar-secondary-opacity: 0.5`) ; un style en ligne l'emporte sur toute
 * règle CSS, y compris sur celles de `globals.css` qui pilotent la densité du
 * second calque. Le défaut à 0,5 rendait donc décoratives toutes les règles
 * `--solar-secondary-opacity` du thème : la densité ne changeait jamais, ni au
 * repos, ni au survol, ni à l'activation.
 *
 * En laissant la prop indéfinie, la valeur revient au défaut CSS
 * (`var(--solar-secondary-opacity, .5)` posé par la bibliothèque), que le
 * thème peut moduler. Passer la prop reste possible, ponctuellement.
 */
export const DuoIcon = forwardRef<SVGSVGElement, DuoIconProps>(function DuoIcon(
  { icon: SolarIcon, size = 24, strokeWidth = 1.75, secondaryOpacity, className, color: _color, 'aria-label': label, ...rest }, ref,
) {
  return <SolarIcon ref={ref} size={size} strokeWidth={strokeWidth} secondaryOpacity={secondaryOpacity}
    className={`solar-accent ${className ?? ''}`} aria-label={label} role={label ? 'img' : undefined}
    aria-hidden={label ? undefined : true} focusable="false" {...rest} />;
});
export default DuoIcon;
