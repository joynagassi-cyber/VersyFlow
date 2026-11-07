import { goBackSafely } from '@/lib/navigation';
// Fixed: UX — member list hydrate failure now shows a visible error + retry instead of an empty list
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { DuoIcon } from '@/components/ui/DuoIcon';
import {
  UserPlusIcon as UserPlus,
  AlertCircleIcon as AlertCircle,
  ArrowRight01Icon as ChevronRight,
} from '@/components/ui/solar-icons';
import { FullScreenPage } from '@/components/layout/FullScreenPage';
import { FamilyHubPage, MemberRow, SectionCard } from '@/components/family/FamilyKit';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingBlock } from '@/components/ui/Skeleton';
import { useFamilySyncStore } from '@/store/family-sync-store';
import { useActiveProfile } from '@/hooks/useActiveProfile';
import { useFamilyService } from '@/hooks/useFamilyService';
import { useAuthStore } from '@/store/auth-store';
import type { MemberWithProfile } from '@/services/family-service';

export default function FamilyMembersScreen() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const activeFamilyId = useFamilySyncStore((s) => s.activeFamilyId);
  const families = useFamilySyncStore((s) => s.families);
  const { activeProfile } = useActiveProfile();
  const meId = useAuthStore((s) => s.user?.userId ?? null);
  const { getMembersScoped } = useFamilyService();

  const [members, setMembers] = useState<MemberWithProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const family = families.find((f) => f.id === activeFamilyId) || null;

  const loadMembers = useCallback(
    (familyId: string) => {
      let cancelled = false;
      setIsLoading(true);
      setLoadError(null);
      getMembersScoped(familyId)
        .then((m) => {
          if (!cancelled) setMembers(m);
        })
        .catch((e) => {
          if (cancelled) return;
          setLoadError(e instanceof Error ? e.message : t('errors.unknownError', 'Une erreur inattendue est survenue'));
        })
        .finally(() => {
          if (!cancelled) setIsLoading(false);
        });
      return () => {
        cancelled = true;
      };
    },
    [getMembersScoped, t],
  );

  useEffect(() => {
    if (!family) return;
    return loadMembers(family.id);
  }, [family, activeProfile?.id, loadMembers]);

  if (!family) {
    return (
      <FullScreenPage title={t('family.members', 'Membres')} showBack>
        <div className="screen-column">
          <EmptyState
            title={t('family.noFamily', 'Aucune famille active')}
            description={t('family.noFamilyHint', 'Commencez par rejoindre ou creer une famille.')}
            actionLabel={t('common.back', 'Retour')}
            onAction={() => goBackSafely(navigate)}
          />
        </div>
      </FullScreenPage>
    );
  }

  const roleLabel = (role: string) =>
    role === 'owner'
      ? t('family.roleOwner', 'Propriétaire')
      : role === 'admin'
        ? t('family.roleAdmin', 'Administrateur')
        : t('family.roleMember', 'Membre');
  /* Le rôle est la première information utile d'une liste de membres : il
     remplace la coche « vérifié » que portait chaque ligne, y compris la
     sienne, et qui ne disait rien. */
  const roleChip = (role: string) =>
    role === 'owner' || role === 'admin' ? (
      <span className="family-member-role">{roleLabel(role)}</span>
    ) : null;

  return (
    <FamilyHubPage
      title={t('family.members', 'Membres')}
      subtitle={family.name}
      right={
        <button
          type="button"
          onClick={() => navigate('/family/invite')}
          aria-label={t('family.inviteMember', 'Inviter un membre')}
          className="touch-target rounded-full bg-surface-tint text-primary active:bg-primary/10"
        >
          <DuoIcon icon={UserPlus} size={18} />
        </button>
      }
    >
      {isLoading ? (
          <LoadingBlock label={t('common.loading', 'Chargement…')} className="py-12" />
        ) : loadError ? (
          <EmptyState
            tone="inline"
            icon={AlertCircle}
            title={t('family.loadFailed', 'Membres indisponibles')}
            description={loadError}
            actionLabel={t('common.retry', 'Réessayer')}
            onAction={() => void loadMembers(family.id)}
          />
        ) : members.length === 0 ? (
          <EmptyState
            icon={UserPlus}
            title={t('family.emptyMembers', 'Aucun membre')}
            description={t(
              'family.emptyMembersHint',
              'Invitez la première personne : la série et le classement se remplissent dès sa première révision.',
            )}
            actionLabel={t('family.inviteMember', 'Inviter un membre')}
            onAction={() => navigate('/family/invite')}
          />
        ) : (
          <SectionCard
            title={t('familyPlus.membersCount', '{{count}} membres', { count: members.length })}
          >
            <ul className="flex flex-col">
              {members.map((m) => (
                <li key={m.id}>
                  <MemberRow
                    name={m.profile?.displayName || m.accountId}
                    meta={roleLabel(m.role)}
                    highlight={meId !== null && m.accountId === meId}
                    youLabel={t('familyPlus.you', 'Vous')}
                    trailing={roleChip(m.role)}
                  />
                </li>
              ))}
            </ul>
          </SectionCard>
        )}

      <button
        type="button"
        onClick={() => navigate('/family/invite')}
        className="g2 flex w-full items-center gap-3 p-4 text-left"
      >
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary">
          <DuoIcon icon={UserPlus} size={20} />
        </span>
        <span className="flex-1">
          <span className="block text-sm font-semibold text-text-primary">
            {t('family.inviteMember', 'Inviter un membre')}
          </span>
          <span className="text-xs text-text-muted">
            {t('family.inviteHint', 'Partagez le code ou le lien')}
          </span>
        </span>
        <DuoIcon icon={ChevronRight} size={18} className="shrink-0 text-text-muted" />
      </button>
    </FamilyHubPage>
  );
}
