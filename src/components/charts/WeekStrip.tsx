/**
 * Semaine en bande — sept mini-barres, une par jour, avec un point marqueur
 * au sommet de la valeur.
 *
 * C'est la vignette des cartes de synthèse (inspiration des tableaux de bord
 * santé) : on lit le rythme d'un coup d'œil sans quitter la carte, et le jour
 * courant est signalé par un point plein. Les barres gardent une hauteur
 * minimale pour que « zéro » reste visible comme un zéro, pas comme un bug.
 */

export interface WeekStripProps {
  /** Sept valeurs, lundi → dimanche. */
  values: number[];
  labels: string[];
  /** Index du jour courant (0 = lundi). */
  todayIndex?: number;
  color?: string;
  height?: number;
}

export function WeekStrip({
  values,
  labels,
  todayIndex,
  color = 'var(--acc)',
  height = 56,
}: WeekStripProps) {
  const max = Math.max(1, ...values);

  return (
    <div className="flex items-end gap-2" style={{ height: height + 14 }}>
      {values.map((value, index) => {
        const ratio = value / max;
        const isToday = index === todayIndex;
        return (
          <div key={`${labels[index]}-${index}`} className="flex flex-1 flex-col items-center gap-1">
            <div className="flex w-full flex-1 items-end justify-center" style={{ height }}>
              <span className="relative flex w-2 items-end justify-center rounded-full bg-surface-tint" style={{ height: '100%' }}>
                <span
                  className="w-2 rounded-full transition-[height] duration-300 motion-reduce:transition-none"
                  style={{
                    height: `${Math.max(value > 0 ? 18 : 8, ratio * 100)}%`,
                    backgroundColor: value > 0 ? color : 'var(--bd)',
                    opacity: isToday ? 1 : 0.55,
                  }}
                  title={`${labels[index]} : ${value}`}
                />
              </span>
            </div>
            <span
              className={
                'text-2xs leading-none ' + (isToday ? 'font-bold text-text-primary' : 'text-text-muted')
              }
            >
              {labels[index]}
            </span>
          </div>
        );
      })}
    </div>
  );
}
