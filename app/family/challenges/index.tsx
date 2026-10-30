/**
 * Famille — Défis d'équipe (kit `m10_famille_d_fis_d_quipe`).
 *
 * Trois onglets (En cours / À venir / Terminés) calculés à partir du store de
 * famille : un défi est « à venir » tant que personne n'a avancé, « terminé »
 * quand son statut est `done`. Les cartes montrent la progression réelle de
 * chaque participant (initiales), pas une illustration.
 */

import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Add01Icon as PlusSign } from '@/components/ui/solar-icons';
import { FullScreenPage } from '@/components/layout/FullScreenPage';
import { DuoIcon } from '@/components/ui/DuoIcon';
import { Button } from '@/components/ui/button';
import {
  FamilySubnav,
  HintNote,
  MemberAvatar,
  ProgressBar,
  SectionCard,
  Segmented,
} from '@/components/family/FamilyKit';
import { EmptyState } from '@/components/ui/EmptyState';
import { useFamilyRoom } from '@/hooks/useFamilyRoom';
import { useFamilyRoomStore, type FamilyChallenge } from '@/store/family-room-store';

type Tab = 'active' | 'soon' | 'done';

const DAY = 86_400_000;

function daysLeft(challenge: FamilyChallenge): number {
  const end = challenge.createdAt + challenge.durationDays * DAY;
  return Math.max(0, Math.ceil((end - Date.now()) / DAY));
}

export default function FamilyChallengesScreen() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { family, familyId } = useFamilyRoom();
  const challenges = useFamilyRoomStore((s) => s.challenges);
  const [tab, setTab] = useState<Tab>('active');

  const mine = useMemo(
    () => challenges.filter((c) => c.familyId === familyId),
    [challenges, familyId],
  );

  const grouped = useMemo(() => {
    const active: FamilyChallenge[] = [];
    const soon: FamilyChallenge[] = [];
    const done: FamilyChallenge[] = [];
    for (const c of mine) {
      if (c.status === 'done') done.push(c);
      else if (Object.values(c.progress).every((v) => v === 0)) soon.push(c);
      else active.push(c);
    }
    return { active, soon, done };
  }, [mine]);

  const list = grouped[tab];

  return (
    <FullScreenPage
      title={t('familyPlus.challengesTitle', 'Défis d’équipe')}
      subtitle={family?.name}
      backPath="/family/home"
      right={
        <button
          type="button"
          onClick={() => navigate('/family/challenges/new')}
          aria-label={t('familyPlus.createChallenge', 'Créer un défi')}
          className="rounded-full bg-surface-tint p-2"
        >
          <DuoIcon icon={PlusSign} size={18} className="text-primary" />
        </button>
      }
    >
      <div className="flex flex-col gap-4">
        <FamilySubnav />

        <Segmented<Tab>
          label={t('familyPlus.challengeTabs', 'Filtres des défis')}
          value={tab}
          onChange={setTab}
          options={[
            { value: 'active', label: t('familyPlus.tabActive', 'En cours') },
            { value: 'soon', label: t('familyPlus.tabSoon', 'À venir') },
            { value: 'done', label: t('familyPlus.tabDone', 'Terminés') },
          ]}
        />

        {list.length === 0 ? (
          <EmptyState
            title={t('familyPlus.noChallenges', 'Aucun défi dans cet onglet')}
            description={t(
              'familyPlus.noChallengesDesc',
              'Un défi d’équipe propose un passage, un objectif collectif ou une série : chacun avance sur son appareil et la progression se rassemble.',
            )}
            actionLabel={t('familyPlus.createChallenge', 'Créer un défi')}
            onAction={() => navigate('/family/challenges/new')}
          />
        ) : (
          list.map((challenge) => {
            const done = Object.values(challenge.progress).filter((v) => v >= challenge.target).length;
            const total = Math.max(1, challenge.participants.length);
            const collective = Math.round(
              (Object.values(challenge.progress).reduce((a, b) => a + b, 0) /
                Math.max(1, challenge.target * total)) *
                100,
            );
            return (
              <SectionCard key={challenge.id}>
                <button
                  type="button"
                  className="w-full text-left"
                  onClick={() => navigate(`/family/challenges/${challenge.id}`)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="micro-label text-primary">
                        {challenge.kind === 'passage'
                          ? t('familyPlus.kindPassage', 'Passage commun')
                          : challenge.kind === 'collectif'
                            ? t('familyPlus.kindCollectif', 'Objectif collectif')
                            : t('familyPlus.kindSerie', 'Série collective')}
                      </p>
                      <span className="card-title mt-1 truncate">
                        {challenge.title}
                      </span>
                      <p className="mt-0.5 text-xs text-text-muted">{challenge.passage}</p>
                    </div>
                    {challenge.status === 'active' && (
                      <span className="inline-flex shrink-0 items-center rounded-full bg-surface-tint px-2 py-1 text-2xs font-semibold tabular-nums text-primary">
                        {t('familyPlus.daysLeft', 'J-{{days}}', { days: daysLeft(challenge) })}
                      </span>
                    )}
                  </div>

                  <div className="mt-3 flex items-center justify-between text-xs text-text-muted">
                    <span className="font-semibold tabular-nums text-text-primary">
                      {collective} %
                    </span>
                    <span>
                      {t('familyPlus.participantsCount', '{{count}} participants', {
                        count: challenge.participants.length,
                      })}
                    </span>
                  </div>
                  <ProgressBar className="mt-1.5" value={collective} label={challenge.title} />

                  <div className="mt-3 flex items-center gap-2">
                    {challenge.participants.slice(0, 5).map((name) => (
                      <MemberAvatar key={name} name={name} size={28} muted={done === 0} />
                    ))}
                    <span className="ml-auto text-xs text-text-muted">
                      {t('familyPlus.membersDone', '{{done}} sur {{total}} ont fini', {
                        done,
                        total: challenge.participants.length,
                      })}
                    </span>
                  </div>
                </button>
              </SectionCard>
            );
          })
        )}

        <HintNote>
          {t(
            'familyPlus.challengesHint',
            'La progression est enregistrée sur cet appareil. Elle sera partagée avec la famille quand la synchronisation des défis sera active.',
          )}
        </HintNote>

        <Button className="w-full" onClick={() => navigate('/family/challenges/new')}>
          <DuoIcon icon={PlusSign} size={16} />
          {t('familyPlus.createChallenge', 'Créer un défi')}
        </Button>
      </div>
    </FullScreenPage>
  );
}
