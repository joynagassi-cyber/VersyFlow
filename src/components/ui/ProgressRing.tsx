import * as React from 'react';
import { cn } from '@/lib/utils';

interface ProgressRingProps {
  value: number; // 0..100
  size?: number;
  stroke?: number;
  label?: React.ReactNode;
  trackClass?: string;
  fillClass?: string;
  className?: string;
}

/** Circular progress ring used on dashboards & home stats. */
export const ProgressRing = React.memo(function ProgressRing({
  value,
  size = 72,
  stroke = 8,
  label,
  trackClass = 'stroke-border',
  fillClass = 'stroke-primary',
  className,
}: ProgressRingProps) {
  const clamped = Math.max(0, Math.min(100, value));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (clamped / 100) * c;

  return (
    <div
      className={cn('relative inline-flex items-center justify-center', className)}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={stroke}
          fill="none"
          className={trackClass}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={fillClass}
          style={{ transition: 'stroke-dashoffset 0.4s ease' }}
        />
      </svg>
      {label != null && (
        <span className="absolute text-sm font-bold text-text-primary">{label}</span>
      )}
    </div>
  );
});
