/**
 * Le tableau de bord statistique rendu pour de vrai.
 *
 * Les primitives sont testées séparément (`charts.test.tsx`) ; ici on vérifie
 * le montage complet : services mockés, données réelles passées aux graphiques,
 * au moins six figures distinctes à l'écran, et aucun écran vide quand il n'y a
 * rien à montrer.
 */
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

const RECORDS = [
  { id: 'joh-3-16', bookId: 'joh', status: 'mastered' },
  { id: 'psa-23-1', bookId: 'psa', status: 'in-progress' },
  { id: 'rom-8-28', bookId: 'rom', status: 'in-progress' },
  { id: 'psa-91-1', bookId: 'psa', status: 'new' },
];

const now = Date.now();
const LOGS = [
  { answeredAt: now - 2 * 86_400_000, rating: 'good' as const, stabilityAfter: 9 },
  { answeredAt: now - 1 * 86_400_000, rating: 'easy' as const, stabilityAfter: 14 },
  { answeredAt: now, rating: 'hard' as const, stabilityAfter: 5 },
];

let logsAvailable = true;

vi.mock('@/services/memorization-service-factory', () => ({
  getMemorizationService: () => ({
    getAllMemorized: async () => RECORDS,
    getDueRecords: async () => [],
  }),
}));

vi.mock('@/services/streak-service', () => ({
  StreakService: class {
    async calculateStreak() {
      return 4;
    }
  },
}));

vi.mock('@/infrastructure/repository/powersync-repositories', () => ({
  getSyncUserIdProvider: () => ({ resolveUserId: async () => 'user-1' }),
  getReviewLogRepository: () => ({
    listByUser: async () => {
      if (!logsAvailable) throw new Error('offline');
      return LOGS;
    },
  }),
}));

import { StatsDashboard } from '@/components/charts/StatsDashboard';

describe('tableau de bord des statistiques', () => {
  beforeEach(() => {
    logsAvailable = true;
  });

  it('affiche au moins six graphiques distincts avec de vraies données', async () => {
    const { container } = render(<StatsDashboard profileId="p1" />);

    await waitFor(() => expect(container.querySelectorAll('.stats-chart').length).toBeGreaterThanOrEqual(6));

    const figures = screen.getAllByRole('group');
    expect(figures.length).toBeGreaterThanOrEqual(6);
    // Chaque figure est nommée : un lecteur d'écran sait de quel graphique il parle.
    for (const figure of figures) {
      expect(figure.getAttribute('aria-label')?.length ?? 0).toBeGreaterThan(0);
    }

    // Formes réellement présentes : cases de chaleur, courbe, anneau, radar, jauge, segments.
    expect(container.querySelectorAll('.heatmap-cell').length).toBeGreaterThan(50);
    expect(container.querySelectorAll('svg').length).toBeGreaterThanOrEqual(5);
    expect(container.querySelectorAll('circle[stroke-dasharray]').length).toBeGreaterThanOrEqual(3);
    expect(container.querySelectorAll('polygon').length).toBeGreaterThanOrEqual(2);
  });

  it('survit à un journal de révision indisponible (hors ligne)', async () => {
    logsAvailable = false;
    const { container } = render(<StatsDashboard profileId="p1" />);
    await waitFor(() => expect(container.querySelectorAll('.stats-chart').length).toBeGreaterThanOrEqual(6));
    // Les graphiques de versets restent dessinés ; les séries vides s'expliquent.
    expect(container.textContent?.length ?? 0).toBeGreaterThan(0);
  });
});
