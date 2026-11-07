/**
 * Famille — Créer un défi (kit `m11_famille_cr_er_un_d_fi`).
 *
 * Le défi est écrit dans le store de famille (local, persisté) et apparaît
 * immédiatement dans la liste. Les trois familles de défi du kit sont
 * proposées ; le passage, la durée et les participants sont choisis avant le
 * lancement, comme sur la maquette — aucun défi ne peut être créé sans titre,
 * sans objectif ni sans participant.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChampionIcon as Trophy, Tick02Icon as Tick } from '@/components/ui/solar-icons';
import { FullScreenPage } from '@/components/layout/FullScreenPage';
import { DuoIcon } from '@/components/ui/DuoIcon';
import { Button } from '@/components/ui/button';
import {
  HintNote,
  MemberAvatar,
  SectionCard,
  Segmented,
} from '@/components/family/FamilyKit';
import { useFamilyRoom } from '@/hooks/useFamilyRoom';
import { useFamilyRoomStore, type ChallengeKind, type ChallengeUnit } from '@/store/family-room-store';
import { cn } from '@/lib/utils';

const KINDS: { value: ChallengeKind; unit: ChallengeUnit; target: number }[] = [
  { value: 'passage', unit: 'verses', target: 6 },
  { value: 'collectif', unit: 'reviews', target: 100 },
  { value: 'serie', unit: 'days', target: 14 },
];

const DURATIONS = [3, 7, 14, 30];

export default function FamilyChallengeNewScreen() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { family, familyId, members } = useFamilyRoom();
  const createChallenge = useFamilyRoomStore((s) => s.createChallenge);

  const [kind, setKind] = useState<ChallengeKind>('passage');
  const [title, setTitle] = useState('');
  const [passage, setPassage] = useState('');
  const [target, setTarget] = useState('6');
  const [duration, setDuration] = useState(14);
  const [participants, setParticipants] = useState<string[]>(
    members.map((m) => m.name),
  );

  const unit = KINDS.find((k) => k.value === kind)?.unit ?? 'verses';
  const canLaunch =
    Boolean(familyId) && title.trim().length > 0 && participants.length > 0 && Number(target) > 0;

  const launch = () => {
    if (!familyId || !canLaunch) return;
    const created = createChallenge({
      familyId,
      title: title.trim(),
      kind,
      unit,
      passage: passage.trim() || t('familyPlus.passageFallback', 'Passage libre'),
      target: Math.max(1, Number(target)),
      durationDays: duration,
      participants,
    });
    navigate(`/family/challenges/${created.id}`);
  };

  return (
    <FullScreenPage
      title={t('familyPlus.newChallengeTitle', 'Créer un défi')}
      subtitle={family?.name}
      backPath="/family/challenges"
    >
      <div className="space-y-4">
        <SectionCard title={t('familyPlus.challengeKind', 'Type de défi')}>
          <div className="flex flex-col gap-2">
            {KINDS.map((k) => {
              const active = k.value === kind;
              return (
                <button
                  key={k.value}
                  type="button"
                  onClick={() => {
                    setKind(k.value);
                    setTarget(String(k.target));
                  }}
                  aria-pressed={active}
                  className={cn(
                    'flex items-center gap-3 rounded-xl border p-3 text-left transition',
                    active ? 'border-primary bg-surface-tint' : 'border-border',
                  )}
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-surface text-primary">
                    <DuoIcon icon={Trophy} size={18} />
                  </span>
                  <span className="flex-1">
                    <span className="block text-sm font-semibold text-text-primary">
                      {k.value === 'passage'
                        ? t('familyPlus.kindPassage', 'Passage commun')
                        : k.value === 'collectif'
                          ? t('familyPlus.kindCollectif', 'Objectif collectif')
                          : t('familyPlus.kindSerie', 'Série collective')}
                    </span>
                    <span className="block text-xs text-text-muted">
                      {k.value === 'passage'
                        ? t('familyPlus.kindPassageDesc', 'Tous mémorisent le même passage')
                        : k.value === 'collectif'
                          ? t('familyPlus.kindCollectifDesc', 'Atteindre un total ensemble')
                          : t('familyPlus.kindSerieDesc', 'Aucun jour manqué')}
                    </span>
                  </span>
                  {active && <DuoIcon icon={Tick} size={16} className="text-primary" />}
                </button>
              );
            })}
          </div>
        </SectionCard>

        <SectionCard title={t('familyPlus.challengeTitleLabel', 'Titre du défi')}>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={60}
            placeholder={t('familyPlus.challengeTitlePlaceholder', 'Psaume 23 en 14 jours')}
            aria-label={t('familyPlus.challengeTitleLabel', 'Titre du défi')}
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-base text-text-primary placeholder:text-text-placeholder focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </SectionCard>

        <SectionCard title={t('familyPlus.passageLabel', 'Passage')}>
          <input
            value={passage}
            onChange={(e) => setPassage(e.target.value)}
            maxLength={80}
            placeholder={t('familyPlus.passagePlaceholder', 'Psaumes 23:1-6')}
            aria-label={t('familyPlus.passageLabel', 'Passage')}
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-base text-text-primary placeholder:text-text-placeholder focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </SectionCard>

        <SectionCard title={t('familyPlus.targetLabel', 'Objectif')}>
          <div className="flex items-center gap-3">
            <input
              value={target}
              onChange={(e) => setTarget(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))}
              inputMode="numeric"
              aria-label={t('familyPlus.targetLabel', 'Objectif')}
              className="w-24 rounded-xl border border-border bg-background px-4 py-2 text-center text-base tabular-nums text-text-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <span className="text-sm text-text-muted">
              {unit === 'verses'
                ? t('familyPlus.unitVerses', 'versets')
                : unit === 'reviews'
                  ? t('familyPlus.unitReviews', 'révisions')
                  : t('familyPlus.unitDays', 'jours')}
            </span>
          </div>
        </SectionCard>

        <SectionCard title={t('familyPlus.durationLabel', 'Durée')}>
          <Segmented<string>
            label={t('familyPlus.durationLabel', 'Durée')}
            value={String(duration)}
            onChange={(v) => setDuration(Number(v))}
            options={DURATIONS.map((d) => ({
              value: String(d),
              label: t('familyPlus.daysShort', '{{count}} j', { count: d }),
            }))}
          />
        </SectionCard>

        <SectionCard
          title={t('familyPlus.participantsLabel', 'Participants')}
          action={
            <span className="text-xs tabular-nums text-text-muted">
              {participants.length} / {members.length}
            </span>
          }
        >
          {members.length === 0 ? (
            <HintNote>
              {t('familyPlus.noMembersYet', 'Aucun membre chargé : invitez d’abord la famille.')}
            </HintNote>
          ) : (
            <div className="flex flex-wrap gap-2">
              {members.map((member) => {
                const active = participants.includes(member.name);
                return (
                  <button
                    key={member.accountId}
                    type="button"
                    aria-pressed={active}
                    onClick={() =>
                      setParticipants((prev) =>
                        prev.includes(member.name)
                          ? prev.filter((n) => n !== member.name)
                          : [...prev, member.name],
                      )
                    }
                    className={cn(
                      'flex items-center gap-2 rounded-full border px-2 py-1.5 text-xs font-semibold transition',
                      active ? 'border-primary bg-surface-tint text-primary' : 'border-border text-text-muted',
                    )}
                  >
                    <MemberAvatar name={member.name} size={22} muted={!active} />
                    {member.name}
                  </button>
                );
              })}
            </div>
          )}
        </SectionCard>

        <HintNote>
          {t('familyPlus.bonusPoints', '+50 pts bonus')} ·{' '}
          {t('familyPlus.teamBadge', 'Badge d’équipe')}
        </HintNote>

        <Button className="w-full" disabled={!canLaunch} onClick={launch}>
          {t('familyPlus.launchChallenge', 'Lancer le défi')}
        </Button>
      </div>
    </FullScreenPage>
  );
}
