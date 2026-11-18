/**
 * Graphiques de statistiques — les chiffres avant les formes.
 *
 * Deux familles de vérifications :
 *   1. les agrégations (`chart-data.ts`) sont justes, y compris les trous
 *      (un jour sans révision vaut 0, il ne disparaît pas de la série) ;
 *   2. chaque primitive dessine réellement quelque chose et reste lisible
 *      sans couleur : `title` par donnée, `role`/`aria-label` sur le cadre.
 */
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import {
  consistency,
  cumulativeReviews,
  dayKey,
  heatmapMatrix,
  ratingMix,
  reviewsPerDay,
  stabilitySeries,
  statusBreakdown,
  topBooks,
  weekdayProfile,
  type ReviewLike,
} from '@/domains/analytics/chart-data';
import { ChartFrame } from '@/components/charts/ChartFrame';
import { HeatmapCalendar } from '@/components/charts/HeatmapCalendar';
import { BarChart, barAxisLabels } from '@/components/charts/BarChart';
import { AreaChart, smoothPath } from '@/components/charts/AreaChart';
import { DonutChart } from '@/components/charts/DonutChart';
import { RadarChart } from '@/components/charts/RadarChart';
import { GaugeChart } from '@/components/charts/GaugeChart';
import { StackedBarChart } from '@/components/charts/StackedBarChart';
import { HorizontalBars } from '@/components/charts/HorizontalBars';
import { WeekStrip } from '@/components/charts/WeekStrip';
import { TickRing } from '@/components/charts/TickRing';
import { DotMatrix } from '@/components/charts/DotMatrix';
import { GroupedBars } from '@/components/charts/GroupedBars';
import { StatCard } from '@/components/charts/StatCard';
import { Calendar01Icon as CalendarIcon } from '@/components/ui/solar-icons';

const DAY = 86_400_000;
const TODAY = new Date(2026, 9, 30, 12, 0, 0).getTime();
const at = (daysAgo: number) => TODAY - daysAgo * DAY;

const LOGS: ReviewLike[] = [
  { answeredAt: at(0), rating: 'good', stabilityAfter: 12 },
  { answeredAt: at(0), rating: 'easy', stabilityAfter: 18 },
  { answeredAt: at(1), rating: 'again', stabilityAfter: 2 },
  { answeredAt: at(3), rating: 'hard', stabilityAfter: 6 },
  { answeredAt: at(3), rating: 'good', stabilityAfter: 9 },
];

describe('agrégations des graphiques', () => {
  it('rend une série jour par jour, zéros compris', () => {
    const series = reviewsPerDay(LOGS, 7, TODAY);
    expect(series).toHaveLength(7);
    expect(series[series.length - 1]).toEqual({ date: dayKey(TODAY), count: 2 });
    expect(series.reduce((sum, day) => sum + day.count, 0)).toBe(LOGS.length);
    // Un jour sans révision existe quand même, à zéro.
    expect(series.some((day) => day.count === 0)).toBe(true);
  });

  it('compte les quatre notes FSRS', () => {
    expect(ratingMix(LOGS)).toEqual({ again: 1, hard: 1, good: 2, easy: 1 });
  });

  it('répartit les versets par statut', () => {
    const status = statusBreakdown([
      { status: 'mastered' },
      { status: 'mastered' },
      { status: 'in-progress' },
      { status: 'new' },
    ] as never);
    expect(status).toEqual({ nouveau: 1, enCours: 1, maitrise: 2 });
  });

  it('cumule sans jamais redescendre', () => {
    const cumulative = cumulativeReviews([
      { date: '2026-10-28', count: 2 },
      { date: '2026-10-29', count: 0 },
      { date: '2026-10-30', count: 3 },
    ]);
    expect(cumulative.map((point) => point.total)).toEqual([2, 2, 5]);
  });

  it('profile la semaine sur sept jours', () => {
    const profile = weekdayProfile(LOGS);
    expect(profile).toHaveLength(7);
    expect(profile.reduce((sum, value) => sum + value, 0)).toBe(LOGS.length);
  });

  it('construit une matrice de chaleur pleine (7 lignes × N colonnes)', () => {
    const matrix = heatmapMatrix(reviewsPerDay(LOGS, 40, TODAY), 6, TODAY);
    expect(matrix.cells).toHaveLength(6);
    for (const column of matrix.cells) expect(column).toHaveLength(7);
    expect(matrix.max).toBeGreaterThanOrEqual(2);
    expect(matrix.total).toBeGreaterThanOrEqual(LOGS.length);
  });

  it('découpe la stabilité en tranches et borne les valeurs', () => {
    const series = stabilitySeries(LOGS, 30, 6, TODAY);
    expect(series).toHaveLength(6);
    expect(series.every((point) => point.value >= 0)).toBe(true);
    expect(series.some((point) => point.value > 0)).toBe(true);
  });

  it('classe les livres et respecte la limite', () => {
    const books = topBooks(
      [{ bookId: 'joh' }, { bookId: 'joh' }, { bookId: 'psa' }, { bookId: 'rom' }] as never,
      2,
    );
    expect(books).toEqual([
      { book: 'joh', count: 2 },
      { book: 'psa', count: 1 },
    ]);
  });

  it('mesure la régularité en pourcentage de jours actifs', () => {
    expect(consistency([{ count: 1 }, { count: 0 }, { count: 3 }, { count: 0 }])).toBe(50);
    expect(consistency([])).toBe(0);
  });
});

