/**
 * Famille — Résultats d'un défi (kit `m13_famille_r_sultats_d_un_d_fi`).
 *
 * Le classement du défi est calculé par `pointsForChallenge` sur la progression
 * enregistrée : le bonus complet ne s'applique qu'à un défi terminé, la moitié
 * au prorata sinon. L'écran affiche donc les deux cas sans mentir sur ce qui
 * a été crédité.
 */

import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChampionIcon as Trophy, Add01Icon as PlusSign } from '@/components/ui/solar-icons';
import { FullScreenPage } from '@/components/layout/FullScreenPage';
import { DuoIcon } from '@/components/ui/DuoIcon';
import { Button } from '@/components/ui/button';
import {
  HintNote,
  MemberRow,
  SectionCard,
  StatTile,
} from '@/components/family/FamilyKit';
import { EmptyState } from '@/components/ui/EmptyState';
import { useFamilyRoom } from '@/hooks/useFamilyRoom';
import { useFamilyRoomStore } from '@/store/family-room-store';
import { FAMILY_POINTS, pointsForChallenge } from '@/services/family-scoring';

export default function FamilyChallengeResultsScreen() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { challengeId } = useParams<{ challengeId: string }>();
  const { family } = useFamilyRoom();
  const challenges = useFamilyRoomStore((s) => s.challenges);

  const challenge = challenges.find((c) => c.id === challengeId) ?? null;

  if (!challenge) {
    return (
      <FullScreenPage title={t('familyPlus.resultsTitle', 'Résultats')} backPath="/family/challenges" column="wide">
        <EmptyState
          title={t('familyPlus.challengeNotFound', 'Défi introuvable')}
          description={t('familyPlus.challengeNotFoundDesc', 'Il a peut-être été supprimé.')}
          actionLabel={t('familyPlus.challengesTitle', 'Défis d’équipe')}
          onAction={() => navigate('/family/challenges')}
        />
      </FullScreenPage>
    );
  }

  const rows = [...challenge.participants]
    .map((name) => ({
      name,
      value: challenge.progress[name] ?? 0,
      points: pointsForChallenge(challenge, name),
    }))
    .sort((a, b) => b.points - a.points || b.value - a.value || a.name.localeCompare(b.name));

  return (
    <FullScreenPage
      title={
        challenge.status === 'done'
          ? t('familyPlus.challengeSuccess', 'Défi réussi !')
          : t('familyPlus.resultsTitle', 'Résultats')
      }
      subtitle={`${challenge.title} · ${family?.name ?? ''}`}
      backPath={`/family/challenges/${challenge.id}`}
    >
      <div className="space-y-4">
        <SectionCard>
          <div className="grid grid-cols-3 gap-2">
            <StatTile value={rows.length} label={t('familyPlus.participantsLabel', 'Participants')} />
            <StatTile
              value={rows.filter((r) => r.value >= challenge.target).length}
              label={t('familyPlus.membersDoneShort', 'Ont fini')}
            />
            <StatTile value={FAMILY_POINTS.challenge} label={t('familyPlus.bonusPoints', '+50 pts bonus')} />
          </div>
        </SectionCard>

        <SectionCard title={t('familyPlus.leaderboardTitle', 'Classement')}>
          <ul className="flex flex-col">
            {rows.map((row, index) => (
              <li key={row.name}>
                <MemberRow
                  name={row.name}
                  avatarSize={36}
                  muted={index > 0}
                  meta={`${index + 1} · ${row.value} / ${challenge.target}`}
                  trailing={
                    <span className="shrink-0 text-sm font-semibold tabular-nums text-primary">
                      +{row.points}
                    </span>
                  }
                />
              </li>
            ))}
          </ul>
        </SectionCard>

        <SectionCard title={t('familyPlus.rewardTitle', 'Récompenses')}>
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-tint text-primary">
              <DuoIcon icon={Trophy} size={22} />
            </span>
            <div>
              <p className="text-sm font-semibold text-text-primary">
                {t('familyPlus.teamBadge', 'Badge d’équipe')}
              </p>
              <p className="text-xs text-text-muted">
                {t('familyPlus.bonusEach', 'Bonus pour chacun : +{{points}} pts', {
                  points: FAMILY_POINTS.challenge,
                })}
              </p>
            </div>
          </div>
        </SectionCard>

        {challenge.status !== 'done' && (
          <HintNote>
            {t(
              'familyPlus.resultsProvisional',
              'Défi encore en cours : les points affichés sont provisoires (moitié du bonus au prorata). Ils passeront au bonus complet à la clôture.',
            )}
          </HintNote>
        )}

        <div className="flex flex-col gap-2">
          <Button className="w-full" onClick={() => navigate('/family/challenges/new')}>
            <DuoIcon icon={PlusSign} size={16} />
            {t('familyPlus.launchNewChallenge', 'Lancer un nouveau défi')}
          </Button>
          <Button variant="ghost" className="w-full" onClick={() => navigate('/family/home')}>
            {t('familyPlus.backToFamily', 'Retour à la famille')}
          </Button>
        </div>
      </div>
    </FullScreenPage>
  );
}
