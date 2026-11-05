/**
 * Panneau « Mode démo » — l'endroit où l'on explique **ce qui est simulé**, où
 * l'on réinitialise la démo et où l'on revient aux données réelles.
 *
 * Il est monté dans `/dev` et dans `/settings/data`. En mode live il n'affiche
 * pas d'actions de démo destructrices : il propose simplement de revenir à la
 * démo (les données de démo sont conservées).
 */

import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DuoIcon } from '@/components/ui/DuoIcon';
import {
  RefreshIcon as Refresh,
  AlertCircleIcon as Alert,
  ArrowRight01Icon as ArrowRight,
  Database01Icon as Database,
} from '@/components/ui/solar-icons';
import { Button } from '@/components/ui/button';
import {
  getDemoSessionInfo,
  reloadDemoSession,
  exitDemoSession,
  reenterDemoSession,
} from '@/dev/demo-session';

function formatDate(value: number, locale: string): string {
  try {
    return new Intl.DateTimeFormat(locale, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value));
  } catch {
    return new Date(value).toISOString();
  }
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

export function DemoModePanel({ compact = false }: { compact?: boolean }) {
  const { t, i18n } = useTranslation();
  const [busy, setBusy] = useState<'reset' | 'exit' | 'enter' | null>(null);
  const locale = i18n.resolvedLanguage || i18n.language || 'fr';

  const info = useMemo(() => getDemoSessionInfo(), []);
  const records = info.counts.memorization_records ?? 0;
  const reviews = info.counts.review_logs ?? 0;
  const families = info.counts.families ?? 0;

  const reset = () => {
    setBusy('reset');
    reloadDemoSession();
  };

  const exit = () => {
    setBusy('exit');
    exitDemoSession();
  };

  const enter = () => {
    setBusy('enter');
    reenterDemoSession();
  };

  return (
    <section
      className="rounded-2xl bg-surface p-4 shadow-sm"
      aria-labelledby="demo-mode-title"
      data-testid="demo-mode-panel"
    >
      <p className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-text-muted">
        <DuoIcon icon={Database} size={14} className="text-primary" />
        {t('demo.panelTitle', 'Mode démo')}
      </p>

      <h2 id="demo-mode-title" className="text-base font-extrabold text-text-primary">
        {info.active
          ? t('demo.activeTitle', 'Vous êtes en mode démo')
          : t('demo.inactiveTitle', 'Vous êtes sur vos données réelles')}
      </h2>

      <p className="mt-1 text-sm text-text-secondary">
        {info.active
          ? t(
              'demo.activeBody',
              'Démo en chantier : plusieurs données sont fictives et enregistrées séparément. L’isolation complète de tous les parcours reste à vérifier ; évitez les données personnelles pendant les essais.',
            )
          : t(
              'demo.inactiveBody',
              'La démonstration est désactivée. Le retour aux données réelles active les services et données réels configurés.',
            )}
      </p>

      {info.active && (
        <>
          <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
            <div className="rounded-xl bg-surface-tint px-3 py-2">
              <dt className="text-[11px] uppercase tracking-wide text-text-muted">
                {t('demo.statVerses', 'Versets fictifs')}
              </dt>
              <dd className="font-extrabold text-text-primary">{records}</dd>
            </div>
            <div className="rounded-xl bg-surface-tint px-3 py-2">
              <dt className="text-[11px] uppercase tracking-wide text-text-muted">
                {t('demo.statReviews', 'Révisions fictives')}
              </dt>
              <dd className="font-extrabold text-text-primary">{reviews}</dd>
            </div>
            <div className="rounded-xl bg-surface-tint px-3 py-2">
              <dt className="text-[11px] uppercase tracking-wide text-text-muted">
                {t('demo.statFamilies', 'Familles fictives')}
              </dt>
              <dd className="font-extrabold text-text-primary">{families}</dd>
            </div>
            <div className="rounded-xl bg-surface-tint px-3 py-2">
              <dt className="text-[11px] uppercase tracking-wide text-text-muted">
                {t('demo.statStorage', 'Espace de démo')}
              </dt>
              <dd className="font-extrabold text-text-primary">{formatBytes(info.storageBytes)}</dd>
            </div>
          </dl>

          <p className="mt-3 text-xs text-text-muted">
            {info.startedAt
              ? t('demo.startedAt', 'Démo commencée le {{date}}.', {
                  date: formatDate(info.startedAt, locale),
                })
              : t('demo.startedUnknown', 'Date de début inconnue.')}{' '}
            {t(
              'demo.lifetime',
              'Les données de démo restent dans ce navigateur jusqu’à « Réinitialiser la démo » ou jusqu’au nettoyage du stockage.',
            )}
          </p>

          {!info.isolationInstalled && (
            <p
              className="mt-2 flex items-start gap-2 rounded-xl bg-surface-tint px-3 py-2 text-xs text-text-secondary"
              role="alert"
            >
              <DuoIcon icon={Alert} size={14} className="mt-0.5 shrink-0 text-primary" />
              <span>
                {t(
                  'demo.isolationUnavailable',
                  'L’isolation du stockage est indisponible ; la démo ne doit pas démarrer.',
                )}
              </span>
            </p>
          )}

          <p className="mt-2 flex items-start gap-2 rounded-xl bg-surface-tint px-3 py-2 text-xs text-text-secondary">
            <DuoIcon icon={Alert} size={14} className="mt-0.5 shrink-0 text-primary" />
            <span>
              {t(
                'demo.limits',
                'Les notifications de démo et le collecteur de test sont désactivés. L’isolation des autres parcours n’est pas encore entièrement vérifiée.',
              )}
            </span>
          </p>
        </>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {info.active ? (
          <>
            <Button variant="outline" size="sm" onClick={reset} disabled={busy !== null}>
              <DuoIcon icon={Refresh} size={16} />
              {busy === 'reset'
                ? t('demo.resetting', 'Réinitialisation…')
                : t('demo.reset', 'Réinitialiser la démo')}
            </Button>
            <Button variant="secondary" size="sm" onClick={exit} disabled={busy !== null}>
              <DuoIcon icon={ArrowRight} size={16} />
              {t('demo.exit', 'Quitter la démo')}
            </Button>
          </>
        ) : (
          <Button variant="secondary" size="sm" onClick={enter} disabled={busy !== null}>
            <DuoIcon icon={ArrowRight} size={16} />
            {busy === 'enter' ? t('demo.entering', 'Ouverture…') : t('demo.enter', 'Voir la démo')}
          </Button>
        )}
      </div>

      {!compact && (
        <p className="mt-3 text-[11px] leading-relaxed text-text-muted">
          {t(
            'demo.exitHint',
            'Quitter la démo recharge l’application sur vos données réelles. Pour revenir ensuite : ouvrez /settings/data et choisissez « Voir la démo », ou ajoutez ?data=mock à l’adresse.',
          )}
        </p>
      )}
    </section>
  );
}

export default DemoModePanel;
