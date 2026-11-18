/**
 * Agrégations pour les graphiques — pures, testables, sans dépendance.
 *
 * Chaque fonction reçoit l'historique brut (journaux de révision, versets
 * mémorisés) et rend une série prête à dessiner. Aucun accès au store, aucune
 * dépendance à une librairie de graphes : les pages peuvent calculer leurs
 * séries en une passe et les tests vérifient les chiffres, pas des pixels.
 */

import type { MemorizationRecord } from '@/domains/memorization/entities';

/** Une entrée minimale de journal de révision — le sous-ensemble utile ici. */
export interface ReviewLike {
  answeredAt: number;
  rating: 'again' | 'hard' | 'good' | 'easy';
  stabilityAfter?: number;
}

const MS_PER_DAY = 86_400_000;

/** Clé de jour locale `AAAA-MM-JJ` (le fuseau de la personne, pas UTC). */
export function dayKey(timestamp: number): string {
  const date = new Date(timestamp);
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

function startOfDay(timestamp: number): number {
  const date = new Date(timestamp);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

/** Série jour par jour sur `days` jours, zéros compris (un trou est une donnée). */
export function reviewsPerDay(
  logs: readonly ReviewLike[],
  days = 30,
  today: number = Date.now(),
): { date: string; count: number }[] {
  const span = Math.max(1, Math.floor(days));
  const counts = new Map<string, number>();
  for (const log of logs) {
    const key = dayKey(log.answeredAt);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const end = startOfDay(today);
  return Array.from({ length: span }, (_, index) => {
    const timestamp = end - (span - 1 - index) * MS_PER_DAY;
    const key = dayKey(timestamp);
    return { date: key, count: counts.get(key) ?? 0 };
  });
}

/** Répartition des quatre notes FSRS. */
export function ratingMix(logs: readonly ReviewLike[]): { again: number; hard: number; good: number; easy: number } {
  const mix = { again: 0, hard: 0, good: 0, easy: 0 };
  for (const log of logs) {
    if (log.rating in mix) mix[log.rating] += 1;
  }
  return mix;
}

/** Statut des versets mémorisés. */
export function statusBreakdown(records: readonly Pick<MemorizationRecord, 'status'>[]): {
  nouveau: number;
  enCours: number;
  maitrise: number;
} {
  const out = { nouveau: 0, enCours: 0, maitrise: 0 };
  for (const record of records) {
    if (record.status === 'mastered') out.maitrise += 1;
    else if (record.status === 'in-progress') out.enCours += 1;
    else out.nouveau += 1;
  }
  return out;
}

/** Total cumulé des révisions : la courbe qui ne redescend jamais. */
export function cumulativeReviews(perDay: readonly { date: string; count: number }[]): { date: string; total: number }[] {
  let running = 0;
  return perDay.map(({ date, count }) => {
    running += count;
    return { date, total: running };
  });
}

/** Activité par jour de la semaine (0 = dimanche, comme `getDay`). */
export function weekdayProfile(logs: readonly ReviewLike[]): number[] {
  const buckets = Array.from({ length: 7 }, () => 0);
  for (const log of logs) buckets[new Date(log.answeredAt).getDay()] += 1;
  return buckets;
}

/**
 * Matrice de chaleur : `weeks` colonnes de 7 jours, alignées sur le lundi.
 * `null` = case hors calendrier (avant le début de l'historique).
 */
export function heatmapMatrix(
  perDay: readonly { date: string; count: number }[],
  weeks = 18,
  today: number = Date.now(),
): { cells: (number | null)[][]; max: number; total: number } {
  const byDate = new Map(perDay.map((day) => [day.date, day.count]));
  const span = Math.max(1, Math.floor(weeks));
  const end = new Date(startOfDay(today));
  // Ramène la fin à la fin de semaine (dimanche) pour des colonnes pleines.
  const endWeekday = (end.getDay() + 6) % 7; // 0 = lundi
  const endAligned = end.getTime() + (6 - endWeekday) * MS_PER_DAY;

  const cells: (number | null)[][] = [];
  let max = 0;
  let total = 0;
  for (let week = 0; week < span; week += 1) {
    const column: (number | null)[] = [];
    for (let weekday = 0; weekday < 7; weekday += 1) {
      const timestamp = endAligned - (span - 1 - week) * 7 * MS_PER_DAY + weekday * MS_PER_DAY;
      if (timestamp > startOfDay(today)) {
        column.push(null);
        continue;
      }
      const count = byDate.get(dayKey(timestamp)) ?? 0;
      max = Math.max(max, count);
      total += count;
      column.push(count);
    }
    cells.push(column);
  }
  return { cells, max, total };
}

/** Évolution de la stabilité moyenne, par tranches de `bucketSize` jours. */
export function stabilitySeries(
  logs: readonly ReviewLike[],
  days = 30,
  buckets = 10,
  today: number = Date.now(),
): { label: string; value: number }[] {
  const span = Math.max(1, Math.floor(days));
  const size = Math.max(1, Math.ceil(span / Math.max(1, buckets)));
  const start = startOfDay(today) - (span - 1) * MS_PER_DAY;
  const sums = Array.from({ length: Math.ceil(span / size) }, () => ({ sum: 0, count: 0 }));

  for (const log of logs) {
    if (log.answeredAt < start) continue;
    const offset = Math.floor((startOfDay(log.answeredAt) - start) / MS_PER_DAY);
    const bucket = Math.floor(offset / size);
    if (bucket < 0 || bucket >= sums.length) continue;
    sums[bucket].sum += log.stabilityAfter ?? 0;
    sums[bucket].count += 1;
  }

  return sums.map((bucket, index) => ({
    label: `J+${index * size + 1}`,
    value: bucket.count > 0 ? Number((bucket.sum / bucket.count).toFixed(2)) : 0,
  }));
}

/** Les livres les plus travaillés — barres horizontales. */
export function topBooks(
  records: readonly Pick<MemorizationRecord, 'bookId'>[],
  limit = 6,
): { book: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const record of records) {
    counts.set(record.bookId, (counts.get(record.bookId) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([book, count]) => ({ book, count }))
    .sort((a, b) => b.count - a.count || a.book.localeCompare(b.book))
    .slice(0, Math.max(0, limit));
}

/** Régularité : part des jours actifs sur la fenêtre. */
export function consistency(perDay: readonly { count: number }[]): number {
  if (perDay.length === 0) return 0;
  const active = perDay.filter((day) => day.count > 0).length;
  return Math.round((active / perDay.length) * 100);
}
