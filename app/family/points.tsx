/**
 * Famille — Points et niveaux (kit `m9_famille_points_et_niveaux`).
 *
 * Tous les chiffres viennent de `useFamilyPoints` : enregistrements de
 * mémorisation locaux du profil actif + défis de la famille. Le barème est
 * affiché **tel qu'il est appliqué** (`FAMILY_POINTS`), pour que l'utilisateur
 * puisse refaire le calcul lui-même.
 */

import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Time04Icon as Clock, CloudUploadIcon } from '@/components/ui/solar-icons';
import { FullScreenPage } from '@/components/layout/FullScreenPage';
import { DuoIcon } from '@/components/ui/DuoIcon';
import { Button } from '@/components/ui/button';
import {
  HintNote,
  ProgressBar,
  SectionCard,
  StatTile,
} from '@/components/family/FamilyKit';
import { useFamilyRoom } from '@/hooks/useFamilyRoom';
import { useFamilyPoints } from '@/hooks/useFamilyPoints';
import { DAILY_CAP, FAMILY_POINTS } from '@/services/family-scoring';

export default function FamilyPointsScreen() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { family, familyId, me } = useFamilyRoom();
  const summary = useFamilyPoints(familyId, me);

  const scale = [
    { key: 'step', value: FAMILY_POINTS.step, label: t('familyPlus.earnStep', 'Étape du parcours terminée') },
    { key: 'review', value: FAMILY_POINTS.review, label: t('familyPlus.earnReview', 'Révision FSRS terminée') },
    { key: 'passage', value: FAMILY_POINTS.passage, label: t('familyPlus.earnPassage', 'Passage terminé') },
    { key: 'streak', value: FAMILY_POINTS.streakDay, label: t('familyPlus.earnStreak', 'Jour de série') },
    { key: 'challenge', value: FAMILY_POINTS.challenge, label: t('familyPlus.earnChallenge', 'Défi réussi') },
  ];

  return (
    <FullScreenPage
      title={t('familyPlus.pointsTitle', 'Points et niveaux')}
      subtitle={family?.name}
      backPath="/family/home"
    >
      <div className="flex flex-col gap-4">
        <SectionCard>
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-text-muted">
                {t('familyPlus.levelLabel', 'NIVEAU {{level}}', { level: summary.level.level })}
              </p>
              <p className="mt-1 text-3xl font-extrabold tabular-nums text-text-primary">
                {summary.available ? summary.total.toLocaleString() : '—'}
              </p>
              <p className="text-sm text-text-muted">{t('familyPlus.points', 'points')}</p>
            </div>
            <div className="text-right text-xs text-text-muted">
              {t('familyPlus.nextTier', 'Prochain palier : {{points}}', {
                points: summary.level.next.toLocaleString(),
              })}
            </div>
          </div>
          <ProgressBar
            className="mt-3"
            value={summary.total - summary.level.floor}
            max={summary.level.next - summary.level.floor}
            label={t('familyPlus.pointsTitle', 'Points et niveaux')}
          />
          <div className="mt-3 grid grid-cols-3 gap-2">
            <StatTile value={summary.available ? summary.verseCount : '—'} label={t('familyPlus.verses', 'Versets')} />
            <StatTile value={summary.available ? summary.masteredCount : '—'} label={t('familyPlus.mastered', 'Maîtrisés')} />
            <StatTile value={summary.available ? summary.fromChallenges : '—'} label={t('familyPlus.fromChallenges', 'Défis')} />
          </div>
        </SectionCard>

        <SectionCard title={t('familyPlus.howToEarn', 'Comment gagner des points')}>
          <ul className="flex flex-col divide-y divide-divider">
            {scale.map((row) => (
              <li key={row.key} className="flex items-center justify-between py-2">
                <span className="text-sm text-text-primary">{row.label}</span>
                <span className="text-sm font-bold tabular-nums text-primary">+{row.value}</span>
              </li>
            ))}
          </ul>
          <div className="mt-3">
            <HintNote>
              {t(
                'familyPlus.dailyCap',
                'Plafond quotidien de {{cap}} points pour garder le jeu équitable.', { cap: DAILY_CAP },
              )}
            </HintNote>
          </div>
        </SectionCard>

        <SectionCard title={t('familyPlus.recentHistory', 'Historique récent')}>
          {summary.challengePoints.length === 0 ? (
            <p className="text-sm text-text-muted">
              {t(
                'familyPlus.emptyHistory',
                'Aucun point de défi pour l’instant. Les points de versets se cumulent dès votre première mémorisation.',
              )}
            </p>
          ) : (
            <ul className="flex flex-col divide-y divide-divider">
              {summary.challengePoints.map((row) => (
                <li key={row.id} className="flex items-center justify-between py-2">
                  <span className="text-sm text-text-primary">🏅 {row.title}</span>
                  <span className="text-sm font-bold tabular-nums text-primary">+{row.points}</span>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        {!summary.available && (
          <HintNote>
            {t(
              'familyPlus.pointsUnavailable',
              'Aucun profil de mémorisation actif : les points ne peuvent pas encore être calculés sur cet appareil.',
            )}
          </HintNote>
        )}

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="flex-1" onClick={() => navigate('/family/challenges')}>
            <DuoIcon icon={Clock} size={16} />
            {t('familyPlus.challengesTitle', 'Défis d’équipe')}
          </Button>
          <Button variant="outline" className="flex-1" onClick={() => navigate('/family/sync')}>
            <DuoIcon icon={CloudUploadIcon} size={16} />
            {t('familyPlus.syncTitle', 'Synchronisation')}
          </Button>
        </div>
      </div>
    </FullScreenPage>
  );
}
