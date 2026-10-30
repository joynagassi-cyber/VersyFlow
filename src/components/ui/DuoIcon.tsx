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

export const DuoIcon = forwardRef<SVGSVGElement, DuoIconProps>(function DuoIcon(
  { icon: SolarIcon, size = 24, strokeWidth = 1.75, secondaryOpacity = 0.5, className, color: _color, 'aria-label': label, ...rest }, ref,
) {
  return <SolarIcon ref={ref} size={size} strokeWidth={strokeWidth} secondaryOpacity={secondaryOpacity}
    className={`solar-accent ${className ?? ''}`} aria-label={label} role={label ? 'img' : undefined}
    aria-hidden={label ? undefined : true} focusable="false" {...rest} />;
});
export default DuoIcon;
