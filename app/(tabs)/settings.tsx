/**
 * Settings Tab — 3 sub-tabs: Données / Paramètres / Profil.
 * Tailwind + i18n + Lucide + Shadcn Dialog.
 */

import { useState, useRef } from 'react';
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
  DownloadCloud,
  LayoutGrid,
  BarChart3,
  TrendingUp,
  Repeat,
  History,
  Layers,
  Camera,
  Mail,
  UserRound,
  Plus,
  Flame,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth-store';
import { ALL_TABS, useUiStore } from '@/store/ui-store';
import { useSettingsStore } from '@/store/settings-store';
import { useFamilyStore } from '@/store/family-store';
import { eventBus, DomainEventTypes } from '@/domains/events';
import { useTranslationPreference } from '@/hooks/useTranslationPreference';
import { SUPPORTED_LANGUAGES, isRTL } from '@/domains/i18n/config';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

type SettingsTab = 'data' | 'params' | 'profile';

const TAB_DEFS: { id: SettingsTab; key: string; label: string }[] = [
  { id: 'data', key: 'settingsTab.data', label: 'Données' },
  { id: 'params', key: 'settingsTab.params', label: 'Paramètres' },
  { id: 'profile', key: 'settingsTab.profile', label: 'Profil' },
];

const TRANSLATION_LABELS: Record<string, string> = {
  lsg: 'Louis Segond (1910)',
  ostervald: 'Ostervald (1930)',
};

const AVATAR_KEY = 'versyflow:profile:avatar';
const NAME_KEY = 'versyflow:profile:name';

export default function SettingsScreen() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [tab, setTab] = useState<SettingsTab>('data');

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Segmented control */}
      <div className="px-4 pt-4">
        <div className="flex rounded-full bg-surface-tint p-1">
          {TAB_DEFS.map((d) => (
            <button
              key={d.id}
              onClick={() => setTab(d.id)}
              className={cn(
                'flex-1 rounded-full py-2 text-sm font-semibold transition',
                tab === d.id ? 'bg-surface text-primary shadow-sm' : 'text-text-muted',
              )}
            >
              {t(d.key, d.label)}
            </button>
          ))}
        </div>
      </div>

      {/* Scrollable content */}
      <div className="min-h-0 flex-1 overflow-y-auto p-4 pb-24">
        {tab === 'data' && <DataTab />}
        {tab === 'params' && <ParamsTab />}
        {tab === 'profile' && <ProfileTab />}
      </div>
    </div>
  );
}

/* ── Section A: Données ─────────────────────────────────────────────── */

function DataTab() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const cards = [
    { icon: BarChart3, label: t('analytics.title', 'Statistiques'), sub: t('settings.version', 'Courbes & rétention'), color: 'text-primary', bg: 'bg-icon-bg-rose', to: '/analytics/dashboard' },
    { icon: TrendingUp, label: t('progress.yourProgress', 'Progression'), sub: t('progress.inProgress', 'En cours & à réviser'), color: 'text-success', bg: 'bg-icon-bg-green', to: '/tabs/progress' },
    { icon: Repeat, label: t('home.review', 'Réviser'), sub: t('home.reviewDesc', 'File de révision'), color: 'text-info', bg: 'bg-icon-bg-blue', to: '/review/queue' },
    { icon: CloudUpload, label: t('settings.backup', 'Sauvegarde & Sync'), sub: t('settings.data', 'Exporter / importer'), color: 'text-warning', bg: 'bg-icon-bg-orange', to: '/settings/backup' },
    { icon: History, label: t('nav.history', 'Historique'), sub: t('review.summary', 'Révisions passées'), color: 'text-info', bg: 'bg-icon-bg-indigo', to: '/review/history' },
    { icon: Layers, label: t('nav.collections', 'Collections'), sub: t('collections.createHint', 'Organisez vos versets'), color: 'text-primary', bg: 'bg-icon-bg-purple', to: '/collections' },
  ];

  return (
    <div className="space-y-3">
      {cards.map((c, i) => (
        <button
          key={i}
          onClick={() => navigate(c.to)}
          className="flex w-full items-center gap-4 rounded-2xl bg-surface p-4 text-left shadow-sm transition active:scale-[0.99]"
        >
          <span className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-full', c.bg)}>
            <c.icon size={20} className={c.color} />
          </span>
          <span className="flex-1">
            <span className="block text-base font-semibold text-text-primary">{c.label}</span>
            <span className="block text-sm text-text-muted">{c.sub}</span>
          </span>
          <ChevronRight size={18} className="text-text-muted" />
        </button>
      ))}
    </div>
  );
}

