/**
 * Tableau de bord statistique — huit graphiques, huit questions.
 *
 * Chaque graphique répond à une question différente ; c'est le critère qui a
 * présidé au choix du type, pas l'envie de varier les formes :
 *
 *   1. carte de chaleur   — « ai-je été régulier ces derniers mois ? »
 *   2. courbe d'aire      — « ma pratique monte-t-elle ce mois-ci ? »
 *   3. barres verticales  — « quel jour de la semaine est mon point faible ? »
 *   4. anneau             — « quelle part de mon stock est maîtrisée ? »
 *   5. radar              — « suis-je équilibré ou seulement régulier ? »
 *   6. jauge              — « sur 30 jours, combien ai-je réellement pratiqué ? »
 *   7. barres empilées    — « mes révisions sont-elles faciles ou laborieuses ? »
 *   8. barres horizontales— « quels livres concentrent mon effort ? »
 *
 * Tout est en SVG et en jetons de couleur : aucun paquet de graphes, aucune
 * requête réseau, aucune couleur figée. Les animations respectent
 * `prefers-reduced-motion`.
 */

import { useTranslation } from 'react-i18next';
import { ChartFrame } from '@/components/charts/ChartFrame';
import { HeatmapCalendar } from '@/components/charts/HeatmapCalendar';
import { AreaChart } from '@/components/charts/AreaChart';
import { BarChart } from '@/components/charts/BarChart';
import { DonutChart } from '@/components/charts/DonutChart';
import { RadarChart } from '@/components/charts/RadarChart';
import { GaugeChart } from '@/components/charts/GaugeChart';
import { StackedBarChart } from '@/components/charts/StackedBarChart';
import { HorizontalBars } from '@/components/charts/HorizontalBars';
import { useStatsCharts, useWeekdayLabels } from '@/hooks/useStatsCharts';
import { normalizeLocaleCode } from '@/domains/i18n/config';

const COLORS = {
  accent: 'var(--acc)',
  success: 'var(--color-success)',
  warning: 'var(--color-warning)',
  error: 'var(--color-error)',
  info: 'var(--color-info)',
};

export interface StatsDashboardProps {
  profileId: string;
  /** Nombre de jours de la fenêtre des séries temporelles. */
  windowDays?: number;
}

