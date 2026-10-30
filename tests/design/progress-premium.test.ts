import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { formatProgressLabel } from '@/lib/progress-label';

describe('Progression premium', () => {
  it('formate les étiquettes sans variables littérales pour 0, 1 et 2', () => {
    expect([0, 1, 2].map((n) => formatProgressLabel('Maîtrisé{plural}', n, 'fr'))).toEqual(['Maîtrisé', 'Maîtrisé', 'Maîtrisés']);
    expect([0, 1, 2].map((n) => formatProgressLabel('jours', n, 'fr'))).toEqual(['jour', 'jour', 'jours']);
    expect([0, 1, 2].map((n) => formatProgressLabel('days', n, 'en'))).toEqual(['days', 'day', 'days']);
    expect(formatProgressLabel('{count} mastered', 2, 'en')).toBe('2 mastered');
  });
  it('conserve les données du service et distingue une comparaison impossible', () => {
    const screen = readFileSync('app/(tabs)/progress.tsx', 'utf8');
    expect(screen).toContain('progressService.getStats()');
    expect(screen).toContain('stats?.weeklyTrend.lastWeek ?? 0');
    expect(screen).toContain("t('progress.noComparison'");
    expect(screen).toContain('g1 tab-heading progress-heading');
    expect(screen).toContain('g2 progress-stat');
  });
});
