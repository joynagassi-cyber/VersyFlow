import * as React from 'react';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/brand/Logo';

interface EmptyStateProps {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
  showLogo?: boolean;
  className?: string;
}

/** Calm, branded empty state with a logo watermark + optional CTA. */
export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  icon,
  showLogo,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-2xl border border-dashed border-border p-10 text-center',
        className,
      )}
    >
      <div className="mb-4 flex h-20 w-20 items-center justify-center opacity-80">
        {showLogo ? <Logo size={64} /> : icon ?? <span className="text-3xl">✦</span>}
      </div>
      <p className="text-base font-semibold text-text-primary">{title}</p>
      {description && <p className="mt-1 max-w-xs text-sm text-text-muted">{description}</p>}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-4 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white shadow-rose transition active:opacity-90"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
