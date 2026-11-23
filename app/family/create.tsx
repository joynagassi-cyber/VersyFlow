/**
 * Famille — Création, étape 1 sur 2 (kit `m3_famille_cr_ation`).
 *
 * Le nom et la couleur sont enregistrés dès cette étape (la famille existe),
 * l'étape 2 (`/family/profile`) ajoute le profil de celui qui crée. C'est
 * l'ordre du kit : on ne demande pas un prénom avant d'avoir une famille à
 * laquelle l'attacher.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  AlertCircleIcon as AlertCircle,
  Tick02Icon as Tick,
} from '@/components/ui/solar-icons';
import { FullScreenPage } from '@/components/layout/FullScreenPage';
import { DuoIcon } from '@/components/ui/DuoIcon';
import { Button } from '@/components/ui/button';
import { SectionCard } from '@/components/family/FamilyKit';
import { FAMILY_SWATCHES, DEFAULT_FAMILY_COLOR, familyTint } from '@/theme/family-palette';
import { useFamilyService } from '@/hooks/useFamilyService';
import { useFamilySyncStore } from '@/store/family-sync-store';
import { useAuthStore } from '@/store/auth-store';
import { fireAndForget } from '@/lib/fire-and-forget';
import { cn } from '@/lib/utils';
import { FAMILY_ICONS, DEFAULT_FAMILY_ICON, resolveFamilyIcon } from '@/lib/family-icon';

export default function FamilyCreateScreen() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { createFamily } = useFamilyService();
  const addFamily = useFamilySyncStore((s) => s.addFamily);
  const setActiveFamily = useFamilySyncStore((s) => s.setActiveFamily);
  const signedIn = Boolean(useAuthStore((s) => s.user?.userId));

  const [name, setName] = useState('');
  const [color, setColor] = useState(DEFAULT_FAMILY_COLOR);
  const [icon, setIcon] = useState(DEFAULT_FAMILY_ICON);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError(t('familyPlus.nameRequired', 'Donnez un nom à votre famille pour continuer.'));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const family = await createFamily(trimmed, color, icon);
      addFamily(family);
      setActiveFamily(family.id);
      navigate('/family/profile', { replace: true });
    } catch (e) {
      setError(
        e instanceof Error ? e.message : t('errors.unknownError', 'Une erreur inattendue est survenue'),
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <FullScreenPage
      title={t('familyPlus.createTitle', 'Créer ma famille')}
      subtitle={t('familyPlus.step1of2', 'Étape 1 sur 2')}
      backPath="/family/presentation"
    >
      <div className="space-y-4">
        <SectionCard title={t('familyPlus.nameLabel', 'Nom de la famille')}>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={40}
            placeholder={t('familyPlus.namePlaceholder', 'Famille Étoile')}
            aria-label={t('familyPlus.nameLabel', 'Nom de la famille')}
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-base text-text-primary placeholder:text-text-placeholder focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </SectionCard>

        <SectionCard title={t('familyPlus.colorLabel', 'Couleur')}>
          <div className="flex flex-wrap gap-2">
            {FAMILY_SWATCHES.map((swatch) => {
              const active = swatch.value === color;
              return (
                <button
                  key={swatch.id}
                  type="button"
                  onClick={() => setColor(swatch.value)}
                  aria-pressed={active}
                  aria-label={t(swatch.labelKey, swatch.label)}
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-full border-2 transition',
                    active ? 'border-text-primary' : 'border-transparent',
                  )}
                  style={{ backgroundColor: swatch.value }}
                >
                  {active && <DuoIcon icon={Tick} size={20} className="text-on-primary" />}
                </button>
              );
            })}
          </div>
        </SectionCard>

        <SectionCard title={t('familyPlus.iconLabel', 'Icône')}>
          <div className="flex flex-wrap gap-2" role="group" aria-label={t('familyPlus.iconLabel', 'Icône')}>
            {FAMILY_ICONS.map((entry) => {
              const active = entry.name === icon;
              return (
                <button
                  key={entry.name}
                  type="button"
                  onClick={() => setIcon(entry.name)}
                  aria-pressed={active}
                  aria-label={t(entry.labelKey, entry.label)}
                  title={t(entry.labelKey, entry.label)}
                  className={cn(
                    'flex h-11 w-11 items-center justify-center rounded-2xl border-2 transition',
                    active
                      ? 'border-primary bg-surface-tint text-primary'
                      : 'border-transparent bg-surface text-text-muted',
                  )}
                >
                  <DuoIcon icon={entry.icon} size={20} />
                </button>
              );
            })}
          </div>
        </SectionCard>

        <SectionCard title={t('familyPlus.preview', 'Aperçu')}>
          <div className="flex items-center gap-3">
            <span
              className="flex h-12 w-12 items-center justify-center rounded-full text-primary"
              style={{ backgroundColor: familyTint(color, 20) }}
              aria-hidden="true"
            >
              <DuoIcon icon={resolveFamilyIcon(icon)} size={24} />
            </span>
            <div>
              <h2 className="card-title">
                {name.trim() || t('familyPlus.namePlaceholder', 'Famille Étoile')}
              </h2>
              <p className="text-xs text-text-muted">
                {t('familyPlus.previewHint', 'Voici comment votre famille apparaîtra.')}
              </p>
            </div>
          </div>
        </SectionCard>

        {!signedIn && (
          <p className="rounded-xl bg-surface-tint px-3 py-2 text-xs text-text-muted">
            {t('family.signedInRequired', 'Connectez-vous pour créer ou rejoindre une famille')}
          </p>
        )}

        {error && (
          <p className="flex items-center gap-1.5 rounded-xl bg-error/10 px-3 py-2 text-sm text-error">
            <DuoIcon icon={AlertCircle} size={16} className="shrink-0" />
            {error}
          </p>
        )}

        <Button
          className="w-full"
          disabled={busy || !signedIn || !name.trim()}
          onClick={() => fireAndForget(submit(), 'family:create')}
        >
          {t('familyPlus.continueAddProfile', 'Continuer · ajouter mon profil')}
        </Button>
      </div>
    </FullScreenPage>
  );
}
