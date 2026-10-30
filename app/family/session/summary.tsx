/**
 * Famille — Résumé de séance de groupe (kit `m17_famille_r_sum_de_session_de_groupe`).
 *
 * Les cartes sues de chaque participant viennent de la séance
 * (`recordCards`), les points de `pointsForChallenge`-équivalent local : ici on
 * affiche les cartes sues et un bonus d'équipe fixe, tous deux calculés, et on
 * précise que le classement détaillé vit dans l'écran Classement.
 */

import { useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Add01Icon as PlusSign, ChampionIcon as Trophy } from '@/components/ui/solar-icons';
import { FullScreenPage } from '@/components/layout/FullScreenPage';
import { DuoIcon } from '@/components/ui/DuoIcon';
import { Button } from '@/components/ui/button';
import { HintNote, MemberAvatar, SectionCard, StatTile } from '@/components/family/FamilyKit';
import { EmptyState } from '@/components/ui/EmptyState';
import { useFamilyRoomStore } from '@/store/family-room-store';
import { FAMILY_POINTS } from '@/services/family-scoring';

export default function FamilySessionSummaryScreen() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const sessionId = params.get('sessionId');
  const sessions = useFamilyRoomStore((s) => s.sessions);

  const session = useMemo(() => sessions.find((s) => s.id === sessionId) ?? null, [sessions, sessionId]);

  if (!session) {
    return (
      <FullScreenPage title={t('familyPlus.sessionSummaryTitle', 'Session terminée')} backPath="/family/home">
        <EmptyState
          title={t('familyPlus.sessionNotFound', 'Séance introuvable')}
          description={t('familyPlus.sessionNotFoundDesc', 'Préparez une séance pour la retrouver ici.')}
          actionLabel={t('familyPlus.openSession', 'Ouvrir la séance')}
          onAction={() => navigate('/family/session/prepare')}
        />
      </FullScreenPage>
    );
  }

  const entries = session.participants.map((p) => {
    const cards = session.cards[p.name] ?? { known: 0, total: 0 };
    return { name: p.name, ...cards };
  });
  const totalKnown = entries.reduce((sum, e) => sum + e.known, 0);
  const totalCards = entries.reduce((sum, e) => sum + e.total, 0);
  const durationMin =
    session.startedAt && session.endedAt
      ? Math.max(1, Math.round((session.endedAt - session.startedAt) / 60000))
      : null;

  return (
    <FullScreenPage
      title={t('familyPlus.sessionSummaryTitle', 'Session terminée')}
      subtitle={`${session.passage} · ${session.participants.length} ${t('familyPlus.participantsShort', 'participants')}`}
      backPath="/family/home"
    >
      <div className="flex flex-col gap-4">
        <SectionCard>
          <div className="grid grid-cols-3 gap-2">
            <StatTile
              value={totalCards > 0 ? `${totalKnown}/${totalCards}` : '—'}
              label={t('familyPlus.cardsKnown', 'Cartes sues')}
            />
            <StatTile
              value={durationMin != null ? `${durationMin} min` : '—'}
              label={t('familyPlus.duration', 'Durée')}
            />
            <StatTile value={FAMILY_POINTS.challenge / 10} label={t('familyPlus.teamBonus', 'Bonus d’équipe')} />
          </div>
        </SectionCard>

        <SectionCard title={t('familyPlus.pointsEarned', 'Points gagnés')}>
          {entries.length === 0 ? (
            <p className="text-sm text-text-muted">
              {t('familyPlus.noParticipants', 'Aucun participant enregistré pour cette séance.')}
            </p>
          ) : (
            <ul className="flex flex-col divide-y divide-divider">
              {entries.map((entry) => (
                <li key={entry.name} className="flex items-center gap-3 py-2">
                  <MemberAvatar name={entry.name} size={30} muted={entry.known === 0} />
                  <span className="min-w-0 flex-1 truncate text-sm text-text-primary">
                    {entry.name}
                  </span>
                  <span className="text-xs tabular-nums text-text-muted">
                    {entry.known}/{entry.total || '—'}
                  </span>
                  <span className="w-10 text-right text-sm font-bold tabular-nums text-primary">
                    +{entry.known * 5}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-3">
            <HintNote>
              {t(
                'familyPlus.summaryScoring',
                'Chaque carte sue vaut 5 points ; le bonus d’équipe (+{{bonus}}) est versé à tous quand la séance est terminée ensemble.',
                { bonus: FAMILY_POINTS.challenge / 10 },
              )}
            </HintNote>
          </div>
        </SectionCard>

        <div className="flex items-center gap-3 rounded-2xl bg-surface-tint p-4">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-surface text-primary">
            <DuoIcon icon={Trophy} size={20} />
          </span>
          <p className="text-sm text-text-primary">
            {t('familyPlus.teamBadgeEarned', 'Badge d’équipe débloqué pour cette séance.')}
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <Button className="w-full" onClick={() => navigate('/family/session/prepare')}>
            <DuoIcon icon={PlusSign} size={16} />
            {t('familyPlus.newSession', 'Nouvelle séance')}
          </Button>
          <Button variant="ghost" className="w-full" onClick={() => navigate('/family/home')}>
            {t('familyPlus.backToFamily', 'Retour à la famille')}
          </Button>
        </div>
      </div>
    </FullScreenPage>
  );
}
