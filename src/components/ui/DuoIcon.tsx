/**
 * Icône du produit — trait plein, une seule couleur, arrondie.
 *
 * Historique : ce composant montait des icônes **line-duotone** (deux calques,
 * dont un teinté). Mesure faite sur le rendu réel : à 16 px, avec un trait de
 * 1,75 px et un second calque à 24 % d'opacité, la couleur ne couvrait que
 * **0,42 px** d'épaisseur visible. Ce n'était pas « peu visible », c'était
 * invisible — d'où le passage à des icônes à une seule couleur.
 *
 * Le nom `DuoIcon` est conservé : 457 appels dans 109 fichiers le référencent,
 * et le remplacer n'apporterait aucune lisibilité. Ce qui change est ici.
 *
 * Le trait est désormais plus franc (2 px) et les extrémités arrondies
 * (`strokeLinecap: round`, déjà posé par la bibliothèque). Une icône active se
 * distingue par sa PASTILLE (voir `.icon-pill` dans `globals.css`), jamais par
 * un changement de graisse : la couleur ne doit pas être le seul signal
 * (WCAG 1.4.1), et une pastille est un signal de forme.
 */
import { forwardRef } from 'react';
import type { SVGProps } from 'react';
import type { Icon } from '@solar-icons/react/lib/types';

export interface DuoIconProps extends Omit<SVGProps<SVGSVGElement>, 'ref' | 'color'> {
  icon: Icon;
  size?: number | string;
  strokeWidth?: number;
  color?: string;
  /**
   * Conservé pour la compatibilité des appels existants, mais **sans effet** :
   * les icônes à un seul calque n'ont pas de seconde couleur. Le garder dans
   * l'interface évite de toucher 109 fichiers pour une prop morte.
   */
  secondaryOpacity?: number;
}

export const DuoIcon = forwardRef<SVGSVGElement, DuoIconProps>(function DuoIcon(
  {
    icon: SolarIcon,
    size = 24,
    strokeWidth = 2,
    secondaryOpacity: _secondaryOpacity,
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
      className={`icon-ink ${className ?? ''}`}
      color={color}
      aria-label={label}
      role={label ? 'img' : undefined}
      aria-hidden={label ? undefined : true}
      focusable="false"
      {...rest}
    />
  );
});
export default DuoIcon;
