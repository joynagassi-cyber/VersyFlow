/**
 * Famille — Points et niveaux (kit `m9_famille_points_et_niveaux`).
 *
 * Tous les chiffres viennent de `useFamilyPoints` : enregistrements de
 * mémorisation locaux du profil actif + défis de la famille. Le barème est
 * affiché **tel qu'il est appliqué** (`FAMILY_POINTS`), pour que l'utilisateur
 * puisse refaire le calcul lui-même.
 *
 * Refonte du hub : en-tête de section identique aux cinq autres hubs
 * (`FamilyHubPage`), chiffre clé porté par `FamilyHero` (`.stat-value`),
 * historique en `MemberRow`-style `MetricRow`, et une seule action principale
 * en bas — les deux boutons « Défis » / « Synchronisation » restent, mais dans
 * la même rangée d'actions que les autres hubs.
 */

import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Time04Icon as Clock,
  CloudUploadIcon,
  FireIcon as Fire,
} from '@/components/ui/solar-icons';
import { DuoIcon } from '@/components/ui/DuoIcon';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  FamilyHero,
  FamilyHubPage,
  HintNote,
  MetricRow,
  SectionCard,
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

  const toNext = Math.max(0, summary.level.next - summary.total);
  const ring = summary.available
    ? Math.min(
        100,
        Math.round(
          ((summary.total - summary.level.floor) /
            Math.max(1, summary.level.next - summary.level.floor)) *
            100,
        ),
      )
    : 0;

  return (
    <FamilyHubPage
      title={t('familyPlus.pointsTitle', 'Points et niveaux')}
      subtitle={family?.name}
    >
      <FamilyHero
        label={t('familyPlus.levelLabel', 'Niveau {{level}}', { level: summary.level.level })}
        value={summary.available ? summary.total.toLocaleString() : '—'}
        unit={t('familyPlus.points', 'points')}
        caption={
          summary.available
            ? t('familyPlus.pointsToNext', 'Encore {{points}} points avant le palier suivant.', {
                points: toNext.toLocaleString(),
              })
            : t('familyPlus.pointsUnavailableShort', 'Points non calculables sans profil actif.')
        }
        ring={ring}
        ringLabel={t('familyPlus.pointsProgress', 'Progression vers le palier suivant')}
        footnote={
          <>
            <span>
              {t('familyPlus.verses', 'Versets')} · {summary.available ? summary.verseCount : '—'}
            </span>
            <span>
              {t('familyPlus.mastered', 'Maîtrisés')} ·{' '}
              {summary.available ? summary.masteredCount : '—'}
            </span>
            <span>
              {t('familyPlus.fromChallenges', 'Défis')} ·{' '}
              {summary.available ? summary.fromChallenges : '—'}
            </span>
          </>
        }
      />

      {!summary.available && (
        <HintNote>
          {t(
            'familyPlus.pointsUnavailable',
            'Aucun profil de mémorisation actif : les points ne peuvent pas encore être calculés sur cet appareil.',
          )}
        </HintNote>
      )}

      <SectionCard title={t('familyPlus.howToEarn', 'Comment gagner des points')}>
        <ul className="flex flex-col divide-y divide-divider">
          {scale.map((row) => (
            <li key={row.key} className="py-1">
              <MetricRow label={row.label} value={`+${row.value}`} />
            </li>
          ))}
        </ul>
        <div className="mt-3">
          <HintNote>
            {t(
              'familyPlus.dailyCap',
              'Plafond quotidien de {{cap}} points pour garder le jeu équitable.',
              { cap: DAILY_CAP },
            )}
          </HintNote>
        </div>
      </SectionCard>

      <SectionCard title={t('familyPlus.recentHistory', 'Historique récent')}>
        {summary.challengePoints.length === 0 ? (
          <EmptyState
            tone="inline"
            icon={Fire}
            title={t('familyPlus.emptyHistoryTitle', 'Aucun défi marqué de points')}
            description={t(
              'familyPlus.emptyHistory',
              'Les points de versets se cumulent dès votre première mémorisation ; les défis réussis apparaîtront ici.',
            )}
          />
        ) : (
          <ul className="flex flex-col divide-y divide-divider">
            {summary.challengePoints.map((row) => (
              <li key={row.id} className="py-1">
                <MetricRow label={row.title} value={`+${row.points}`} />
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

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
    </FamilyHubPage>
  );
}
