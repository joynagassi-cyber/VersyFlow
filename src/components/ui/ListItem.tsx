import * as React from 'react';
import { ChevronRight } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ListItemProps {
  icon?: LucideIcon;
  label: string;
  value?: React.ReactNode;
  onClick?: () => void;
  showChevron?: boolean;
  trailing?: React.ReactNode;
  iconBgClass?: string;
  className?: string;
}

const baseClasses = (className?: string) =>
  cn(
    'flex w-full items-center gap-3 px-4 py-3 text-left',
    className,
  );

/** A grouped settings/list row: tinted icon + label + optional value/chevron. */
export function ListItem({
  icon: Icon,
  label,
  value,
  onClick,
  showChevron,
  trailing,
  iconBgClass = 'bg-icon-bg-rose text-primary',
  className,
}: ListItemProps) {
  const content = (
    <>
      {Icon && (
        <span
          className={cn(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
            iconBgClass,
          )}
        >
          <Icon size={18} />
        </span>
      )}
      <span className="flex-1 text-sm font-medium text-text-primary">{label}</span>
      {value && <span className="text-sm text-text-muted">{value}</span>}
      {trailing}
      {showChevron && (
        <ChevronRight size={18} className="shrink-0 text-text-muted rtl:rotate-180" />
      )}
    </>
  );

  if (onClick) {
    return (
      <button
        onClick={onClick}
        className={cn(baseClasses(className), 'rounded-xl transition active:bg-surface-tint')}
      >
        {content}
      </button>
    );
  }
  return <div className={baseClasses(className)}>{content}</div>;
}
