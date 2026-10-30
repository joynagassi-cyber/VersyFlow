import { describe, expect, it } from 'vitest';
import {
  DAILY_CAP,
  FAMILY_POINTS,
  applyDailyCap,
  levelFor,
  pointsForChallenge,
  pointsForRecords,
} from '@/services/family-scoring';

describe('family-scoring — barème affiché dans « Points et niveaux »', () => {
  it('respecte le barème du kit (10 / 10 / 30 / 5 / 50, plafond 100)', () => {
    expect(FAMILY_POINTS).toMatchObject({
      step: 10,
      review: 10,
      passage: 30,
      streakDay: 5,
      challenge: 50,
    });
    expect(DAILY_CAP).toBe(100);
  });

  it('calcule le niveau et le palier suivant', () => {
    expect(levelFor(0)).toMatchObject({ level: 1, next: 240, remaining: 240 });
    expect(levelFor(239)).toMatchObject({ level: 1, remaining: 1 });
    expect(levelFor(240)).toMatchObject({ level: 2, floor: 240, next: 480 });
    expect(levelFor(1240)).toMatchObject({ level: 6, remaining: 200 });
  });

  it('ne descend jamais sous zéro', () => {
    expect(levelFor(-50).level).toBe(1);
  });

  it('compte un verset maîtrisé comme un passage, pas comme deux étapes', () => {
    expect(pointsForRecords([])).toBe(0);
    expect(pointsForRecords([{ status: 'learning' }])).toBe(FAMILY_POINTS.step);
    expect(pointsForRecords([{ status: 'mastered' }])).toBe(FAMILY_POINTS.passage);
    expect(pointsForRecords([{ mastered: true }, { status: 'learning' }])).toBe(40);
  });

  it('crédite le bonus complet d’un défi terminé, la moitié au prorata sinon', () => {
    const progress = { Léa: 5 };
    expect(
      pointsForChallenge({ status: 'done', target: 10, progress }, 'Léa'),
    ).toBe(FAMILY_POINTS.challenge);
    expect(
      pointsForChallenge({ status: 'active', target: 10, progress }, 'Léa'),
    ).toBe(25);
    expect(
      pointsForChallenge({ status: 'active', target: 10, progress: { Léa: 20 } }, 'Léa'),
    ).toBe(25);
    expect(pointsForChallenge({ status: 'active', target: 0, progress }, 'Léa')).toBe(0);
  });

  it('applique le plafond quotidien sans rendre de points négatifs', () => {
    expect(applyDailyCap(60, 0)).toBe(60);
    expect(applyDailyCap(60, 70)).toBe(30);
    expect(applyDailyCap(60, 100)).toBe(0);
    expect(applyDailyCap(60, 130)).toBe(0);
  });
});
