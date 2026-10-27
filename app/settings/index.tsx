import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  User,
  Cloud,
  Palette,
  Languages,
  Calendar,
  Bell,
  Shield,
  BookOpen,
  LogOut,
  ChevronRight,
  Sparkles,
  LayoutGrid,
  Layers,
  Star,
  BookText,
  SlidersHorizontal,
  ListChecks,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { FullScreenPage } from '@/components/layout/FullScreenPage';
import { Button } from '@/components/ui/button';
import { ProfileAvatar } from '@/components/profile/ProfileAvatar';
import { useAuthStore } from '@/store/auth-store';
import { useSettingsStore, type BibleVersionType } from '@/store/settings-store';
import { getTranslationDisplayInfo } from '@/services/bible-translation-names';

type Row = { label: string; icon: LucideIcon; to: string };

/** The three version types, with their i18n keys (shared with onboarding). */
const VERSION_TYPES: { id: BibleVersionType; i18nKey: string; label: string }[] = [
  { id: 'classical', i18nKey: 'onboarding.versionTypeClassical', label: 'Classique' },
  { id: 'modern', i18nKey: 'onboarding.versionTypeModern', label: 'Moderne' },
  { id: 'revised', i18nKey: 'onboarding.versionTypeRevised', label: 'Révisée' },
];

