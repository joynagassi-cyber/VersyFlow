import * as React from 'react';
import { cn } from '@/lib/utils';

type CardVariant = 'surface' | 'hero' | 'tint';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
}

const variantClasses: Record<CardVariant, string> = {
  surface: 'glass rounded-3xl bg-surface p-5 shadow-md',
  hero: 'rounded-3xl bg-primary p-5 text-on-primary shadow',
  tint: 'bento-inset rounded-2xl bg-surface-tint p-4 shadow-sm',
};

/** Reusable surface container with concentric outer/inner card radii. */
export function Card({ variant = 'surface', className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  );
}

export type { CardVariant };
