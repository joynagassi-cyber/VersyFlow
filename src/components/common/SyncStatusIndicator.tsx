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

function formatElapsed(ms: number): string {
  if (ms < 60_000) return 'now';
  const min = Math.floor(ms / 60_000);
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  return `${h}h`;
}

interface SyncStatusIndicatorProps {
  /**
   * Un point seul, sans phrase.
   *
   * Dans un en-tête permanent, « Synchronisé maintenant » en rose est du
   * bruit : l'information ne sert qu'en cas de problème. En compact, l'état
   * reste lisible d'un coup d'œil (couleur + forme), et le texte part en
   * `aria-label` pour les lecteurs d'écran — jamais supprimé, seulement
   * déplacé.
   */
  compact?: boolean;
}

export default function SyncStatusIndicator({ compact = false }: SyncStatusIndicatorProps = {}) {
  const { colors, sp } = useAppTheme();
  const { t } = useTranslation();
  const { phase, lastSyncAt, error } = useSyncStatus();

  let label = t('sync.idle', 'Synchronisation');
  let color: string = colors.textMuted;
  if (phase === 'ready' && lastSyncAt) {
    label = `${t('sync.lastSynced', 'Synchronisé')} ${formatElapsed(Date.now() - lastSyncAt)}`;
    color = 'var(--color-primary)';
  } else if (phase === 'connecting') {
    label = t('sync.connecting', 'Connexion…');
    color = colors.info;
  } else if (phase === 'error') {
    label = t('sync.error', 'Erreur de synchro');
    color = colors.error;
  }

  if (compact) {
    return (
      <span
        data-phase={phase}
        data-testid="sync-status"
        role="status"
        aria-label={label}
        title={label}
        className="inline-flex h-10 w-10 items-center justify-center"
      >
        <span
          aria-hidden
          className="inline-block h-2 w-2 rounded-full"
          style={{ backgroundColor: color }}
        />
      </span>
    );
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