describe('primitives de graphique', () => {
  it('le cadre annonce le graphique et gère l’absence de données', () => {
    const { rerender } = render(
      <ChartFrame title="Chaleur" summary="12 révisions" hasData>
        <span>contenu</span>
      </ChartFrame>,
    );
    expect(screen.getByRole('group', { name: 'Chaleur' })).toBeInTheDocument();
    expect(screen.getByRole('img')).toHaveAttribute('aria-label', 'Chaleur. 12 révisions');

    rerender(
      <ChartFrame title="Chaleur" summary="vide" hasData={false} empty={{ title: 'Aucune donnée' }}>
        <span>jamais rendu</span>
      </ChartFrame>,
    );
    expect(screen.getByText('Aucune donnée')).toBeInTheDocument();
    expect(screen.queryByText('jamais rendu')).not.toBeInTheDocument();
  });

  it('la carte de chaleur expose une case par jour et sa valeur', () => {
    const { container } = render(
      <HeatmapCalendar
        cells={[[0, 1, 2, 3, 4, null, null]]}
        max={4}
        weekdayLabels={['L', 'M', 'M', 'J', 'V', 'S', 'D']}
      />,
    );
    expect(container.querySelectorAll('.heatmap-cell')).toHaveLength(7);
    expect(container.querySelectorAll('[data-level="-2"]')).toHaveLength(2);
  });

  it('les barres portent une infobulle par valeur', () => {
    const { container } = render(
      <BarChart data={[{ label: 'lun', value: 3 }, { label: 'mar', value: 0 }]} />,
    );
    expect(container.querySelectorAll('span[title]')).toHaveLength(2);
  });

  it('la courbe produit un chemin lissé valide', () => {
    const path = smoothPath([
      { x: 0, y: 10 },
      { x: 10, y: 4 },
      { x: 20, y: 8 },
    ]);
    expect(path.startsWith('M 0 10')).toBe(true);
    expect(path).toContain('C');
    expect(smoothPath([])).toBe('');
    expect(smoothPath([{ x: 1, y: 2 }])).toBe('M 1 2');
  });

  it('la courbe dessine une aire et une ligne', () => {
    const { container } = render(<AreaChart data={[{ label: 'a', value: 1 }, { label: 'b', value: 4 }]} />);
    expect(container.querySelector('path[fill^="url(#area-"]')).toBeTruthy();
    expect(container.querySelectorAll('path[stroke]').length).toBeGreaterThanOrEqual(1);
  });

  it('l’anneau additionne les segments en arcs', () => {
    const { container } = render(
      <DonutChart
        slices={[
          { label: 'A', value: 3, color: 'red' },
          { label: 'B', value: 1, color: 'blue' },
        ]}
        centerValue={4}
      />,
    );
    expect(container.querySelectorAll('circle[stroke-dasharray]')).toHaveLength(2);
    expect(screen.getByText('4')).toBeInTheDocument();
  });

  it('le radar exige trois axes et positionne chaque sommet', () => {
    const { container, rerender } = render(
      <RadarChart axes={[{ label: 'a', value: 1 }, { label: 'b', value: 0.5 }]} />,
    );
    expect(container.firstChild).toBeNull();
    rerender(
      <RadarChart
        axes={[
          { label: 'a', value: 1 },
          { label: 'b', value: 0.5 },
          { label: 'c', value: 0.2 },
        ]}
      />,
    );
    expect(container.querySelectorAll('circle')).toHaveLength(3);
  });

  it('la jauge borne la valeur entre 0 et 100', () => {
    const { container } = render(<GaugeChart value={140} label="Régularité" hint="30 jours" />);
    expect(screen.getByText('100%')).toBeInTheDocument();
    expect(container.querySelectorAll('path[stroke-dasharray]')).toHaveLength(1);
  });

  it('les barres empilées nomment chaque segment', () => {
    render(
      <StackedBarChart
        segments={[
          { key: 'a', label: 'À revoir', value: 2, color: 'red' },
          { key: 'b', label: 'Bien', value: 6, color: 'green' },
        ]}
      />,
    );
    expect(screen.getByText('À revoir')).toBeInTheDocument();
    expect(screen.getByText('Bien')).toBeInTheDocument();
  });

  it('les barres horizontales affichent libellé et valeur', () => {
    render(<HorizontalBars data={[{ label: 'JOH', value: 7 }, { label: 'PSA', value: 3 }]} />);
    expect(screen.getByText('JOH')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();
  });

  it('barAxisLabels garde six repères au maximum', () => {
    const labels = barAxisLabels(Array.from({ length: 30 }, (_, index) => ({ label: `${index}` })));
    expect(labels.filter(Boolean).length).toBeLessThanOrEqual(6);
  });
});

describe('vignettes de synthèse', () => {
  it('la bande hebdomadaire dessine sept barres et nomme la valeur', () => {
    const { container } = render(
      <WeekStrip values={[0, 3, 1, 0, 5, 2, 4]} labels={['L', 'M', 'M', 'J', 'V', 'S', 'D']} todayIndex={6} />,
    );
    expect(container.querySelectorAll('span[title]')).toHaveLength(7);
    expect(container.textContent).toContain('D');
  });

  it('l’anneau gradué allume la part attendue', () => {
    const { container } = render(<TickRing value={12} ratio={0.5} ticks={36} />);
    const lines = container.querySelectorAll('line');
    expect(lines).toHaveLength(36);
    const lit = [...lines].filter((line) => line.getAttribute('opacity') === '1');
    expect(lit).toHaveLength(18);
    expect(screen.getByText('12')).toBeInTheDocument();
  });

  it('la matrice de points expose une pastille par jour', () => {
    const { container } = render(<DotMatrix values={Array.from({ length: 14 }, (_, i) => i)} columns={7} />);
    expect(container.querySelectorAll('span[title]')).toHaveLength(14);
  });

  it('les barres groupées comparent deux séries', () => {
    const { container } = render(
      <GroupedBars
        labels={['L', 'M', 'M']}
        seriesA={{ label: 'Cette sem.', values: [2, 4, 1], color: 'red' }}
        seriesB={{ label: 'Précédente', values: [1, 3, 3], color: 'blue' }}
      />,
    );
    expect(container.querySelectorAll('span[title]')).toHaveLength(6);
    expect(screen.getByText('Précédente')).toBeInTheDocument();
  });

  it('la carte de synthèse porte valeur, unité et explication', () => {
    render(
      <StatCard
        title="Série"
        icon={CalendarIcon}
        value={12}
        unit="j"
        hint="Jours consécutifs"
        visual={<span>vignette</span>}
      />,
    );
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('j')).toBeInTheDocument();
    expect(screen.getByText('Jours consécutifs')).toBeInTheDocument();
    expect(screen.getByText('vignette')).toBeInTheDocument();
  });
});

