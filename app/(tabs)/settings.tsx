/**
 * Réglages — trois sections, une seule page.
 *
 * La page « Réglages » complète (`app/settings/index.tsx`) a été validée le
 * 30/10 : carte profil, carte traduction avec le sélecteur de type de version,
 * puis des blocs titrés (BIBLE, ACTIVITÉS & DONNÉES PERSONNELLES, APPLICATION).
 * Cet onglet reprend **exactement** ce langage — mêmes cartes, mêmes en-têtes
 * de section, mêmes rangées — et ajoute un sélecteur de section en haut pour
 * éviter d'empiler quatre écrans :
 *
 *   · Réglages — tout ce qui se règle (langue, traduction, apparence, rappels) ;
 *   · Données  — tout ce qui s'enregistre et l'historique (sauvegarde, export,
 *                révisions passées, statistiques, collections, remise à zéro) ;
 *   · Profil   — la personne : identité, badge, niveau de mémorisation,
 *                profils multiples, famille.
 *
 * Le sélecteur est un vrai `tablist` : flèches gauche/droite, Début/Fin,
 * `aria-selected`, panneau associé. Rien n'est caché aux lecteurs d'écran.
 */

import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { Icon as IconSvgElement } from '@solar-icons/react/lib/types';
import { DuoIcon } from '@/components/ui/DuoIcon';
import { ProfileAvatar } from '@/components/profile/ProfileAvatar';
import {
  BookTextIcon as BookText,
  Calendar01Icon as Calendar,
  BellIcon as Bell,
  CloudIcon as Cloud,
  PaletteIcon as Palette,
  LanguagesIcon as Languages,
  LayoutGridIcon as LayoutGrid,
  ListChecksIcon as ListChecks,
  SlidersHorizontalIcon as SlidersHorizontal,
  SparklesIcon as Sparkles,
  StarIcon as Star,
  Shield01Icon as Shield,
  HistoryIcon as History,
  ChartBarLineIcon as ChartBar,
  TrendingUpIcon as TrendingUp,
  Layers01Icon as Layers,
  Clock01Icon as Clock,
  Delete02Icon as Trash,
  ChevronRightIcon as ChevronRight,
  LogOutIcon as LogOut,
  UserCircleIcon as UserCircle,
  UserGroupIcon as UserGroup,
  UserRoundIcon as UserRound,
  PlusSignIcon as Plus,
  Download01Icon as Download,
  CheckIcon as Check,
  Medal01Icon as Medal,
  Camera01Icon as Camera,
} from '@/components/ui/solar-icons';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth-store';
import { useUiStore } from '@/store/ui-store';
import { BOTTOM_BAR_MAX } from '@/domains/navigation/bottom-bar';
import { useSettingsStore, type BibleVersionType } from '@/store/settings-store';
import { useActiveProfile } from '@/hooks/useActiveProfile';
import { getMemorizationService } from '@/services/memorization-service-factory';
import { StreakService } from '@/services/streak-service';
import { eventBus, DomainEventTypes } from '@/services/events-service';
import { SUPPORTED_LANGUAGES, isRTL } from '@/services/i18n-service';
import { getTranslationDisplayInfo } from '@/services/bible-translation-names';
import { memorizationProgress, MEMORIZATION_LEVELS } from '@/domains/progress/memorization-level';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { fireAndForget } from '@/lib/fire-and-forget';

type SettingsTab = 'params' | 'data' | 'profile';

const TAB_DEFS: { id: SettingsTab; key: string; label: string }[] = [
  { id: 'params', key: 'settingsTab.params', label: 'Réglages' },
  { id: 'data', key: 'settingsTab.data', label: 'Données' },
  { id: 'profile', key: 'settingsTab.profile', label: 'Profil' },
];

/** Les trois types de version — même jeu que l'onboarding et la page Réglages. */
const VERSION_TYPES: { id: BibleVersionType; i18nKey: string; label: string }[] = [
  { id: 'classical', i18nKey: 'onboarding.versionTypeClassical', label: 'Classique' },
  { id: 'modern', i18nKey: 'onboarding.versionTypeModern', label: 'Moderne' },
  { id: 'revised', i18nKey: 'onboarding.versionTypeRevised', label: 'Révisée' },
];

