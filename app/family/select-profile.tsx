/**
 * Famille — Sélecteur de profil (kit `m5_famille_s_lecteur_de_profil`).
 *
 * La maquette demande « Qui mémorise ? » : une liste de profils avec un statut
 * par personne (actif / a révisé / pas encore).
 *
 * **Ce que l'écran peut réellement faire.** Les profils d'apprentissage sont
 * liés au compte connecté : on ne peut donc *basculer* que sur les profils
 * présents **sur cet appareil**. Les autres membres de la famille sont listés
 * juste après, en lecture seule — leur nom vient de la famille, pas d'un profil
 * local — et leur ligne ouvre leur fiche.
 *
 * Le statut « a révisé » n'est pas inventé : il vient de la dernière entrée du
 * fil d'activité local de la famille (`actor` = nom affiché du membre). Un
 * membre sans entrée affiche « pas encore », pas une date fabriquée.
 */

import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  CheckmarkCircle02Icon as CheckCircle,
  ArrowRight01Icon as ArrowRight,
  UserPlusIcon as UserPlus,
  UserIcon as User,
} from '@/components/ui/solar-icons';
import { FullScreenPage } from '@/components/layout/FullScreenPage';
import { DuoIcon } from '@/components/ui/DuoIcon';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/EmptyState';
import { HintNote, MemberAvatar, SectionCard } from '@/components/family/FamilyKit';
import { useActiveProfile } from '@/hooks/useActiveProfile';
import { useFamilyRoom } from '@/hooks/useFamilyRoom';
import { useFamilyRoomStore } from '@/store/family-room-store';

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export default function FamilySelectProfileScreen() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { profiles, activeProfileId, selectProfile } = useActiveProfile();
  const { family, familyId, members, loading } = useFamilyRoom();
  const activities = useFamilyRoomStore((s) => s.activities);

  /** Dernière activité locale par acteur (nom affiché). */
  const lastByActor = useMemo(() => {
    const map = new Map<string, number>();
    for (const entry of activities) {
      if (entry.familyId !== familyId) continue;
      const known = map.get(entry.actor) ?? 0;
      if (entry.at > known) map.set(entry.actor, entry.at);
    }
    return map;
  }, [activities, familyId]);

  const localNames = useMemo(
    () => new Set(profiles.map((p) => p.displayName.trim().toLowerCase())),
    [profiles],
  );

  const others = useMemo(
    () => members.filter((m) => !localNames.has(m.name.trim().toLowerCase())),
    [members, localNames],
  );

  const relative = (at: number | undefined) => {
    if (!at) return null;
    const delta = Date.now() - at;
    if (delta < MINUTE) return t('familyPlus.justNow', 'à l’instant');
    if (delta < HOUR) return t('familyPlus.minutesAgo', 'il y a {{count}} min', { count: Math.round(delta / MINUTE) });
    if (delta < DAY) return t('familyPlus.hoursAgo', 'il y a {{count}} h', { count: Math.round(delta / HOUR) });
    return t('familyPlus.daysAgo', 'il y a {{count}} j', { count: Math.round(delta / DAY) });
  };

  const choose = (id: string) => {
    if (id !== activeProfileId) selectProfile(id);
    navigate('/family/home');
  };

  return (
    <FullScreenPage
      title={t('familyPlus.whoMemorizes', 'Qui mémorise ?')}
      subtitle={
        family
          ? t('familyPlus.membersCount', '{{count}} membres', { count: members.length })
          : undefined
      }
      backPath="/family/home"
    >
      <div className="flex flex-col gap-4">
        {profiles.length === 0 ? (
          <EmptyState
            title={t('familyPlus.noLocalProfile', 'Aucun profil sur cet appareil')}
            description={t(
              'familyPlus.noLocalProfileDesc',
              'Créez un profil pour mémoriser : il restera sur cet appareil et pourra rejoindre la famille.',
            )}
            actionLabel={t('familyPlus.createProfile', 'Créer un profil')}
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
                      onClick={() => choose(profile.id)}
                      aria-current={active ? 'true' : undefined}
                      className={
                        active
                          ? 'flex w-full items-center gap-3 rounded-2xl border border-primary bg-surface-tint p-3 text-left'
                          : 'flex w-full items-center gap-3 rounded-2xl border border-border p-3 text-left transition-colors hover:bg-surface-tint'
                      }
                    >
                      <MemberAvatar name={profile.displayName} size={44} muted={!active} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-bold text-text-primary">
                          {profile.displayName}
                        </span>
                        <span className="block truncate text-xs text-text-muted">
                          {profile.slogan?.trim() ||
                            t('familyPlus.noAlias', 'Pas d’alias pour l’instant')}
                        </span>
                      </span>
                      {active ? (
                        <span className="flex shrink-0 items-center gap-1 text-xs font-bold text-primary">
                          <DuoIcon icon={CheckCircle} size={18} />
                          {t('familyPlus.activeProfile', 'Actif')}
                        </span>
                      ) : (
                        <DuoIcon icon={ArrowRight} size={18} className="shrink-0 text-text-muted" />
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
              {others.map((member) => {
                const at = lastByActor.get(member.name);
                const since = relative(at);
                return (
                  <li key={member.accountId}>
                    <button
                      type="button"
                      onClick={() =>
                        navigate(`/family/member/${encodeURIComponent(member.accountId)}`)
                      }
                      className="flex w-full items-center gap-3 rounded-2xl border border-border p-3 text-left transition-colors hover:bg-surface-tint"
                    >
                      <MemberAvatar name={member.name} size={44} muted />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-text-primary">
                          {member.name}
                        </span>
                        <span className="block truncate text-xs text-text-muted">
                          {since
                            ? t('familyPlus.reviewedAgo', 'A révisé · {{when}}', { when: since })
                            : t('familyPlus.notYetReviewed', 'Pas encore révisé')}
                        </span>
                      </span>
                      <span className="flex shrink-0 items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-text-muted">
                        <DuoIcon icon={User} size={14} />
                        {t('familyPlus.readOnly', 'Lecture')}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </SectionCard>
        )}

        {loading && (
          <p className="px-1 text-sm text-text-muted">{t('common.loading', 'Chargement...')}</p>
        )}

        <HintNote>
          {t(
            'familyPlus.selectorHint',
            'Un profil ne se bascule que s’il existe sur cet appareil : la mémorisation de chacun reste locale. Les autres membres s’ouvrent en lecture seule.',
          )}
        </HintNote>

        <div className="flex flex-wrap gap-2">
          <Button className="flex-1" onClick={() => navigate('/family/invite')}>
            <DuoIcon icon={UserPlus} size={16} />
            {t('familyPlus.addMember', 'Ajouter un membre')}
          </Button>
          <Button variant="outline" className="flex-1" onClick={() => navigate('/profile/create')}>
            {t('familyPlus.createProfile', 'Créer un profil')}
          </Button>
        </div>
      </div>
    </FullScreenPage>
  );
}