/* ── Section B: Paramètres ──────────────────────────────────────────── */

function ParamsTab() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { user, isAuthenticated, signOut } = useAuthStore();
  const { bibleTranslation, setBibleTranslation } = useSettingsStore();
  const { setPreference } = useTranslationPreference();
  const [languageModalOpen, setLanguageModalOpen] = useState(false);
  const visibleTabs = useUiStore((s) => s.visibleTabs);
  const setVisibleTab = useUiStore((s) => s.setVisibleTab);

  const currentLanguage = i18n.language ?? 'fr';

  const changeLanguage = (code: string) => {
    useSettingsStore.getState().setUiLanguage(code);
    void i18n.changeLanguage(code);
    document.documentElement.dir = isRTL(code) ? 'rtl' : 'ltr';
    setLanguageModalOpen(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth/login');
  };

  const groups = [
    {
      title: t('settings.apparence', 'Apparence'),
      rows: [
        { icon: <Languages size={20} />, bg: 'bg-icon-bg-purple', color: 'text-primary', label: t('settings.uiLanguage', "Langue de l'interface"), sub: getLanguageName(currentLanguage), onClick: () => setLanguageModalOpen(true) },
        { icon: <BookText size={20} />, bg: 'bg-surface-tint', color: 'text-text-secondary', label: t('settings.bibleTranslation', 'Traduction biblique'), sub: TRANSLATION_LABELS[bibleTranslation] ?? 'LSG', onClick: () => { const next = bibleTranslation === 'lsg' ? 'ostervald' : 'lsg'; setBibleTranslation(next); setPreference(next); } },
        { icon: <Moon size={20} />, bg: 'bg-icon-bg-blue', color: 'text-info', label: t('settings.theme', 'Thème & accent'), sub: t('settings.fontSize', 'Clair, sombre, taille, accent'), onClick: () => navigate('/settings/appearance') },
      ],
    },
    {
      title: t('settings.sessionReminders', 'Session & Rappels'),
      rows: [
        { icon: <LayoutGrid size={20} />, bg: 'bg-surface-tint', color: 'text-primary', label: t('settings.session', 'Session'), sub: t('settings.reminders', 'Objectif & durée'), onClick: () => navigate('/settings/session') },
        { icon: <CloudUpload size={20} />, bg: 'bg-icon-bg-green', color: 'text-success', label: t('settings.reminders', 'Rappels'), sub: t('settings.data', 'Heures & fréquence'), onClick: () => navigate('/settings/reminders') },
      ],
    },
    {
      title: t('settings.confidentialite', 'Confidentialité'),
      rows: [
        { icon: <ShieldCheck size={20} />, bg: 'bg-icon-bg-blue', color: 'text-info', label: t('settings.privacyTitle', 'Données & confidentialité'), sub: t('settings.downloadData', 'Télémétrie & données'), onClick: () => navigate('/settings/privacy') },
      ],
    },
    {
      title: t('settings.about', 'À propos'),
      rows: [
        { icon: <Info size={20} />, bg: 'bg-surface-tint', color: 'text-text-tertiary', label: t('settings.about', 'À propos'), sub: `${t('common.appName', 'VersyFlow')} v0.1.0`, onClick: () => navigate('/settings/about') },
        { icon: <HelpCircle size={20} />, bg: 'bg-icon-bg-green', color: 'text-success', label: t('settings.helpSupport', 'Aide & Support'), sub: t('settings.documentation', 'Guides et contact'), onClick: () => navigate('/settings/about') },
      ],
    },
  ];

  function getLanguageName(code: string) {
    const lang = SUPPORTED_LANGUAGES.find((l) => l.code === code);
    return lang ? lang.name : code;
  }

  return (
    <div className="space-y-5">
      {/* Navigation — enable/disable tabs */}
      <section>
        <h2 className="mb-2 flex items-center gap-2 px-1 text-sm font-semibold uppercase tracking-wide text-text-tertiary">
          <LayoutGrid size={16} />
          {t('settings.navigation', 'Navigation')}
        </h2>
        <div className="overflow-hidden rounded-2xl bg-surface shadow-sm">
          {ALL_TABS.map((tabItem, i) => {
            const on = visibleTabs.includes(tabItem.id);
            return (
              <div key={tabItem.id} className={cn('flex w-full items-center gap-3 p-4', i < ALL_TABS.length - 1 && 'border-b border-divider')}>
                <span className="flex-1">
                  <span className="block text-base text-text-primary">{t(tabItem.labelKey, tabItem.label)}</span>
                  <span className="block text-sm text-text-muted">
                    {on ? t('settings.tabEnabled', 'Affiché dans la barre') : t('settings.tabHidden', 'Masqué')}
                  </span>
                </span>
                <button onClick={() => setVisibleTab(tabItem.id, !on)} className={cn('relative h-6 w-11 shrink-0 rounded-full transition-colors', on ? 'bg-primary' : 'bg-border')} aria-pressed={on}>
                  <span className={cn('absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all', on ? 'left-[22px]' : 'left-0.5')} />
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* Groups */}
      {groups.map((group) => (
        <section key={group.title}>
          <h2 className="mb-2 px-1 text-sm font-semibold uppercase tracking-wide text-text-tertiary">{group.title}</h2>
          <div className="overflow-hidden rounded-2xl bg-surface shadow-sm">
            {group.rows.map((row, i) => (
              <button key={i} onClick={row.onClick} className={cn('flex w-full items-center gap-3 p-4 text-left', i < group.rows.length - 1 && 'border-b border-divider')}>
                <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-full', row.bg)}>
                  <span className={row.color}>{row.icon}</span>
                </span>
                <span className="flex-1">
                  <span className="block text-base text-text-primary">{row.label}</span>
                  <span className="block text-sm text-text-muted">{row.sub}</span>
                </span>
                <ChevronRight size={18} className="text-text-muted" />
              </button>
            ))}
          </div>
        </section>
      ))}

      {/* Danger zone */}
      <section>
        <h2 className="mb-2 px-1 text-sm font-semibold uppercase tracking-wide text-text-tertiary">
          {t('settings.resetProgress', 'Zone de danger')}
        </h2>
        <div className="overflow-hidden rounded-2xl bg-surface shadow-sm">
          <button
            onClick={() => {
              if (window.confirm(t('settings.resetConfirmText', 'Cela supprimera TOUS vos versets mémorisés.'))) {
                eventBus.emit({
                  id: crypto.randomUUID(),
                  type: DomainEventTypes.PROGRESS_RESET,
                  timestamp: Date.now(),
                  payload: { reason: 'user_initiated' as const, versesDeleted: 0, reviewsDeleted: 0 },
                });
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
              <span className="block text-base font-medium text-error">{t('settings.resetProgress', 'Réinitialiser la progression')}</span>
              <span className="block text-sm text-text-muted">{t('common.delete', 'Supprimer toutes les données')}</span>
            </span>
            <ChevronRight size={18} className="text-error" />
          </button>
        </div>
      </section>

      {isAuthenticated && (
        <button onClick={handleSignOut} className="flex w-full items-center justify-center gap-2 rounded-full bg-surface p-4 text-base font-semibold text-error shadow-sm">
          <LogOut size={18} />
          {t('settings.signOut', 'Se déconnecter')}
        </button>
      )}

      {/* Language dialog */}
      <Dialog open={languageModalOpen} onOpenChange={setLanguageModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('settings.uiLanguage', 'Choisir la langue')}</DialogTitle>
          </DialogHeader>
          <div className="mt-2 flex flex-col gap-2">
            {SUPPORTED_LANGUAGES.map((lang) => {
              const selected = currentLanguage === lang.code;
              return (
                <button key={lang.code} onClick={() => changeLanguage(lang.code)} className={cn('flex items-center justify-between rounded-xl p-3 text-left transition-colors', selected ? 'bg-surface-tint' : 'hover:bg-surface-tint/50')}>
                  <span>
                    <span className={cn('block text-base', selected ? 'font-semibold text-primary' : 'font-medium text-text-primary')}>{lang.name}</span>
                    <span className="text-sm text-text-muted">{lang.displayName}</span>
                  </span>
                  {selected && <Check size={18} className="text-primary" />}
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ── Section C: Profil ──────────────────────────────────────────────── */

function ProfileTab() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, isAuthenticated, signOut } = useAuthStore();
  const { families, activeFamilyId } = useFamilyStore();
  const fileRef = useRef<HTMLInputElement>(null);

  const [avatar, setAvatar] = useState<string>(() => localStorage.getItem(AVATAR_KEY) ?? '');
  const [name, setName] = useState<string>(
    () => localStorage.getItem(NAME_KEY) ?? user?.display_name ?? '',
  );
  const [editing, setEditing] = useState(false);

  const displayName = name || user?.display_name || 'Utilisateur';
  const activeFamily = families.find((f) => f.id === activeFamilyId) || null;

  const saveName = () => {
    localStorage.setItem(NAME_KEY, name);
    setEditing(false);
  };

  const pickPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const url = reader.result as string;
      setAvatar(url);
      localStorage.setItem(AVATAR_KEY, url);
    };
    reader.readAsDataURL(file);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth/login');
  };

  const actions = [
    { icon: UserRound, label: t('profile.manageProfiles', 'Gérer les profils'), sub: t('profile.select', 'Choisir qui apprend'), to: '/profile/select', color: 'text-primary', bg: 'bg-icon-bg-rose' },
    { icon: Plus, label: t('profile.createProfile', 'Ajouter un profil'), sub: t('profile.selectHint', 'Plusieurs apprenants'), to: '/profile/create', color: 'text-success', bg: 'bg-icon-bg-green' },
    { icon: Download, label: t('settings.exportData', 'Exporter mes données'), sub: t('settings.data', 'Sauvegarde locale'), to: '/settings/backup', color: 'text-warning', bg: 'bg-icon-bg-orange' },
  ];

  return (
    <div className="space-y-5">
      {/* Identity card */}
      <div className="flex flex-col items-center rounded-3xl bg-surface p-6 shadow-md">
        <button
          onClick={() => fileRef.current?.click()}
          className="relative h-24 w-24 overflow-hidden rounded-full bg-surface-tint active:scale-95"
          aria-label={t('profile.avatar', 'Changer la photo')}
        >
          {avatar ? (
            <img src={avatar} alt={displayName} className="h-full w-full object-cover" />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-4xl font-extrabold text-primary">
              {displayName.charAt(0).toUpperCase()}
            </span>
          )}
          <span className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-white shadow">
            <Camera size={14} />
          </span>
        </button>
        <input ref={fileRef} type="file" accept="image/*" onChange={pickPhoto} className="hidden" />

        <div className="mt-4 w-full">
          {editing ? (
            <div className="flex items-center gap-2">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('profile.namePlaceholder', 'Ex : Sarah, David...')}
                className="flex-1 rounded-full bg-surface-tint px-4 py-2 text-base text-text-primary outline-none ring-2 ring-[color:var(--color-primary)]"
              />
              <button onClick={saveName} className="rounded-full bg-primary p-2 text-white">
                <Check size={16} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-2 text-xl font-extrabold text-text-primary"
            >
              {displayName}
              <CircleUserRound size={18} className="text-text-muted" />
            </button>
          )}
          <p className="mt-1 flex items-center gap-1.5 text-sm text-text-muted">
            <Mail size={14} />
            {isAuthenticated ? user?.email ?? t('profile.local', 'Local') : t('profile.local', 'Mode local')}
          </p>
          <div className="mt-3 flex items-center gap-2">
            <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold', isAuthenticated ? 'bg-success-light text-success' : 'bg-surface-tint text-text-muted')}>
              {isAuthenticated ? t('profile.connected', 'Connecté') : t('profile.local', 'Local')}
            </span>
            {activeFamily && (
              <span className="inline-flex items-center gap-1 rounded-full bg-icon-bg-rose px-2.5 py-1 text-xs font-semibold text-primary">
                {activeFamily.name}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Data actions */}
      <section>
        <div className="overflow-hidden rounded-2xl bg-surface shadow-sm">
          {actions.map((a, i) => (
            <button key={i} onClick={() => navigate(a.to)} className={cn('flex w-full items-center gap-3 p-4 text-left', i < actions.length - 1 && 'border-b border-divider')}>
              <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-full', a.bg)}>
                <a.icon size={18} className={a.color} />
              </span>
              <span className="flex-1">
                <span className="block text-base text-text-primary">{a.label}</span>
                <span className="block text-sm text-text-muted">{a.sub}</span>
              </span>
              <ChevronRight size={18} className="text-text-muted" />
            </button>
          ))}
        </div>
      </section>

      {isAuthenticated && (
        <button onClick={handleSignOut} className="flex w-full items-center justify-center gap-2 rounded-full bg-surface p-4 text-base font-semibold text-error shadow-sm">
          <LogOut size={18} />
          {t('settings.signOut', 'Se déconnecter')}
        </button>
      )}
    </div>
  );
}