const AVATAR_KEY = 'versyflow:profile:avatar';
const NAME_KEY = 'versyflow:profile:name';

/* ── Briques partagées ──────────────────────────────────────────────── */

function SectionLabel({ icon, children }: { icon: IconSvgElement; children: React.ReactNode }) {
  return (
    <p className="settings-section-label">
      <DuoIcon icon={icon} size={16} className="text-text-muted" />
      {children}
    </p>
  );
}

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('settings-card overflow-hidden rounded-2xl bg-surface shadow-sm', className)}>
      {children}
    </div>
  );
}

interface RowProps {
  icon: IconSvgElement;
  label: string;
  sub?: string;
  trailing?: string;
  danger?: boolean;
  onClick?: () => void;
}

function Row({ icon, label, sub, trailing, danger, onClick }: RowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'settings-row flex w-full items-center gap-3 px-4 py-3.5 text-left',
        danger && 'text-error',
      )}
    >
      <span className="settings-row-chip flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-tint">
        <DuoIcon icon={icon} size={20} className={danger ? 'text-error' : 'text-text-secondary'} />
      </span>
      <span className="min-w-0 flex-1">
        <span className={cn('block truncate text-[15px]', danger ? 'font-semibold text-error' : 'text-text-primary')}>
          {label}
        </span>
        {sub && <span className="block truncate text-xs text-text-muted">{sub}</span>}
      </span>
      {trailing && <span className="text-xs text-text-muted">{trailing}</span>}
      <DuoIcon icon={ChevronRight} size={16} className={danger ? 'text-error' : 'text-text-muted'} />
    </button>
  );
}

function RowGroup({ children }: { children: React.ReactNode }) {
  return <div className="settings-row-group overflow-hidden rounded-2xl bg-surface shadow-sm">{children}</div>;
}

/* ── Écran ──────────────────────────────────────────────────────────── */

export default function SettingsScreen() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<SettingsTab>('params');
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const selectTab = (next: SettingsTab) => setTab(next);

  const onTabKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    const last = TAB_DEFS.length - 1;
    let target = -1;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') target = index === last ? 0 : index + 1;
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') target = index === 0 ? last : index - 1;
    else if (event.key === 'Home') target = 0;
    else if (event.key === 'End') target = last;
    if (target < 0) return;
    event.preventDefault();
    selectTab(TAB_DEFS[target].id);
    tabRefs.current[target]?.focus();
  };

  return (
    <div className="screen-column settings-premium h-full overflow-y-auto">
      <div className="settings-content">
        <header className="settings-heading g1">
          <h1>{t('nav.settings', 'Réglages')}</h1>
          <div
            className="settings-tabs"
            role="tablist"
            aria-label={t('settings.sectionsAria', 'Sections des réglages')}
          >
            {TAB_DEFS.map((def, index) => (
              <button
                key={def.id}
                ref={(node) => {
                  tabRefs.current[index] = node;
                }}
                id={`settings-tab-${def.id}`}
                type="button"
                role="tab"
                aria-selected={tab === def.id}
                aria-controls={`settings-panel-${def.id}`}
                tabIndex={tab === def.id ? 0 : -1}
                onClick={() => selectTab(def.id)}
                onKeyDown={(event) => onTabKeyDown(event, index)}
              >
                {t(def.key, def.label)}
              </button>
            ))}
          </div>
        </header>

        <main
          className="settings-panel"
          id={`settings-panel-${tab}`}
          role="tabpanel"
          aria-labelledby={`settings-tab-${tab}`}
          tabIndex={-1}
        >
          {tab === 'params' && <ParamsTab onOpenProfile={() => selectTab('profile')} />}
          {tab === 'data' && <DataTab />}
          {tab === 'profile' && <ProfileTab />}
        </main>
      </div>
    </div>
  );
}

/* ── Section 1 : Réglages ───────────────────────────────────────────── */

