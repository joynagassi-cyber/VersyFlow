/**
 * Settings Tab — 3 sub-tabs: Données / Paramètres / Profil.
 * Tailwind + i18n + Lucide + Shadcn Dialog.
 */
// Fixed: Structure — tab body scroll div mirrors TabLayout #main-content (accepted pattern, see 02-detect #5)
// Fixed: A11y — profile name save button now carries a translated aria-label

import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { DuoIcon } from '@/components/ui/DuoIcon';
import { ThemeAppearanceIcon } from '@/components/ui/ThemeAppearanceIcon';
import {
  ChevronRightIcon as ChevronRight,
  LanguagesIcon as Languages,
  BookTextIcon as BookText,
  CloudUploadIcon as CloudUpload,
  Download01Icon as Download,
  ShieldCheckIcon as ShieldCheck,
  InformationCircleIcon as Info,
  HelpCircleIcon as HelpCircle,
  Delete02Icon as Trash2,
  LogOutIcon as LogOut,
  CheckIcon as Check,
  UserCircleIcon as CircleUserRound,
  LayoutGridIcon as LayoutGrid,
  BarChartIcon as BarChart3,
  TrendingUpIcon as TrendingUp,
  RepeatIcon as Repeat,
  HistoryIcon as History,
  Layers01Icon as Layers,
  Camera01Icon as Camera,
  Mail01Icon as Mail,
  UserRoundIcon as UserRound,
  PlusSignIcon as Plus,
} from '@/components/ui/solar-icons';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth-store';
import { ALL_TABS, useUiStore } from '@/store/ui-store';
import { useSettingsStore } from '@/store/settings-store';
import { useFamilyStore } from '@/store/family-store';
import { eventBus, DomainEventTypes } from '@/services/events-service';
import { SUPPORTED_LANGUAGES, isRTL } from '@/services/i18n-service';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

type SettingsTab = 'data' | 'params' | 'profile';

const TAB_DEFS: { id: SettingsTab; key: string; label: string }[] = [
  { id: 'data', key: 'settingsTab.data', label: 'Données' },
  { id: 'params', key: 'settingsTab.params', label: 'Paramètres' },
  { id: 'profile', key: 'settingsTab.profile', label: 'Profil' },
];

import { bibleTranslationDisplayName } from '@/services/bible-translation-names';
import { fireAndForget } from '@/lib/fire-and-forget';
import { Switch } from '@/components/ui/Switch';

const AVATAR_KEY = 'versyflow:profile:avatar';
const NAME_KEY = 'versyflow:profile:name';

export default function SettingsScreen() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<SettingsTab>('data');

  return (
    <div className="screen-column settings-premium h-full overflow-y-auto">
      <div className="settings-content">
        <header className="g1 settings-heading">
          <p className="settings-eyebrow">VersyFlow</p>
          <h1 className="page-title mt-2 mb-5">{t('nav.settings', 'Réglages')}</h1>
          <div className="settings-tabs" role="group" aria-label={t('settings.settings', 'Paramètres')}>
            {TAB_DEFS.map((d) => (
              <button key={d.id} type="button" onClick={() => setTab(d.id)} aria-pressed={tab === d.id}>
                {t(d.key, d.label)}
              </button>
            ))}
          </div>
        </header>
        <main className="settings-panel">
          {tab === 'data' && <DataTab />}
          {tab === 'params' && <ParamsTab />}
          {tab === 'profile' && <ProfileTab />}
        </main>
      </div>
    </div>
  );
}

/* ── Section A: Données ─────────────────────────────────────────────── */

/**
 * Déconnexion — une seule commande pour les deux dispositions (téléphone et
 * bureau). Elle était recopiée à l'identique deux fois dans ce fichier : deux
 * endroits à corriger quand la copie ou l'action change.
 */
function SignOutButton({ onSignOut }: { onSignOut: () => Promise<void> }) {
  const { t } = useTranslation();
  return (
    <button
      type="button"
      onClick={() => fireAndForget(onSignOut(), 'settings:signOut')}
      className="flex min-h-14 w-full items-center justify-center gap-2 rounded-full bg-surface px-4 text-base font-semibold text-error shadow-sm"
    >
      <DuoIcon icon={LogOut} size={18} />
      {t('settings.signOut', 'Se déconnecter')}
    </button>
  );
}

