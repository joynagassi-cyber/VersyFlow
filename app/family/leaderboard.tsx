/**
 * Famille — Classement (kit `m8_famille_classement`).
 *
 * Le classement affiché est **local et explicite** : il additionne, pour chaque
 * membre, les points de défi gagnés dans la famille active (`pointsForChallenge`).
 * Les révisions de chaque membre ne sont pas encore synchronisées entre
 * appareils ; l'écran le dit, et propose l'écran de synchronisation plutôt que
 * de laisser croire à un classement mondial.
 */

import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { RefreshIcon, CloudUploadIcon } from '@/components/ui/solar-icons';
import { FullScreenPage } from '@/components/layout/FullScreenPage';
import { DuoIcon } from '@/components/ui/DuoIcon';
import { Button } from '@/components/ui/button';
import {
  HintNote,
  MemberAvatar,
  ProgressBar,
  SectionCard,
  Segmented,
} from '@/components/family/FamilyKit';
import { EmptyState } from '@/components/ui/EmptyState';
import { useFamilyRoom } from '@/hooks/useFamilyRoom';
import { useFamilyRoomStore } from '@/store/family-room-store';
import { pointsForChallenge } from '@/services/family-scoring';

type Period = 'week' | 'month' | 'all';

const DAY = 86_400_000;

export default function FamilyLeaderboardScreen() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { family, familyId, members, loading } = useFamilyRoom();
  const challenges = useFamilyRoomStore((s) => s.challenges);
  const [period, setPeriod] = useState<Period>('week');

  const rows = useMemo(() => {
    const now = Date.now();
    const window = period === 'week' ? 7 * DAY : period === 'month' ? 30 * DAY : Number.MAX_SAFE_INTEGER;
    const scoped = challenges.filter(
      (c) => c.familyId === familyId && now - c.createdAt <= window,
    );

    return members
      .map((member) => {
        const points = scoped.reduce((sum, c) => sum + pointsForChallenge(c, member.name), 0);
        const done = scoped.filter((c) => c.status === 'done' && c.participants.includes(member.name))
          .length;
        const engaged = scoped.filter((c) => (c.progress[member.name] ?? 0) > 0).length;
        return { ...member, points, done, engaged };
      })
      .sort(
        (a, b) =>
          b.points - a.points || b.done - a.done || b.engaged - a.engaged || a.name.localeCompare(b.name),
      );
  }, [challenges, familyId, members, period]);

  const top = rows[0];
  const tie = rows.length > 1 && rows[0].points === rows[1].points;
  const maxPoints = Math.max(1, ...rows.map((r) => r.points));

  return (
    <FullScreenPage
      title={t('familyPlus.leaderboardTitle', 'Classement')}
      subtitle={family?.name}
      backPath="/family/home"
    >
      <div className="flex flex-col gap-4">
        <Segmented<Period>
          label={t('familyPlus.periodLabel', 'Période')}
          value={period}
          onChange={setPeriod}
          options={[
            { value: 'week', label: t('familyPlus.periodWeek', 'Semaine') },
            { value: 'month', label: t('familyPlus.periodMonth', 'Mois') },
            { value: 'all', label: t('familyPlus.periodAll', 'Depuis le début') },
          ]}
        />

        {loading ? (
          <p className="px-1 text-sm text-text-muted">{t('common.loading', 'Chargement...')}</p>
        ) : rows.length === 0 ? (
          <EmptyState
            title={t('familyPlus.noMembers', 'Aucun membre pour l’instant')}
            description={t(
              'familyPlus.noMembersDesc',
              'Invitez un membre : le classement se remplit dès la première révision partagée.',
            )}
            actionLabel={t('family.invite', 'Inviter')}
            onAction={() => navigate('/family/invite')}
          />
        ) : (
          <SectionCard>
            <ul className="flex flex-col gap-3">
              {rows.map((row, index) => (
                <li key={row.accountId}>
                  <button
                    type="button"
                    onClick={() => navigate(`/family/member/${encodeURIComponent(row.accountId)}`)}
                    className="flex w-full items-center gap-3 rounded-xl p-1 text-left"
                  >
                    <span className="w-5 text-center text-sm font-bold tabular-nums text-text-muted">
                      {index + 1}
                    </span>
                    <MemberAvatar name={row.name} size={36} />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-2">
                        <span className="truncate text-sm font-semibold text-text-primary">
                          {row.name}
                        </span>
                        <span className="shrink-0 text-sm font-bold tabular-nums text-primary">
                          {row.points} {t('familyPlus.pts', 'pts')}
                        </span>
                      </span>
                      <ProgressBar
                        value={row.points}
                        max={maxPoints}
                        label={row.name}
                        className="mt-1.5"
                      />
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </SectionCard>
        )}

        {top && (
          <HintNote>
            {tie
              ? t('familyPlus.tieNote', 'Égalité départagée par la régularité : {{name}} est en tête.', {
                  name: top.name,
                })
              : t('familyPlus.leaderNote', '{{name}} est en tête sur cette période.', {
                  name: top.name,
                })}
          </HintNote>
        )}

        <HintNote>
          {t(
            'familyPlus.leaderSource',
            'Classement local : il additionne les points de défi de cette famille sur l’appareil. Les révisions de chacun ne sont pas encore comparées entre appareils.',
          )}
        </HintNote>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="flex-1" onClick={() => navigate('/family/challenges')}>
            <DuoIcon icon={RefreshIcon} size={16} />
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
