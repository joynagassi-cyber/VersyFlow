/**
 * useFamilyPoints — les points de la famille, calculés sur des données réelles.
 *
 * Sources (aucune donnée inventée) :
 *  1. les enregistrements de mémorisation **locaux** du profil actif
 *     (`getMemorizationService().getAllMemorized()`), qui donnent les étapes
 *     et les passages terminés ;
 *  2. les défis de la famille (`useFamilyRoomStore`), qui donnent le bonus.
 *
 * Le barème appliqué est celui du kit, isolé dans `src/services/family-scoring.ts`
 * et testé séparément. Quand le service de mémorisation n'est pas disponible
 * (pas de profil, stockage vide), le hook renvoie `available: false` et les
 * écrans affichent un tiret — jamais un 0 déguisé en mesure.
 */

import { useEffect, useMemo, useState } from 'react';
import { useActiveProfile } from '@/hooks/useActiveProfile';
import { useFamilyRoomStore } from '@/store/family-room-store';
import { getMemorizationService } from '@/services/memorization-service-factory';
import { levelFor, pointsForChallenge, pointsForRecords } from '@/services/family-scoring';
import type { LevelInfo } from '@/services/family-scoring';

export interface FamilyPointsSummary {
  available: boolean;
  /** Points issus des versets mémorisés. */
  fromVerses: number;
  /** Points issus des défis de la famille. */
  fromChallenges: number;
  total: number;
  level: LevelInfo;
  verseCount: number;
  masteredCount: number;
  /** Détail par défi, pour les écrans qui listent les contributions. */
  challengePoints: { id: string; title: string; points: number }[];
}

const EMPTY: FamilyPointsSummary = {
  available: false,
  fromVerses: 0,
  fromChallenges: 0,
  total: 0,
  level: levelFor(0),
  verseCount: 0,
  masteredCount: 0,
  challengePoints: [],
};

export function useFamilyPoints(familyId: string | null, me: string): FamilyPointsSummary {
  const { activeProfile } = useActiveProfile();
  const challenges = useFamilyRoomStore((s) => s.challenges);

  const [verseStats, setVerseStats] = useState<{
    available: boolean;
    points: number;
    count: number;
    mastered: number;
  }>({ available: false, points: 0, count: 0, mastered: 0 });

  useEffect(() => {
    let cancelled = false;
    const profileId = activeProfile?.id;
    if (!profileId) {
      setVerseStats({ available: false, points: 0, count: 0, mastered: 0 });
      return;
    }
    void (async () => {
      try {
        const service = getMemorizationService(profileId);
        const records = await service.getAllMemorized();
        if (cancelled) return;
        const mastered = records.filter((r) => r.status === 'mastered').length;
        setVerseStats({
          available: true,
          points: pointsForRecords(records),
          count: records.length,
          mastered,
        });
      } catch {
        if (!cancelled) setVerseStats({ available: false, points: 0, count: 0, mastered: 0 });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeProfile?.id]);

  return useMemo(() => {
    const mine = challenges.filter(
      (c) => (!familyId || c.familyId === familyId) && me !== '' && c.participants.includes(me),
    );
    const challengePoints = mine.map((c) => ({
      id: c.id,
      title: c.title,
      points: pointsForChallenge(c, me),
    }));
    const fromChallenges = challengePoints.reduce((sum, c) => sum + c.points, 0);

    if (!verseStats.available && challengePoints.length === 0) return EMPTY;

    const total = verseStats.points + fromChallenges;
    return {
      available: true,
      fromVerses: verseStats.points,
      fromChallenges,
      total,
      level: levelFor(total),
      verseCount: verseStats.count,
      masteredCount: verseStats.mastered,
      challengePoints,
    };
  }, [challenges, familyId, me, verseStats]);
}