export function StatsDashboard({ profileId, windowDays = 30 }: StatsDashboardProps) {
  const { t, i18n } = useTranslation();
  const locale = normalizeLocaleCode(i18n.resolvedLanguage || i18n.language);
  const weekdayLabels = useWeekdayLabels(locale);
  const data = useStatsCharts(profileId, windowDays);

  if (data.loading) {
    return (
      <div className="stats-grid" role="status" aria-live="polite">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="stats-chart g2 h-40 animate-pulse rounded-2xl bg-surface" />
        ))}
        <span className="sr-only">{t('stats.loading', 'Calcul des graphiques…')}</span>
      </div>
    );
  }

  const hasReviews = data.totals.reviews > 0;
  const peakDay = data.perDay.reduce((best, day) => (day.count > best.count ? day : best), data.perDay[0] ?? { date: '', count: 0 });
  const totalMix = data.mix.again + data.mix.hard + data.mix.good + data.mix.easy;
  const masteredRatio =
    data.totals.verses > 0 ? Math.round((data.status.maitrise / data.totals.verses) * 100) : 0;

  // Radar : six axes normalisés sur les volumes observés, bornés à 1.
  const radarAxes = [
    { label: t('stats.axisConsistency', 'Régularité'), value: data.consistencyPct / 100, display: `${data.consistencyPct}%` },
    { label: t('stats.axisVolume', 'Volume'), value: Math.min(1, data.totals.reviews / 120), display: `${data.totals.reviews}` },
    { label: t('stats.axisMastery', 'Maîtrise'), value: masteredRatio / 100, display: `${masteredRatio}%` },
    { label: t('stats.axisStreak', 'Série'), value: Math.min(1, data.totals.streak / 30), display: `${data.totals.streak} j` },
    {
      label: t('stats.axisEase', 'Facilité'),
      value: totalMix > 0 ? (data.mix.good + data.mix.easy) / totalMix : 0,
      display: totalMix > 0 ? `${Math.round(((data.mix.good + data.mix.easy) / totalMix) * 100)}%` : '—',
    },
    {
      label: t('stats.axisBreadth', 'Diversité'),
      value: Math.min(1, data.books.length / 6),
      display: `${data.books.length}`,
    },
  ];

  return (
    <div className="stats-grid">
      <ChartFrame
        title={t('stats.heatmapTitle', 'Régularité des révisions')}
        subtitle={t('stats.heatmapSubtitle', {
          count: data.heatmap.total,
          defaultValue: '{{count}} révisions sur les 18 dernières semaines',
        })}
        summary={t('stats.heatmapSummary', {
          total: data.heatmap.total,
          defaultValue: '{{total}} révisions au total, case la plus dense à {{max}}.',
          max: data.heatmap.max,
        })}
        hasData={data.heatmap.total > 0}
        empty={{ title: t('stats.noReviews', 'Aucune révision enregistrée'), hint: t('stats.noReviewsHint', 'Vos cases se rempliront dès la première session.') }}
        wide
      >
        <HeatmapCalendar cells={data.heatmap.cells} max={data.heatmap.max} weekdayLabels={weekdayLabels} />
      </ChartFrame>

      <ChartFrame
        title={t('stats.areaTitle', 'Révisions par jour')}
        subtitle={t('stats.areaSubtitle', {
          days: windowDays,
          defaultValue: 'Sur les {{days}} derniers jours',
        })}
        summary={t('stats.areaSummary', {
          peak: peakDay?.count ?? 0,
          defaultValue: 'Pic à {{peak}} révisions sur une journée.',
        })}
        hasData={hasReviews}
        empty={{ title: t('stats.noReviews', 'Aucune révision enregistrée') }}
        wide
      >
        <div className="flex flex-col gap-1">
          <AreaChart
            data={data.perDay.map((day) => ({ label: day.date, value: day.count }))}
            describe={(point) => `${point.label} : ${point.value}`}
          />
          <div className="flex justify-between text-2xs text-text-muted">
            <span>{data.perDay[0]?.date}</span>
            <span>{data.perDay[data.perDay.length - 1]?.date}</span>
          </div>
        </div>
      </ChartFrame>

      <ChartFrame
        title={t('stats.weekdayTitle', 'Activité par jour')}
        subtitle={t('stats.weekdaySubtitle', 'Où se concentre votre pratique')}
        summary={t('stats.weekdaySummary', 'Répartition des révisions sur les sept jours de la semaine.')}
        hasData={hasReviews}
        empty={{ title: t('stats.noReviews', 'Aucune révision enregistrée') }}
      >
        <BarChart
          data={data.weekday.map((count, index) => ({ label: weekdayLabels[index], value: count }))}
          describe={(point) => `${point.label} : ${point.value}`}
        />
        <div className="mt-1 flex justify-between text-2xs text-text-muted">
          {weekdayLabels.map((label, index) => (
            <span key={`${label}-${index}`} className="flex-1 text-center">
              {label}
            </span>
          ))}
        </div>
      </ChartFrame>

      <ChartFrame
        title={t('stats.statusTitle', 'Versets par statut')}
        subtitle={t('stats.statusSubtitle', {
          count: data.totals.verses,
          defaultValue: '{{count}} versets en bibliothèque',
        })}
        summary={t('stats.statusSummary', {
          mastered: data.status.maitrise,
          learning: data.status.enCours,
          fresh: data.status.nouveau,
          defaultValue: '{{mastered}} maîtrisés, {{learning}} en cours, {{fresh}} nouveaux.',
        })}
        hasData={data.totals.verses > 0}
        empty={{ title: t('stats.noVerses', 'Aucun verset mémorisé') }}
      >
        <div className="flex items-center gap-4">
          <DonutChart
            slices={[
              { label: t('stats.mastered', 'Maîtrisés'), value: data.status.maitrise, color: COLORS.success },
              { label: t('stats.inProgress', 'En cours'), value: data.status.enCours, color: COLORS.accent },
              { label: t('stats.new', 'Nouveaux'), value: data.status.nouveau, color: COLORS.info },
            ]}
            centerValue={data.totals.verses}
            centerLabel={t('stats.verses', 'versets')}
          />
          <ul className="flex flex-col gap-2 text-xs">
            {[
              { label: t('stats.mastered', 'Maîtrisés'), value: data.status.maitrise, color: COLORS.success },
              { label: t('stats.inProgress', 'En cours'), value: data.status.enCours, color: COLORS.accent },
              { label: t('stats.new', 'Nouveaux'), value: data.status.nouveau, color: COLORS.info },
            ].map((row) => (
              <li key={row.label} className="flex items-center gap-2">
                <span aria-hidden="true" className="h-2 w-2 rounded-full" style={{ backgroundColor: row.color }} />
                <span className="text-text-secondary">{row.label}</span>
                <span className="font-bold text-text-primary tabular-nums">{row.value}</span>
              </li>
            ))}
          </ul>
        </div>
      </ChartFrame>

      <ChartFrame
        title={t('stats.radarTitle', 'Équilibre d’apprentissage')}
        subtitle={t('stats.radarSubtitle', 'Six dimensions, normalisées')}
        summary={t('stats.radarSummary', 'Profil d’équilibre entre régularité, volume, maîtrise, série, facilité et diversité.')}
      >
        <RadarChart axes={radarAxes} />
      </ChartFrame>

      <ChartFrame
        title={t('stats.gaugeTitle', 'Régularité sur 30 jours')}
        subtitle={t('stats.gaugeSubtitle', 'Part des jours avec au moins une révision')}
        summary={t('stats.gaugeSummary', { pct: data.consistencyPct, defaultValue: '{{pct}} % de jours actifs.' })}
        hasData={hasReviews}
        empty={{ title: t('stats.noReviews', 'Aucune révision enregistrée') }}
      >
        <GaugeChart
          value={data.consistencyPct}
          label={t('stats.activeDays', 'jours actifs')}
          hint={t('stats.activeDaysHint', {
            active: data.perDay.filter((day) => day.count > 0).length,
            days: data.perDay.length,
            defaultValue: '{{active}} jours sur {{days}}',
          })}
          color={COLORS.success}
        />
      </ChartFrame>

      <ChartFrame
        title={t('stats.mixTitle', 'Facilité des révisions')}
        subtitle={t('stats.mixSubtitle', 'Répartition des quatre notes FSRS')}
        summary={t('stats.mixSummary', {
          easy: data.mix.easy,
          good: data.mix.good,
          hard: data.mix.hard,
          again: data.mix.again,
          defaultValue: '{{easy}} faciles, {{good}} bien, {{hard}} difficiles, {{again}} à revoir.',
        })}
        hasData={totalMix > 0}
        empty={{ title: t('stats.noReviews', 'Aucune révision enregistrée') }}
      >
        <StackedBarChart
          segments={[
            { key: 'again', label: t('stats.again', 'À revoir'), value: data.mix.again, color: COLORS.error },
            { key: 'hard', label: t('stats.hard', 'Difficile'), value: data.mix.hard, color: COLORS.warning },
            { key: 'good', label: t('stats.good', 'Bien'), value: data.mix.good, color: COLORS.accent },
            { key: 'easy', label: t('stats.easy', 'Facile'), value: data.mix.easy, color: COLORS.success },
          ]}
          totalLabel={t('stats.totalReviews', 'Révisions')}
        />
        <div className="mt-4">
          <p className="mb-2 text-xs font-semibold text-text-secondary">
            {t('stats.stabilityTitle', 'Stabilité moyenne par période')}
          </p>
          <AreaChart
            data={data.stability}
            height={72}
            color={COLORS.info}
            describe={(point) => `${point.label} : ${point.value}`}
          />
        </div>
      </ChartFrame>

      <ChartFrame
        title={t('stats.booksTitle', 'Livres les plus travaillés')}
        subtitle={t('stats.booksSubtitle', 'Vos six premiers livres')}
        summary={t('stats.booksSummary', 'Classement des livres par nombre de versets mémorisés.')}
        hasData={data.books.length > 0}
        empty={{ title: t('stats.noVerses', 'Aucun verset mémorisé') }}
      >
        <HorizontalBars
          data={data.books.map((book) => ({ label: book.book.toUpperCase(), value: book.count }))}
        />
      </ChartFrame>
    </div>
  );
}

export default StatsDashboard;
