/**
 * Courbe lissée avec aire dégradée — la forme qui raconte une tendance.
 *
 * Le tracé est une courbe de Catmull-Rom convertie en Bézier cubiques : douce
 * sans mentir sur les points (elle passe exactement par chaque valeur). L'aire
 * est un dégradé du même teint vers le transparent, donc lisible en clair
 * comme en sombre.
 */

import { useId } from 'react';

export interface AreaChartProps {
  data: { label: string; value: number }[];
  height?: number;
  /** Résumé d'une valeur (infobulle + lecteur d'écran). */
  describe?: (point: { label: string; value: number }, index: number) => string;
  color?: string;
  /** Affiche les points si la série est courte. */
  showDots?: boolean;
}

/** Points → chemin `M … C …` qui passe par chaque point. */
export function smoothPath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  let path = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    path += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
  }
  return path;
}

export function AreaChart({
  data,
  height = 140,
  describe,
  color = 'var(--acc)',
  showDots = false,
}: AreaChartProps) {
  const gradientId = useId().replace(/:/g, '');
  const width = 320;
  const padding = 6;
  const max = Math.max(1, ...data.map((point) => point.value));
  const min = Math.min(...data.map((point) => point.value), 0);
  const span = max - min || 1;

  const points = data.map((point, index) => ({
    x: data.length === 1 ? width / 2 : padding + (index / (data.length - 1)) * (width - padding * 2),
    y: padding + (1 - (point.value - min) / span) * (height - padding * 2),
  }));

  const line = smoothPath(points);
  const area =
    points.length > 0
      ? `${line} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`
      : '';

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-auto w-full"
      preserveAspectRatio="none"
      role="presentation"
    >
      <defs>
        <linearGradient id={`area-${gradientId}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.34" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>

      {/* Grille horizontale : trois repères suffisent, au-delà c'est du bruit. */}
      {[0.25, 0.5, 0.75].map((ratio) => (
        <line
          key={ratio}
          x1={0}
          x2={width}
          y1={padding + ratio * (height - padding * 2)}
          y2={padding + ratio * (height - padding * 2)}
          stroke="var(--bd)"
          strokeWidth="1"
          strokeDasharray="3 5"
        />
      ))}

      {area && <path d={area} fill={`url(#area-${gradientId})`} />}
      {line && (
        <path
          d={line}
          fill="none"
          stroke={color}
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}

      {showDots &&
        points.map((point, index) => (
          <circle key={index} cx={point.x} cy={point.y} r="3" fill={color}>
            <title>{describe ? describe(data[index], index) : `${data[index].label} : ${data[index].value}`}</title>
          </circle>
        ))}
    </svg>
  );
}
