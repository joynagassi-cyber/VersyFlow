import * as React from 'react';
import { cn } from '@/lib/utils';

interface ChipProps {
  label: string;
  active?: boolean;
  onClick?: () => void;
  icon?: React.ReactNode;
  className?: string;
}

/** Pill chip / toggle. Renders a button when `onClick` is provided. */
export function Chip({ label, active, onClick, icon, className }: ChipProps) {
  const cls = cn(
    'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition',
    active ? 'bg-primary text-white shadow-rose' : 'bg-surface-tint text-primary',
    className,
  );
  if (onClick) {
    return (
      <button onClick={onClick} className={cls}>
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
}
