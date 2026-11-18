/**
 * Famille — Fil d'activité (kit `m20_famille_fil_d_activit`).
 *
 * Les entrées viennent du store de famille (défis lancés, défis réussis,
 * niveaux). Les réactions sont **prédéfinies uniquement** : trois boutons, pas
 * de texte libre — c'est la règle du kit, et elle évite d'avoir à modérer quoi
 * que ce soit entre membres.
 */

import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FullScreenPage } from '@/components/layout/FullScreenPage';
import {
  HintNote,
  MemberAvatar,
  SectionCard,
  Segmented,
} from '@/components/family/FamilyKit';
import { EmptyState } from '@/components/ui/EmptyState';
import { useFamilyRoom } from '@/hooks/useFamilyRoom';
import { useFamilyRoomStore, type ActivityKind } from '@/store/family-room-store';
import { cn } from '@/lib/utils';

type Filter = 'all' | 'challenges' | 'levels';

const REACTIONS: { key: string; label: string }[] = [
  { key: 'cheer', label: 'Bravo' },
  { key: 'courage', label: 'Courage' },
  { key: 'keepGoing', label: 'Continue' },
];

function relativeTime(at: number, t: (k: string, f: string, o?: Record<string, unknown>) => string): string {
  const minutes = Math.round((Date.now() - at) / 60000);
  if (minutes < 1) return t('familyPlus.justNow', 'à l’instant');
  if (minutes < 60) return t('familyPlus.minutesAgo', 'il y a {{count}} min', { count: minutes });
  const hours = Math.round(minutes / 60);
  if (hours < 24) return t('familyPlus.hoursAgo', 'il y a {{count}} h', { count: hours });
  return t('familyPlus.daysAgo', 'il y a {{count}} j', { count: Math.round(hours / 24) });
}

const KIND_LABEL: Record<ActivityKind, { key: string; fallback: string }> = {
  'challenge-done': { key: 'familyPlus.activityDone', fallback: 'a terminé' },
  'challenge-started': { key: 'familyPlus.activityStarted', fallback: 'a lancé le défi' },
  'level-up': { key: 'familyPlus.activityLevelUp', fallback: 'a atteint un nouveau niveau' },
  missed: { key: 'familyPlus.activityMissed', fallback: 'n’a pas révisé récemment' },
};

export default function FamilyActivityScreen() {
  const { t } = useTranslation();
  const { family, familyId } = useFamilyRoom();
  const activities = useFamilyRoomStore((s) => s.activities);
  const react = useFamilyRoomStore((s) => s.react);
  const [filter, setFilter] = useState<Filter>('all');

  const entries = useMemo(() => {
    const scoped = activities.filter((a) => a.familyId === familyId);
    if (filter === 'all') return scoped;
    if (filter === 'levels') return scoped.filter((a) => a.kind === 'level-up');
    return scoped.filter((a) => a.kind === 'challenge-done' || a.kind === 'challenge-started');
  }, [activities, familyId, filter]);

  return (
    <FullScreenPage
      title={t('familyPlus.activityTitle', 'Activité')}
      subtitle={family?.name}
      backPath="/family/home"
    >
      <div className="flex flex-col gap-4">
        <Segmented<Filter>
          label={t('familyPlus.activityFilter', 'Filtrer l’activité')}
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'all', label: t('familyPlus.all', 'Tout') },
            { value: 'challenges', label: t('familyPlus.challengesTitle', 'Défis') },
            { value: 'levels', label: t('familyPlus.levels', 'Niveaux') },
          ]}
        />

        {entries.length === 0 ? (
          <EmptyState
            title={t('familyPlus.noActivity', 'Aucune activité pour l’instant')}
            description={t(
              'familyPlus.noActivityDesc',
              'Lancez un défi ou une séance : ce que fait chaque membre apparaîtra ici.',
            )}
          />
        ) : (
          <ul className="flex flex-col gap-3">
            {entries.map((entry) => {
              const label = KIND_LABEL[entry.kind];
              return (
                <li key={entry.id}>
                  <SectionCard>
                    <div className="flex items-start gap-3">
                      <MemberAvatar name={entry.actor || '?'} size={36} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-text-primary">
                          <span className="font-semibold">{entry.actor || t('familyPlus.someone', 'Un membre')}</span>{' '}
                          {t(label.key, label.fallback)}{' '}
                          <span className="font-semibold">{entry.target}</span>
                        </p>
                        <p className="mt-0.5 text-xs text-text-muted">{relativeTime(entry.at, t)}</p>

                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {REACTIONS.map((reaction) => {
                            const count = entry.reactions[reaction.key] ?? 0;
                            return (
                              <button
                                key={reaction.key}
                                type="button"
                                onClick={() => react(entry.id, reaction.key)}
                                className={cn(
                                  'rounded-full px-2.5 py-1 text-2xs font-semibold transition',
                                  count > 0
                                    ? 'bg-surface-tint text-primary'
                                    : 'bg-surface-tint/60 text-text-muted',
                                )}
                                aria-label={`${t(reaction.key === 'cheer' ? 'familyPlus.reactCheer' : reaction.key === 'courage' ? 'familyPlus.reactCourage' : 'familyPlus.reactKeepGoing', reaction.label)} ${entry.actor}`}
                              >
                                {t(
                                  reaction.key === 'cheer'
                                    ? 'familyPlus.reactCheer'
                                    : reaction.key === 'courage'
                                      ? 'familyPlus.reactCourage'
                                      : 'familyPlus.reactKeepGoing',
                                  reaction.label,
                                )}
                                {count > 0 ? ` · ${count}` : ''}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </SectionCard>
                </li>
              );
            })}
          </ul>
        )}

        <HintNote>
          {t(
            'familyPlus.reactionsNote',
            'Réactions prédéfinies uniquement, sans texte libre : personne ne peut écrire quelque chose de blessant dans le fil.',
          )}
        </HintNote>
      </div>
    </FullScreenPage>
  );
}
