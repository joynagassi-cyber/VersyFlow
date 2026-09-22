import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { FullScreenPage } from '@/components/layout/FullScreenPage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useActiveProfile } from '@/hooks/useActiveProfile';
import { cn } from '@/lib/utils';

const AVATARS = ['🦁', '🦊', '🐼', '🐨', '🦄', '🐯', '🐸', '🐙'];
const NAME_SCHEMA = z.string().trim().min(2).max(30);

export default function CreateProfileScreen() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { createProfile, selectProfile } = useActiveProfile();
  const [displayName, setDisplayName] = useState('');
  const [avatar, setAvatar] = useState(AVATARS[0]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleCreate = async () => {
    const parsed = NAME_SCHEMA.safeParse(displayName);
    if (!parsed.success) {
      setError(t('profile.nameError', 'Nom requis (min 2)'));
      return;
    }
    setSubmitting(true);
    try {
      const profile = await createProfile(parsed.data, avatar);
      selectProfile(profile.id);
      navigate('/tabs');
    } catch {
      setError(t('profile.createError', 'Impossible de creer le profil'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <FullScreenPage title={t('profile.create', 'Nouveau profil')} showBack>
      <div className="mx-auto max-w-md space-y-6">
        <div>
          <label className="mb-2 block text-sm font-semibold text-text-secondary">
            {t('profile.avatar', 'Choisis un avatar')}
          </label>
          <div className="flex flex-wrap gap-3">
            {AVATARS.map((a) => (
              <button
                key={a}
                onClick={() => setAvatar(a)}
                className={cn(
                  'flex h-14 w-14 items-center justify-center rounded-full border-2 text-2xl transition',
                  avatar === a
                    ? 'border-primary bg-surface-tint'
                    : 'border-border bg-surface',
                )}
              >
                {a}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-text-secondary">
            {t('profile.displayName', 'Nom d\'affichage')}
          </label>
          <Input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder={t('profile.namePlaceholder', 'Entrez votre nom')}
            maxLength={30}
          />
          {error && <p className="mt-1 text-sm text-error">{error}</p>}
        </div>

        <Button variant="default" className="w-full" onClick={handleCreate} disabled={submitting}>
          {submitting ? t('common.loading', 'Creation...') : t('profile.createCta', 'Creer mon profil')}
        </Button>
      </div>
    </FullScreenPage>
  );
}
