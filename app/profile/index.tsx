import { useEffect, useRef, useState, type CSSProperties } from 'react';
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
  Camera01Icon as Camera,
  CheckIcon as Check,
} from '@/components/ui/solar-icons';
import { FullScreenPage } from '@/components/layout/FullScreenPage';
import { ListItem } from '@/components/ui/ListItem';
import { Button } from '@/components/ui/button';
import { ProfileAvatar } from '@/components/profile/ProfileAvatar';
import { useAuthStore } from '@/store/auth-store';
import { useSettingsStore } from '@/store/settings-store';
import { useActiveProfile } from '@/hooks/useActiveProfile';
import { useProfileSyncStore } from '@/store/profile-sync-store';
import { useProfileStore } from '@/store/profile-store';
import { getLearnerProfileRepository } from '@/infrastructure/repository/powersync-repositories';
import { getMemorizationService } from '@/services/memorization-service-factory';
import { getFsrsEngine } from '@/services/fsrs-factory';
import { ProgressService } from '@/services/progress-service';
import type { ProgressStats } from '@/services/stats-calculator';
import { cn } from '@/lib/utils';
import { getTranslationDisplayInfo } from '@/services/bible-translation-names';
import { fireAndForget } from '@/lib/fire-and-forget';
import {
  readPersistedProfileCover,
  resolveAndPersistProfileCover,
  type LocalProfileCoverSpec,
} from '@/theme/profile-cover';
import { isImageTheme, themeLandscapeUrl } from '@/theme/theme-catalog';
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
  const slogan = activeProfile?.slogan;

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(
    () =>
      localStorage.getItem('versyflow:profile:name') ||
      activeProfile?.displayName ||
      user?.display_name ||
      '',
  );

  useEffect(() => {
    if (!localStorage.getItem('versyflow:profile:name') && activeProfile?.displayName && !editing) {
      setName(activeProfile.displayName);
    }
  }, [activeProfile?.displayName, editing]);

  // Photo et couverture vivent exclusivement dans le stockage local de
  // l'appareil (en mode démo : préfixe isolé). Aucune donnée ne quitte l'appareil.
  const [photo, setPhoto] = useState(() => localStorage.getItem('versyflow:profile:avatar') || '');
  const [coverSpec, setCoverSpec] = useState<LocalProfileCoverSpec | null>(() =>
    readPersistedProfileCover(localStorage.getItem('versyflow:profile:avatar') || ''),
  );
  const fileRef = useRef<HTMLInputElement>(null);

  const pickPhoto = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const url = typeof reader.result === 'string' ? reader.result : '';
      if (!url) return;
      localStorage.setItem('versyflow:profile:avatar', url);
      setPhoto(url);
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    let mounted = true;
    void resolveAndPersistProfileCover(photo).then((result) => {
      if (mounted) setCoverSpec(result);
    });
    return () => {
      mounted = false;
    };
  }, [photo]);

  const saveName = () => {
    const trimmed = name.trim();
    localStorage.setItem('versyflow:profile:name', trimmed);
    setName(trimmed);
    setEditing(false);

    if (trimmed && activeProfile?.id) {
      const syncProfiles = useProfileSyncStore.getState().profiles;
      if (syncProfiles.some((p) => p.id === activeProfile.id)) {
        useProfileSyncStore.getState().setProfiles(
          syncProfiles.map((p) =>
            p.id === activeProfile.id ? { ...p, displayName: trimmed } : p,
          ),
        );
      }
      const localProfiles = useProfileStore.getState().profiles;
      if (localProfiles.some((p) => p.id === activeProfile.id)) {
        useProfileStore.getState().setProfiles(
          localProfiles.map((p) =>
            p.id === activeProfile.id ? { ...p, displayName: trimmed } : p,
          ),
        );
      }
      fireAndForget(
        getLearnerProfileRepository().update(activeProfile.id, { displayName: trimmed }),
        'profile:rename',
      );
    }
  };

  const imageTheme = useAppearanceStore((s) => s.colorThemeId);
  const fallbackCoverUrl = themeLandscapeUrl(
    isImageTheme(imageTheme) && imageTheme !== 'obj-miroir' ? imageTheme! : 'nat-trees',
  );
  const heroCoverUrl = coverSpec?.motifDataUrl ?? fallbackCoverUrl;

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

  const displayName = name || activeProfile?.displayName || user?.display_name || '';
  const hasPhoto = photo.startsWith('data:image/');
  const translationInfo = getTranslationDisplayInfo(bibleTranslation);

  const toggleTranslation = () =>
    setBibleTranslation(bibleTranslation === 'lsg' ? 'ostervald' : 'lsg');

  const handleSignOut = async () => {
    if (window.confirm(t('profile.confirmSignOut', 'Se déconnecter ?'))) {
      await signOut();
      navigate('/auth');
    }
  };

  const heroStyle: CSSProperties = {
    backgroundImage: `url("${heroCoverUrl}")`,
    ...(coverSpec
      ? ({
          '--profile-cover-base': coverSpec.baseColor,
          '--profile-portrait-scrim': coverSpec.overlayScrim,
          '--profile-portrait-text': coverSpec.overlayText,
          '--profile-portrait-muted': coverSpec.overlayMuted,
        } as CSSProperties)
      : {}),
  };

  return (
    <FullScreenPage title={t('common.profil', 'Profil')} showBack column="wide">
      <div className="profile-premium space-y-5">
        <section
          className={cn('profile-hero', coverSpec && 'has-local-motif')}
          style={heroStyle}
          aria-label={t('common.profil', 'Profil')}
        >
          <div className="profile-hero-content">
            {/* Grand portrait avec nom intégré directement à la photo */}
            <div className="profile-portrait-card">
              <div className="profile-portrait-media">
                {hasPhoto ? (
                  <img
                    src={photo}
                    alt={displayName || t('common.profil', 'Profil')}
                    className="profile-portrait-img"
                  />
                ) : (
                  <div className="profile-portrait-placeholder">
                    <ProfileAvatar
                      photo={null}
                      name={displayName}
                      size={112}
                      className="profile-avatar"
                    />
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="profile-avatar-edit"
                aria-label={t('profile.changePhoto', 'Changer la photo de profil')}
              >
                <DuoIcon icon={Camera} size={18} />
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={pickPhoto}
                className="hidden"
                aria-label={t('profile.changePhoto', 'Changer la photo de profil')}
              />

              <div className="profile-portrait-overlay">
                <p className="profile-portrait-eyebrow">
                  {isAuthenticated
                    ? t('profile.connected', 'Connecté')
                    : t('profile.localMode', 'Mode local')}
                </p>
                <div className="profile-portrait-name-row">
                  {editing ? (
                    <input
                      value={name}
                      autoFocus
                      onChange={(e) => setName(e.target.value)}
                      onBlur={saveName}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveName();
                        if (e.key === 'Escape') setEditing(false);
                      }}
                      aria-label={t('profile.setName', 'Définir un nom')}
                      className="profile-name-input"
                    />
                  ) : (
                    <h1>{displayName || t('profile.setName', 'Définir un nom')}</h1>
                  )}
                  <button
                    type="button"
                    onClick={() => (editing ? saveName() : setEditing(true))}
                    className="profile-name-edit"
                    aria-label={
                      editing
                        ? t('common.save', 'Enregistrer')
                        : t('common.edit', 'Modifier')
                    }
                  >
                    <DuoIcon icon={editing ? Check : Pencil} size={16} />
                  </button>
                </div>
              </div>
            </div>

            {/* Détails harmonisés sur la couverture extraite localement */}
            <div className="profile-hero-text">
              <p className="profile-eyebrow">
                {coverSpec
                  ? t('profile.harmonizedCover', 'Couverture harmonisée locale')
                  : t('profile.activeProfile', 'Profil actif')}
              </p>
              <p className="profile-slogan">
                {slogan ||
                  t(
                    'profile.defaultSlogan',
                    'Un verset médité chaque jour prend racine durablement.',
                  )}
              </p>
              <p className="profile-local-note">
                {t(
                  'profile.localPrivacyNote',
                  'Photo et motif de couverture traités et conservés uniquement sur cet appareil.',
                )}
              </p>
            </div>
          </div>
        </section>

        {/* ── Stats band ── */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile value={stats?.streakCount ?? null} label={t('progress.streak', 'Série')} />
          <StatTile
            value={stats?.masteredVerses ?? null}
            label={formatProgressLabel(
              t('progress.mastered', 'Maîtrisés'),
              stats?.masteredVerses ?? 0,
              i18n.resolvedLanguage || i18n.language,
            )}
          />
          <StatTile
            value={stats?.totalVerses ?? null}
            label={formatProgressLabel(
              t('progress.versesMemorized', 'Versets mémorisés'),
              stats?.totalVerses ?? 0,
              i18n.resolvedLanguage || i18n.language,
            )}
          />
          <StatTile value={stats?.dueForReview ?? null} label={t('progress.toReview', 'À réviser')} />
        </div>

        {/* ── Preferences ── */}
        <div className="overflow-hidden rounded-2xl bg-surface shadow-sm">
          <h2 className="px-4 pt-4 text-xs font-bold uppercase tracking-wide text-text-muted">
            {t('profile.preferences', 'Préférences')}
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
              value={displayName || activeProfile?.displayName}
              onClick={() => navigate('/profile/select')}
              showChevron
            />
            <ListItem
              icon={UsersRound}
              label={t('profile.createProfile', 'Créer un profil')}
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
            {t('settings.exportData', 'Exporter mes données')}
          </Button>
          {profiles.length > 1 && (
            <Button variant="ghost" onClick={() => navigate('/profile/select')}>
              <DuoIcon icon={UsersRound} size={18} />
              {t('profile.manageProfiles', 'Gérer les profils')}
            </Button>
          )}
          {isAuthenticated && (
            <Button
              variant="ghost"
              className={cn('text-error')}
              onClick={() => fireAndForget(handleSignOut(), 'profile:signOut')}
            >
              <DuoIcon icon={LogOut} size={18} />
              {t('nav.signOut', 'Se déconnecter')}
            </Button>
          )}
        </div>
      </div>
    </FullScreenPage>
  );
}
