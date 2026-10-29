/**
 * Famille — Séance en direct (kits `m16_famille_s_ance_en_direct_en_ligne` et
 * `m16b_famille_s_ance_hors_ligne`).
 *
 * Les deux maquettes sont le **même écran dans deux états** : connecté, les
 * résultats partent en direct ; hors ligne, ils attendent la reconnexion. Le
 * patron sync (`useSyncStatus`) décide lequel des deux en-têtes s'affiche —
 * l'écran ne teste jamais `navigator.onLine` lui-même, et rien n'est perdu :
 * les cartes sues restent enregistrées localement.
 */

import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  CloudUploadIcon as CloudUpload,
  Tick02Icon as Tick,
  Cancel01Icon as Cancel,
} from '@hugeicons/core-free-icons';
import { FullScreenPage } from '@/components/layout/FullScreenPage';
import { DuoIcon } from '@/components/ui/DuoIcon';
import { Button } from '@/components/ui/button';
import {
  HintNote,
  MemberAvatar,
  ProgressBar,
  SectionCard,
} from '@/components/family/FamilyKit';
import { EmptyState } from '@/components/ui/EmptyState';
import { useFamilyRoom } from '@/hooks/useFamilyRoom';
import { useFamilyRoomStore } from '@/store/family-room-store';
import { useSyncStatus } from '@/hooks/useSyncStatus';

export default function FamilySessionLiveScreen() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const sessionId = params.get('sessionId');
  const { me } = useFamilyRoom();
  const sessions = useFamilyRoomStore((s) => s.sessions);
  const recordCards = useFamilyRoomStore((s) => s.recordCards);
  const endSession = useFamilyRoomStore((s) => s.endSession);
  const sync = useSyncStatus();

  const session = useMemo(() => sessions.find((s) => s.id === sessionId) ?? null, [sessions, sessionId]);
  const [known, setKnown] = useState(0);
  const [total, setTotal] = useState(3);

  if (!session) {
    return (
      <FullScreenPage title={t('familyPlus.liveTitle', 'Séance en direct')} backPath="/family/session/prepare">
        <EmptyState
          title={t('familyPlus.sessionNotFound', 'Séance introuvable')}
          description={t(
            'familyPlus.sessionNotFoundDesc',
            'Préparez une séance pour la retrouver ici. Les séances sont conservées sur cet appareil.',
          )}
          actionLabel={t('familyPlus.openSession', 'Ouvrir la séance')}
          onAction={() => navigate('/family/session/prepare')}
        />
      </FullScreenPage>
    );
  }

  const online = sync.phase === 'ready' || (sync.isReady && !sync.error);
  const connected = session.participants.filter((p) => p.state === 'online').length;
  const pending = known;

  const mark = (isKnown: boolean) => {
    const nextKnown = isKnown ? known + 1 : known;
    setKnown(nextKnown);
    const nextTotal = Math.max(total, known + 1);
    setTotal(nextTotal);
    if (me) recordCards(session.id, me, nextKnown, nextTotal);
  };

  return (
    <FullScreenPage
      title={session.passage}
      subtitle={t('familyPlus.familySession', 'Séance en famille')}
      backPath="/family/session/prepare"
    >
      <div className="flex flex-col gap-4">
        <SectionCard>
          <div className="flex items-center justify-between gap-2">
            <span
              className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${
                online ? 'bg-success-light text-success' : 'bg-warning-light text-warning'
              }`}
            >
              <DuoIcon icon={CloudUpload} size={12} />
              {online
                ? t('familyPlus.live', 'En direct')
                : t('familyPlus.offline', 'Hors ligne')}
            </span>
            <span className="text-xs text-text-muted">
              {online
                ? t('familyPlus.connectedCount', '{{connected}} sur {{total}} connectés', {
                    connected,
                    total: session.participants.length,
                  })
                : t('familyPlus.pendingResults', '{{count}} résultats en attente', { count: pending })}
            </span>
          </div>
          <p className="mt-2 text-xs leading-5 text-text-muted">
            {online
              ? t('familyPlus.liveHint', 'Connecté · tes stats sont partagées en direct.')
              : t(
                  'familyPlus.offlineHint',
                  'Hors ligne · tu continues, tes stats seront partagées à la reconnexion.',
                )}
          </p>
        </SectionCard>

        <SectionCard title={t('familyPlus.myCard', 'Ma carte')}>
          <p className="text-sm text-text-muted">{session.passage}</p>
          <p className="mt-2 text-lg font-semibold text-text-primary">
            {online
              ? t('familyPlus.tapToFlip', 'Touche pour retourner la carte')
              : t('familyPlus.pendingHint', 'Ils partiront dès que la connexion revient.')}
          </p>
          <div className="mt-3 flex items-center justify-between text-xs text-text-muted">
            <span className="tabular-nums">
              {known} / {total}
            </span>
            <span>
              {session.mode === 'flashcard'
                ? t('familyPlus.modeFlashcard', 'Flashcard')
                : session.mode === 'writing'
                  ? t('familyPlus.modeWriting', 'Écriture')
                  : t('familyPlus.modeMasking', 'Masquage')}
            </span>
          </div>
          <ProgressBar className="mt-1.5" value={known} max={total} label={session.passage} />
        </SectionCard>

        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" onClick={() => mark(false)}>
            <DuoIcon icon={Cancel} size={16} className="text-error" />
            {t('familyPlus.notKnown', 'Pas su')}
          </Button>
          <Button onClick={() => mark(true)}>
            <DuoIcon icon={Tick} size={16} />
            {t('familyPlus.known', 'Su')}
          </Button>
        </div>

        <SectionCard title={t('familyPlus.participantsLabel', 'Participants')}>
          <ul className="flex flex-col gap-2">
            {session.participants.map((participant) => (
              <li key={participant.name} className="flex items-center gap-3">
                <MemberAvatar
                  name={participant.name}
                  size={30}
                  muted={participant.state !== 'online'}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-text-primary">{participant.name}</p>
                  <p className="text-xs text-text-muted">
                    {participant.state === 'online'
                      ? t('familyPlus.stateOnline', 'En ligne · prêt')
                      : participant.state === 'offline'
                        ? t('familyPlus.stateOffline', 'Hors ligne · mémorise en local')
                        : participant.state === 'declined'
                          ? t('familyPlus.stateDeclined', 'N’a pas rejoint')
                          : t('familyPlus.stateInvited', 'Invité · en attente')}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </SectionCard>

        <HintNote>
          {t(
            'familyPlus.privacyNote',
            'Seuls les résultats de mémorisation sont partagés (cartes sues). Les réponses libres ne quittent pas l’appareil.',
          )}
        </HintNote>

        <Button
          variant="outline"
          className="w-full"
          onClick={() => {
            endSession(session.id);
            navigate(`/family/session/summary?sessionId=${session.id}`);
          }}
        >
          {t('familyPlus.finishSession', 'Terminer la séance')}
        </Button>
      </div>
    </FullScreenPage>
  );
}
