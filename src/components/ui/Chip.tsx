import * as React from 'react';
import { cn } from '@/lib/utils';

interface ChipProps {
  label: string;
  active?: boolean;
  onClick?: () => void;
  icon?: React.ReactNode;
  disabled?: boolean;
  className?: string;
}

/** Pill chip / toggle. Renders a button when `onClick` is provided. */
export const Chip = React.memo(function Chip({
  label,
  active,
  onClick,
  icon,
  disabled,
  className,
}: ChipProps) {
  /* `min-h-8` : une pastille reste une cible secondaire (32 px), jamais un
     texte cliquable isolé. Le survol n'existe que sur pointeur fin. */
  const cls = cn(
    'inline-flex min-h-8 items-center gap-1.5 rounded-full px-3 text-xs font-semibold',
    'transition-colors duration-[var(--motion-fast)]',
    active ? 'bg-primary text-on-primary' : 'bg-surface-tint text-primary',
    onClick && !disabled && '[@media(hover:hover)and(pointer:fine)]:hover:bg-primary/15',
    disabled && 'opacity-45',
    className,
  );
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-pressed={active === undefined ? undefined : active}
        className={cls}
      >
        {icon}
        {label}
      </button>
    );
  }
  return (
    <span className={cls}>
      {icon}
      {label}
    </span>
  );
});
