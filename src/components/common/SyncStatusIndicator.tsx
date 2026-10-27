/**
 * SyncStatusIndicator — single, token-only surface for sync state.
 *
 * Renders the {@link useSyncStatus} phase as a compact pill. Screens embed
 * this ONE component instead of scattering `if (offline)` / manual status
 * checks. No colours or spacing are hardcoded — it uses the design-system
 * tokens via `useAppTheme`.
 */

import { useTranslation } from 'react-i18next';
import { useAppTheme } from '@/theme/useTheme';
import { useSyncStatus } from '@/hooks/useSyncStatus';
import type { SyncPhase } from '@/hooks/useSyncStatus';

function formatElapsed(ms: number): string {
  if (ms < 60_000) return 'now';
  const min = Math.floor(ms / 60_000);
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  return `${h}h`;
}

export default function SyncStatusIndicator() {
  const { colors, sp } = useAppTheme();
  const { t } = useTranslation();
  const { phase, lastSyncAt, error } = useSyncStatus();

  let label = t('sync.idle', 'Synchronisation');
  let color: string = colors.textMuted;
  if (phase === 'ready' && lastSyncAt) {
    label = `${t('sync.lastSynced', 'Synchronisé')} ${formatElapsed(Date.now() - lastSyncAt)}`;
    color = colors.success;
  } else if (phase === 'connecting') {
    label = t('sync.connecting', 'Connexion…');
    color = colors.info;
  } else if (phase === 'error') {
    label = t('sync.error', 'Erreur de synchro');
    color = colors.error;
  }

  return (
    <span
      data-phase={phase}
      data-testid="sync-status"
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
      style={{
        backgroundColor: colors.surfaceTint,
        color,
        marginLeft: sp.sm,
      }}
      title={error ?? undefined}
    >
      <span
        aria-hidden
        className="inline-block h-2 w-2 rounded-full"
        style={{ backgroundColor: color }}
      />
      {label}
    </span>
  );
}
