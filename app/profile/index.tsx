import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { DuoIcon } from '@/components/ui/DuoIcon';
import {
  PencilIcon as Pencil,
  LogOutIcon as LogOut,
  UsersIcon as Users,
  GlobeIcon as Globe,
  BookTextIcon as BookText,
  Download01Icon as Download,
  UsersRoundIcon as UsersRound,
} from '@/components/ui/solar-icons';
import { FullScreenPage } from '@/components/layout/FullScreenPage';
import { ListItem } from '@/components/ui/ListItem';
import { Button } from '@/components/ui/button';
import { ProfileAvatar } from '@/components/profile/ProfileAvatar';
import { useAuthStore } from '@/store/auth-store';
import { useSettingsStore } from '@/store/settings-store';
import { useActiveProfile } from '@/hooks/useActiveProfile';
import { getMemorizationService } from '@/services/memorization-service-factory';
import { getFsrsEngine } from '@/services/fsrs-factory';
import { ProgressService } from '@/services/progress-service';
import type { ProgressStats } from '@/services/stats-calculator';
import { cn } from '@/lib/utils';
import { getTranslationDisplayInfo } from '@/services/bible-translation-names';
import { fireAndForget } from '@/lib/fire-and-forget';
import { localProfileCover } from '@/theme/profile-cover';
import { themeLandscapeUrl } from '@/theme/theme-catalog';
import { useAppearanceStore } from '@/store/appearance-store';
import { formatProgressLabel } from '@/lib/progress-label';

function StatTile({ value, label }: { value: number | null; label: string }) {
  return (
    <div className="g2 profile-stat">
      <p className="profile-stat-value">{value ?? '–'}</p>
      <p className="profile-stat-label">{label}</p>
    </div>
  );
}

export default function ProfileScreen() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const signOut = useAuthStore((s) => s.signOut);
  const bibleTranslation = useSettingsStore((s) => s.bibleTranslation);
  const setBibleTranslation = useSettingsStore((s) => s.setBibleTranslation);
  const { activeProfile, profiles } = useActiveProfile();
  // Optional personal slogan (entity field, synced via PowerSync).
  const slogan = activeProfile?.slogan;
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(() => localStorage.getItem('versyflow:profile:name') || user?.display_name || activeProfile?.displayName || '');
  const [photo] = useState(() => localStorage.getItem('versyflow:profile:avatar') || '');
  const imageTheme = useAppearanceStore((s) => s.colorThemeId);
  const [cover, setCover] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    void localProfileCover(photo).then((result) => { if (active) setCover(result); });
    return () => { active = false; };
  }, [photo]);
  const saveName = () => { localStorage.setItem('versyflow:profile:name', name); setEditing(false); };
  const [stats, setStats] = useState<ProgressStats | null>(null);

  const profileId = activeProfile?.id ?? 'default';

  useEffect(() => {
    let cancelled = false;
    void (async () => {
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
  const translationInfo = getTranslationDisplayInfo(bibleTranslation);

  const toggleTranslation = () =>
    setBibleTranslation(bibleTranslation === 'lsg' ? 'ostervald' : 'lsg');

  const handleSignOut = async () => {
    if (window.confirm(t('profile.confirmSignOut', 'Se deconnecter ?'))) {
      await signOut();
      navigate('/auth');
    }
  };

  return (
    <FullScreenPage title={t('common.profil', 'Profil')} showBack column={false}>
      <div className="profile-premium space-y-5">
        <div className="profile-hero" style={{ backgroundImage: `url("${cover ?? themeLandscapeUrl(imageTheme && imageTheme !== 'obj-miroir' ? imageTheme : 'nat-trees')}")` }}>
          <div className="profile-hero-content">
            <div className="profile-hero-text">
              <p className="profile-eyebrow">{isAuthenticated ? t('profile.connected', 'Connecté') : t('profile.localMode', 'Mode local')}</p>
              <div className="profile-name-row">
                {editing ? <input value={name} autoFocus onChange={(e) => setName(e.target.value)} onBlur={saveName} onKeyDown={(e) => { if (e.key === 'Enter') saveName(); }} aria-label={t('profile.setName', 'Définir un nom')} className="profile-name-input" /> : <h1>{displayName || t('profile.setName', 'Définir un nom')}</h1>}
                <button type="button" onClick={() => setEditing(true)} className="profile-name-edit" aria-label={t('common.edit', 'Modifier')}><DuoIcon icon={Pencil} size={18} /></button>
              </div>
              <p className="profile-slogan">{slogan || user?.userId || t('profile.localMode', 'Mode local')}</p>
            </div>
            <ProfileAvatar photo={photo.startsWith('data:image/') ? photo : null} name={displayName} size={144} className="profile-avatar" />
          </div>
        </div>

        {/* ── Stats band ── */}
        <div className="grid grid-cols-2 gap-3">
          <StatTile value={stats?.streakCount ?? null} label={t('progress.streak', 'Serie')} />
          <StatTile value={stats?.masteredVerses ?? null} label={formatProgressLabel(t('progress.mastered', 'Maîtrisés'), stats?.masteredVerses ?? 0, i18n.resolvedLanguage || i18n.language)} />
          <StatTile value={stats?.totalVerses ?? null} label={formatProgressLabel(t('progress.versesMemorized', 'Versets mémorisés'), stats?.totalVerses ?? 0, i18n.resolvedLanguage || i18n.language)} />
          <StatTile value={stats?.dueForReview ?? null} label={t('progress.toReview', 'A reviser')} />
        </div>

        {/* ── Preferences ── */}
        <div className="g2 overflow-hidden">
          <h2 className="px-4 pt-4 text-xs font-bold uppercase tracking-wide text-text-muted">
            {t('profile.preferences', 'Preferences')}
          </h2>
          <div className="mt-2 flex flex-col divide-y divide-[color:var(--color-divider)]">
            <ListItem
              icon={BookText}
              label={t('settings.bibleTranslation', 'Traduction')}
              value={`${translationInfo.abbreviation} · ${translationInfo.name}`}
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

        {/* ── Actions ── */}
        <div className="flex flex-col gap-3">
          <Button variant="outline" onClick={() => navigate('/settings/backup')}>
            <DuoIcon icon={Download} size={18} />
            {t('settings.exportData', 'Exporter mes donnees')}
          </Button>
          {profiles.length > 1 && (
            <Button variant="ghost" onClick={() => navigate('/profile/select')}>
              <DuoIcon icon={UsersRound} size={18} />
              {t('profile.manageProfiles', 'Gerer les profils')}
            </Button>
          )}
          {isAuthenticated && (
            <Button variant="ghost" className={cn('text-error')} onClick={() => fireAndForget(handleSignOut(), 'profile:signOut')}>
              <DuoIcon icon={LogOut} size={18} />
              {t('nav.signOut', 'Se deconnecter')}
            </Button>
          )}
        </div>
      </div>
    </FullScreenPage>
  );
}
