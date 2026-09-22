import { useState, useRef } from 'react';
import type { ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Download, Upload, Cloud, Loader2 } from 'lucide-react';
import { FullScreenPage } from '@/components/layout/FullScreenPage';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/auth-store';
import { useActiveProfile } from '@/hooks/useActiveProfile';
import { getMemorizationService } from '@/services/memorization-service-factory';
import type { MemorizationRecord } from '@/domains/memorization/entities';

export default function BackupScreen() {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuthStore();
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
      setStatus({ kind: 'ok', message: records.length + " verset(s) exporte(s)" });
    } catch (e) {
      console.error('[Backup] export failed', e);
      setStatus({ kind: 'error', message: "Export impossible pour le moment" });
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
      setStatus({ kind: 'ok', message: count + " verset(s) importe(s)" });
    } catch {
      setStatus({ kind: 'error', message: 'Fichier illisible (JSON attendu)' });
    }
  };

  const Toggle = ({ on, onChange, disabled }: { on: boolean; onChange: () => void; disabled?: boolean }) => (
    <button
      onClick={onChange}
      disabled={disabled}
      className={
        'relative h-7 w-12 shrink-0 rounded-full transition ' +
        (on ? 'bg-primary' : 'bg-[color:var(--color-divider)]') +
        (disabled ? ' opacity-40' : '')
      }
      aria-pressed={on}
    >
      <span
        className={
          'absolute top-0.5 h-6 w-6 rounded-full bg-white transition-all ' +
          (on ? 'left-[calc(100%-1.625rem)]' : 'left-0.5')
        }
      />
    </button>
  );

  return (
    <FullScreenPage
      title={t('settings.backup', 'Sauvegarde')}
      showBack
      backPath="/settings"
    >
      <div className="mx-auto max-w-md space-y-4">
        <div className="space-y-3 rounded-2xl bg-surface p-4 shadow-sm">
          <p className="text-base font-bold text-text-primary">
            {t('settings.backup.title', 'Sauvegarde')}
          </p>
          <div className="flex items-center justify-between">
            <span className="text-base text-text-primary">
              {t('settings.backup.auto', 'Sauvegarde automatique')}
            </span>
            <Toggle on={autoBackup} onChange={() => setAutoBackup((v) => !v)} />
          </div>
          <Button variant="default" className="w-full" onClick={handleExport} disabled={busy}>
            {busy ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
            {t('settings.backup.export', 'Exporter mes donnees')}
          </Button>
          <Button
            variant="secondary"
            className="w-full"
            onClick={() => fileRef.current?.click()}
          >
            <Upload size={18} />
            {t('settings.backup.import', 'Importer des donnees')}
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

        <div className="space-y-3 rounded-2xl bg-surface p-4 shadow-sm">
          <p className="text-base font-bold text-text-primary">
            {t('settings.backup.cloud', 'Synchronisation Cloud')}
          </p>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-base text-text-primary">
              <Cloud size={18} className="text-primary" />
              {t('settings.backup.sync', 'Sync automatique')}
            </span>
            <Toggle on={syncEnabled} onChange={() => setSyncEnabled((v) => !v)} disabled={!isAuthenticated} />
          </div>
          {!isAuthenticated && (
            <p className="text-sm text-text-muted">
              {t('settings.backup.loginForSync', 'Connectez-vous pour activer la synchronisation cloud')}
            </p>
          )}
        </div>
      </div>
    </FullScreenPage>
  );
}
