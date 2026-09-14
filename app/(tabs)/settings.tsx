/**
 * Settings Screen — application preferences menu
 * Tailwind + i18n + Lucide + Shadcn Dialog.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ChevronRight,
  Languages,
  BookText,
  Moon,
  CloudUpload,
  Download,
  ShieldCheck,
  Info,
  FileText,
  HelpCircle,
  Trash2,
  LogOut,
  Check,
  CircleUserRound,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth-store';
import { useSettingsStore } from '@/store/settings-store';
import { useTranslationPreference } from '@/hooks/useTranslationPreference';
import { SUPPORTED_LANGUAGES, isRTL } from '@/domains/i18n/config';
import {
  BibleTranslationRegistry,
  DEFAULT_BIBLE_TRANSLATIONS,
  type BibleTranslationManifest,
} from '@/domains/bible/registry';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const bibleCatalogue = new BibleTranslationRegistry(DEFAULT_BIBLE_TRANSLATIONS);

const availableTranslations = bibleCatalogue
  .listTranslations()
  .filter((t) => t.available)
  .sort((a, b) => a.name.localeCompare(b.name));

const LANG_NAMES: Record<string, string> = {
  fr: 'Français',
  en: 'English',
  de: 'Deutsch',
  es: 'Español',
  pt: 'Português',
  ru: 'Русский',
  uk: 'Українська',
  ar: 'العربية',
  fa: 'فارسی',
  zh: '中文',
  ja: '日本語',
  ko: '한국어',
  hi: 'हिन्दी',
  ml: 'മലയാളം',
  it: 'Italiano',
  la: 'Latina',
  nl: 'Nederlands',
  da: 'Dansk',
  sv: 'Svenska',
  so: 'Soomaali',
  sw: 'Kiswahili',
  tl: 'Tagalog',
};

function groupTranslationsByLanguage(): Array<{
  language: string;
  name: string;
  items: BibleTranslationManifest[];
}> {
  const byLanguage = new Map<string, BibleTranslationManifest[]>();
  for (const tr of availableTranslations) {
    const key = tr.language.toLowerCase();
    const arr = byLanguage.get(key) ?? [];
    arr.push(tr);
    byLanguage.set(key, arr);
  }
  return [...byLanguage.entries()].map(([language, items]) => ({
    language,
    name: LANG_NAMES[language] ?? language.toUpperCase(),
    items: items.sort((a, b) => a.name.localeCompare(b.name)),
  }));
}

export default function SettingsScreen() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { user, isAuthenticated, signOut } = useAuthStore();
  const { bibleTranslation, setBibleTranslation } = useSettingsStore();
  const { setPreference } = useTranslationPreference();
  const [languageModalOpen, setLanguageModalOpen] = useState(false);
  const [translationModalOpen, setTranslationModalOpen] = useState(false);

  const currentLanguage = i18n.language ?? 'fr';
  const currentTranslationLabel =
    availableTranslations.find((x) => x.id === bibleTranslation)?.name ??
    bibleTranslation ??
    'Louis Segond (1910)';

  const chooseTranslation = (id: string) => {
    setBibleTranslation(id);
    setPreference(id);
    setTranslationModalOpen(false);
  };

  const changeLanguage = (code: string) => {
    setUiLanguagePersisted(code);
    void i18n.changeLanguage(code);
    document.documentElement.dir = isRTL(code) ? 'rtl' : 'ltr';
    setLanguageModalOpen(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth/login');
  };

  const settingsGroups = [
    {
      title: t('settings.uiLanguage', 'Préférences'),
      rows: [
        {
          icon: <Languages size={20} />,
          iconBg: 'bg-surface-tint',
          iconColor: 'text-primary',
          label: t('settings.uiLanguage', 'Langue de l\'interface'),
          subtitle: getLanguageName(currentLanguage),
          onClick: () => setLanguageModalOpen(true),
        },
        {
          icon: <BookText size={20} />,
          iconBg: 'bg-icon-bg-purple',
          iconColor: 'text-text-secondary',
          label: t('settings.bibleTranslation', 'Traduction biblique'),
          subtitle: currentTranslationLabel,
          onClick: () => setTranslationModalOpen(true),
        },
      ],
    },
    {
      title: t('settings.theme', 'Apparence'),
      rows: [
        {
          icon: <Moon size={20} />,
          iconBg: 'bg-icon-bg-blue',
          iconColor: 'text-info',
          label: t('settings.theme', 'Thème'),
          subtitle: t('settings.light', 'Clair'),
          onClick: () => navigate('/settings/appearance'),
        },
      ],
    },
    {
      title: t('settings.dataManagement', 'Données'),
      rows: [
        {
          icon: <Download size={20} />,
          iconBg: 'bg-icon-bg-orange',
          iconColor: 'text-warning',
          label: t('settings.availableTranslations', 'Traductions disponibles'),
          subtitle: t('settings.availableTranslationsHint', 'Télécharger des bibles en ligne'),
          onClick: () => navigate('/settings/available-translations'),
        },
        {
          icon: <CloudUpload size={20} />,
          iconBg: 'bg-icon-bg-green',
          iconColor: 'text-success',
          label: t('settings.exportData', 'Sauvegarde & Sync'),
          subtitle: t('settings.storageUsed', 'Synchroniser vos données'),
          onClick: () => navigate('/settings/backup'),
        },
        {
          icon: <Download size={20} />,
          iconBg: 'bg-icon-bg-orange',
          iconColor: 'text-warning',
          label: t('settings.exportData', 'Exporter mes données'),
          subtitle: t('settings.storageUsed', 'Télécharger vos données'),
          onClick: () => navigate('/settings/backup'),
        },
      ],
    },
    {
      title: 'Confidentialité',
      rows: [
        {
          icon: <ShieldCheck size={20} />,
          iconBg: 'bg-icon-bg-blue',
          iconColor: 'text-info',
          label: 'Politique de confidentialité',
          subtitle: t('settings.about', 'Voir nos conditions'),
          onClick: () => navigate('/settings/privacy'),
        },
      ],
    },
    {
      title: t('settings.about', 'À propos'),
      rows: [
        {
          icon: <Info size={20} />,
          iconBg: 'bg-surface-tint',
          iconColor: 'text-text-tertiary',
          label: t('settings.version', 'Version'),
          subtitle: `${t('common.appName', 'VersyFlow')} v0.1.0`,
          onClick: () => navigate('/settings/about'),
        },
        {
          icon: <FileText size={20} />,
          iconBg: 'bg-icon-bg-blue',
          iconColor: 'text-info',
          label: t('settings.documentation', 'Documentation'),
          subtitle: t('settings.about', 'Guides et tutoriels'),
          onClick: () => navigate('/settings/about'),
        },
        {
          icon: <HelpCircle size={20} />,
          iconBg: 'bg-icon-bg-green',
          iconColor: 'text-success',
          label: 'Aide & Support',
          subtitle: t('settings.about', 'FAQ et contact'),
          onClick: () => navigate('/settings/about'),
        },
      ],
    },
  ];

  // helper for language names (kept outside JSX)
  function getLanguageName(code: string) {
    const lang = SUPPORTED_LANGUAGES.find((l) => l.code === code);
    return lang ? lang.name : code;
  }

  function setUiLanguagePersisted(code: string) {
    useSettingsStore.getState().setUiLanguage(code);
  }

  return (
    <div className="min-h-full overflow-y-auto bg-background p-4 pb-24">
      <h1 className="mb-4 text-2xl font-bold text-text-primary">
        {t('settings.settings', 'Paramètres')}
      </h1>

      {/* Profile card */}
      <div className="flex items-center gap-4 rounded-2xl bg-surface p-5 shadow-md">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white">
          <CircleUserRound size={28} />
        </span>
        <div className="flex-1">
          <p className="text-lg font-bold text-text-primary">
            {user?.display_name || t('settings.settings', 'Utilisateur')}
          </p>
          <p className="text-sm text-text-tertiary">
            {isAuthenticated
              ? t('common.confirm', 'Compte connecté')
              : t('common.loading', 'Mode local')}
          </p>
        </div>
        <button
          onClick={() => navigate('/profile')}
          className="rounded-full p-2 text-text-muted"
          aria-label={t('common.back', 'Profil')}
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Groups */}
      {settingsGroups.map((group) => (
        <section key={group.title} className="mt-6">
          <h2 className="mb-2 px-1 text-sm font-semibold uppercase tracking-wide text-text-tertiary">
            {group.title}
          </h2>
          <div className="overflow-hidden rounded-2xl bg-surface shadow-sm">
            {group.rows.map((row, i) => (
              <button
                key={i}
                onClick={row.onClick}
                className={cn(
                  'flex w-full items-center gap-3 p-4 text-left',
                  i < group.rows.length - 1 && 'border-b border-divider',
                )}
              >
                <span
                  className={cn(
                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
                    row.iconBg,
                  )}
                >
                  <span className={row.iconColor}>{row.icon}</span>
                </span>
                <span className="flex-1">
                  <span className="block text-base text-text-primary">{row.label}</span>
                  <span className="block text-sm text-text-muted">{row.subtitle}</span>
                </span>
                <ChevronRight size={18} className="text-text-muted" />
              </button>
            ))}
          </div>
        </section>
      ))}

      {/* Danger zone */}
      <section className="mt-6">
        <h2 className="mb-2 px-1 text-sm font-semibold uppercase tracking-wide text-text-tertiary">
          {t('settings.resetProgress', 'Zone de danger')}
        </h2>
        <div className="overflow-hidden rounded-2xl bg-surface shadow-sm">
          <button
            onClick={() => {
              if (window.confirm(t('settings.resetConfirmText', 'Cela supprimera TOUS vos versets.'))) {
                useSettingsStore.getState().resetToDefaults();
                navigate('/onboarding/welcome', { replace: true });
              }
            }}
            className="flex w-full items-center gap-3 p-4 text-left"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-error-light">
              <Trash2 size={20} className="text-error" />
            </span>
            <span className="flex-1">
              <span className="block text-base font-medium text-error">
                {t('settings.resetProgress', 'Réinitialiser la progression')}
              </span>
              <span className="block text-sm text-text-muted">
                {t('common.delete', 'Supprimer toutes les données')}
              </span>
            </span>
            <ChevronRight size={18} className="text-error" />
          </button>
        </div>
      </section>

      {/* Sign out */}
      {isAuthenticated && (
        <button
          onClick={handleSignOut}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-surface p-4 text-base font-semibold text-error shadow-sm"
        >
          <LogOut size={18} />
          {t('common.skip', 'Se déconnecter')}
        </button>
      )}

      {/* Footer */}
      <div className="mt-10 flex flex-col items-center gap-1 pb-6">
        <p className="text-xl font-bold text-primary">{t('common.appName', 'VersyFlow')}</p>
        <p className="text-sm text-text-muted">v0.1.0</p>
      </div>

      {/* Language dialog (Shadcn) */}
      <Dialog open={languageModalOpen} onOpenChange={setLanguageModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('settings.uiLanguage', 'Choisir la langue')}</DialogTitle>
          </DialogHeader>
          <div className="mt-2 flex flex-col gap-2">
            {SUPPORTED_LANGUAGES.map((lang) => {
              const selected = currentLanguage === lang.code;
              return (
                <button
                  key={lang.code}
                  onClick={() => changeLanguage(lang.code)}
                  className={cn(
                    'flex items-center justify-between rounded-xl p-3 text-left transition-colors',
                    selected ? 'bg-surface-tint' : 'hover:bg-surface-tint/50',
                  )}
                >
                  <span>
                    <span
                      className={cn(
                        'block text-base',
                        selected
                          ? 'font-semibold text-primary'
                          : 'font-medium text-text-primary',
                      )}
                    >
                      {lang.name}
                    </span>
                    <span className="text-sm text-text-muted">{lang.displayName}</span>
                  </span>
                  {selected && <Check size={18} className="text-primary" />}
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* Bible translation picker (catalogue-driven, groups by language) */}
      <Dialog open={translationModalOpen} onOpenChange={setTranslationModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('settings.bibleTranslation', 'Choisir la traduction')}</DialogTitle>
          </DialogHeader>
          <div className="mt-2 flex max-h-[60vh] flex-col gap-4 overflow-y-auto">
            {groupTranslationsByLanguage().map((group) => (
              <div key={group.language}>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-text-tertiary">
                  {group.name}
                </p>
                {group.items.map((tr) => {
                  const selected = tr.id === bibleTranslation;
                  return (
                    <button
                      key={tr.id}
                      onClick={() => chooseTranslation(tr.id)}
                      className={cn(
                        'flex w-full items-center justify-between rounded-xl p-3 text-left transition-colors',
                        selected ? 'bg-surface-tint' : 'hover:bg-surface-tint/50',
                      )}
                    >
                      <span className="text-base font-medium text-text-primary">
                        {tr.name}
                        {tr.year ? ` (${tr.year})` : ''}
                      </span>
                      {selected && <Check size={18} className="text-primary" />}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
