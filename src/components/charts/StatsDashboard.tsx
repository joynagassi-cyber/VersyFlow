/**
 * Tableau de bord statistique — deux étages, comme les maquettes de référence.
 *
 *   1. **Synthèse** : six cartes qui répondent d'un mot, avec une vignette qui
 *      donne le rythme des sept derniers jours (bande hebdomadaire, anneau
 *      gradué, matrice de points, barres groupées, anneau de maîtrise).
 *   2. **Analyse** : six graphiques pleine largeur — carte de chaleur de 26
 *      semaines, courbe lissée, radar à six axes, anneau des statuts, mix FSRS
 *      empilé, classement des livres.
 *
 * Le type de graphique répond à une question ; la taille des cartes est
 * pilotée par le CSS (`stats-grid`, 12 colonnes au bureau) pour que les
 * graphiques occupent réellement l'écran sur desktop — la carte de chaleur
 * passe de 12 à 18 px par case selon la largeur.
 *
 * Tout est SVG + jetons de couleur : aucune librairie de graphes, aucune
 * requête, aucun hexadécimal.
 */

import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/Skeleton';
import { ChartFrame } from '@/components/charts/ChartFrame';
import { HeatmapCalendar } from '@/components/charts/HeatmapCalendar';
import { AreaChart } from '@/components/charts/AreaChart';
import { BarChart } from '@/components/charts/BarChart';
import { DonutChart } from '@/components/charts/DonutChart';
import { RadarChart } from '@/components/charts/RadarChart';
import { GaugeChart } from '@/components/charts/GaugeChart';
import { StackedBarChart } from '@/components/charts/StackedBarChart';
import { HorizontalBars } from '@/components/charts/HorizontalBars';
import { StatCard } from '@/components/charts/StatCard';
import { WeekStrip } from '@/components/charts/WeekStrip';
import { TickRing } from '@/components/charts/TickRing';
import { DotMatrix } from '@/components/charts/DotMatrix';
import { GroupedBars } from '@/components/charts/GroupedBars';
import { useStatsCharts, useWeekdayLabels } from '@/hooks/useStatsCharts';
import { normalizeLocaleCode } from '@/domains/i18n/config';
import {
  BookOpen01Icon as BookOpen,
  FlameIcon as Flame,
  Medal01Icon as Medal,
  Calendar01Icon as CalendarDay,
  ChartBarLineIcon as ChartBar,
  StarIcon as StarIcon,
} from '@/components/ui/solar-icons';

const COLORS = {
  accent: 'var(--acc)',
  success: 'var(--color-success)',
  warning: 'var(--color-warning)',
  error: 'var(--color-error)',
  info: 'var(--color-info)',
};

/* ── Vignettes de squelette ─────────────────────────────────────────────
 * Une silhouette par forme réelle de carte de synthèse — pas une pastille
 * unique. L'ordre reprend celui des six `StatCard` du tableau chargé :
 * bande des 7 jours, anneau de série, anneau de maîtrise, matrice de
 * pastilles, barres groupées (pleine largeur), barre FSRS (pleine largeur). */
function WeekStripGhost() {
  // WeekStrip : 56 px de tracé + l'étiquette jour, 7 colonnes espacées.
  const heights = ['h-3', 'h-7', 'h-5', 'h-9', 'h-6', 'h-11', 'h-4'];
  return (
    <div className="flex h-[70px] items-end gap-2">
      {heights.map((height, index) => (
        <div key={index} className="flex flex-1 flex-col items-center gap-1">
          <div className="relative h-14 w-2 rounded-full bg-surface-tint">
            <Skeleton className={`absolute bottom-0 w-2 rounded-full ${height}`} />
          </div>
          <Skeleton className="h-2 w-2.5 rounded-sm" />
        </div>
      ))}
    </div>
  );
}

function RingGhost() {
  // TickRing est rendu à 104 × 104 dans les deux cartes.
  return <Skeleton className="h-[104px] w-[104px] rounded-full" />;
}

