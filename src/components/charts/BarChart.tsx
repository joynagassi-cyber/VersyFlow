/**
 * Barres verticales — la forme qu'on lit le plus vite pour comparer des
 * journées. Hauteur calculée sur le maximum réel, coins arrondis, valeurs
 * en `title`, et un point chaud qui prend l'accent du thème.
 */

export interface BarChartProps {
  data: { label: string; value: number }[];
  /** Hauteur du dessin en pixels (sans les libellés). */
  height?: number;
  /** Libellé complet d'une barre (infobulle + lecteur d'écran). */
  describe?: (point: { label: string; value: number }, index: number) => string;
  /** Couleur de base ; l'accent est utilisé par défaut. */
  color?: string;
  /** Met en avant l'index du maximum. */
  highlightMax?: boolean;
}

export function BarChart({
  data,
  height = 120,
  describe,
  color = 'var(--acc)',
  highlightMax = true,
}: BarChartProps) {
  const max = Math.max(1, ...data.map((point) => point.value));
  const peak = data.reduce((best, point, index) => (point.value > data[best]?.value ? index : best), 0);

  return (
    <div className="flex items-end gap-[3px]" style={{ height }}>
      {data.map((point, index) => {
        const ratio = point.value / max;
        const isPeak = highlightMax && index === peak && point.value > 0;
        return (
          <div key={`${point.label}-${index}`} className="group flex h-full flex-1 flex-col justify-end">
            <span
              className="w-full rounded-t-[3px] transition-[height] duration-300 motion-reduce:transition-none"
              style={{
                height: `${Math.max(point.value > 0 ? 6 : 2, ratio * 100)}%`,
                backgroundColor: point.value > 0 ? color : 'var(--bd)',
                opacity: isPeak ? 1 : point.value > 0 ? 0.72 : 1,
              }}
              title={describe ? describe(point, index) : `${point.label} : ${point.value}`}
            />
          </div>
        );
      })}
    </div>
  );
}

/** Étiquettes d'axe discrètes ; on en garde 6 au maximum pour ne pas tourner. */
export function barAxisLabels(data: { label: string }[], max = 6): (string | null)[] {
  if (data.length === 0) return [];
  const step = Math.max(1, Math.ceil(data.length / max));
  return data.map((point, index) => (index % step === 0 ? point.label : null));
}
