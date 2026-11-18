/**
 * Barres horizontales — pour les catégories qui ont un nom (livres, thèmes).
 *
 * Le libellé est à gauche, la barre à droite, la valeur au bout : l'œil
 * compare des longueurs alignées, ce que des barres verticales ne savent pas
 * faire quand les noms sont longs.
 */

export interface HorizontalBarsProps {
  data: { label: string; value: number }[];
  color?: string;
  /** Suffixe affiché après la valeur. */
  suffix?: string;
}

export function HorizontalBars({ data, color = 'var(--acc)', suffix }: HorizontalBarsProps) {
  const max = Math.max(1, ...data.map((point) => point.value));

  return (
    <ul className="flex flex-col gap-2">
      {data.map((point) => (
        <li key={point.label} className="flex items-center gap-2">
          <span className="w-[84px] shrink-0 truncate text-xs font-medium text-text-secondary">{point.label}</span>
          <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-surface-tint">
            <span
              className="block h-full rounded-full transition-[width] duration-300 motion-reduce:transition-none"
              style={{
                width: `${Math.max(4, (point.value / max) * 100)}%`,
                backgroundColor: color,
              }}
              title={`${point.label} : ${point.value}${suffix ?? ''}`}
            />
          </span>
          <span className="w-8 shrink-0 text-end text-xs font-bold text-text-primary tabular-nums">
            {point.value}
            {suffix}
          </span>
        </li>
      ))}
    </ul>
  );
}
