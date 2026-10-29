/**
 * DuoIcon — le rendu d'icône **duotone** de VersyFlow.
 *
 * Pourquoi ce composant existe
 * ----------------------------
 * Le produit a une seule bibliothèque d'icônes (Hugeicons, `core-free-icons`)
 * et une seule façon de les dessiner. Le style demandé est le **duotone** :
 * une forme pleine, douce, derrière un trait net.
 *
 * Hugeicons ne livre le duotone que dans sa version payante — le paquet libre
 * ne contient que des icônes au trait. On n'installe donc rien de plus : on
 * compose le duotone à partir des **mêmes données d'icône officielles**
 * (`IconSvgElement`, la liste de formes exportée par le paquet). Chaque forme
 * est rendue deux fois :
 *
 *  1. `duotone-fill` — la même géométrie, remplie, sans trait, à
 *     `secondaryOpacity` (16 % par défaut) : c'est le « fond » de l'icône.
 *  2. `duotone-line` — la forme d'origine (trait + attributs d'origine),
 *     par-dessus : c'est le trait qui donne le contour.
 *
 * Aucun nom d'icône n'est inventé, aucune icône n'est redessinée à la main :
 * la géométrie vient du paquet, seul le rendu est doublé. Un test
 * (`tests/design/duotone-icons.test.ts`) vérifie les deux calques, et l'audit
 * (C18) vérifie qu'aucun fichier d'interface n'importe `@hugeicons/react`
 * directement — donc qu'aucune icône ne peut échapper au duotone.
 *
 * Le nom `DuoIcon` (plutôt que `Icon`) est volontaire : onze écrans déclarent
 * déjà une variable locale `Icon` (l'icône d'une ligne de liste, `const Icon =
 * a.icon`). Un composant nommé `Icon` serait masqué par ces variables, et le
 * JSX échouerait silencieusement à la compilation. `DuoIcon` ne peut pas
 * entrer en collision et dit ce qu'il fait.
 */

import { createElement, forwardRef } from 'react';
import type { SVGProps } from 'react';
import type { IconSvgElement } from '@hugeicons/react';

export interface DuoIconProps extends Omit<SVGProps<SVGSVGElement>, 'ref' | 'color'> {
  /** Données d'icône Hugeicons (`Home01Icon`, `PulseIcon`, …). */
  icon: IconSvgElement;
  /** Côté du carré, en px (ou toute unité CSS). */
  size?: number | string;
  /** Épaisseur du trait ; par défaut celle de l'icône (1.5). */
  strokeWidth?: number;
  /**
   * Opacité du calque plein (0 → trait seul, 1 → icône pleine).
   * La valeur par défaut est celle du duotone.
   */
  secondaryOpacity?: number;
  /** Couleur du trait et du calque plein. */
  color?: string;
}

type LayerAttrs = Record<string, string | number>;

export const DuoIcon = forwardRef<SVGSVGElement, DuoIconProps>(function DuoIcon(
  {
    icon,
    size = 24,
    strokeWidth,
    secondaryOpacity = 0.16,
    className,
    color = 'currentColor',
    'aria-label': ariaLabel,
    ...rest
  },
  ref,
) {
  const strokeProps: LayerAttrs =
    strokeWidth !== undefined ? { strokeWidth, stroke: 'currentColor' } : {};

  const labelled = typeof ariaLabel === 'string' && ariaLabel.length > 0;

  return (
    <svg
      ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      color={color}
      className={className}
      role={labelled ? 'img' : undefined}
      aria-label={labelled ? ariaLabel : undefined}
      aria-hidden={labelled ? undefined : true}
      focusable="false"
      {...rest}
    >
      {/* Calque duotone : la même géométrie, pleine et douce. */}
      <g data-layer="duotone-fill" fill="currentColor" stroke="none" opacity={secondaryOpacity}>
        {icon.map(([tag, attrs], index) =>
          createElement(tag, {
            ...(attrs as LayerAttrs),
            key: `fill-${index}`,
            fill: 'currentColor',
            stroke: 'none',
            opacity: undefined,
          }),
        )}
      </g>
      {/* Calque de trait : la forme officielle, inchangée. */}
      <g data-layer="duotone-line">
        {icon.map(([tag, attrs], index) =>
          createElement(tag, {
            ...(attrs as LayerAttrs),
            ...strokeProps,
            key: `line-${index}`,
          }),
        )}
      </g>
    </svg>
  );
});

DuoIcon.displayName = 'DuoIcon';

export default DuoIcon;
