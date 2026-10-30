/**
 * Famille — Détail d'un défi (kit `m12_famille_d_tail_d_un_d_fi`).
 *
 * Chaque participant a sa ligne et sa progression réelle. « Avancer » crédite
 * une unité pour le profil actif — c'est le seul moyen, dans cette version, de
 * faire vivre un défi sans backend : le bouton est donc explicite et l'écran
 * dit d'où vient la progression.
 */

import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChampionIcon as Trophy, CheckmarkCircle02Icon as CheckCircle } from '@/components/ui/solar-icons';
import { FullScreenPage } from '@/components/layout/FullScreenPage';
import { DuoIcon } from '@/components/ui/DuoIcon';
import { Button } from '@/components/ui/button';
import {
  HintNote,
  MemberAvatar,
  ProgressBar,
  SectionCard,
  StatTile,
} from '@/components/family/FamilyKit';
import { EmptyState } from '@/components/ui/EmptyState';
import { useFamilyRoom } from '@/hooks/useFamilyRoom';
import { useFamilyRoomStore } from '@/store/family-room-store';

export default function FamilyChallengeDetailScreen() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { challengeId } = useParams<{ challengeId: string }>();
  const { family, me } = useFamilyRoom();
  const challenges = useFamilyRoomStore((s) => s.challenges);
  const advance = useFamilyRoomStore((s) => s.advanceChallenge);
  const complete = useFamilyRoomStore((s) => s.completeChallenge);

  const challenge = challenges.find((c) => c.id === challengeId) ?? null;

  if (!challenge) {
    return (
      <FullScreenPage title={t('familyPlus.challengeDetailTitle', 'Défi')} backPath="/family/challenges">
        <EmptyState
          title={t('familyPlus.challengeNotFound', 'Défi introuvable')}
          description={t(
            'familyPlus.challengeNotFoundDesc',
            'Il a peut-être été supprimé avec les données de la famille sur cet appareil.',
          )}
          actionLabel={t('familyPlus.challengesTitle', 'Défis d’équipe')}
          onAction={() => navigate('/family/challenges')}
        />
      </FullScreenPage>
    );
  }

  const finished = Object.values(challenge.progress).filter((v) => v >= challenge.target).length;
  const total = challenge.participants.length;
  const collective = Math.round(
    (Object.values(challenge.progress).reduce((a, b) => a + b, 0) /
      Math.max(1, challenge.target * Math.max(1, total))) *
      100,
  );
  const myProgress = challenge.progress[me] ?? 0;

  return (
    <FullScreenPage
      title={challenge.title}
      subtitle={`${family?.name ?? ''} · ${challenge.passage}`}
      backPath="/family/challenges"
    >
      <div className="flex flex-col gap-4">
        <SectionCard>
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] font-bold uppercase tracking-wide text-primary">
              {challenge.kind === 'passage'
                ? t('familyPlus.kindPassage', 'Passage commun')
                : challenge.kind === 'collectif'
                  ? t('familyPlus.kindCollectif', 'Objectif collectif')
                  : t('familyPlus.kindSerie', 'Série collective')}
            </p>
            {challenge.status === 'done' && (
              <span className="flex items-center gap-1 rounded-full bg-success-light px-2 py-1 text-[11px] font-bold text-success">
                <DuoIcon icon={CheckCircle} size={12} />
                {t('familyPlus.challengeDone', 'Réussi')}
              </span>
            )}
          </div>
          <div className="mt-2 grid grid-cols-3 gap-2">
            <StatTile value={`${finished}/${total}`} label={t('familyPlus.membersDoneShort', 'Ont fini')} />
            <StatTile value={challenge.target} label={t('familyPlus.targetLabel', 'Objectif')} />
            <StatTile value={collective} label="%" />
          </div>
          <ProgressBar className="mt-3" value={collective} label={challenge.title} />
        </SectionCard>

        <SectionCard title={t('familyPlus.participantsLabel', 'Participants')}>
          <ul className="flex flex-col gap-3">
            {challenge.participants.map((name) => {
              const value = challenge.progress[name] ?? 0;
              const done = value >= challenge.target;
              return (
                <li key={name} className="flex items-center gap-3">
                  <MemberAvatar name={name} size={32} muted={!done} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="truncate text-sm font-semibold text-text-primary">{name}</span>
                      <span className="shrink-0 text-xs tabular-nums text-text-muted">
                        {value} / {challenge.target}
                      </span>
                    </div>
                    <ProgressBar
                      className="mt-1"
                      value={value}
                      max={challenge.target}
                      label={name}
                    />
                  </div>
                  {done && <DuoIcon icon={CheckCircle} size={16} className="text-success" />}
                </li>
              );
            })}
          </ul>
        </SectionCard>

        <HintNote>
          {t(
            'familyPlus.challengeProgressHint',
            'La progression de chacun est enregistrée sur son appareil. Sur cet appareil, vous ne voyez que ce qui y a été saisi.',
          )}
        </HintNote>

        <div className="flex flex-col gap-2">
          <Button
            className="w-full"
            disabled={!me || challenge.status === 'done' || myProgress >= challenge.target}
            onClick={() => advance(challenge.id, me, 1)}
          >
            {t('familyPlus.advance', 'Avancer d’une unité')}
          </Button>
          <Button
            variant="outline"
            className="w-full"
            disabled={challenge.status === 'done'}
            onClick={() => {
              complete(challenge.id);
              navigate(`/family/challenges/${challenge.id}/results`);
            }}
          >
            <DuoIcon icon={Trophy} size={16} />
            {t('familyPlus.markDone', 'Marquer comme réussi')}
          </Button>
        </div>
      </div>
    </FullScreenPage>
  );
}
