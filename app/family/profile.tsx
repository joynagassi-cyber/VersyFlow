/**
 * Famille — Mon profil, étape 2 sur 2 (kit `m4_famille_profil_de_membre`).
 *
 * Le prénom et l'alias (« Gardienne du Psaume 23 ») sont écrits sur le profil
 * d'apprentissage actif — la même entité que le reste de l'app, pas une copie
 * locale. L'aperçu à droite montre exactement ce que verront les autres
 * membres : prénom + alias, rien d'autre.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FullScreenPage } from '@/components/layout/FullScreenPage';
import { Button } from '@/components/ui/button';
import { MemberAvatar, SectionCard, HintNote } from '@/components/family/FamilyKit';
import { useActiveProfile } from '@/hooks/useActiveProfile';
import { useFamilyRoom } from '@/hooks/useFamilyRoom';
import { useLearnerProfile } from '@/hooks/useLearnerProfile';
import { fireAndForget } from '@/lib/fire-and-forget';

const ALIAS_MAX = 30;

export default function FamilyProfileScreen() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { activeProfile } = useActiveProfile();
  const { updateProfile } = useLearnerProfile();
  const { family } = useFamilyRoom();

  const [firstName, setFirstName] = useState(activeProfile?.displayName ?? '');
  const [alias, setAlias] = useState(activeProfile?.slogan ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!activeProfile) return;
    setBusy(true);
    setError(null);
    try {
      await updateProfile(activeProfile.id, {
        displayName: firstName.trim() || activeProfile.displayName,
        slogan: alias.trim(),
      });
      navigate('/family/home', { replace: true });
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
      title={t('familyPlus.myProfileTitle', 'Mon profil')}
      subtitle={t('familyPlus.step2of2', 'Étape 2 sur 2')}
      backPath="/family/create"
    >
      <div className="flex flex-col gap-4">
        <SectionCard title={t('familyPlus.firstName', 'Prénom')}>
          <input
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            maxLength={40}
            aria-label={t('familyPlus.firstName', 'Prénom')}
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-base text-text-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </SectionCard>

        <SectionCard
          title={t('familyPlus.aliasLabel', 'Mon rôle (alias)')}
          action={
            <span className="text-xs tabular-nums text-text-muted">
              {alias.length} / {ALIAS_MAX}
            </span>
          }
        >
          <input
            value={alias}
            onChange={(e) => setAlias(e.target.value.slice(0, ALIAS_MAX))}
            placeholder={t('familyPlus.aliasPlaceholder', 'Gardienne du Psaume 23')}
            aria-label={t('familyPlus.aliasLabel', 'Mon rôle (alias)')}
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-base text-text-primary placeholder:text-text-placeholder focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <div className="mt-2">
            <HintNote>
              {t('familyPlus.aliasHint', 'Écris le rôle que tu veux : il apparaît sous ton prénom.')}
            </HintNote>
          </div>
        </SectionCard>

        <SectionCard title={t('familyPlus.preview', 'Aperçu')}>
          <div className="flex items-center gap-3">
            <MemberAvatar name={firstName || 'L'} size={44} />
            <div>
              <h2 className="card-title">
                {firstName.trim() || t('familyPlus.firstName', 'Prénom')}
              </h2>
              <p className="text-sm italic text-text-muted">
                {alias.trim() || t('familyPlus.aliasPlaceholder', 'Gardienne du Psaume 23')}
              </p>
            </div>
          </div>
        </SectionCard>

        {!family && (
          <HintNote>
            {t(
              'familyPlus.noFamilyYet',
              'Aucune famille active : votre profil existe déjà, il sera rattaché à la prochaine famille créée ou rejointe.',
            )}
          </HintNote>
        )}

        {error && (
          <p className="rounded-xl bg-error/10 px-3 py-2 text-sm text-error">{error}</p>
        )}

        <Button
          className="w-full"
          disabled={busy || !activeProfile || !firstName.trim()}
          onClick={() => fireAndForget(submit(), 'family:save-profile')}
        >
          {t('familyPlus.saveProfile', 'Enregistrer')}
        </Button>
      </div>
    </FullScreenPage>
  );
}
