import { DuoIcon } from '@/components/ui/DuoIcon';
import { PaintRollerIcon, SparklesIcon } from '@/components/ui/solar-icons';

/** Two paint rollers with a small sparkle, using the existing Solar glyphs. */
export function ThemeAppearanceIcon() {
  return <span className="theme-appearance-icon" aria-hidden="true">
    <DuoIcon icon={PaintRollerIcon} size={19} className="theme-roller-first" />
    <DuoIcon icon={PaintRollerIcon} size={16} className="theme-roller-second" />
    <DuoIcon icon={SparklesIcon} size={10} className="theme-roller-sparkle" />
  </span>;
}
