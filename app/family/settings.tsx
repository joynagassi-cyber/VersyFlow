/**
 * Famille — Réglages de la famille (kit `m14_famille_r_glages_famille`).
 *
 * Le nom et la couleur modifient l'entité `Family` existante (service du
 * domaine), les préférences de classement vivent dans le store de famille.
 * La zone sensible dit exactement ce que fait « Quitter » : on quitte la
 * famille, on ne supprime pas les autres membres.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  UserMultiple02Icon as Users,
  RankingIcon as Ranking,
  Logout01Icon as Logout,
} from '@/components/ui/solar-icons';
import { FullScreenPage } from '@/components/layout/FullScreenPage';
import { DuoIcon } from '@/components/ui/DuoIcon';
import { Button } from '@/components/ui/button';
import {
  FamilySubnav,
  HintNote,
  InfoRow,
  SectionCard,
  Segmented,
} from '@/components/family/FamilyKit';
import { Switch } from '@/components/ui/Switch';
import { useFamilyRoom } from '@/hooks/useFamilyRoom';
import { useFamilyRoomStore, type ResetDay } from '@/store/family-room-store';
import { FAMILY_SWATCHES, familyTint } from '@/theme/family-palette';
import { useFamilyService } from '@/hooks/useFamilyService';
import { useFamilySyncStore } from '@/store/family-sync-store';
import { fireAndForget } from '@/lib/fire-and-forget';
import { cn } from '@/lib/utils';

export default function FamilySettingsScreen() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { family, members, signedOut } = useFamilyRoom();
  const settings = useFamilyRoomStore((s) =>
    family ? s.settingsFor(family.id) : undefined,
  );
  const updateSettings = useFamilyRoomStore((s) => s.updateSettings);
  const clearFamily = useFamilyRoomStore((s) => s.clearFamily);
  const removeFamily = useFamilySyncStore((s) => s.removeFamily);
  const { leaveFamily } = useFamilyService();

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!family) {
    return (
      <FullScreenPage title={t('familyPlus.familySettingsTitle', 'Réglages Famille')} backPath="/family/home">
        <HintNote>
          {t('familyPlus.noFamilySelected', 'Aucune famille active : choisissez ou créez une famille.')}
        </HintNote>
      </FullScreenPage>
    );
  }

  const current = settings ?? {
    resetDay: 'monday' as ResetDay,
    showScores: true,
    showAliases: true,
    wifiOnlySync: false,
  };

  const leave = async () => {
    setBusy(true);
    setError(null);
    try {
      await leaveFamily(family.id);
      clearFamily(family.id);
      removeFamily(family.id);
      navigate('/family/presentation', { replace: true });
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
      title={t('familyPlus.familySettingsTitle', 'Réglages Famille')}
      subtitle={family.name}
      backPath="/family/home"
    >
      <div className="flex flex-col gap-4">
        <FamilySubnav />

        <SectionCard title={t('familyPlus.familySection', 'Famille')}>
          <InfoRow
            label={t('familyPlus.familyNameLabel', 'Nom')}
            value={family.name}
            icon={Users}
          />
          <div className="mt-2 flex items-center gap-2">
            {FAMILY_SWATCHES.map((swatch) => (
              <span
                key={swatch.id}
                aria-hidden="true"
                className={cn(
                  'h-6 w-6 rounded-full border-2',
                  swatch.value === family.color ? 'border-text-primary' : 'border-transparent',
                )}
                style={{ backgroundColor: swatch.value }}
              />
            ))}
            <span
              className="ml-auto rounded-full px-2 py-1 text-2xs font-semibold text-text-primary"
              style={{ backgroundColor: familyTint(family.color) }}
            >
              {t('familyPlus.currentColor', 'Couleur actuelle')}
            </span>
          </div>
          <div className="mt-2">
            <InfoRow
              label={t('familyPlus.manageMembers', 'Gérer les membres')}
              value={members.length}
              onClick={() => navigate('/family/members')}
            />
          </div>
        </SectionCard>

        <SectionCard title={t('familyPlus.leaderboardTitle', 'Classement')}>
          <p className="mb-2 text-sm text-text-primary">{t('familyPlus.resetLabel', 'Remise à zéro')}</p>
          <Segmented<ResetDay>
            label={t('familyPlus.resetLabel', 'Remise à zéro')}
            value={current.resetDay}
            onChange={(resetDay) => updateSettings(family.id, { resetDay })}
            options={[
              { value: 'monday', label: t('familyPlus.resetMonday', 'Chaque lundi') },
              { value: 'sunday', label: t('familyPlus.resetSunday', 'Chaque dimanche') },
              { value: 'first-of-month', label: t('familyPlus.resetFirst', 'Le 1er du mois') },
            ]}
          />

          <div className="mt-3">
            <InfoRow
              label={t('familyPlus.showScores', 'Afficher les scores détaillés')}
              icon={Ranking}
              trailing={
                <Switch
                  checked={current.showScores}
                  label={t('familyPlus.showScores', 'Afficher les scores détaillés')}
                  onCheckedChange={(v) => updateSettings(family.id, { showScores: v })}
                />
              }
            />
            <HintNote>
              {t('familyPlus.showScoresHint', 'Sinon, seul le rang est visible (pas les points).')}
            </HintNote>
          </div>

          <div className="mt-3">
            <InfoRow
              label={t('familyPlus.showAliases', 'Afficher les alias')}
              trailing={
                <Switch
                  checked={current.showAliases}
                  label={t('familyPlus.showAliases', 'Afficher les alias')}
                  onCheckedChange={(v) => updateSettings(family.id, { showAliases: v })}
                />
              }
            />
          </div>
        </SectionCard>

        <SectionCard title={t('familyPlus.dangerZone', 'Zone sensible')}>
          <p className="text-sm text-text-muted">
            {t(
              'familyPlus.leaveFamilyHint',
              'Quitter la famille retire votre appartenance sur cet appareil. Les autres membres et leurs données ne sont pas supprimés.',
            )}
          </p>
          {error && <p className="mt-2 rounded-xl bg-error/10 px-3 py-2 text-sm text-error">{error}</p>}
          <Button
            variant="destructive"
            className="mt-3 w-full"
            disabled={busy || signedOut}
            onClick={() => fireAndForget(leave(), 'family:leave')}
          >
            <DuoIcon icon={Logout} size={16} />
            {t('familyPlus.leaveFamily', 'Quitter la famille')}
          </Button>
        </SectionCard>
      </div>
    </FullScreenPage>
  );
}
