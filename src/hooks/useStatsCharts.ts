/**
 * Charge une fois les données nécessaires aux graphiques de statistiques.
 *
 * Trois sources, une seule passe :
 *   · les versets mémorisés (`getAllMemorized`) → statuts, livres ;
 *   · les journaux de révision (`listByUser`) → heatmap, courbes, mix FSRS ;
 *   · la série (`StreakService`) → régularité.
 *
 * Aucune donnée inventée : si le journal est vide, les séries sont vides et
 * les graphiques affichent leur état vide plutôt qu'une jolie courbe fausse.
 */

import { useEffect, useMemo, useState } from 'react';
import { getMemorizationService } from '@/services/memorization-service-factory';
import { getReviewLogRepository, getSyncUserIdProvider } from '@/infrastructure/repository/powersync-repositories';
import { StreakService } from '@/services/streak-service';
import type { MemorizationRecord } from '@/domains/memorization/entities';
import {
  consistency,
  cumulativeReviews,
  heatmapMatrix,
  ratingMix,
  reviewsPerDay,
  stabilitySeries,
  statusBreakdown,
  topBooks,
  weekdayProfile,
  type ReviewLike,
} from '@/domains/analytics/chart-data';

export interface StatsChartData {
  loading: boolean;
  error: boolean;
  records: MemorizationRecord[];
  logs: ReviewLike[];
  perDay: { date: string; count: number }[];
  cumulative: { date: string; total: number }[];
  heatmap: ReturnType<typeof heatmapMatrix>;
  weekday: number[];
  mix: ReturnType<typeof ratingMix>;
  status: ReturnType<typeof statusBreakdown>;
  stability: { label: string; value: number }[];
  books: { book: string; count: number }[];
  consistencyPct: number;
  totals: { verses: number; mastered: number; reviews: number; streak: number; longestStreak: number };
}

const EMPTY: StatsChartData = {
  loading: false,
  error: false,
  records: [],
  logs: [],
  perDay: [],
  cumulative: [],
  heatmap: { cells: [], max: 0, total: 0 },
  weekday: [0, 0, 0, 0, 0, 0, 0],
  mix: { again: 0, hard: 0, good: 0, easy: 0 },
  status: { nouveau: 0, enCours: 0, maitrise: 0 },
  stability: [],
  books: [],
  consistencyPct: 0,
  totals: { verses: 0, mastered: 0, reviews: 0, streak: 0, longestStreak: 0 },
};

export function useStatsCharts(profileId: string, windowDays = 30): StatsChartData {
  const [data, setData] = useState<StatsChartData>({ ...EMPTY, loading: true });

  useEffect(() => {
    let cancelled = false;
    setData((current) => ({ ...current, loading: true }));

    const load = async () => {
      try {
        const service = getMemorizationService(profileId);
        const [records, streak] = await Promise.all([
          service.getAllMemorized(),
          new StreakService(service, profileId).calculateStreak(),
        ]);

        let logs: ReviewLike[] = [];
        try {
          const userId = await getSyncUserIdProvider().resolveUserId();
          if (userId) {
            const entries = await getReviewLogRepository().listByUser(userId);
            logs = entries.map((entry) => ({
              answeredAt: entry.answeredAt,
              rating: entry.rating,
              stabilityAfter: entry.stabilityAfter,
            }));
          }
        } catch {
          // Journal indisponible (offline sans migration) : on garde les
          // graphiques de versets, les séries temporelles resteront vides.
          logs = [];
        }

        if (cancelled) return;
        setData(buildData(records, logs, streak, windowDays));
      } catch {
        if (!cancelled) setData({ ...EMPTY, error: true });
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [profileId, windowDays]);

  return data;
}

/** Construction pure — exportée pour les tests. */
export function buildData(
  records: MemorizationRecord[],
  logs: ReviewLike[],
  streak: number,
  windowDays = 30,
): StatsChartData {
  const perDay = reviewsPerDay(logs, windowDays);
  const status = statusBreakdown(records);
  return {
    loading: false,
    error: false,
    records,
    logs,
    perDay,
    cumulative: cumulativeReviews(perDay),
    // La carte de chaleur regarde plus loin que la fenêtre des courbes :
    // 26 semaines demandent 182 jours d'historique, pas 30.
    heatmap: heatmapMatrix(reviewsPerDay(logs, 182), 26),
    weekday: weekdayProfile(logs),
    mix: ratingMix(logs),
    status,
    stability: stabilitySeries(logs, windowDays),
    books: topBooks(records, 6),
    consistencyPct: consistency(perDay),
    totals: {
      verses: records.length,
      mastered: status.maitrise,
      reviews: logs.length,
      streak,
      longestStreak: streak,
    },
  };
}

/** Petit utilitaire mémorisé pour ne pas recalculer les libellés de jours. */
export function useWeekdayLabels(locale: string): string[] {
  return useMemo(
    () =>
      Array.from({ length: 7 }, (_, index) =>
        new Date(2024, 0, 1 + index).toLocaleDateString(locale, { weekday: 'narrow' }),
      ),
    [locale],
  );
}
