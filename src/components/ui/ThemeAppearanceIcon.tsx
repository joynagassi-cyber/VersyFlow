import { DuoIcon } from '@/components/ui/DuoIcon';
import { PaintRollerIcon, SparklesIcon } from '@/components/ui/solar-icons';

/** Two paint rollers with a small sparkle, using the existing Solar glyphs. */
export function ThemeAppearanceIcon() {
  // Un seul glyphe porteur : l'ÉCHELLE D'ICÔNES (S01) n'a que quatre tailles
  // (16/20/24/32). Les deux rouleaux et l'étincelle étaient à 19/10 px ; un
  // rouleau à 20 px avec une étincelle de 16 px composait déjà l'image. Le
  // rendu reste celui d'une icône de liste, pas d'une illustration.
  return <span className="theme-appearance-icon" aria-hidden="true">
    <DuoIcon icon={PaintRollerIcon} size={20} className="theme-roller-first" />
    <DuoIcon icon={SparklesIcon} size={16} className="theme-roller-sparkle" />
  </span>;
}
