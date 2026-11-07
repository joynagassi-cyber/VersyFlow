/**
 * Famille — Détail d'un membre (kit `m7_famille_d_tail_d_un_membre`).
 *
 * Ce que cet écran peut montrer, et ce qu'il refuse d'inventer
 * ------------------------------------------------------------
 * Le service `getMembersScoped` renvoie un `cognitiveData` **vide** pour tout
 * le monde aujourd'hui (les valeurs FSRS ne sont pas encore branchées côté
 * famille) et il ne le renvoie qu'au propriétaire et aux administrateurs.
 * L'écran affiche donc les vraies informations — nom, rôle, alias, date
 * d'arrivée, progression dans les défis de la famille — et affiche « — » là
 * où la donnée n'existe pas encore, au lieu d'un 0 qui se ferait passer pour
 * une mesure.
 */

import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  UserGroupIcon as Users,
  ChartLineData01Icon as Chart,
  ChampionIcon as Trophy,
  ArrowRight01Icon as ArrowRight,
} from '@/components/ui/solar-icons';
import { FullScreenPage } from '@/components/layout/FullScreenPage';
import { DuoIcon } from '@/components/ui/DuoIcon';
import { Button } from '@/components/ui/button';
import {
  HintNote,
  MemberRow,
  MetricRow,
  SectionCard,
  StatTile,
} from '@/components/family/FamilyKit';
import { EmptyState } from '@/components/ui/EmptyState';
import { useFamilyRoom } from '@/hooks/useFamilyRoom';
import { useFamilyRoomStore } from '@/store/family-room-store';
import { pointsForChallenge } from '@/services/family-scoring';

export default function FamilyMemberScreen() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { accountId } = useParams<{ accountId: string }>();
  const { family, members, me, loading } = useFamilyRoom();
  const challenges = useFamilyRoomStore((s) => s.challenges);

  const member = members.find((m) => m.accountId === accountId) ?? null;

  const memberChallenges = useMemo(
    () =>
      challenges
        .filter((c) => c.familyId === family?.id && c.participants.includes(member?.name ?? ''))
        .map((c) => ({
          challenge: c,
          value: c.progress[member?.name ?? ''] ?? 0,
          points: pointsForChallenge(c, member?.name ?? ''),
        })),
    [challenges, family?.id, member?.name],
  );

  const totalPoints = memberChallenges.reduce((sum, c) => sum + c.points, 0);

  if (!family) {
    return (
      <FullScreenPage title={t('familyPlus.memberTitle', 'Membre')} backPath="/family/home" column="wide">
        <HintNote>
          {t('familyPlus.noFamilySelected', 'Aucune famille active : choisissez ou créez une famille.')}
        </HintNote>
      </FullScreenPage>
    );
  }

  if (!member && !loading) {
    return (
      <FullScreenPage title={t('familyPlus.memberTitle', 'Membre')} backPath="/family/members">
        <HintNote>
          {t(
            'familyPlus.memberNotFound',
            'Ce membre ne fait plus partie de la famille active (ou son profil n’est plus lisible).',
          )}
        </HintNote>
      </FullScreenPage>
    );
  }

  return (
    <FullScreenPage
      title={member?.name ?? '—'}
      subtitle={family.name}
      backPath="/family/members"
    >
      <div className="space-y-4">
        <SectionCard>
          <MemberRow
            name={member?.name ?? '?'}
            avatarSize={56}
            meta={
              member?.role === 'owner'
                ? t('familyPlus.roleOwner', 'Propriétaire')
                : member?.role === 'admin'
                  ? t('familyPlus.roleAdmin', 'Administrateur')
                  : t('familyPlus.roleMember', 'Membre')
            }
            highlight={member?.accountId === me}
            youLabel={t('familyPlus.you', 'Vous')}
          />
        </SectionCard>

        <div className="grid grid-cols-3 gap-2">
          <StatTile
            value={memberChallenges.length}
            label={t('familyPlus.passages', 'Passages')}
          />
          <StatTile value={totalPoints} label={t('familyPlus.points', 'points')} />
          <StatTile value="—" label={t('familyPlus.streak', 'Série')} hint={t('familyPlus.notMeasured', 'non mesuré')} />
        </div>

        <SectionCard title={t('familyPlus.challengesInCommon', 'Défis en commun')}>
          {memberChallenges.length === 0 ? (
            <EmptyState
              tone="inline"
              icon={Trophy}
              title={t('familyPlus.noChallengeForMemberTitle', 'Aucun défi en cours')}
              description={t(
                'familyPlus.noChallengeForMember',
                'Ce membre ne participe à aucun défi en cours.',
              )}
            />
          ) : (
            <ul className="flex flex-col divide-y divide-divider">
              {memberChallenges.map(({ challenge, value, points }) => (
                <li key={challenge.id} className="py-1">
                  <MetricRow
                    label={challenge.title}
                    value={`${value} / ${challenge.target} · ${points} ${t('familyPlus.points', 'points')}`}
                    progress={(value / Math.max(1, challenge.target)) * 100}
                    progressLabel={challenge.title}
                  />
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard title={t('familyPlus.thisWeek', 'Cette semaine')}>
          <div className="grid grid-cols-3 gap-2">
            <StatTile value="—" label={t('familyPlus.reviews', 'Révisions')} />
            <StatTile value="—" label={t('familyPlus.mastered', 'Maîtrisés')} />
            <StatTile value="—" label={t('familyPlus.badges', 'Badges')} />
          </div>
          <div className="mt-3">
            <HintNote>
              {t(
                'familyPlus.noCognitiveData',
                'Les données détaillées de révision ne sont affichées qu’au propriétaire et aux administrateurs, et seulement quand la synchronisation des révisions est active. Un tiret veut dire « pas encore mesuré », pas « zéro ».',
              )}
            </HintNote>
          </div>
        </SectionCard>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="flex-1" onClick={() => navigate('/family/leaderboard')}>
            <DuoIcon icon={Trophy} size={16} />
            {t('familyPlus.leaderboardTitle', 'Classement')}
          </Button>
          <Button variant="outline" className="flex-1" onClick={() => navigate('/family/activity')}>
            <DuoIcon icon={Chart} size={16} />
            {t('familyPlus.activityTitle', 'Activité')}
          </Button>
          <Button variant="outline" className="flex-1" onClick={() => navigate('/family/members')}>
            <DuoIcon icon={Users} size={16} />
            {t('familyPlus.members', 'Membres')}
            <DuoIcon icon={ArrowRight} size={14} />
          </Button>
        </div>
      </div>
    </FullScreenPage>
  );
}
