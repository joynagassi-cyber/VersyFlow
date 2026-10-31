import { useState, useRef } from 'react';
import type { ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { DuoIcon } from '@/components/ui/DuoIcon';
import {
  Download01Icon as Download,
  Upload01Icon as Upload,
  CloudIcon as Cloud,
  Loading03Icon as Loader2,
} from '@/components/ui/solar-icons';
import { FullScreenPage } from '@/components/layout/FullScreenPage';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/Switch';
import { useAuthStore } from '@/store/auth-store';
import { useActiveProfile } from '@/hooks/useActiveProfile';
import { getMemorizationService } from '@/services/memorization-service-factory';
import type { MemorizationRecord } from '@/domains/memorization/entities';
import { fireAndForget } from '@/lib/fire-and-forget';

export default function BackupScreen() {
  const { t } = useTranslation();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { activeProfile } = useActiveProfile();
  const [autoBackup, setAutoBackup] = useState(false);
  const [syncEnabled, setSyncEnabled] = useState(isAuthenticated);
  const [status, setStatus] = useState<{ kind: 'ok' | 'error'; message: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    setBusy(true);
    try {
      const service = getMemorizationService(activeProfile?.id ?? 'default');
      const records = await service.getAllMemorized();
      const payload = { app: 'versyflow', version: 1, exportedAt: new Date().toISOString(), records };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      a.href = url;
      a.download = 'versyflow-backup-' + stamp + '.json';
      a.click();
      URL.revokeObjectURL(url);
      setStatus({
        kind: 'ok',
        message: t('settings.backupScreen.exported', '{{count}} verset(s) exporté(s)', {
          count: records.length,
        }),
      });
    } catch (e) {
      console.error('[Backup] export failed', e);
      setStatus({
        kind: 'error',
        message: t('settings.backupScreen.exportFailed', 'Export impossible pour le moment'),
      });
    } finally {
      setBusy(false);
    }
  };

  const handleImportFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      const raw: unknown = JSON.parse(await file.text());
      const list = Array.isArray(raw)
        ? raw
        : raw && typeof raw === 'object' && Array.isArray((raw as { records?: unknown[] }).records)
          ? (raw as { records: unknown[] }).records
          : [];
      const service = getMemorizationService(activeProfile?.id ?? 'default');
      let count = 0;
      for (const item of list) {
        const rec = item as MemorizationRecord;
        if (!rec || typeof rec !== 'object' || !rec.bookId || !rec.translationId) continue;
        const { id, learnerProfileId, ...rest } = rec;
        void id;
        void learnerProfileId;
        await service.saveMemorizedRecord(rest, activeProfile?.id ?? 'default');
        count += 1;
      }
      setStatus({
        kind: 'ok',
        message: t('settings.backupScreen.imported', '{{count}} verset(s) importé(s)', { count }),
      });
    } catch {
      setStatus({
        kind: 'error',
        message: t('settings.backupScreen.invalidFile', 'Fichier illisible (JSON attendu)'),
      });
    }
  };

  return (
    <FullScreenPage
      title={t('settings.backup', 'Sauvegarde')}
      showBack
      backPath="/tabs/settings"
    >
      <div className="screen-column space-y-4">
        <div className="glass space-y-3 rounded-2xl p-4">
          <h2>
            {t('settings.backupScreen.title', 'Sauvegarde')}
          </h2>
          <div className="flex items-center justify-between">
            <span className="text-base text-text-primary">
              {t('settings.backupScreen.auto', 'Sauvegarde automatique')}
            </span>
            <Switch
              checked={autoBackup}
              onCheckedChange={setAutoBackup}
              label={t('settings.backupScreen.auto', 'Sauvegarde automatique')}
            />
          </div>
          <Button variant="default" className="w-full" onClick={() => fireAndForget(handleExport(), 'settings:export')} disabled={busy}>
            {busy ? <DuoIcon icon={Loader2} size={18} className="animate-spin" /> : <DuoIcon icon={Download} size={18} />}
            {t('settings.backupScreen.export', 'Exporter mes donnees')}
          </Button>
          <Button
            variant="secondary"
            className="w-full"
            onClick={() => fileRef.current?.click()}
          >
            <DuoIcon icon={Upload} size={18} />
            {t('settings.backupScreen.import', 'Importer des donnees')}
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            style={{ display: 'none' }}
            onChange={(e) => void handleImportFile(e)}
          />
          {status && (
            <p
              className={
                'text-center text-sm ' +
                (status.kind === 'ok' ? 'text-success' : 'text-error')
              }
            >
              {status.message}
            </p>
          )}
        </div>

        <div className="glass space-y-3 rounded-2xl p-4">
          <h2>
            {t('settings.backupScreen.cloud', 'Synchronisation Cloud')}
          </h2>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-base text-text-primary">
              <DuoIcon icon={Cloud} size={18} className="text-primary" />
              {t('settings.backupScreen.sync', 'Sync automatique')}
            </span>
            <Switch
              checked={syncEnabled}
              onCheckedChange={setSyncEnabled}
              label={t('settings.backupScreen.sync', 'Synchronisation automatique')}
              disabled={!isAuthenticated}
            />
          </div>
          {!isAuthenticated && (
            <p className="text-sm text-text-muted">
              {t('settings.backupScreen.loginForSync', 'Connectez-vous pour activer la synchronisation cloud')}
            </p>
          )}
        </div>
      </div>
    </FullScreenPage>
  );
}
