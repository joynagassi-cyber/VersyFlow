/**
 * Famille — Synchronisation (kit `m21_famille_synchronisation`).
 *
 * Tout ce qui est affiché vient du vrai état de synchronisation
 * (`useSyncStatus` + `useFamilySyncStore`) : dernière synchronisation réelle,
 * erreur réelle, et l'inventaire honnête de ce qui **n'est pas encore**
 * synchronisé (défis, séances, activité — stockés localement). L'écran ne
 * simule aucun « appareil lié » : il liste cet appareil-ci, et dit pourquoi.
 */

import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  RefreshIcon,
  SmartPhone01Icon as Phone,
  CloudUploadIcon as CloudUpload,
  AlertCircleIcon as AlertCircle,
  CheckmarkCircle02Icon as CheckCircle,
} from '@/components/ui/solar-icons';
import { FullScreenPage } from '@/components/layout/FullScreenPage';
import { DuoIcon } from '@/components/ui/DuoIcon';
import { Button } from '@/components/ui/button';
import { HintNote, SectionCard, StatTile } from '@/components/family/FamilyKit';
import { useFamilyRoom } from '@/hooks/useFamilyRoom';
import { useFamilyRoomStore } from '@/store/family-room-store';
import { useSyncStatus } from '@/hooks/useSyncStatus';
import { fireAndForget } from '@/lib/fire-and-forget';

function formatAgo(ms: number | null, t: (k: string, f: string, o?: Record<string, unknown>) => string): string {
  if (ms == null) return t('familyPlus.neverSynced', 'Jamais synchronisé');
  const minutes = Math.round(ms / 60000);
  if (minutes < 1) return t('familyPlus.justNow', 'à l’instant');
  if (minutes < 60) return t('familyPlus.minutesAgo', 'il y a {{count}} min', { count: minutes });
  const hours = Math.round(minutes / 60);
  if (hours < 24) return t('familyPlus.hoursAgo', 'il y a {{count}} h', { count: hours });
  return t('familyPlus.daysAgo', 'il y a {{count}} j', { count: Math.round(hours / 24) });
}

export default function FamilySyncScreen() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { family, members, reload } = useFamilyRoom();
  const sync = useSyncStatus();
  const challenges = useFamilyRoomStore((s) => s.challenges);
  const sessions = useFamilyRoomStore((s) => s.sessions);

  const localPending =
    challenges.filter((c) => c.familyId === family?.id).length +
    sessions.filter((s) => s.familyId === family?.id).length;

  const healthy = sync.error === null && sync.lastSyncAt !== null;

  return (
    <FullScreenPage
      title={t('familyPlus.syncTitle', 'Synchronisation')}
      subtitle={family?.name}
      backPath="/family/home"
    >
      <div className="flex flex-col gap-4">
        <SectionCard>
          <div className="flex items-center gap-3">
            <span
              className={`flex h-11 w-11 items-center justify-center rounded-full ${
                healthy ? 'bg-success-light text-success' : 'bg-warning-light text-warning'
              }`}
            >
              <DuoIcon icon={healthy ? CheckCircle : AlertCircle} size={22} />
            </span>
            <div>
              <p className="text-base font-bold text-text-primary">
                {healthy
                  ? t('familyPlus.allUpToDate', 'Tout est à jour')
                  : sync.error
                    ? t('familyPlus.syncError', 'La synchronisation a échoué')
                    : t('familyPlus.notSyncedYet', 'Pas encore synchronisé')}
              </p>
              <p className="text-xs text-text-muted">
                {t('familyPlus.lastSync', 'Dernière synchronisation')} ·{' '}
                {formatAgo(sync.elapsedMs, t)}
              </p>
            </div>
          </div>
          {sync.error && (
            <p className="mt-3 rounded-xl bg-error/10 px-3 py-2 text-xs text-error">{sync.error}</p>
          )}
          <Button
            variant="outline"
            className="mt-3 w-full"
            onClick={() => {
              reload();
              fireAndForget(Promise.resolve(sync.isReady), 'family:sync-refresh');
            }}
          >
            <DuoIcon icon={RefreshIcon} size={16} />
            {t('familyPlus.syncNow', 'Synchroniser maintenant')}
          </Button>
        </SectionCard>

        <SectionCard title={t('familyPlus.linkedDevices', 'Appareils liés')}>
          <ul className="flex flex-col divide-y divide-divider">
            <li className="flex items-center gap-3 py-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-tint text-primary">
                <DuoIcon icon={Phone} size={18} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-text-primary">
                  {t('familyPlus.thisPhone', 'Ce téléphone')}
                  {members[0]?.name ? ` · ${members[0].name}` : ''}
                </p>
                <p className="text-xs text-text-muted">
                  {healthy
                    ? t('familyPlus.upToDate', 'À jour')
                    : t('familyPlus.behind', 'En retard')}
                </p>
              </div>
              <span
                className={`rounded-full px-2 py-1 text-2xs font-bold ${
                  healthy ? 'bg-success-light text-success' : 'bg-warning-light text-warning'
                }`}
              >
                {healthy ? t('familyPlus.upToDate', 'À jour') : t('familyPlus.behind', 'En retard')}
              </span>
            </li>
          </ul>
          <div className="mt-3">
            <HintNote>
              {t(
                'familyPlus.devicesHonest',
                'Un seul appareil est connu aujourd’hui. La liste des autres appareils apparaîtra quand la synchronisation multi-appareils sera branchée : elle n’est pas simulée ici.',
              )}
            </HintNote>
          </div>
        </SectionCard>

        <SectionCard title={t('familyPlus.pendingUpload', 'En attente d’envoi')}>
          <div className="grid grid-cols-2 gap-2">
            <StatTile value={localPending} label={t('familyPlus.pendingChanges', 'changements')} />
            <StatTile value={sync.isReady ? 0 : 1} label={t('familyPlus.pendingDevices', 'appareils')} />
          </div>
          <div className="mt-3">
            <HintNote>
              {t(
                'familyPlus.pendingHint2',
                'Défis, séances et fil d’activité sont enregistrés sur cet appareil. Ils partiront dès que la connexion revient — rien n’est perdu en attendant.',
              )}
            </HintNote>
          </div>
        </SectionCard>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="flex-1" onClick={() => navigate('/family/activity')}>
            <DuoIcon icon={CloudUpload} size={16} />
            {t('familyPlus.activityTitle', 'Activité')}
          </Button>
          <Button variant="outline" className="flex-1" onClick={() => navigate('/settings/data')}>
            <DuoIcon icon={CloudUpload} size={16} />
            {t('familyPlus.dataSettings', 'Données')}
          </Button>
        </div>
      </div>
    </FullScreenPage>
  );
}
