// Fixed: UX — member list hydrate failure now shows a visible error + retry instead of an empty list
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { UserPlus, CheckCircle2, AlertCircle } from 'lucide-react';
import { FullScreenPage } from '@/components/layout/FullScreenPage';
import { EmptyState } from '@/components/ui/EmptyState';
import { useFamilySyncStore } from '@/store/family-sync-store';
import { useActiveProfile } from '@/hooks/useActiveProfile';
import { useFamilyService } from '@/hooks/useFamilyService';
import type { MemberWithProfile } from '@/services/family-service';

export default function FamilyMembersScreen() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const activeFamilyId = useFamilySyncStore((s) => s.activeFamilyId);
  const families = useFamilySyncStore((s) => s.families);
  const { activeProfile } = useActiveProfile();
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
        <div className="mx-auto max-w-md">
          <EmptyState
            title={t('family.noFamily', 'Aucune famille active')}
            description={t('family.noFamilyHint', 'Commencez par rejoindre ou creer une famille.')}
            actionLabel={t('common.back', 'Retour')}
            onAction={() => navigate(-1)}
          />
        </div>
      </FullScreenPage>
    );
  }

  const roleLabel = (role: string) =>
    role === 'owner'
      ? t('family.roleOwner', 'Proprietaire')
      : role === 'admin'
        ? t('family.roleAdmin', 'Admin')
        : t('family.roleMember', 'Membre');

  return (
    <FullScreenPage
      title={family.name}
      showBack
      backPath="/family/home"
      right={
        <button
          onClick={() => navigate('/family/invite')}
          className="rounded-full bg-surface-tint p-2 active:bg-primary/10"
        >
          <UserPlus size={18} className="text-primary" />
        </button>
      }
    >
      <div className="mx-auto max-w-md space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wide text-text-muted">
          {t('family.members', 'Membres')}
        </h2>

        {isLoading ? (
          <p className="py-8 text-center text-sm text-text-muted">
            {t('common.loading', 'Chargement...')}
          </p>
        ) : loadError ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl bg-surface p-6 text-center shadow-sm">
            <AlertCircle size={28} className="text-error" />
            <p className="text-sm text-error">{loadError}</p>
            <button
              onClick={() => loadMembers(family.id)}
              className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white active:opacity-90"
            >
              {t('common.retry', 'Réessayer')}
            </button>
          </div>
        ) : members.length === 0 ? (
          <EmptyState title={t('family.emptyMembers', 'Aucun membre')} />
        ) : (
          <div className="space-y-2">
            {members.map((m) => (
              <div
                key={m.id}
                className="flex items-center gap-3 rounded-2xl bg-surface p-3 shadow-sm"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-surface-tint text-lg font-bold text-primary">
                  {(m.profile?.displayName || m.accountId || '?').charAt(0).toUpperCase()}
                </span>
                <div className="flex-1">
                  <p className="text-base font-semibold text-text-primary">
                    {m.profile?.displayName || m.accountId}
                  </p>
                  <p className="text-xs text-text-muted">{roleLabel(m.role)}</p>
                </div>
                <CheckCircle2 size={20} className="text-success" />
              </div>
            ))}
          </div>
        )}

        <button
          onClick={() => navigate('/family/invite')}
          className="flex w-full items-center gap-3 rounded-2xl bg-surface-tint p-4 text-left active:opacity-90"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-white">
            <UserPlus size={20} />
          </span>
          <span className="flex-1">
            <span className="block text-sm font-semibold text-text-primary">
              {t('family.inviteMember', 'Inviter un membre')}
            </span>
            <span className="text-xs text-text-muted">
              {t('family.inviteHint', 'Partagez le code ou le lien')}
            </span>
          </span>
        </button>
      </div>
    </FullScreenPage>
  );
}