function DataTab() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const cards = [
    { icon: BarChart3, label: t('settingsHub.analytics', 'Statistiques détaillées'), sub: t('settingsHub.analyticsHint', 'Courbes et rétention'), to: '/analytics/dashboard' },
    { icon: TrendingUp, label: t('settingsHub.progress', 'Progression'), sub: t('settingsHub.progressHint', 'En cours et à réviser'), to: '/tabs/progress' },
    { icon: Repeat, label: t('home.review', 'Réviser'), sub: t('settingsHub.reviewHint', 'File de révision'), to: '/review/queue' },
    { icon: CloudUpload, label: t('settings.backup', 'Sauvegarde & Sync'), sub: t('settingsHub.backupHint', 'Exporter ou importer'), to: '/settings/backup' },
    { icon: History, label: t('nav.history', 'Historique'), sub: t('settingsHub.historyHint', 'Révisions passées'), to: '/review/history' },
    { icon: Layers, label: t('nav.collections', 'Collections'), sub: t('settingsHub.collectionsHint', 'Organisez vos versets'), to: '/collections' },
  ];

  return (
    <div className="settings-data-grid">
      {cards.map((c, i) => (
        <button
          key={i}
          onClick={() => navigate(c.to)}
          className="g2 settings-data-card"
        >
          <span className="icon-chip flex h-11 w-11 shrink-0 items-center justify-center rounded-full">
            <DuoIcon icon={c.icon} size={20} />
          </span>
          <span className="flex-1">
            <span className="block text-base font-semibold text-text-primary">{c.label}</span>
            <span className="block text-sm text-text-muted">{c.sub}</span>
          </span>
          <DuoIcon icon={ChevronRight} size={18} className="text-text-muted" />
        </button>
      ))}
    </div>
  );
}

/* ── Section B: Paramètres ──────────────────────────────────────────── */

