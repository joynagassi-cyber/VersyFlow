import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { DuoIcon } from '@/components/ui/DuoIcon';
import {
  PlusSignIcon as Plus,
  CheckIcon as Check,
  UserIcon as User,
  ArrowRight01Icon as ArrowRight,
} from '@/components/ui/solar-icons';
import { z } from 'zod';
import { FullScreenPage } from '@/components/layout/FullScreenPage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useActiveProfile } from '@/hooks/useActiveProfile';
import { cn } from '@/lib/utils';
import { fireAndForget } from '@/lib/fire-and-forget';
import { EmptyState } from '@/components/ui/EmptyState';
import { FamilySelectProfileSkeleton } from '@/components/ui/ScreenSkeletons';
import { HintNote, MemberAvatar, SectionCard } from '@/components/family/FamilyKit';
import { useFamilyRoom } from '@/hooks/useFamilyRoom';
import { useFamilyRoomStore } from '@/store/family-room-store';

const NAME_SCHEMA = z.string().trim().min(2).max(30);

export default function ProfileSelectionScreen() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { profiles, activeProfileId, selectProfile, createProfile } = useActiveProfile();
  /**
   * Le sélecteur familial (`app/family/select-profile.tsx`) faisait la même
   * chose en mieux : il montrait les profils locaux ET les autres membres de la
   * famille (en lecture seule), avec leur dernière activité réelle. Deux écrans
   * pour un seul geste, c'était deux endroits où le profil actif pouvait
   * diverger. Celui-ci est désormais le seul : il reprend les deux listes.
   */
  const { family, familyId, members, loading } = useFamilyRoom();
  const activities = useFamilyRoomStore((s) => s.activities);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSelect = (id: string) => {
    selectProfile(id);
    navigate('/tabs/home');
  };

  /** Dernière activité locale par acteur (nom affiché) — rien d'inventé. */
  const lastByActor = new Map<string, number>();
  for (const entry of activities) {
    if (entry.familyId !== familyId) continue;
    const known = lastByActor.get(entry.actor) ?? 0;
    if (entry.at > known) lastByActor.set(entry.actor, entry.at);
  }

  const localNames = new Set(profiles.map((p) => p.displayName.trim().toLowerCase()));
  const others = members.filter((m) => !localNames.has(m.name.trim().toLowerCase()));

  const handleCreate = async () => {
    const parsed = NAME_SCHEMA.safeParse(newName);
    if (!parsed.success) {
      setError(t('profile.nameError', 'Nom trop court (min 2)'));
      return;
    }
    await createProfile(parsed.data);
    navigate('/tabs/home');
  };

  return (
    <FullScreenPage
      title={t('profile.select', 'Profil')}
      subtitle={family ? t('familyPlus.membersCount', '{{count}} membres', { count: members.length }) : undefined}
      backPath="/settings"
    >
      <div className="screen-column space-y-4">
        <div className="text-center">
          <h2 className="page-title">
            {t('profile.who', "Qui apprend aujourd'hui ?")}
          </h2>
          <p className="mt-1 text-sm text-text-muted">
            {t('profile.selectHint', 'Choisis ton profil pour continuer')}
          </p>
        </div>

        {profiles.length === 0 ? (
          <EmptyState
            title={t('familyPlus.noLocalProfile', 'Aucun profil sur cet appareil')}
            description={t(
              'familyPlus.noLocalProfileDesc',
              'Créez un profil pour mémoriser : il restera sur cet appareil et pourra rejoindre la famille.',
            )}
            actionLabel={t('profile.createProfile', 'Créer un profil')}
            onAction={() => navigate('/profile/create')}
          />
        ) : (
          <SectionCard title={t('familyPlus.myProfiles', 'Profils de cet appareil')}>
            <ul className="flex flex-col gap-2">
              {profiles.map((profile) => {
                const active = profile.id === activeProfileId;
                return (
                  <li key={profile.id}>
                    <button
                      type="button"
                      onClick={() => handleSelect(profile.id)}
                      aria-current={active ? 'true' : undefined}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition-colors',
                        active
                          ? 'border-primary bg-surface-tint'
                          : 'border-border hover:bg-surface-tint',
                      )}
                    >
                      <MemberAvatar name={profile.displayName} size={44} muted={!active} />
                      <span className="min-w-0 flex-1">
                        <span className="card-title block truncate">{profile.displayName}</span>
                        <span className="block truncate text-xs text-text-muted">
                          {profile.slogan?.trim() || t('familyPlus.noAlias', 'Pas d’alias pour l’instant')}
                        </span>
                      </span>
                      {active ? (
                        <span className="flex shrink-0 items-center gap-1 text-xs font-bold text-primary">
                          <DuoIcon icon={Check} size={20} />
                          {t('profile.active', 'Actif')}
                        </span>
                      ) : (
                        <DuoIcon icon={ArrowRight} size={20} className="shrink-0 text-text-muted" />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </SectionCard>
        )}

        {others.length > 0 && (
          <SectionCard title={t('familyPlus.otherMembers', 'Autres membres de la famille')}>
            <ul className="flex flex-col gap-2">
              {others.map((member) => (
                <li key={member.accountId}>
                  <button
                    type="button"
                    onClick={() => navigate(`/family/member/${encodeURIComponent(member.accountId)}`)}
                    className="flex w-full items-center gap-3 rounded-2xl border border-border p-3 text-left transition-colors hover:bg-surface-tint"
                  >
                    <MemberAvatar name={member.name} size={44} muted />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-text-primary">
                        {member.name}
                      </span>
                      <span className="block truncate text-xs text-text-muted">
                        {lastByActor.get(member.name)
                          ? t('familyPlus.reviewedAgo', 'A révisé · {{when}}', {
                              when: t('familyPlus.justNow', 'à l’instant'),
                            })
                          : t('familyPlus.notYetReviewed', 'Pas encore révisé')}
                      </span>
                    </span>
                    <span className="flex shrink-0 items-center gap-1 text-2xs font-semibold uppercase tracking-wide text-text-muted">
                      <DuoIcon icon={User} size={16} />
                      {t('familyPlus.readOnly', 'Lecture')}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </SectionCard>
        )}

        {loading && (
          <FamilySelectProfileSkeleton label={t('common.loading', 'Chargement…')} />
        )}

        <HintNote>
          {t(
            'familyPlus.selectorHint',
            'Un profil ne se bascule que s’il existe sur cet appareil : la mémorisation de chacun reste locale. Les autres membres s’ouvrent en lecture seule.',
          )}
        </HintNote>

        <Button variant="outline" className="w-full" onClick={() => setShowCreate((s) => !s)}>
          <DuoIcon icon={Plus} size={20} />
          {t('profile.create', 'Creer un profil')}
        </Button>

        {showCreate && (
          <div className="g2 space-y-3 p-4">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder={t('profile.namePlaceholder', 'Ex: Sarah, David...')}
              maxLength={30}
            />
            {error && <p className="text-sm text-error">{error}</p>}
            <div className="flex gap-2">
              <Button
                variant="ghost"
                className="flex-1"
                onClick={() => {
                  setShowCreate(false);
                  setNewName('');
                  setError(null);
                }}
              >
                {t('common.cancel', 'Annuler')}
              </Button>
              <Button variant="default" className="flex-1" onClick={() => fireAndForget(handleCreate(), 'profile:select-create')}>
                {t('common.continue', 'Creer')}
              </Button>
            </div>
          </div>
        )}
      </div>
    </FullScreenPage>
  );
}
