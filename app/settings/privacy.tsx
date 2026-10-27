import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronRight, Download, Trash2 } from 'lucide-react';
import { FullScreenPage } from '@/components/layout/FullScreenPage';

export default function PrivacyScreen() {
  const { t } = useTranslation();
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);
  const [crashReporting, setCrashReporting] = useState(true);

  const Toggle = ({ on, onChange }: { on: boolean; onChange: () => void }) => (
    <button
      onClick={onChange}
      className={
        'relative h-7 w-12 shrink-0 rounded-full transition ' +
        (on ? 'bg-primary' : 'bg-[color:var(--color-divider)]')
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
      title={t('settings.privacyTitle', 'Donnees & confidentialite')}
      showBack
      backPath="/settings"
    >
      <div className="mx-auto max-w-md space-y-4">
        <div className="space-y-1 rounded-2xl bg-surface p-2 shadow-sm">
          <p className="px-3 pt-2 text-base font-bold text-text-primary">
            {t('settings.privacyTitle', 'Donnees & confidentialite')}
          </p>
          <div className="flex items-center justify-between px-3 py-3">
            <span className="text-base text-text-primary">
              {t('settings.anonymousAnalytics', "Partager l'analyse anonyme")}
            </span>
            <Toggle on={analyticsEnabled} onChange={() => setAnalyticsEnabled((v) => !v)} />
          </div>
          <div className="flex items-center justify-between px-3 py-3">
            <span className="text-base text-text-primary">
              {t('settings.crashReports', 'Rapports de plantage')}
            </span>
            <Toggle on={crashReporting} onChange={() => setCrashReporting((v) => !v)} />
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl bg-surface shadow-sm">
          <p className="px-4 pt-3 text-base font-bold text-text-primary">
            {t('settings.dataManagement', 'Gestion des donnees')}
          </p>
          <button className="flex w-full items-center justify-between px-4 py-3.5">
            <span className="flex items-center gap-3 text-base text-text-primary">
              <Download size={18} className="text-text-muted" />
              {t('settings.downloadData', 'Telecharger mes donnees')}
            </span>
            <ChevronRight size={18} className="text-text-muted" />
          </button>
          <button className="flex w-full items-center justify-between px-4 py-3.5">
            <span className="flex items-center gap-3 text-base font-medium text-error">
              <Trash2 size={18} />
              {t('settings.deleteAccount', 'Supprimer mon compte')}
            </span>
            <span className="text-sm font-semibold text-error">
              {t('common.delete', 'Supprimer')}
            </span>
          </button>
        </div>
      </div>
    </FullScreenPage>
  );
}
