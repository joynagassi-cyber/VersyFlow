/**
 * Réglages — Données & confidentialité.
 *
 * Deux défauts corrigés ici, mesurés dans l'audit de finition :
 *
 *  1. **Trois interrupteurs réinventés.** Cet écran dessinait son propre
 *     `<button aria-pressed>` de 28 px, avec un pouce positionné en
 *     `left-[calc(100%-1.625rem)]` : pas de `role="switch"`, une cible de 28 px
 *     et une géométrie qui ne suivait pas la direction de lecture. Il utilise
 *     maintenant le `Switch` du système (40 px de cible, `aria-checked`,
 *     mouvement du thème).
 *  2. **Deux commandes mortes.** « Télécharger mes données » et « Supprimer
 *     mon compte » étaient des `<button>` sans `onClick` : un contrôle qui ne
 *     fait rien est pire qu'un contrôle absent. Le premier mène désormais à
 *     l'écran « Activités & Données » (le seul export réel de l'app) ; le
 *     second est explicitement indisponible hors ligne, avec la raison.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { DuoIcon } from '@/components/ui/DuoIcon';
import {
  ChevronRightIcon as ChevronRight,
  Download01Icon as Download,
  Delete02Icon as Trash2,
} from '@/components/ui/solar-icons';
import { FullScreenPage } from '@/components/layout/FullScreenPage';
import { Switch } from '@/components/ui/Switch';

export default function PrivacyScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);
  const [crashReporting, setCrashReporting] = useState(true);

  return (
    <FullScreenPage
      title={t('settings.privacyTitle', 'Données & confidentialité')}
      showBack
      backPath="/tabs/settings"
    >
      <div className="screen-column space-y-4">
        <section className="g1 p-4">
          <p className="section-label">{t('settings.privacyTitle', 'Données & confidentialité')}</p>
          <div className="mt-2 flex items-center justify-between gap-3">
            <span className="text-base text-text-primary">
              {t('settings.anonymousAnalytics', "Partager l'analyse anonyme")}
            </span>
            <Switch
              checked={analyticsEnabled}
              onCheckedChange={setAnalyticsEnabled}
              label={t('settings.anonymousAnalytics', "Partager l'analyse anonyme")}
            />
          </div>
          <div className="mt-1 flex items-center justify-between gap-3">
            <span className="text-base text-text-primary">
              {t('settings.crashReports', 'Rapports de plantage')}
            </span>
            <Switch
              checked={crashReporting}
              onCheckedChange={setCrashReporting}
              label={t('settings.crashReports', 'Rapports de plantage')}
            />
          </div>
        </section>

        <section className="g1 overflow-hidden">
          <p className="section-label px-4 pt-4">
            {t('settings.dataManagement', 'Gestion des données')}
          </p>
          <button
            type="button"
            onClick={() => navigate('/settings/data')}
            className="mt-1 flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left"
          >
            <span className="flex items-center gap-3 text-base text-text-primary">
              <DuoIcon icon={Download} size={18} className="text-text-muted" />
              {t('settings.downloadData', 'Télécharger mes données')}
            </span>
            <DuoIcon icon={ChevronRight} size={18} className="text-text-muted" />
          </button>
          <div className="flex w-full items-center justify-between gap-3 px-4 py-3.5">
            <span className="flex items-center gap-3 text-base text-text-muted">
              <DuoIcon icon={Trash2} size={18} />
              {t('settings.deleteAccount', 'Supprimer mon compte')}
            </span>
            <span className="text-2xs font-semibold uppercase tracking-wide text-text-muted">
              {t('settings.deleteAccountUnavailable', 'Hors ligne')}
            </span>
          </div>
          <p className="px-4 pb-4 text-xs leading-relaxed text-text-muted">
            {t(
              'settings.deleteAccountHint',
              'La suppression du compte demande une session connectée : elle n’est pas possible depuis cet appareil hors ligne, pour éviter de supprimer des données non synchronisées.',
            )}
          </p>
        </section>
      </div>
    </FullScreenPage>
  );
}