describe('tableau de bord — au moins six graphiques différents', () => {
  const source = readFileSync('src/components/charts/StatsDashboard.tsx', 'utf8');
  const primitives = [
    'HeatmapCalendar',
    'AreaChart',
    'BarChart',
    'DonutChart',
    'RadarChart',
    'GaugeChart',
    'StackedBarChart',
    'HorizontalBars',
  ];

  it('compose huit primitives de graphique', () => {
    for (const primitive of primitives) expect(source).toContain(`<${primitive}`);
    expect(new Set(primitives).size).toBeGreaterThanOrEqual(6);
  });

  it('ajoute cinq vignettes de synthèse et six cartes de tête', () => {
    for (const primitive of ['StatCard', 'WeekStrip', 'TickRing', 'DotMatrix', 'GroupedBars']) {
      expect(source).toContain(`<${primitive}`);
    }
    expect((source.match(/<StatCard/g) ?? []).length).toBeGreaterThanOrEqual(6);
  });

  it('est branché sur les données réelles, pas sur des constantes', () => {
    expect(source).toContain('useStatsCharts(profileId');
    expect(source).not.toMatch(/\[1,\s*2,\s*3,\s*4\]/);
  });

  it('reste sans librairie de graphes et sans couleur figée', () => {
    expect(source).not.toMatch(/from '(recharts|chart\.js|d3|victory|@nivo)/);
    expect(source).not.toMatch(/#[0-9a-f]{6}/i);
  });
});
