/**
 * Famille — Préparation de séance (kit `m15_famille_pr_paration_de_s_ance`).
 *
 * On choisit un passage, un mode (flashcard / écriture / masquage), les
 * participants et le moment. « Ouvrir la séance » crée la séance dans le store
 * puis ouvre l'écran en direct, où chacun avance sur son appareil.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  BookOpen01Icon as BookOpen,
  Tick02Icon as Tick,
  Add01Icon as PlusSign,
} from '@/components/ui/solar-icons';
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
import { useFamilyRoomStore, type SessionMode } from '@/store/family-room-store';
import { cn } from '@/lib/utils';

export default function FamilySessionPrepareScreen() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { familyId, members, me } = useFamilyRoom();
  const planSession = useFamilyRoomStore((s) => s.planSession);

  const [passage, setPassage] = useState('');
  const [mode, setMode] = useState<SessionMode>('flashcard');
  const [online, setOnline] = useState<string[]>(members.map((m) => m.name));

  const canOpen = Boolean(familyId) && passage.trim().length > 0;

  const open = () => {
    if (!familyId || !canOpen) return;
    const session = planSession({
      familyId,
      passage: passage.trim(),
      mode,
      participants: members.map((member) => ({
        name: member.name,
        state: online.includes(member.name) ? 'online' : 'invited',
      })),
    });
    navigate(`/family/session/live?sessionId=${session.id}`);
  };

  return (
    <FullScreenPage
      title={t('familyPlus.familySession', 'Séance en famille')}
      subtitle={t('familyPlus.eachOwnDevice', 'Chacun sur son appareil')}
      backPath="/family/home"
    >
      <div className="space-y-4">
        <SectionCard title={t('familyPlus.passageLabel', 'Passage')}>
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-tint text-primary">
              <DuoIcon icon={BookOpen} size={18} />
            </span>
            <input
              value={passage}
              onChange={(e) => setPassage(e.target.value)}
              maxLength={80}
              placeholder={t('familyPlus.passagePlaceholder', 'Psaumes 23:1-6')}
              aria-label={t('familyPlus.passageLabel', 'Passage')}
              className="flex-1 rounded-xl border border-border bg-background px-4 py-2.5 text-base text-text-primary placeholder:text-text-placeholder focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </SectionCard>

        <SectionCard title={t('familyPlus.modeLabel', 'Type de séance')}>
          <Segmented<SessionMode>
            label={t('familyPlus.modeLabel', 'Type de séance')}
            value={mode}
            onChange={setMode}
            options={[
              { value: 'flashcard', label: t('familyPlus.modeFlashcard', 'Flashcard') },
              { value: 'writing', label: t('familyPlus.modeWriting', 'Écriture') },
              { value: 'masking', label: t('familyPlus.modeMasking', 'Masquage') },
            ]}
          />
        </SectionCard>

        <SectionCard
          title={t('familyPlus.participantsLabel', 'Participants')}
          action={
            <span className="text-xs tabular-nums text-text-muted">
              {online.length} / {members.length}
            </span>
          }
        >
          {members.length === 0 ? (
            <HintNote>
              {t('familyPlus.noMembersYet', 'Aucun membre chargé : invitez d’abord la famille.')}
            </HintNote>
          ) : (
            <ul className="flex flex-col gap-2">
              {members.map((member) => {
                const isOnline = online.includes(member.name);
                const isMe = member.name === me;
                return (
                  <li key={member.accountId} className="flex items-center gap-3">
                    <MemberAvatar name={member.name} size={32} muted={!isOnline} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-text-primary">
                        {member.name}
                        {isMe && (
                          <span className="ml-1 text-2xs font-normal text-text-muted">
                            ({t('familyPlus.you', 'vous')})
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-text-muted">
                        {isOnline
                          ? t('familyPlus.onlineReady', 'En ligne · prêt')
                          : t('familyPlus.notInvited', 'Pas invité')}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setOnline((prev) =>
                          prev.includes(member.name)
                            ? prev.filter((n) => n !== member.name)
                            : [...prev, member.name],
                        )
                      }
                      aria-pressed={isOnline}
                      className={cn(
                        'flex items-center gap-1 rounded-full px-2.5 py-1 text-2xs font-semibold transition',
                        isOnline ? 'bg-primary text-on-primary' : 'bg-surface-tint text-primary',
                      )}
                    >
                      <DuoIcon icon={isOnline ? Tick : PlusSign} size={12} />
                      {isOnline
                        ? t('familyPlus.invited', 'Invité')
                        : t('familyPlus.invite', 'Inviter')}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </SectionCard>

        <HintNote>
          {t(
            'familyPlus.sessionHint',
            'Chacun mémorise sur son appareil, en ligne ou non. Les résultats sont partagés en direct, ou dès la reconnexion.',
          )}
        </HintNote>

        <Button className="w-full" disabled={!canOpen} onClick={open}>
          {t('familyPlus.openSession', 'Ouvrir la séance')}
        </Button>
      </div>
    </FullScreenPage>
  );
}
