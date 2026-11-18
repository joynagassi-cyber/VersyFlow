import { useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { JourneyArtwork } from '@/components/onboarding/JourneyArtwork';
import { ProfileAvatar } from '@/components/profile/ProfileAvatar';
import { useActiveProfile } from '@/hooks/useActiveProfile';
import { useAuthStore } from '@/store/auth-store';
import { useAppearanceStore } from '@/store/appearance-store';
import { useSettingsStore, settingsStorePersist } from '@/store/settings-store';
import { clearOnboardingProgress, clearOnboardingReady, isOnboardingReady } from '@/onboarding/progress';
import { FIXED_ACCENTS } from '@/theme/fixed-accents';
import { PRESET_CATALOG } from '@/theme/preset-catalog';
import { Input } from '@/components/ui/input';

const features = ['bible', 'memorize', 'review', 'progress', 'family', 'share'] as const;
const fallback = [
  ['La Bible, tout près de vous', 'Explorez les livres et retrouvez les passages qui vous accompagnent.'],
  ['Gardez la Parole dans votre cœur', 'Choisissez vos versets et avancez à votre rythme, séance après séance.'],
  ['Révisez au bon moment', 'La répétition espacée et FSRS adaptent les révisions à votre progression.'],
  ['Chaque pas compte', 'Suivez votre progression et retrouvez le chemin parcouru.'],
  ['Grandissez ensemble', 'Découvrez le mode Famille en démonstration.'],
  ['Partagez votre parcours', 'Les invitations et l’apprentissage collectif sont en cours de développement.'],
];
export default function JourneyScreen() {
  const { t } = useTranslation(); const navigate = useNavigate(); const { step = 'intro' } = useParams();
  const index = features.indexOf(step as typeof features[number]);
  const { activeProfile: selectedProfile, createProfile, selectProfile } = useActiveProfile();
  const user = useAuthStore((s) => s.user);
  const activeProfile = selectedProfile?.accountId === user?.userId ? selectedProfile : null;
  const [name, setName] = useState(activeProfile?.displayName || user?.display_name || '');
  const [slogan, setSlogan] = useState(activeProfile?.slogan || '');
  const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  const fixedAccentId = useAppearanceStore((s) => s.fixedAccentId);
  const setFixedAccentId = useAppearanceStore((s) => s.setFixedAccentId);
  const setBackgroundType = useAppearanceStore((s) => s.setBackgroundType);
  const presetId = useAppearanceStore((s) => s.presetId);
  const setPreset = useAppearanceStore((s) => s.setPreset);
  const themeMode = useAppearanceStore((s) => s.themeMode);
  const setThemeMode = useAppearanceStore((s) => s.setThemeMode);
  const finish = async () => {
    setBusy(true); setError('');
    try {
      useSettingsStore.setState({ onboardingCompleted: true });
      await settingsStorePersist.save();
      const saved = JSON.parse(localStorage.getItem('versyflow-settings-storage') || '{}') as { onboardingCompleted?: boolean };
      if (saved.onboardingCompleted !== true) throw new Error('Save failed');
      if (user) { clearOnboardingProgress(user.userId); clearOnboardingReady(user.userId); }
      navigate('/tabs/home', { replace: true });
    } catch {
      useSettingsStore.setState({ onboardingCompleted: false });
      setError(t('onboardingJourney.saveError', 'Impossible d’enregistrer votre espace. Réessayez.'));
    } finally { setBusy(false); }
  };
  const saveProfile = async () => {
    if (activeProfile) { navigate('/onboarding/session-config'); return; }
    if (name.trim().length < 2) { setError(t('profile.nameError', 'Nom requis (min 2)')); return; }
    setBusy(true); setError('');
    try { const profile = await createProfile(name.trim(), undefined, slogan.trim() || undefined); selectProfile(profile.id); navigate('/onboarding/session-config'); }
    catch { setError(t('profile.createError', 'Impossible de créer le profil')); }
    finally { setBusy(false); }
  };
  const isIntro = step === 'intro'; const isProfile = step === 'profile'; const isColors = step === 'colors'; const isDone = step === 'success';
  if (isDone && !isOnboardingReady(user?.userId, activeProfile?.id)) return <Navigate to="/onboarding/reminder-config" replace />;
  if (!isIntro && !isProfile && !isColors && !isDone && index < 0) return <div className="journey-content"><button onClick={() => navigate('/onboarding/journey/intro')}>{t('common.back', 'Retour')}</button></div>;
  const title = isIntro ? t('onboardingJourney.introTitle', 'Un chemin qui commence avec vous') : isProfile ? t('onboardingJourney.profileTitle', 'Votre espace, votre histoire') : isColors ? t('onboardingJourney.colorsTitle', 'Choisissez vos couleurs') : isDone ? t('onboardingJourney.successTitle', 'Bravo, vous avez fait un grand pas !') : t(`onboardingJourney.${step}Title`, fallback[index]?.[0]);
  const desc = isIntro ? t('onboardingJourney.introDesc', 'Découvrez comment VersyFlow vous accompagne, puis créez un espace qui vous ressemble.') : isProfile ? t('onboardingJourney.profileDesc', 'Choisissez un nom : votre illustration apparaît automatiquement.') : isColors ? t('onboardingJourney.colorsDesc', 'Votre choix prend vie immédiatement. Vous pourrez le modifier plus tard.') : isDone ? t('onboardingJourney.successDesc', 'Votre espace est prêt. La suite de votre chemin commence maintenant.') : t(`onboardingJourney.${step}Desc`, fallback[index]?.[1]);
  const back = isIntro ? '/onboarding/translation-select' : index === 0 ? '/onboarding/journey/intro' : index > 0 ? `/onboarding/journey/${features[index - 1]}` : isProfile ? '/onboarding/journey/colors' : isColors ? '/onboarding/journey/share' : '/onboarding/reminder-config';
  const next = isIntro ? '/onboarding/journey/bible' : index >= 0 && index < features.length - 1 ? `/onboarding/journey/${features[index + 1]}` : '/onboarding/journey/colors';
  const progress = isIntro ? 1 : index >= 0 ? index + 2 : isProfile ? 9 : isColors ? 8 : 10;
  return <main className="journey-page"><div className="journey-visual"><div className="journey-brand">VERSYFLOW <span>✦</span></div><JourneyArtwork index={index < 0 ? 6 : index} /><p>{t('onboardingJourney.visualCaption', 'La Parole vous accompagne, chaque jour.')}</p></div>
    <section className="journey-content"><div className="journey-copy">
      <button type="button" className="journey-back" onClick={() => navigate(back)}>← {t('common.back', 'Retour')}</button>
      <p className="journey-overline">{isDone ? t('onboardingJourney.ready', 'TOUT EST PRÊT') : t('onboardingJourney.step', 'VOTRE PARCOURS')} {!isDone && `${progress} / 10`}</p>
      <h1>{title}</h1><p className="journey-lead">{desc}</p>
      {isProfile && <div className="journey-profile"><ProfileAvatar name={activeProfile?.displayName || name || 'u'} size={84} /><div className="journey-fields">{activeProfile ? <p>{activeProfile.displayName}</p> : <><label>{t('profile.displayName', "Nom d’affichage")}<Input maxLength={30} value={name} onChange={(e) => setName(e.target.value)} /></label><label>{t('profile.slogan', 'Votre slogan')}<Input maxLength={60} value={slogan} onChange={(e) => setSlogan(e.target.value)} /></label></>}{error && <p role="alert" className="text-error">{error}</p>}</div></div>}
      {isColors && <div className="journey-theme-options">
        <label>{t('settings.theme', 'Thème')}<select value={presetId ?? ''} onChange={(event) => { setBackgroundType('none'); setFixedAccentId(null); setPreset(event.target.value || null); }}>
          {!presetId && <option value="">{t('onboardingJourney.chooseTheme', 'Choisir un thème')}</option>}
          {PRESET_CATALOG.map((preset) => <option value={preset.id} key={preset.id}>{preset.label}</option>)}
        </select></label>
        <div role="group" aria-label={t('settings.themeMode', 'Mode')} className="journey-mode-options">
          {(['light', 'dark', 'system'] as const).map((mode) => <button type="button" key={mode} aria-pressed={themeMode === mode} onClick={() => setThemeMode(mode)}>{t(`settings.theme${mode === 'light' ? 'Light' : mode === 'dark' ? 'Dark' : 'System'}`, mode)}</button>)}
        </div>
      </div>}
      {isColors && <div className="journey-accents">{FIXED_ACCENTS.map((accent) => <button key={accent.id} type="button" aria-pressed={fixedAccentId === accent.id} aria-label={accent.label} onClick={() => { setBackgroundType('none'); setFixedAccentId(accent.id); }}><span style={{ backgroundColor: accent.color }} /><small>{accent.label}</small></button>)}</div>}
      {isDone && <div className="journey-success-profile"><ProfileAvatar name={activeProfile?.displayName || name || 'u'} size={76} /><div><strong>{activeProfile?.displayName || name}</strong><p>{activeProfile?.slogan}</p></div><div className="journey-confetti" aria-hidden="true"><i>✦</i><i>✧</i><i>✦</i><i>✧</i><i>✦</i><i>✧</i></div></div>}
      {!isDone && <div className="journey-progress" aria-label={`${progress} / 10`}><span style={{ width: `${progress * 10}%` }} /></div>}
      {isDone && error && <p role="alert" className="text-error">{error}</p>}
      <button className="journey-primary" type="button" disabled={busy} onClick={() => { if (isDone) { void finish(); } else if (isProfile) void saveProfile(); else navigate(isColors ? '/onboarding/journey/profile' : next); }}>{isDone ? t('onboardingJourney.enter', 'Entrer dans mon espace') : t('common.continue', 'Continuer')} <span>→</span></button>
    </div></section></main>;
}
