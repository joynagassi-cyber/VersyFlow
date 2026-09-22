import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Pencil, LogOut, Users, Globe, BookText, Download, UsersRound } from 'lucide-react';
import { FullScreenPage } from '@/components/layout/FullScreenPage';
import { ListItem } from '@/components/ui/ListItem';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/auth-store';
import { useSettingsStore } from '@/store/settings-store';
import { useActiveProfile } from '@/hooks/useActiveProfile';
import { getMemorizationService } from '@/services/memorization-service-factory';
import { getFsrsEngine } from '@/services/fsrs-factory';
import { ProgressService } from '@/services/progress-service';
import type { ProgressStats } from '@/services/stats-calculator';
import { cn } from '@/lib/utils';

import { bibleTranslationDisplayName } from '@/services/bible-translation-names';

function StatTile({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-2xl bg-surface p-3 text-center shadow-sm">
      <p className="text-2xl font-extrabold text-primary">{value}</p>
      <p className="mt-1 text-[11px] font-medium uppercase tracking-wide text-text-muted">{label}</p>
    </div>
  );
}

export default function ProfileScreen() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, isAuthenticated, signOut } = useAuthStore();
  const { bibleTranslation, setBibleTranslation } = useSettingsStore();
  const { activeProfile, profiles } = useActiveProfile();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.display_name || activeProfile?.displayName || '');
  const [stats, setStats] = useState<ProgressStats | null>(null);

  const profileId = activeProfile?.id ?? 'default';

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const service = getMemorizationService(profileId);
        const progress = new ProgressService(service, getFsrsEngine(), undefined, profileId);
        const data = await progress.getStats();
        if (!cancelled) setStats(data);
      } catch {
        if (!cancelled) setStats(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [profileId]);

  const displayName = name || user?.display_name || activeProfile?.displayName || '';
  const initial = (displayName || 'U').charAt(0).toUpperCase();

  const toggleTranslation = () =>
    setBibleTranslation(bibleTranslation === 'lsg' ? 'ostervald' : 'lsg');

  const handleSignOut = async () => {
    if (window.confirm(t('profile.confirmSignOut', 'Se deconnecter ?'))) {
      await signOut();
      navigate('/auth/login');
    }
  };

  return (
    <FullScreenPage title={t('common.profil', 'Profil')} showBack>
      <div className="mx-auto max-w-md space-y-5">
        {/* Header card */}
        <div className="gradient-hero glow-primary rounded-3xl p-5 text-white">
          <div className="flex items-center gap-4">
            <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-white/25 text-2xl font-extrabold">
              {initial}
            </span>
            <div className="min-w-0 flex-1">
              {editing ? (
                <input
                  value={name}
                  autoFocus
                  onChange={(e) => setName(e.target.value)}
                  onBlur={() => setEditing(false)}
                  onKeyDown={(e) => e.key === 'Enter' && setEditing(false)}
                  className="w-full rounded-lg bg-white/20 px-2 py-1 text-lg font-bold text-white outline-none"
                />
              ) : (
                <p className="truncate text-lg font-bold">{displayName || t('profile.setName', 'Definir un nom')}</p>
              )}
              <p className="truncate text-sm text-white/80">{user?.userId || 'Mode local'}</p>
              <span className="mt-2 inline-block rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-semibold">
                {isAuthenticated ? t('profile.connected', 'Connecte') : t('profile.local', 'Local')}
              </span>
            </div>
            <button
              onClick={() => setEditing(true)}
              className="rounded-full bg-white/20 p-2 active:bg-white/30"
              aria-label="edit"
            >
              <Pencil size={16} />
            </button>
          </div>
        </div>

        {/* Stats band */}
        <div className="grid grid-cols-2 gap-3">
          <StatTile value={stats?.streakCount ?? 0} label={t('progress.streak', 'Serie')} />
          <StatTile value={stats?.masteredVerses ?? 0} label={t('progress.mastered', 'Maitres')} />
          <StatTile value={stats?.totalVerses ?? 0} label={t('progress.versesMemorized', 'Versets')} />
          <StatTile value={stats?.dueForReview ?? 0} label={t('progress.toReview', 'A reviser')} />
        </div>

        {/* Preferences */}
        <div className="overflow-hidden rounded-2xl bg-surface shadow-sm">
          <h2 className="px-4 pt-4 text-xs font-bold uppercase tracking-wide text-text-muted">
            {t('profile.preferences', 'Preferences')}
          </h2>
          <div className="mt-2 flex flex-col divide-y divide-[color:var(--color-divider)]">
            <ListItem
              icon={BookText}
              label={t('settings.bibleTranslation', 'Traduction')}
              value={bibleTranslationDisplayName(bibleTranslation)}
              onClick={toggleTranslation}
            />
            <ListItem
              icon={Globe}
              label={t('settings.uiLanguage', 'Langue')}
              onClick={() => navigate('/settings/languages')}
              showChevron
            />
            <ListItem
              icon={Users}
              label={t('profile.activeProfile', 'Profil actif')}
              value={activeProfile?.displayName}
              onClick={() => navigate('/profile/select')}
              showChevron
            />
            <ListItem
              icon={UsersRound}
              label={t('profile.createProfile', 'Creer un profil')}
              onClick={() => navigate('/profile/create')}
              showChevron
            />
            <ListItem
              icon={Users}
              label={t('settings.family', 'Famille active')}
              onClick={() => navigate('/family/home')}
              showChevron
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <Button variant="outline" onClick={() => navigate('/settings/backup')}>
            <Download size={18} />
            {t('settings.exportData', 'Exporter mes donnees')}
          </Button>
          {profiles.length > 1 && (
            <Button variant="ghost" onClick={() => navigate('/profile/select')}>
              <UsersRound size={18} />
              {t('profile.manageProfiles', 'Gerer les profils')}
            </Button>
          )}
          {isAuthenticated && (
            <Button variant="ghost" className={cn('text-error')} onClick={handleSignOut}>
              <LogOut size={18} />
              {t('nav.signOut', 'Se deconnecter')}
            </Button>
          )}
        </div>
      </div>
    </FullScreenPage>
  );
}
