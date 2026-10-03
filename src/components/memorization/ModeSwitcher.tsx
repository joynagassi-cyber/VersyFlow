/**
 * ModeSwitcher — the 4-mode segmented control at the bottom of the
 * unified Memorization Workspace.
 *
 * Each mode is an icon + label:
 *   👁 Révéler   ·   🙈 Masquer   ·   🗂 Cartes   ·   ✍️ Écrire
 *
 * The active mode is the dark "pill"; the others are outline. A
 * `<`/`>` toggle (or chevron) collapses the bar to a single-button
 * state when the user wants minimal chrome.
 *
 * Premium design: floating pill with layered shadows (.mw-switcher /
 * .mw-switcher-pill), springy active state, and a "PROCHAIN" badge on
 * the recommended next mode.
 */

import { useState } from 'react';
import { ChevronDown, ChevronRight, Eye, EyeOff, Layers, PenLine } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ModeId = 'reveal' | 'mask' | 'cards' | 'write';

export const MODES: Array<{ id: ModeId; label: string; icon: typeof Eye }> = [
  { id: 'reveal', label: 'Révéler', icon: Eye },
  { id: 'mask', label: 'Masquer', icon: EyeOff },
  { id: 'cards', label: 'Cartes', icon: Layers },
  { id: 'write', label: 'Écrire', icon: PenLine },
];

export interface ModeSwitcherProps {
  active: ModeId;
  onChange: (m: ModeId) => void;
  /** The "next" mode is recommended when the current one is finished
   *  with a score ≥ threshold — a subtle badge is shown. */
  recommendedNext?: ModeId | null;
  /** When collapsed, the bar shows only the active mode + an expand
   *  button; expanding reveals all four. */
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function ModeSwitcher({
  active,
  onChange,
  recommendedNext,
  collapsed,
  onToggleCollapse,
}: ModeSwitcherProps) {
  const [showAll, setShowAll] = useState(!collapsed);

  const visibleModes = showAll ? MODES : [MODES.find((m) => m.id === active)!];

  return (
    <div className="mw-switcher">
      <div className="mw-switcher-pill">
        {visibleModes.map((mode) => {
          const isActive = active === mode.id;
          const isRecommended = recommendedNext === mode.id && !isActive;
          const Icon = mode.icon;
          return (
            <button
              key={mode.id}
              type="button"
              onClick={() => onChange(mode.id)}
              className={cn(
                'flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-bold transition',
                isActive && 'active',
                isRecommended && 'recommended',
              )}
            >
              <Icon size={14} />
              {mode.label}
              {isRecommended && <span className="badge">PROCHAIN</span>}
            </button>
          );
        })}

        {/* Expand/collapse toggle */}
        <button
          type="button"
          onClick={() => {
            setShowAll((s) => !s);
            onToggleCollapse?.();
          }}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-tint text-text-secondary active:scale-90"
          aria-label={showAll ? 'Replier' : 'Déplier'}
        >
          {showAll ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </button>
      </div>
    </div>
  );
}

export default ModeSwitcher;