function ParamsTab() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const signOut = useAuthStore((s) => s.signOut);
  const bibleTranslation = useSettingsStore((s) => s.bibleTranslation);
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
    navigate('/auth');
  };

  const groups = [
    {
      title: t('settings.apparence', 'Apparence'),
      rows: [
        { icon: <DuoIcon icon={Languages} size={20} />, label: t('settings.uiLanguage', "Langue de l'interface"), sub: getLanguageName(currentLanguage), onClick: () => setLanguageModalOpen(true) },
        { icon: <DuoIcon icon={BookText} size={20} />, label: t('settings.bibleTranslation', 'Traduction biblique'), sub: `${bibleTranslationDisplayName(bibleTranslation)} · ${t('settings.downloadTranslations', 'Télécharger d’autres versions')}`, onClick: () => navigate('/settings/available-translations') },
        { icon: <ThemeAppearanceIcon />, label: t('nav.theme', 'Thème et apparence'), sub: t('settingsHub.themeHint', 'Clair, sombre et accent'), onClick: () => navigate('/settings/appearance') },
      ],
    },
    {
      title: t('settings.sessionReminders', 'Session & Rappels'),
      rows: [
        { icon: <DuoIcon icon={LayoutGrid} size={20} />, label: t('settings.session', 'Session'), sub: t('settingsHub.sessionHint', 'Objectif et durée'), onClick: () => navigate('/settings/session') },
        { icon: <DuoIcon icon={CloudUpload} size={20} />, label: t('settings.reminders', 'Rappels'), sub: t('settingsHub.remindersHint', 'Heures et fréquence'), onClick: () => navigate('/settings/reminders') },
      ],
    },
    {
      title: t('settings.confidentialite', 'Confidentialité'),
      rows: [
        { icon: <DuoIcon icon={ShieldCheck} size={20} />, label: t('settings.privacyTitle', 'Données & confidentialité'), sub: t('settingsHub.privacyHint', 'Télémétrie et données'), onClick: () => navigate('/settings/privacy') },
      ],
    },
    {
      title: t('settings.about', 'À propos'),
      rows: [
        { icon: <DuoIcon icon={Info} size={20} />, label: t('settings.about', 'À propos'), sub: `${t('common.appName', 'VersyFlow')} v0.1.0`, onClick: () => navigate('/settings/about') },
        { icon: <DuoIcon icon={HelpCircle} size={20} />, label: t('settings.helpSupport', 'Aide & Support'), sub: t('settings.documentation', 'Guides et contact'), onClick: () => navigate('/settings/about') },
      ],
    },
  ];

  function getLanguageName(code: string) {
    const lang = SUPPORTED_LANGUAGES.find((l) => l.code === code);
    return lang ? lang.name : code;
  }

  return (
    <div className="settings-groups">
      {/* Navigation — enable/disable tabs */}
      <section>
        <div className="g2 settings-group-card overflow-hidden">
          <h2 className="flex items-center gap-2">
            <DuoIcon icon={LayoutGrid} size={16} />
            {t('settings.navigation', 'Navigation')}
          </h2>
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
                <Switch
                  checked={on}
                  onCheckedChange={() => setVisibleTab(tabItem.id, !on)}
                  label={t(tabItem.labelKey, tabItem.label)}
                  disabled={tabItem.id === 'settings'}
                />
              </div>
            );
          })}
        </div>
      </section>

      {/* Groups */}
      {groups.map((group) => (
        <section key={group.title}>
          <div className="g2 settings-group-card overflow-hidden">
            <h2>{group.title}</h2>
            {group.rows.map((row, i) => (
              <button key={i} onClick={row.onClick} className={cn('flex w-full items-center gap-3 p-4 text-left', i < group.rows.length - 1 && 'border-b border-divider')}>
                <span className="icon-chip flex h-10 w-10 shrink-0 items-center justify-center rounded-full">
                  {row.icon}
                </span>
                <span className="flex-1">
                  <span className="block text-base text-text-primary">{row.label}</span>
                  <span className="block text-sm text-text-muted">{row.sub}</span>
                </span>
                <DuoIcon icon={ChevronRight} size={18} className="text-text-muted" />
              </button>
            ))}
          </div>
        </section>
      ))}

      {/* Danger zone */}
      <section>
        <div className="g2 settings-group-card overflow-hidden">
          <h2>{t('settingsHub.danger', 'Zone de danger')}</h2>
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
              <DuoIcon icon={Trash2} size={20} className="text-error" />
            </span>
            <span className="flex-1">
              <span className="block text-base font-medium text-error">{t('settings.resetProgress', 'Réinitialiser la progression')}</span>
              <span className="block text-sm text-text-muted">{t('common.delete', 'Supprimer toutes les données')}</span>
            </span>
            <DuoIcon icon={ChevronRight} size={18} className="text-error" />
          </button>
        </div>
      </section>

      {isAuthenticated && (
        <SignOutButton onSignOut={handleSignOut} />
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
                  {selected && <DuoIcon icon={Check} size={18} className="text-primary" />}
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
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const signOut = useAuthStore((s) => s.signOut);
  const families = useFamilyStore((s) => s.families);
  const activeFamilyId = useFamilyStore((s) => s.activeFamilyId);
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
    navigate('/auth');
  };

  const actions = [
    { icon: UserRound, label: t('profile.manageProfiles', 'Gérer les profils'), sub: t('settingsHub.chooseLearner', 'Choisir qui apprend'), to: '/profile/select' },
    { icon: Plus, label: t('profile.createProfile', 'Ajouter un profil'), sub: t('settingsHub.multipleLearners', 'Plusieurs apprenants'), to: '/profile/create' },
    { icon: Download, label: t('settings.exportData', 'Exporter mes données'), sub: t('settingsHub.localBackup', 'Sauvegarde locale'), to: '/settings/backup' },
  ];

  return (
    <div className="settings-groups">
      {/* Identity card */}
      <div className="g2 settings-profile-card flex flex-col items-center p-6">
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
          <span className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-on-primary shadow">
            <DuoIcon icon={Camera} size={14} />
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
              <button
                onClick={saveName}
                className="rounded-full bg-primary p-2 text-on-primary"
                aria-label={t('common.save', 'Enregistrer')}
              >
                <DuoIcon icon={Check} size={16} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-2 text-xl font-extrabold text-text-primary"
            >
              {displayName}
              <DuoIcon icon={CircleUserRound} size={18} className="text-text-muted" />
            </button>
          )}
          <p className="mt-1 flex items-center gap-1.5 text-sm text-text-muted">
            <DuoIcon icon={Mail} size={14} />
            {isAuthenticated ? user?.email ?? t('profile.local', 'Local') : t('profile.local', 'Mode local')}
          </p>
          <div className="mt-3 flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-surface-tint px-2.5 py-1 text-xs font-semibold text-text-muted">
              {isAuthenticated ? t('profile.connected', 'Connecté') : t('profile.local', 'Local')}
            </span>
            {activeFamily && (
              <span className="inline-flex items-center gap-1 rounded-full bg-surface-tint px-2.5 py-1 text-xs font-semibold text-text-secondary">
                {activeFamily.name}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Data actions */}
      <section>
        <div className="g2 settings-group-card overflow-hidden">
          {actions.map((a, i) => (
            <button key={i} onClick={() => navigate(a.to)} className={cn('flex w-full items-center gap-3 p-4 text-left', i < actions.length - 1 && 'border-b border-divider')}>
              <span className="icon-chip flex h-10 w-10 shrink-0 items-center justify-center rounded-full">
                <DuoIcon icon={a.icon} size={18} />
              </span>
              <span className="flex-1">
                <span className="block text-base text-text-primary">{a.label}</span>
                <span className="block text-sm text-text-muted">{a.sub}</span>
              </span>
              <DuoIcon icon={ChevronRight} size={18} className="text-text-muted" />
            </button>
          ))}
        </div>
      </section>

      {isAuthenticated && (
        <SignOutButton onSignOut={handleSignOut} />
      )}
    </div>
  );
}
