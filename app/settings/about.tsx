import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DuoIcon } from '@/components/ui/DuoIcon';
import {
  BookOpen01Icon as BookOpen,
  ExternalLinkIcon as ExternalLink,
  HeartIcon as Heart,
  CpuIcon as Cpu,
  SparklesIcon as Sparkles,
  ChevronDownIcon as ChevronDown,
} from '@/components/ui/solar-icons';
import { FullScreenPage } from '@/components/layout/FullScreenPage';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/brand/Logo';
import { useAppearanceStore } from '@/store/appearance-store';
import { notificationService } from '@/services/notification-service';

// Fixed: Capacitor — test notification now requests permission just-in-time (ensurePermissions) before scheduling

const VERSION = '0.1.0';

/**
 * Feature changelog — a static list kept in this file. The "Nouveautés"
 * section below always shows the entries for the app version in use; new
 * releases append their entry to this array. (There is no per-user
 * "seen what's new" persistence — the section is a static changelog, not a
 * badge.)
 */
const WHATS_NEW = [
  {
    version: VERSION,
    title: 'Lecture premium & réglages fins',
    items: [
      '10 polices serif premium et réglages de taille, interlignage, espacement',
      'Carte de lecture translucide sur fond de thème flouté',
      'Barre de progression réelle pour le téléchargement des traductions',
      'Tags sémantiques de tous les versets d\'un chapitre',
      'Comparaison inter-traductions par langue cible',
      'Nouvelle section Paramètres divisée par catégories',
    ],
  },
];

export default function AboutScreen() {
  const { t } = useTranslation();
  const reminderEnabled = useAppearanceStore((s) => s.reminderEnabled);
  const reminderFrequency = useAppearanceStore((s) => s.reminderFrequency);
  const reminderTime = useAppearanceStore((s) => s.reminderTime);
  const [showWhatNew, setShowWhatNew] = useState(true);
  const [scheduled, setScheduled] = useState(false);

  const open = (url: string) => {
    window.open(url, '_blank');
  };

  const testNotification = async () => {
    try {
      // User-initiated: request permission just-in-time, then schedule.
      // The service is store/i18n-free — read the reminder config from the
      // store and translate the body here, then pass both as arguments.
      await notificationService.ensurePermissions(reminderEnabled);
      await notificationService.scheduleDailyReminders(
        {
          enabled: reminderEnabled,
          frequency: reminderFrequency,
          time: reminderTime,
        },
        t('reminders.notificationBody', 'Temps de révision !'),
      );
      setScheduled(true);
    } catch {
      setScheduled(false);
    }
  };

  return (
    <FullScreenPage
      title={t('settings.about', "A propos")}
      showBack
      backPath="/settings"
    >
      <div className="screen-column space-y-4">
        {/* Header */}
        <div className="glass flex flex-col items-center gap-2 rounded-3xl p-6">
          <Logo size={72} />
          <p className="text-2xl font-extrabold text-text-primary">VersyFlow</p>
          <p className="text-sm text-text-muted">Version {VERSION}</p>
        </div>

        {/* What's new */}
        <div className="glass rounded-2xl p-4">
          <button
            className="flex w-full items-center justify-between"
            onClick={() => setShowWhatNew((v) => !v)}
            aria-expanded={showWhatNew}
          >
            <p className="flex items-center gap-2 text-base font-bold text-text-primary">
              <DuoIcon icon={Sparkles} size={18} className="text-primary" />
              {t('settings.whatsNew', 'Nouveautés')}
            </p>
            <DuoIcon icon={ChevronDown}
              size={18}
              aria-label={t('common.expandCollapse', 'Déplier / replier')}
              className={'text-text-muted transition-transform ' + (showWhatNew ? 'rotate-180' : '')}
            />
          </button>
          {showWhatNew &&
            WHATS_NEW.map((entry, i) => (
              <div key={i} className="mt-3">
                <p className="text-xs font-bold text-primary">v{entry.version}</p>
                <p className="mb-1.5 text-sm font-semibold text-text-primary">{entry.title}</p>
                <ul className="flex flex-col gap-1">
                  {entry.items.map((item, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm text-text-secondary">
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          <Button
            variant="outline"
            className="mt-4 w-full"
            onClick={() => void testNotification()}
            disabled={scheduled}
          >
            {scheduled
              ? t('settings.notificationScheduled', 'Rappel planifié ✓')
              : t('settings.testNotification', 'Tester une notification locale')}
          </Button>
        </div>

        {/* About */}
        <div className="glass rounded-2xl p-4">
          <p className="mb-2 flex items-center gap-2 text-base font-bold text-text-primary">
            <DuoIcon icon={BookOpen} size={18} className="text-primary" />
            {t('settings.about', "A propos")}
          </p>
          <p className="text-sm leading-relaxed text-text-secondary">
            {t('settings.aboutDescription',
              "VersyFlow vous aide a memoriser les versets bibliques grace a la science de la repetition espacee (FSRS).")}
          </p>
        </div>

        {/* Links */}
        <div className="glass overflow-hidden rounded-2xl">
          {[
            { label: t('settings.documentation', 'Documentation'), url: 'https://github.com/your-org/versyflow' },
            { label: t('settings.supportLink', 'Support'), url: 'mailto:support@versyflow.com' },
            { label: t('settings.privacyPolicy', 'Politique de confidentialite'), url: 'https://versyflow.com/privacy' },
          ].map((l, i) => (
            <button
              key={i}
              onClick={() => open(l.url)}
              className="flex w-full items-center justify-between border-b border-[color:var(--color-divider)] px-4 py-3.5 last:border-0"
            >
              <span className="text-base font-medium text-primary">{l.label}</span>
              <DuoIcon icon={ExternalLink} size={16} className="text-text-muted" />
            </button>
          ))}
        </div>

        {/* Credits */}
        <div className="glass space-y-2 rounded-2xl p-4 text-center">
          <p className="flex items-center justify-center gap-2 text-sm text-text-secondary">
            <DuoIcon icon={Heart} size={14} className="text-primary" />
            {t('settings.creditMission', 'Developpe avec amour pour la gloire de Dieu')}
          </p>
          <p className="flex items-center justify-center gap-2 text-sm text-text-muted">
            <DuoIcon icon={Cpu} size={14} />
            {t('settings.creditEngine', 'Moteur FSRS par Dmytro Gutman')}
          </p>
        </div>
      </div>
    </FullScreenPage>
  );
}