export default function SettingsScreen() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const signOut = useAuthStore((s) => s.signOut);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSignOut = () => {
    signOut();
    navigate('/auth');
  };

  const displayName = user?.display_name || t('settings.localUser', 'Utilisateur');
  const bibleTranslation = useSettingsStore((s) => s.bibleTranslation);
  const bibleVersionType = useSettingsStore((s) => s.bibleVersionType);
  const setBibleVersionType = useSettingsStore((s) => s.setBibleVersionType);
  const translationInfo = getTranslationDisplayInfo(bibleTranslation);

  // Settings reorganized into clearly divided vertical sections. Each group
  // is a distinct user concern: Bible, App, Appearance, Learning, Sync,
  // New features, and Bottom-nav page toggles.
  const groups: { title: string; icon: LucideIcon; items: Row[] }[] = [
    {
      title: t('settings.bibleSection', 'Bible'),
      icon: BookText,
      items: [
        {
          label: t('settings.bibleTranslation', 'Traduction biblique'),
          icon: BookText,
          to: '/settings/available-translations',
        },
      ],
    },
    {
      title: t('settings.activitiesSection', 'Activités & Données personnelles'),
      icon: ListChecks,
      items: [
        {
          label: t('settings.dataRow', 'Mes activités, tags & highlights'),
          icon: ListChecks,
          to: '/settings/data',
        },
      ],
    },
    {
      title: t('settings.appSection', 'Application'),
      icon: LayoutGrid,
      items: [
        { label: t('settings.uiLanguage', 'Langue de l’interface'), icon: Languages, to: '/settings/languages' },
        { label: t('settings.session', 'Session de mémorisation'), icon: Calendar, to: '/settings/session' },
        { label: t('settings.reminders', 'Rappels & notifications'), icon: Bell, to: '/settings/reminders' },
      ],
    },
    {
      title: t('settings.appearanceSection', 'Apparence & Lecture'),
      icon: Palette,
      items: [
        { label: t('settings.theme', 'Thème, couleurs & Lecture'), icon: Palette, to: '/settings/appearance' },
        { label: t('settings.themeImage', "Thèmes d'image"), icon: Layers, to: '/settings/theme-picker' },
      ],
    },
    {
      title: t('settings.learningSection', 'Apprentissage sémantique'),
      icon: Star,
      items: [
        {
          label: t('settings.semanticTree', 'Arbre sémantique & modes'),
          icon: Star,
          to: '/semantic',
        },
      ],
    },
    {
      title: t('settings.navigationSection', 'Navigation & Pages'),
      icon: LayoutGrid,
      items: [
        {
          label: t('settings.navigationSettings', 'Pages visibles & menu'),
          icon: SlidersHorizontal,
          to: '/settings/navigation',
        },
      ],
    },
    {
      title: t('settings.dataSection', 'Données & Synchronisation'),
      icon: Cloud,
      items: [
        { label: t('settings.backup', 'Sauvegarde & export'), icon: Cloud, to: '/settings/backup' },
        { label: t('settings.privacy', 'Confidentialité & données'), icon: Shield, to: '/settings/privacy' },
      ],
    },
    {
      title: t('settings.newFeaturesSection', 'Nouveautés'),
      icon: Sparkles,
      items: [
        { label: t('settings.versions', 'Versions de la Bible'), icon: BookText, to: '/settings/available-translations' },
      ],
    },
  ];

  return (
    <FullScreenPage title={t('nav.settings', 'Parametres')} showBack>
      <div className="mx-auto max-w-md space-y-5">
        {/* Profile card — premium avatar (photo → vector illustration fallback) */}
        <button
          onClick={() => navigate('/profile')}
          className="flex w-full items-center gap-4 rounded-3xl bg-surface p-4 text-left shadow-sm"
        >
          <ProfileAvatar name={displayName} size={48} />
          <span className="min-w-0 flex-1">
            <span className="text-gradient-hero block truncate text-base font-extrabold">
              {displayName}
            </span>
            <span className="block truncate text-sm text-text-muted">
              {isAuthenticated ? t('settings.connected', 'Connecte') : t('settings.localMode', 'Mode local')}
            </span>
          </span>
          <ChevronRight size={18} className="text-text-muted" />
        </button>

        {/* Active translation pill (abbreviation + full name, subtitle). */}
        <div className="flex items-center gap-3 rounded-2xl bg-surface p-4 shadow-sm">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-tint text-primary">
            <BookText size={18} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-text-primary">
              {translationInfo.abbreviation}
              {translationInfo.abbreviation !== translationInfo.name && (
                <span className="ml-2 font-medium text-text-muted">· {translationInfo.name}</span>
              )}
            </p>
            <p className="text-xs text-text-muted">
              {translationInfo.language ? (
                <>
                  {translationInfo.abbreviation} — {translationInfo.language}
                </>
              ) : (
                translationInfo.abbreviation
              )}
            </p>
            {/* Compact version-type switch — writes bibleVersionType, which
                filters the onboarding translation picker. */}
            <div className="mt-2 flex items-center gap-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-text-muted">
                {t('settings.versionTypeBadge', 'Type de version')}
              </span>
              <div className="flex gap-1">
                {VERSION_TYPES.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setBibleVersionType(v.id)}
                    className={cn(
                      'rounded-full px-2 py-0.5 text-[11px] font-semibold transition',
                      bibleVersionType === v.id
                        ? 'bg-primary text-white'
                        : 'bg-surface-tint text-text-secondary',
                    )}
                  >
                    {t(v.i18nKey, v.label)}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <ChevronRight
            size={18}
            className="cursor-pointer text-text-muted"
            onClick={() => navigate('/settings/available-translations')}
          />
        </div>

        {/* Divided vertical sections */}
        {groups.map((group, gi) => (
          <div key={gi}>
            <p className="mb-2 flex items-center gap-2 px-1 text-xs font-bold uppercase tracking-wide text-text-muted">
              <group.icon size={13} className="text-primary" />
              {group.title}
            </p>
            <div className="overflow-hidden rounded-2xl bg-surface shadow-sm">
              {group.items.map((item, i) => (
                <button
                  key={i}
                  onClick={() => navigate(item.to)}
                  className={
                    'flex w-full items-center justify-between px-4 py-3.5 text-left ' +
                    (i < group.items.length - 1
                      ? 'border-b border-[color:var(--color-divider)]'
                      : '')
                  }
                >
                  <span className="flex items-center gap-3">
                    <item.icon size={18} className="text-text-muted" />
                    <span className="text-base text-text-primary">{item.label}</span>
                  </span>
                  <ChevronRight size={16} className="text-text-muted" />
                </button>
              ))}
            </div>
          </div>
        ))}

        {/* Sign out */}
        {isAuthenticated && (
          <button
            onClick={() => setShowConfirm(true)}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-surface py-3.5 font-semibold text-error shadow-sm"
          >
            <LogOut size={18} />
            {t('settings.signOut', 'Se deconnecter')}
          </button>
        )}
      </div>

      {/* Confirm modal */}
      {showConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6"
          onClick={() => setShowConfirm(false)}
        >
          <div
            className="w-full max-w-[320px] rounded-3xl bg-surface p-6 text-center shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-xl font-bold text-text-primary">
              {t('settings.signOutTitle', 'Deconnexion')}
            </p>
            <p className="mt-2 text-sm text-text-secondary">
              {t('settings.signOutConfirm', 'Etes-vous sur de vouloir vous deconnecter ?')}
            </p>
            <div className="mt-5 flex gap-3">
              <Button variant="ghost" className="flex-1" onClick={() => setShowConfirm(false)}>
                {t('common.cancel', 'Annuler')}
              </Button>
              <Button variant="destructive" className="flex-1" onClick={handleSignOut}>
                {t('settings.signOut', 'Deconnexion')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </FullScreenPage>
  );
}
