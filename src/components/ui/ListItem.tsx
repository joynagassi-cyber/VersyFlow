import * as React from 'react';
import { DuoIcon } from '@/components/ui/DuoIcon';
import {
  ChevronRightIcon as ChevronRight,
} from '@hugeicons/core-free-icons';
import type { IconSvgElement } from '@hugeicons/react';
import { cn } from '@/lib/utils';

interface ListItemProps {
  icon?: IconSvgElement;
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
export const ListItem = React.memo(function ListItem({
  icon: Icon,
  label,
  value,
  onClick,
  showChevron,
  trailing,
  iconBgClass = 'icon-chip',
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
          <DuoIcon icon={Icon} size={18} />
        </span>
      )}
      <span className="flex-1 text-sm font-medium text-text-primary">{label}</span>
      {value && <span className="text-sm text-text-muted">{value}</span>}
      {trailing}
      {showChevron && (
        <DuoIcon icon={ChevronRight} size={18} className="shrink-0 text-text-muted rtl:rotate-180" />
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
});
