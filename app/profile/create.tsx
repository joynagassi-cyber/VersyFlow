import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { FullScreenPage } from '@/components/layout/FullScreenPage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ProfileAvatar } from '@/components/profile/ProfileAvatar';
import { useActiveProfile } from '@/hooks/useActiveProfile';
import { cn } from '@/lib/utils';

/** Max length of the optional personal slogan (matches the DB column). */
const SLOGAN_MAX_LENGTH = 60;

const NAME_SCHEMA = z.string().trim().min(2).max(30);

export default function CreateProfileScreen() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { createProfile, selectProfile } = useActiveProfile();
  const [displayName, setDisplayName] = useState('');
  const [sloganText, setSloganText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Live preview: as the user types, the fallback illustration (a themed
  // vector from the offline theme catalog) is re-derived from the name.
  const previewSeed = displayName.trim() || 'u';

  const handleCreate = async () => {
    const parsed = NAME_SCHEMA.safeParse(displayName);
    if (!parsed.success) {
      setError(t('profile.nameError', 'Nom requis (min 2)'));
      return;
    }
    setSubmitting(true);
    try {
      // Slogan is persisted on the profile entity itself (LearnerProfile.slogan)
      // and synced via PowerSync; no separate store is needed.
      const profile = await createProfile(parsed.data, undefined, sloganText.trim() || undefined);
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
      <div className="mx-auto flex max-w-md flex-col items-center gap-6">
        {/* Live preview of the profile avatar as the name is typed. */}
        <ProfileAvatar name={previewSeed} size={96} className="shadow-xl" />

        <div className="w-full">
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
          <p className="mt-2 text-xs text-text-muted">
            {t('profile.avatarHint', 'Sans photo, une illustration est choisie automatiquement à partir de votre nom.')}
          </p>
        </div>

        {/* Optional slogan — shown under the display name on the profile
            screen. Free-form (no zod name constraints apply). */}
        <div className="w-full">
          <label className="mb-2 block text-sm font-semibold text-text-secondary">
            {t('profile.slogan', 'Votre slogan')}
          </label>
          <Input
            value={sloganText}
            onChange={(e) => setSloganText(e.target.value.slice(0, SLOGAN_MAX_LENGTH))}
            placeholder={t('profile.sloganPlaceholder', 'Ex. « Mémoire vive, foi forte »')}
            maxLength={SLOGAN_MAX_LENGTH}
          />
          <p className="mt-2 text-xs text-text-muted">
            {t('profile.sloganHint', 'Optionnel — affiché sous votre nom sur votre profil (60 caractères max).')}
          </p>
        </div>

        <Button variant="default" className="w-full" onClick={handleCreate} disabled={submitting}>
          {submitting ? t('common.loading', 'Creation...') : t('profile.createCta', 'Creer mon profil')}
        </Button>
      </div>
    </FullScreenPage>
  );
}
