import * as React from 'react';
import { cn } from '@/lib/utils';

type CardVariant = 'surface' | 'hero' | 'tint';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
}

const variantClasses: Record<CardVariant, string> = {
  surface: 'bg-surface shadow-md',
  hero: 'gradient-hero text-white glow-primary shadow-rose',
  tint: 'bg-surface-tint shadow-sm',
};

/** Reusable surface container. `hero` renders the magenta-to-accent gradient. */
export function Card({ variant = 'surface', className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl p-4',
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  );
}

export type { CardVariant };
