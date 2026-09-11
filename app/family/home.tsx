/**
 * Family Home Screen — family dashboard
 * Tailwind + i18n + Lucide + FullScreenPage.
 */

import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Plus, LogIn, ChevronRight, ChevronLeft, Users, Check } from 'lucide-react';
import FullScreenPage from '@/components/layout/FullScreenPage';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useFamilyStore } from '@/store/family-store';

export default function FamilyHomeScreen() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { families, activeFamilyId, setActiveFamily } = useFamilyStore();

  const activeFamily = families.find((f) => f.id === activeFamilyId) || null;

  const selectFamily = (familyId: string) => {
    setActiveFamily(familyId);
    navigate('/family/members');
  };

  const daysAgo = (createdAt: number) =>
    Math.max(0, Math.floor((Date.now() - createdAt) / 86400000));

  return (
    <FullScreenPage
      title={t('family.contextFamily', 'Ma Famille')}
      backPath="/tabs/home"
      right={
        <button
          onClick={() => navigate('/family/invite')}
          className="rounded-full bg-surface-tint p-2"
          aria-label={t('family.invite', 'Inviter')}
        >
          <Plus size={18} className="text-primary" />
        </button>
      }
    >
      {/* Active family */}
      {activeFamily ? (
        <button
          onClick={() => selectFamily(activeFamily.id)}
          className="flex w-full items-center gap-4 rounded-2xl border bg-surface p-5 shadow-sm"
          style={{ borderColor: `${activeFamily.color}40` }}
        >
          <span
            className="flex h-14 w-14 items-center justify-center rounded-full text-2xl"
            style={{ backgroundColor: `${activeFamily.color}20` }}
          >
            {activeFamily.icon}
          </span>
          <span className="flex-1 text-left">
            <p className="text-lg font-bold text-text-primary">{activeFamily.name}</p>
            <p className="mt-1 text-sm text-text-muted">
              {t('family.members', 'Membres')} • {t('family.contextFamilyDesc', 'Progression partagée')}
            </p>
          </span>
          <ChevronRight size={20} className="text-text-muted" />
        </button>
      ) : (
        <div className="flex flex-col items-center rounded-2xl bg-surface p-8 text-center shadow-sm">
          <span className="text-5xl">👨‍👩‍👧‍👦</span>
          <p className="mt-4 text-lg font-bold text-text-primary">
            {t('family.noFamily', 'Aucune famille active')}
          </p>
          <p className="mt-1 text-sm text-text-muted">
            {t('family.createFamily', 'Créez une famille')}{' '}
            {t('family.shareDesc', 'pour partager votre progression')}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="mt-5 flex flex-col gap-3">
        <Button className="w-full" onClick={() => navigate('/family/invite')}>
          <Plus size={16} />
          {t('family.createFamily', 'Créer une famille')}
        </Button>
        <Button variant="outline" className="w-full" onClick={() => navigate('/family/join')}>
          <LogIn size={16} />
          {t('family.joinButton', 'Rejoindre la famille')}
        </Button>
      </div>

      {/* Recent families */}
      {families.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-2 px-1 text-base font-bold text-text-primary">
            {t('family.members', 'Familles récentes')}
          </h2>
          <div className="flex flex-col gap-2">
            {families.map((family) => (
              <button
                key={family.id}
                onClick={() => selectFamily(family.id)}
                className={cn(
                  'flex items-center gap-3 rounded-xl bg-surface p-4 text-left shadow-sm',
                  activeFamilyId === family.id && 'ring-1 ring-primary',
                )}
              >
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-xl"
                  style={{ backgroundColor: `${family.color}20` }}
                >
                  {family.icon}
                </span>
                <span className="flex-1">
                  <p className="text-base font-semibold text-text-primary">{family.name}</p>
                  <p className="text-xs text-text-muted">
                    {t('family.familyMember', 'Créée il y a')} {daysAgo(family.createdAt)} j
                  </p>
                </span>
                {activeFamilyId === family.id && (
                  <span className="flex items-center gap-1 rounded-full bg-surface-tint px-2.5 py-1 text-xs font-semibold text-primary">
                    <Check size={12} />
                    {t('family.familyActive', 'Actif')}
                  </span>
                )}
              </button>
            ))}
          </div>
        </section>
      )}
    </FullScreenPage>
  );
}
