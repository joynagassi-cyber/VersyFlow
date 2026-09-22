import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Plus, Check } from 'lucide-react';
import { z } from 'zod';
import { FullScreenPage } from '@/components/layout/FullScreenPage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useActiveProfile } from '@/hooks/useActiveProfile';
import { cn } from '@/lib/utils';

const NAME_SCHEMA = z.string().trim().min(2).max(30);

export default function ProfileSelectionScreen() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { profiles, activeProfile, selectProfile, createProfile } = useActiveProfile();
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSelect = (id: string) => {
    selectProfile(id);
    navigate('/tabs');
  };

  const handleCreate = async () => {
    const parsed = NAME_SCHEMA.safeParse(newName);
    if (!parsed.success) {
      setError(t('profile.nameError', 'Nom trop court (min 2)'));
      return;
    }
    await createProfile(parsed.data);
    navigate('/tabs');
  };

  return (
    <FullScreenPage title={t('profile.select', 'Profil')} showBack>
      <div className="mx-auto max-w-md space-y-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-text-primary">
            {t('profile.who', "Qui apprend aujourd'hui ?")}
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            {t('profile.selectHint', 'Choisis ton profil pour continuer')}
          </p>
        </div>

        <div className="space-y-3">
          {profiles.map((profile) => {
            const active = activeProfile?.id === profile.id;
            return (
              <button
                key={profile.id}
                onClick={() => handleSelect(profile.id)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-2xl bg-surface p-4 text-left shadow-sm transition active:scale-[0.99]',
                  active && 'ring-2 ring-primary',
                )}
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-full gradient-hero text-xl font-bold text-white">
                  {(profile.displayName || '?').charAt(0).toUpperCase()}
                </span>
                <span className="flex-1">
                  <span className="block text-base font-semibold text-text-primary">
                    {profile.displayName}
                  </span>
                  {active && (
                    <span className="text-xs font-medium text-primary">
                      {t('profile.active', 'Actif')}
                    </span>
                  )}
                </span>
                {active && <Check size={20} className="text-primary" />}
              </button>
            );
          })}
        </div>

        <Button variant="outline" className="w-full" onClick={() => setShowCreate((s) => !s)}>
          <Plus size={18} />
          {t('profile.create', 'Creer un profil')}
        </Button>

        {showCreate && (
          <div className="space-y-3 rounded-2xl bg-surface p-4 shadow-sm">
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
              <Button variant="default" className="flex-1" onClick={handleCreate}>
                {t('common.continue', 'Creer')}
              </Button>
            </div>
          </div>
        )}
      </div>
    </FullScreenPage>
  );
}
