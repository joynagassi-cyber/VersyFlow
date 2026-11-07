import { DuoIcon } from '@/components/ui/DuoIcon';
import { BookOpen01Icon, BrainIcon, Clock01Icon, UserGroupIcon, BarChartIcon, PaletteIcon, SparklesIcon } from '@/components/ui/solar-icons';

const icons = [BookOpen01Icon, BrainIcon, Clock01Icon, UserGroupIcon, BarChartIcon, PaletteIcon, SparklesIcon];
/** Decorative, local vector composition; colors follow the active theme. */
export function JourneyArtwork({ index = 0 }: { index?: number }) {
  const Icon = icons[index % icons.length];
  return <div className={`journey-art journey-art-${index}`} aria-hidden="true">
    <div className="journey-art-halo" /><div className="journey-art-orbit journey-art-orbit-one" /><div className="journey-art-orbit journey-art-orbit-two" />
    <div className="journey-art-card journey-art-card-back" /><div className="journey-art-card journey-art-card-front"><DuoIcon icon={Icon} size={106} /></div>
    <span className="journey-art-spark journey-art-spark-one">✦</span><span className="journey-art-spark journey-art-spark-two">✦</span>
    <span className="journey-art-line journey-art-line-one" /><span className="journey-art-line journey-art-line-two" />
  </div>;
}
