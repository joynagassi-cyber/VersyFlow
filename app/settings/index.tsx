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
} from 'lucide-react';
import { FullScreenPage } from '@/components/layout/FullScreenPage';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/auth-store';

type Row = { label: string; icon: typeof User; to: string };

export default function SettingsScreen() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, isAuthenticated, signOut } = useAuthStore();
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSignOut = () => {
    signOut();
    navigate('/auth/login');
  };

  const groups: { title: string; items: Row[] }[] = [
    {
      title: t('settings.compte', 'Compte'),
      items: [
        { label: t('settings.profil', 'Profil'), icon: User, to: '/profile' },
        ...(isAuthenticated
          ? [{ label: t('settings.sync', 'Synchronisation'), icon: Cloud, to: '/settings/backup' }]
          : []),
      ],
    },
    {
      title: t('settings.apparence', 'Apparence'),
      items: [
        { label: t('settings.theme', 'Theme'), icon: Palette, to: '/settings/appearance' },
        { label: t('settings.uiLanguage', 'Langue'), icon: Languages, to: '/settings/languages' },
      ],
    },
    {
      title: t('settings.sessionReminders', 'Session & Rappels'),
      items: [
        { label: t('settings.session', 'Session'), icon: Calendar, to: '/settings/session' },
        { label: t('settings.reminders', 'Rappels'), icon: Bell, to: '/settings/reminders' },
      ],
    },
    {
      title: t('settings.confidentialite', 'Confidentialite'),
      items: [
        { label: t('settings.data', 'Donnees'), icon: Shield, to: '/settings/privacy' },
        { label: t('settings.backup', 'Sauvegarde'), icon: Cloud, to: '/settings/backup' },
      ],
    },
    {
      title: t('settings.aide', 'Aide'),
      items: [{ label: t('settings.about', "A propos"), icon: BookOpen, to: '/settings/about' }],
    },
  ];

  return (
    <FullScreenPage title={t('nav.settings', 'Parametres')} showBack>
      <div className="mx-auto max-w-md space-y-5">
        {/* Profile card */}
        <button
          onClick={() => navigate('/profile')}
          className="flex w-full items-center gap-4 rounded-3xl bg-surface p-4 text-left shadow-sm"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-xl font-bold text-white">
            {(user?.display_name || 'U').charAt(0).toUpperCase()}
          </span>
          <span className="flex-1">
            <span className="block text-base font-semibold text-text-primary">
              {user?.display_name || t('settings.localUser', 'Utilisateur')}
            </span>
            <span className="text-sm text-text-muted">
              {isAuthenticated
                ? t('settings.connected', 'Connecte')
                : t('settings.localMode', 'Mode local')}
            </span>
          </span>
          <ChevronRight size={18} className="text-text-muted" />
        </button>

        {/* Groups */}
        {groups.map((group, gi) => (
          <div key={gi}>
            <p className="mb-2 px-1 text-xs font-bold uppercase tracking-wide text-text-muted">
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