function ParamsTab({ onOpenProfile }: { onOpenProfile: () => void }) {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const bibleTranslation = useSettingsStore((s) => s.bibleTranslation);
  const bibleVersionType = useSettingsStore((s) => s.bibleVersionType);
  const setBibleVersionType = useSettingsStore((s) => s.setBibleVersionType);
  const barItems = useUiStore((s) => s.barItems);
  const [languageModalOpen, setLanguageModalOpen] = useState(false);

  const translation = getTranslationDisplayInfo(bibleTranslation);
  const currentLanguage = i18n.language ?? 'fr';
  const displayName = user?.display_name || t('settings.localUser', 'Utilisateur');

  const changeLanguage = (code: string) => {
    useSettingsStore.getState().setUiLanguage(code);
    void i18n.changeLanguage(code);
    document.documentElement.dir = isRTL(code) ? 'rtl' : 'ltr';
    setLanguageModalOpen(false);
  };

  const languageName = SUPPORTED_LANGUAGES.find((l) => l.code === currentLanguage)?.name ?? currentLanguage;

  return (
    <div className="settings-groups">
      {/* Profil — carte d'identité, mène à la section Profil. */}
      <button
        type="button"
        onClick={onOpenProfile}
        className="settings-card flex w-full items-center gap-4 rounded-2xl bg-surface p-4 text-left shadow-sm"
      >
        <ProfileAvatar name={displayName} size={46} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[15px] font-extrabold text-primary">{displayName}</span>
          <span className="block truncate text-[13px] text-text-muted">
            {isAuthenticated ? t('settings.connected', 'Connecté') : t('settings.localMode', 'Mode local')}
          </span>
        </span>
        <DuoIcon icon={ChevronRight} size={20} className="text-text-muted" />
      </button>

      {/* Traduction active + type de version. Même contrôle que la page validée. */}
      <div className="settings-card flex items-center gap-3 rounded-2xl bg-surface p-4 shadow-sm">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface-tint text-text-secondary">
          <DuoIcon icon={BookText} size={20} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-bold text-text-primary">
            {translation.abbreviation}
            {translation.abbreviation !== translation.name && (
              <span className="ms-2 font-medium text-text-muted">· {translation.name}</span>
            )}
          </p>
          {translation.language && (
            <p className="truncate text-xs text-text-muted">
              {translation.abbreviation} — {translation.language}
            </p>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <span className="text-2xs font-bold uppercase tracking-wide text-text-muted">
              {t('settings.versionTypeBadge', 'Type de version')}
            </span>
            <div className="flex gap-1" role="group" aria-label={t('settings.versionTypeBadge', 'Type de version')}>
              {VERSION_TYPES.map((version) => (
                <button
                  key={version.id}
                  type="button"
                  onClick={() => setBibleVersionType(version.id)}
                  aria-pressed={bibleVersionType === version.id}
                  className={cn(
                    'settings-version-pill rounded-full px-2.5 py-0.5 text-2xs font-semibold transition-colors',
                    bibleVersionType === version.id
                      ? 'bg-primary text-on-primary'
                      : 'bg-surface-tint text-text-secondary',
                  )}
                >
                  {t(version.i18nKey, version.label)}
                </button>
              ))}
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => navigate('/settings/available-translations')}
          aria-label={t('settings.bibleTranslation', 'Traduction biblique')}
          className="settings-chevron flex h-9 w-9 items-center justify-center rounded-full"
        >
          <DuoIcon icon={ChevronRight} size={20} className="text-text-muted" />
        </button>
      </div>

      <section>
        <SectionLabel icon={BookText}>{t('settings.bibleSection', 'Bible')}</SectionLabel>
        <RowGroup>
          <Row
            icon={BookText}
            label={t('settings.bibleTranslation', 'Traduction biblique')}
            onClick={() => navigate('/settings/available-translations')}
          />
          <Row
            icon={Sparkles}
            label={t('settings.versions', 'Versions de la Bible')}
            onClick={() => navigate('/settings/available-translations')}
          />
        </RowGroup>
      </section>

      <section>
        <SectionLabel icon={ListChecks}>
          {t('settings.activitiesSection', 'Activités & Données personnelles')}
        </SectionLabel>
        <RowGroup>
          <Row
            icon={ListChecks}
            label={t('settings.dataRow', 'Mes activités, tags & highlights')}
            onClick={() => navigate('/settings/data')}
          />
        </RowGroup>
      </section>

      <section>
        <SectionLabel icon={LayoutGrid}>{t('settings.appSection', 'Application')}</SectionLabel>
        <RowGroup>
          <Row
            icon={Languages}
            label={t('settings.uiLanguage', "Langue de l'interface")}
            sub={languageName}
            onClick={() => setLanguageModalOpen(true)}
          />
          <Row
            icon={Calendar}
            label={t('settings.session', 'Session de mémorisation')}
            onClick={() => navigate('/settings/session')}
          />
          <Row
            icon={Bell}
            label={t('settings.reminders', 'Rappels & notifications')}
            onClick={() => navigate('/settings/reminders')}
          />
        </RowGroup>
      </section>

      <section>
        <SectionLabel icon={Palette}>{t('settings.appearanceSection', 'Apparence & Lecture')}</SectionLabel>
        <RowGroup>
          <Row
            icon={Palette}
            label={t('nav.theme', 'Thème et apparence')}
            onClick={() => navigate('/settings/appearance')}
          />
          <Row
            icon={Layers}
            label={t('settings.themeImage', "Thèmes d'image")}
            onClick={() => navigate('/settings/theme-picker')}
          />
        </RowGroup>
      </section>

      <section>
        <SectionLabel icon={Star}>{t('settings.learningSection', 'Apprentissage sémantique')}</SectionLabel>
        <RowGroup>
          <Row
            icon={Star}
            label={t('settings.semanticTree', 'Arbre sémantique & modes')}
            onClick={() => navigate('/semantic')}
          />
        </RowGroup>
      </section>

      <section>
        <SectionLabel icon={SlidersHorizontal}>
          {t('settings.navigationSection', 'Navigation & Pages')}
        </SectionLabel>
        <RowGroup>
          {/* La barre se configure dans son écran dédié : entrées épinglables,
              ordre, libellés, densité. Un simple interrupteur ne suffisait pas. */}
          <Row
            icon={SlidersHorizontal}
            label={t('settings.navigationBottomBarTitle', 'Barre d’onglets')}
            sub={t('settings.navBarRowSub', {
              count: barItems.length,
              max: BOTTOM_BAR_MAX,
              defaultValue: '{{count}} / {{max}} onglets · ordre, libellés et densité',
            })}
            onClick={() => navigate('/settings/navigation')}
          />
        </RowGroup>
      </section>

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
                        selected ? 'font-semibold text-primary' : 'font-medium text-text-primary',
                      )}
                    >
                      {lang.name}
                    </span>
                    <span className="text-sm text-text-muted">{lang.displayName}</span>
                  </span>
                  {selected && <DuoIcon icon={Check} size={20} className="text-primary" />}
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ── Section 2 : Données & historique ───────────────────────────────── */

function DataTab() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="settings-groups">
      <section>
        <SectionLabel icon={History}>{t('settings.historySection', 'Historique & activité')}</SectionLabel>
        <RowGroup>
          <Row
            icon={History}
            label={t('settings.dataReviewHistory', 'Historique de mes révisions')}
            onClick={() => navigate('/review/history')}
          />
          <Row
            icon={ChartBar}
            label={t('settingsHub.analytics', 'Statistiques détaillées')}
            sub={t('settingsHub.analyticsHint', 'Courbes et rétention')}
            onClick={() => navigate('/analytics/dashboard')}
          />
          <Row
            icon={TrendingUp}
            label={t('settingsHub.progress', 'Progression')}
            sub={t('settingsHub.progressHint', 'En cours et à réviser')}
            onClick={() => navigate('/tabs/progress')}
          />
          <Row
            icon={Clock}
            label={t('home.review', 'File de révision')}
            sub={t('settingsHub.reviewHint', 'Versets à revoir aujourd’hui')}
            onClick={() => navigate('/review/queue')}
          />
          <Row
            icon={Layers}
            label={t('nav.collections', 'Collections')}
            onClick={() => navigate('/collections')}
          />
        </RowGroup>
      </section>

      <section>
        <SectionLabel icon={Cloud}>{t('settings.dataSection', 'Données & Synchronisation')}</SectionLabel>
        <RowGroup>
          <Row
            icon={Cloud}
            label={t('settings.backup', 'Sauvegarde & export')}
            onClick={() => navigate('/settings/backup')}
          />
          <Row
            icon={Download}
            label={t('settings.exportData', 'Exporter mes données')}
            sub={t('settingsHub.localBackup', 'Sauvegarde locale')}
            onClick={() => navigate('/settings/backup')}
          />
          <Row
            icon={BookText}
            label={t('settings.downloadTranslations', 'Versions téléchargées')}
            onClick={() => navigate('/settings/available-translations')}
          />
          <Row
            icon={Shield}
            label={t('settings.privacy', 'Confidentialité & données')}
            onClick={() => navigate('/settings/privacy')}
          />
        </RowGroup>
      </section>

      <section>
        <SectionLabel icon={Trash}>{t('settingsHub.danger', 'Zone de danger')}</SectionLabel>
        <RowGroup>
          <Row
            icon={Trash}
            danger
            label={t('settings.resetProgress', 'Réinitialiser la progression')}
            sub={t('common.delete', 'Supprimer toutes les données')}
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
          />
        </RowGroup>
      </section>
    </div>
  );
}