function DotMatrixGhost() {
  // 30 jours sur cinq rangées de sept, comme `DotMatrix(columns={7})`.
  return (
    <div className="flex flex-col gap-1.5">
      {Array.from({ length: 5 }, (_, row) => (
        <div key={row} className="flex gap-1.5">
          {Array.from({ length: row === 4 ? 2 : 7 }, (_, column) => (
            <Skeleton key={column} className="h-2.5 w-2.5 rounded-full" />
          ))}
          {row === 4 && Array.from({ length: 5 }, (_, column) => (
            <span key={`pad-${column}`} className="h-2.5 w-2.5" aria-hidden="true" />
          ))}
        </div>
      ))}
    </div>
  );
}

function GroupedBarsGhost() {
  const heights = ['h-4', 'h-6', 'h-3', 'h-7', 'h-5', 'h-8', 'h-6'];
  return (
    <div className="w-[132px]">
      <div className="flex h-14 items-end gap-2">
        {heights.map((height, index) => (
          <div key={index} className="flex h-full flex-1 items-end justify-center gap-[3px]">
            <Skeleton className={`w-1.5 rounded-t-sm ${height}`} />
            <Skeleton className={`w-1.5 rounded-t-sm ${index % 2 === 0 ? 'h-5' : 'h-3'}`} />
          </div>
        ))}
      </div>
      <div className="mt-1 flex justify-between gap-1">
        {Array.from({ length: 7 }, (_, index) => (
          <Skeleton key={index} className="h-2 w-2.5 rounded-sm" />
        ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
        {[0, 1].map((index) => (
          <div key={index} className="flex items-center gap-1.5">
            <Skeleton className="h-2 w-2 rounded-full" />
            <Skeleton className="h-2 w-12 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

function StackedBarGhost() {
  return (
    <div className="flex w-[160px] flex-col gap-2">
      <Skeleton className="h-2.5 w-full rounded-full" />
      <div className="flex flex-wrap gap-x-2 gap-y-1">
        {['w-8', 'w-10', 'w-8', 'w-9'].map((width, index) => (
          <div key={index} className="flex items-center gap-1">
            <Skeleton className="h-2 w-2 rounded-full" />
            <Skeleton className={`h-2 ${width} rounded-full`} />
          </div>
        ))}
      </div>
    </div>
  );
}

const STAT_CARD_GHOSTS: { visual: React.ReactNode; wide: boolean; chevron: boolean }[] = [
  { visual: <WeekStripGhost />, wide: false, chevron: true },
  { visual: <RingGhost />, wide: false, chevron: false },
  { visual: <RingGhost />, wide: false, chevron: true },
  { visual: <DotMatrixGhost />, wide: false, chevron: false },
  { visual: <GroupedBarsGhost />, wide: true, chevron: false },
  { visual: <StackedBarGhost />, wide: true, chevron: false },
];

export interface StatsDashboardProps {
  profileId: string;
  windowDays?: number;
}

export function StatsDashboard({ profileId, windowDays = 30 }: StatsDashboardProps) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const locale = normalizeLocaleCode(i18n.resolvedLanguage || i18n.language);
  const weekdayLabels = useWeekdayLabels(locale);
  const data = useStatsCharts(profileId, windowDays);

  if (data.loading) {
    // Deux étages, comme le tableau chargé : six cartes de synthèse, chacune
    // avec la silhouette de SA vignette (semaine, anneaux, matrice, barres),
    // puis neuf cadres d'analyse dont trois pleine largeur (carte de
    // chaleur, courbe, série) — comme les trois `wide` du tableau chargé.
    return (
      <div className="stats-grid" role="status" aria-live="polite" aria-busy="true">
        <span className="sr-only">{t('stats.loading', 'Calcul des graphiques…')}</span>
        {STAT_CARD_GHOSTS.map((card, index) => (
          <div
            key={`card-${index}`}
            className={
              card.wide
                ? 'stat-card stat-card--wide-visual g2 rounded-2xl p-4'
                : 'stat-card g2 rounded-2xl p-4'
            }
            aria-hidden="true"
          >
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-8 shrink-0 rounded-xl" />
              <Skeleton className="h-3.5 w-2/5 rounded-full" />
              {card.chevron && <Skeleton className="ml-auto h-4 w-4 shrink-0 rounded-md" />}
            </div>
            <div className="mt-3 flex items-end justify-between gap-3">
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <Skeleton className="h-8 w-1/2 rounded-lg" />
                <Skeleton className="h-2.5 w-4/5 rounded-full" />
              </div>
              <div className="shrink-0">{card.visual}</div>
            </div>
          </div>
        ))}
        {Array.from({ length: 9 }, (_, index) => {
          const wide = index === 0 || index === 1 || index === 8;
          return (
            <div
              key={`chart-${index}`}
              className={wide ? 'stats-chart stats-chart--wide g2 rounded-2xl p-4' : 'stats-chart g2 rounded-2xl p-4'}
              aria-hidden="true"
            >
              <Skeleton className="h-5 w-1/3 rounded-full" />
              <Skeleton className="mt-1.5 h-2.5 w-1/4 rounded-full" />
              <Skeleton className={wide ? 'mt-4 h-40 w-full rounded-xl' : 'mt-4 h-32 w-full rounded-xl'} />
            </div>
          );
        })}
      </div>
    );
  }

  const last7 = data.perDay.slice(-7);
  const prev7 = data.perDay.slice(-14, -7);
  const todayCount = last7[last7.length - 1]?.count ?? 0;
  const yesterdayCount = last7[last7.length - 2]?.count ?? 0;
  const delta = todayCount - yesterdayCount;

  const totalMix = data.mix.again + data.mix.hard + data.mix.good + data.mix.easy;
  const easePct = totalMix > 0 ? Math.round(((data.mix.good + data.mix.easy) / totalMix) * 100) : 0;
  const masteredPct = data.totals.verses > 0 ? Math.round((data.status.maitrise / data.totals.verses) * 100) : 0;
  const activeDays = data.perDay.filter((day) => day.count > 0).length;
  const weekTotal = last7.reduce((sum, day) => sum + day.count, 0);
  const prevWeekTotal = prev7.reduce((sum, day) => sum + day.count, 0);
  const weekDelta = prevWeekTotal > 0 ? Math.round(((weekTotal - prevWeekTotal) / prevWeekTotal) * 100) : null;
  const todayIndex = (new Date().getDay() + 6) % 7;

  const hasReviews = data.totals.reviews > 0;
  const peakDay = data.perDay.reduce(
    (best, day) => (day.count > best.count ? day : best),
    data.perDay[0] ?? { date: '', count: 0 },
  );

  const radarAxes = [
    { label: t('stats.axisConsistency', 'Régularité'), value: data.consistencyPct / 100, display: `${data.consistencyPct}%` },
    { label: t('stats.axisVolume', 'Volume'), value: Math.min(1, data.totals.reviews / 120), display: `${data.totals.reviews}` },
    { label: t('stats.axisMastery', 'Maîtrise'), value: masteredPct / 100, display: `${masteredPct}%` },
    { label: t('stats.axisStreak', 'Série'), value: Math.min(1, data.totals.streak / 30), display: `${data.totals.streak} j` },
    { label: t('stats.axisEase', 'Facilité'), value: easePct / 100, display: totalMix > 0 ? `${easePct}%` : '—' },
    { label: t('stats.axisBreadth', 'Diversité'), value: Math.min(1, data.books.length / 6), display: `${data.books.length}` },
  ];

  return (
    <div className="stats-dashboard">
      {/* Étage 1 — synthèse */}
      <div className="stats-grid">
        <StatCard
          title={t('stats.cardToday', 'Révisions aujourd’hui')}
          icon={CalendarDay}
          value={todayCount}
          unit={t('stats.cardReviewsUnit', 'rév.')}
          hint={
            delta === 0
              ? t('stats.cardSameAsYesterday', 'Comme hier')
              : delta > 0
                ? t('stats.cardMoreThanYesterday', { count: delta, defaultValue: '+{{count}} vs hier' })
                : t('stats.cardLessThanYesterday', { count: Math.abs(delta), defaultValue: '−{{count}} vs hier' })
          }
          onClick={() => navigate('/review/queue')}
          visual={
            <WeekStrip
              values={last7.map((day) => day.count)}
              labels={last7.map((day) => new Date(`${day.date}T12:00:00`).toLocaleDateString(locale, { weekday: 'narrow' }))}
              todayIndex={6}
            />
          }
        />

        <StatCard
          title={t('stats.cardStreak', 'Série')}
          icon={Flame}
          value={data.totals.streak}
          unit={t('stats.daysShort', 'j')}
          hint={t('stats.cardStreakHint', 'Jours consécutifs')}
          visual={<TickRing value={data.totals.streak} ratio={Math.min(1, data.totals.streak / 30)} label={t('stats.cardStreakRing', 'sur 30 j')} size={104} color={COLORS.warning} />}
        />

        <StatCard
          title={t('stats.cardMastery', 'Maîtrise')}
          icon={Medal}
          value={`${masteredPct}%`}
          hint={t('stats.cardMasteryHint', {
            mastered: data.status.maitrise,
            total: data.totals.verses,
            defaultValue: '{{mastered}} / {{total}} versets',
          })}
          onClick={() => navigate('/mastery')}
          visual={<TickRing value={`${masteredPct}%`} ratio={masteredPct / 100} size={104} color={COLORS.success} label={t('stats.masteredShort', 'maîtrisés')} />}
        />

        <StatCard
          title={t('stats.cardConsistency', 'Régularité')}
          icon={CalendarDay}
          value={`${data.consistencyPct}%`}
          hint={t('stats.cardConsistencyHint', {
            active: activeDays,
            days: data.perDay.length,
            defaultValue: '{{active}} jours actifs sur {{days}}',
          })}
          visual={
            <DotMatrix
              values={data.perDay.map((day) => day.count)}
              columns={7}
              describe={(value, index) => `${data.perDay[index]?.date ?? ''} : ${value}`}
            />
          }
        />

        <StatCard
          title={t('stats.cardWeek', 'Cette semaine')}
          icon={ChartBar}
          value={weekTotal}
          unit={t('stats.cardReviewsUnit', 'rév.')}
          hint={
            weekDelta === null
              ? t('stats.noComparison', 'Pas de comparaison')
              : weekDelta >= 0
                ? t('stats.cardWeekUp', { count: weekDelta, defaultValue: '+{{count}} % vs semaine passée' })
                : t('stats.cardWeekDown', { count: Math.abs(weekDelta), defaultValue: '−{{count}} % vs semaine passée' })
          }
          visual={
            <GroupedBars
              labels={weekdayLabels}
              seriesA={{ label: t('stats.thisWeekShort', 'Cette sem.'), values: last7.map((day) => day.count), color: COLORS.accent }}
              seriesB={{ label: t('stats.lastWeekShort', 'Précédente'), values: prev7.map((day) => day.count), color: COLORS.info }}
              height={56}
            />
          }
          className="stat-card--wide-visual"
        />

        <StatCard
          title={t('stats.cardEase', 'Facilité')}
          icon={StarIcon}
          value={`${easePct}%`}
          hint={t('stats.cardEaseHint', 'Révisions « bien » ou « facile »')}
          visual={
            <div className="flex flex-col items-end gap-1">
              <StackedBarChart
                segments={[
                  { key: 'again', label: t('stats.again', 'À revoir'), value: data.mix.again, color: COLORS.error },
                  { key: 'hard', label: t('stats.hard', 'Difficile'), value: data.mix.hard, color: COLORS.warning },
                  { key: 'good', label: t('stats.good', 'Bien'), value: data.mix.good, color: COLORS.accent },
                  { key: 'easy', label: t('stats.easy', 'Facile'), value: data.mix.easy, color: COLORS.success },
                ]}
                height={10}
                showTotal={false}
              />
              <span className="text-2xs text-text-muted">{t('stats.totalReviews', 'Révisions')} {totalMix}</span>
            </div>
          }
          className="stat-card--wide-visual"
        />
      </div>

      {/* Étage 2 — analyse */}
      <div className="stats-grid">
        <ChartFrame
          title={t('stats.heatmapTitle', 'Régularité des révisions')}
          subtitle={t('stats.heatmapSubtitle', {
            count: data.heatmap.total,
            defaultValue: '{{count}} révisions sur les 26 dernières semaines',
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
          subtitle={t('stats.areaSubtitle', { days: windowDays, defaultValue: 'Sur les {{days}} derniers jours' })}
          summary={t('stats.areaSummary', { peak: peakDay?.count ?? 0, defaultValue: 'Pic à {{peak}} révisions sur une journée.' })}
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
            height={150}
          />
          <div className="mt-1 flex justify-between text-2xs text-text-muted">
            {weekdayLabels.map((label, index) => (
              <span key={`${label}-${index}`} className={index === todayIndex ? 'flex-1 text-center font-bold text-text-primary' : 'flex-1 text-center'}>
                {label}
              </span>
            ))}
          </div>
        </ChartFrame>

        <ChartFrame
          title={t('stats.statusTitle', 'Versets par statut')}
          subtitle={t('stats.statusSubtitle', { count: data.totals.verses, defaultValue: '{{count}} versets en bibliothèque' })}
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
              size={148}
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
          <RadarChart axes={radarAxes} size={260} />
        </ChartFrame>

        <ChartFrame
          title={t('stats.booksTitle', 'Livres les plus travaillés')}
          subtitle={t('stats.booksSubtitle', 'Vos six premiers livres')}
          summary={t('stats.booksSummary', 'Classement des livres par nombre de versets mémorisés.')}
          hasData={data.books.length > 0}
          empty={{ title: t('stats.noVerses', 'Aucun verset mémorisé') }}
        >
          <HorizontalBars data={data.books.map((book) => ({ label: book.book.toUpperCase(), value: book.count }))} />
        </ChartFrame>

        <ChartFrame
          title={t('stats.gaugeTitle', 'Régularité sur 30 jours')}
          subtitle={t('stats.gaugeSubtitle', 'Part des jours avec au moins une révision')}
          summary={t('stats.gaugeSummary', { pct: data.consistencyPct, defaultValue: '{{pct}} % de jours actifs.' })}
          hasData={hasReviews}
          empty={{ title: t('stats.noReviews', 'Aucune révision enregistrée') }}
        >
          <div className="flex items-center gap-5">
            <GaugeChart
              value={data.consistencyPct}
              label={t('stats.activeDays', 'jours actifs')}
              hint={t('stats.activeDaysHint', {
                active: activeDays,
                days: data.perDay.length,
                defaultValue: '{{active}} jours sur {{days}}',
              })}
              color={COLORS.success}
            />
            <DotMatrix values={data.perDay.map((day) => day.count)} columns={7} color={COLORS.success} />
          </div>
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
          <div className="flex flex-col gap-4">
            <StackedBarChart
              segments={[
                { key: 'again', label: t('stats.again', 'À revoir'), value: data.mix.again, color: COLORS.error },
                { key: 'hard', label: t('stats.hard', 'Difficile'), value: data.mix.hard, color: COLORS.warning },
                { key: 'good', label: t('stats.good', 'Bien'), value: data.mix.good, color: COLORS.accent },
                { key: 'easy', label: t('stats.easy', 'Facile'), value: data.mix.easy, color: COLORS.success },
              ]}
              height={22}
              totalLabel={t('stats.totalReviews', 'Révisions')}
            />
            <div>
              <p className="mb-2 text-xs font-semibold text-text-secondary">{t('stats.stabilityTitle', 'Stabilité moyenne par période')}</p>
              <AreaChart data={data.stability} height={96} color={COLORS.info} describe={(point) => `${point.label} : ${point.value}`} />
            </div>
          </div>
        </ChartFrame>

        <ChartFrame
          title={t('stats.streakTitle', 'Régularité de la série')}
          subtitle={t('stats.streakSubtitle', 'Chaque pastille = un jour')}
          summary={t('stats.streakSummary', 'Matrice des jours actifs sur la fenêtre analysée.')}
          hasData={activeDays > 0}
          empty={{ title: t('stats.noReviews', 'Aucune révision enregistrée') }}
          wide
        >
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <DotMatrix
              values={data.perDay.map((day) => day.count)}
              columns={14}
              color={COLORS.accent}
              describe={(value, index) => `${data.perDay[index]?.date ?? ''} : ${value}`}
            />
            <div className="flex items-center gap-6">
              <div>
                <p className="text-2xl font-extrabold text-text-primary tabular-nums">{activeDays}</p>
                <p className="text-2xs text-text-muted">{t('stats.activeDays', 'jours actifs')}</p>
              </div>
              <div>
                <p className="text-2xl font-extrabold text-text-primary tabular-nums">{data.perDay.length - activeDays}</p>
                <p className="text-2xs text-text-muted">{t('stats.inactiveDays', 'jours sans révision')}</p>
              </div>
              <div>
                <p className="text-2xl font-extrabold text-text-primary tabular-nums">{peakDay?.count ?? 0}</p>
                <p className="text-2xs text-text-muted">{t('stats.peakDay', 'record sur un jour')}</p>
              </div>
            </div>
          </div>
        </ChartFrame>
      </div>
    </div>
  );
}

export default StatsDashboard;
