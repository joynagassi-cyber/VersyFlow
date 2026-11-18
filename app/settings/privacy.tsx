import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DuoIcon } from '@/components/ui/DuoIcon';
import {
  ChevronRightIcon as ChevronRight,
  Download01Icon as Download,
  Delete02Icon as Trash2,
} from '@/components/ui/solar-icons';
import { FullScreenPage } from '@/components/layout/FullScreenPage';

/**
 * H03 + H06 : un interrupteur porte un nom accessible et expose son état
 * (`role="switch"` + `aria-checked`), pas seulement sa couleur (B04).
 *
 * Défini hors du composant d'écran : sinon React recrée le type à chaque
 * rendu, démonte le bouton et fait perdre le focus clavier juste après l'appui.
 */
function Toggle({
  on,
  onChange,
  labelId,
  label,
}: {
  on: boolean;
  onChange: () => void;
  labelId: string;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-labelledby={labelId}
      aria-label={label}
      onClick={onChange}
      className={
        'relative h-7 w-12 shrink-0 rounded-full transition ' +
        (on ? 'bg-primary' : 'bg-[color:var(--color-divider)]')
      }
    >
      <span
        className={
          'absolute top-0.5 h-6 w-6 rounded-full bg-surface transition-all ' +
          (on ? 'end-0.5' : 'start-0.5')
        }
      />
    </button>
  );
}

export default function PrivacyScreen() {
  const { t } = useTranslation();
  // K01 (playbook) : aucune case pré-cochée. Le partage est un choix
  // explicite, refusé par défaut — et refuser coûte un seul geste, comme
  // accepter (les deux interrupteurs sont symétriques).
  const [analyticsEnabled, setAnalyticsEnabled] = useState(false);
  const [crashReporting, setCrashReporting] = useState(false);

  return (
    <FullScreenPage
      title={t('settings.privacyTitle', 'Donnees & confidentialite')}
      showBack
      backPath="/settings"
    >
      <div className="screen-column space-y-4">
        <div className="glass space-y-1 rounded-2xl bg-surface p-2 shadow-sm">
          <p className="px-3 pt-2 text-base font-bold text-text-primary">
            {t('settings.privacyTitle', 'Donnees & confidentialite')}
          </p>
          <p className="px-3 pb-2 text-sm text-text-muted">
            {t(
              'settings.privacyOptIn',
              'Rien n’est partagé tant que vous ne l’activez pas vous-même. Vos lectures et vos photos restent sur cet appareil.',
            )}
          </p>
          <div className="flex items-center justify-between gap-3 px-3 py-3">
            <span id="privacy-analytics-label" className="text-base text-text-primary">
              {t('settings.anonymousAnalytics', "Partager l'analyse anonyme")}
            </span>
            <Toggle
              on={analyticsEnabled}
              onChange={() => setAnalyticsEnabled((v) => !v)}
              labelId="privacy-analytics-label"
              label={t('settings.anonymousAnalytics', "Partager l'analyse anonyme")}
            />
          </div>
          <div className="flex items-center justify-between gap-3 px-3 py-3">
            <span id="privacy-crash-label" className="text-base text-text-primary">
              {t('settings.crashReports', 'Rapports de plantage')}
            </span>
            <Toggle
              on={crashReporting}
              onChange={() => setCrashReporting((v) => !v)}
              labelId="privacy-crash-label"
              label={t('settings.crashReports', 'Rapports de plantage')}
            />
          </div>
        </div>

        <div className="glass overflow-hidden rounded-2xl bg-surface shadow-sm">
          <p className="px-4 pt-3 text-base font-bold text-text-primary">
            {t('settings.dataManagement', 'Gestion des donnees')}
          </p>
          {/* E05 : une action indisponible dit pourquoi, au lieu de ne rien
              faire quand on clique dessus (promesse non tenue, règle G04). */}
          <button
            type="button"
            disabled
            aria-describedby="privacy-export-hint"
            className="flex w-full items-center justify-between px-4 py-3.5 opacity-60"
          >
            <span className="flex items-center gap-3 text-base text-text-primary">
              <DuoIcon icon={Download} size={18} className="text-text-muted" />
              {t('settings.downloadData', 'Telecharger mes donnees')}
            </span>
            <DuoIcon icon={ChevronRight} size={18} className="text-text-muted" />
          </button>
          <p id="privacy-export-hint" className="px-4 pb-3 text-sm text-text-muted">
            {t(
              'settings.downloadDataHint',
              'Indisponible en mode local : il n’y a pas encore de compte auquel rattacher l’export.',
            )}
          </p>
          <button
            type="button"
            disabled
            aria-describedby="privacy-delete-hint"
            className="flex w-full items-center justify-between px-4 py-3.5"
          >
            <span className="flex items-center gap-3 text-base font-medium text-error">
              <DuoIcon icon={Trash2} size={18} />
              {t('settings.deleteAccount', 'Supprimer mon compte')}
            </span>
            <span className="text-sm font-semibold text-error opacity-60">
              {t('common.delete', 'Supprimer')}
            </span>
          </button>
          <p id="privacy-delete-hint" className="px-4 pb-3 text-sm text-text-muted">
            {t(
              'settings.deleteAccountHint',
              'Indisponible sans compte connecté. Vos données locales se suppriment depuis Réglages › Données.',
            )}
          </p>
        </div>
      </div>
    </FullScreenPage>
  );
}