/* ── Section 3 : Profil, badge et niveau ────────────────────────────── */

function ProfileTab() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const signOut = useAuthStore((s) => s.signOut);
  const { activeProfile } = useActiveProfile();
  const profileId = activeProfile?.id ?? 'default';
  const fileRef = useRef<HTMLInputElement>(null);

  const [avatar, setAvatar] = useState<string>(() => localStorage.getItem(AVATAR_KEY) ?? '');
  const [name, setName] = useState<string>(
    () => localStorage.getItem(NAME_KEY) ?? user?.display_name ?? '',
  );
  const [editing, setEditing] = useState(false);
  const [stats, setStats] = useState<{ total: number; mastered: number; streak: number } | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const service = getMemorizationService(profileId);
        const [records, streak] = await Promise.all([
          service.getAllMemorized(),
          new StreakService(service, profileId).calculateStreak(),
        ]);
        if (cancelled) return;
        setStats({
          total: records.length,
          mastered: records.filter((record) => record.status === 'mastered').length,
          streak,
        });
      } catch (error) {
        console.error('[Settings] profile stats failed:', error);
        if (!cancelled) setStats(null);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [profileId]);

  const displayName = name || user?.display_name || t('settings.localUser', 'Utilisateur');
  const progress = memorizationProgress(stats?.total ?? 0);
  const levelKey = progress.level.id;

  const saveName = () => {
    localStorage.setItem(NAME_KEY, name.trim());
    setEditing(false);
  };

  const pickPhoto = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
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

  return (
    <div className="settings-groups">
      {/* Identité */}
      <Card className="p-5">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full"
            aria-label={t('profile.avatar', 'Changer la photo')}
          >
            <ProfileAvatar photo={avatar || null} name={displayName} size={64} />
            <span className="absolute bottom-0 end-0 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-on-primary shadow">
              <DuoIcon icon={Camera} size={16} />
            </span>
          </button>
          <input ref={fileRef} type="file" accept="image/*" onChange={pickPhoto} className="hidden" />

          <div className="min-w-0 flex-1">
            {editing ? (
              <div className="flex items-center gap-2">
                <input
                  value={name}
                  aria-label={t('profile.name', 'Nom affiché')}
                  onChange={(event) => setName(event.target.value)}
                  placeholder={t('profile.namePlaceholder', 'Ex : Sarah, David...')}
                  className="min-w-0 flex-1 rounded-full bg-surface-tint px-3 py-1.5 text-[15px] text-text-primary outline-none ring-2 ring-[color:var(--color-primary)]"
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
                type="button"
                onClick={() => setEditing(true)}
                className="flex items-center gap-2 text-[17px] font-extrabold text-primary"
              >
                <span className="truncate">{displayName}</span>
                <DuoIcon icon={UserCircle} size={20} className="shrink-0 text-text-muted" />
              </button>
            )}
            <p className="mt-0.5 truncate text-[13px] text-text-muted">
              {isAuthenticated ? user?.email ?? t('profile.connected', 'Connecté') : t('settings.localMode', 'Mode local')}
            </p>
          </div>
        </div>
      </Card>

      {/* Badge + niveau de mémorisation */}
      <Card className="p-5">
        <div className="flex items-center gap-4">
          <span
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/12 text-primary"
            aria-hidden="true"
          >
            <DuoIcon icon={Medal} size={24} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-2xs font-bold uppercase tracking-wide text-text-muted">
              {t('settings.badgeTitle', 'Badge & niveau')}
            </p>
            <p className="truncate text-[17px] font-extrabold text-text-primary">
              {t(`levels.${levelKey}`, progress.level.label)}
            </p>
            <p className="text-[13px] text-text-muted">
              {stats === null
                ? t('settings.levelLoading', 'Calcul en cours…')
                : progress.next
                  ? t('settings.levelNext', {
                      count: progress.remaining ?? 0,
                      level: t(`levels.${progress.next.id}`, progress.next.label),
                      defaultValue: 'Plus que {{count}} versets avant « {{level}} »',
                    })
                  : t('settings.levelMax', 'Palier maximal atteint')}
            </p>
          </div>
        </div>

        {progress.ratio !== null && (
          <div
            className="mt-4 h-2 w-full overflow-hidden rounded-full bg-surface-tint"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round((progress.ratio ?? 0) * 100)}
            aria-label={t('settings.levelTitle', 'Niveau de mémorisation')}
          >
            <span
              className="block h-full rounded-full bg-primary transition-all"
              style={{ width: `${Math.round((progress.ratio ?? 0) * 100)}%` }}
            />
          </div>
        )}

        <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
          <div>
            <dt className="text-2xs text-text-muted">{t('settings.versesMemorized', 'Mémorisés')}</dt>
            <dd className="text-base font-bold text-text-primary">{stats?.total ?? '–'}</dd>
          </div>
          <div>
            <dt className="text-2xs text-text-muted">{t('settings.versesMastered', 'Maîtrisés')}</dt>
            <dd className="text-base font-bold text-text-primary">{stats?.mastered ?? '–'}</dd>
          </div>
          <div>
            <dt className="text-2xs text-text-muted">{t('settings.streakDays', 'Jours de suite')}</dt>
            <dd className="text-base font-bold text-text-primary">{stats?.streak ?? '–'}</dd>
          </div>
        </dl>
      </Card>

      <section>
        <SectionLabel icon={UserRound}>{t('settings.profileSection', 'Mon profil')}</SectionLabel>
        <RowGroup>
          <Row
            icon={UserRound}
            label={t('profile.manageProfiles', 'Gérer les profils')}
            sub={t('settingsHub.chooseLearner', 'Choisir qui apprend')}
            onClick={() => navigate('/profile/select')}
          />
          <Row
            icon={Plus}
            label={t('profile.createProfile', 'Ajouter un profil')}
            sub={t('settingsHub.multipleLearners', 'Plusieurs apprenants')}
            onClick={() => navigate('/profile/create')}
          />
          <Row
            icon={UserGroup}
            label={t('nav.family', 'Famille')}
            onClick={() => navigate('/family/home')}
          />
        </RowGroup>
      </section>

      {isAuthenticated && (
        <button
          type="button"
          onClick={() => fireAndForget(handleSignOut(), 'settings:signOut')}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-surface p-4 text-base font-semibold text-error shadow-sm"
        >
          <DuoIcon icon={LogOut} size={20} />
          {t('settings.signOut', 'Se déconnecter')}
        </button>
      )}
    </div>
  );
}
