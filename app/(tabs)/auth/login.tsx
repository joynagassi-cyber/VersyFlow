import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/auth-store';
import { useSettingsStore } from '@/store/settings-store';
import { FullScreenPage } from '@/components/layout/FullScreenPage';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { isDemoMode } from '@/dev/demo-mode';
import { readOnboardingProgress } from '@/onboarding/progress';

export default function LoginScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const signIn = useAuthStore((s) => s.signIn);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setBusy(true); setError('');
    try {
      await signIn(email.trim(), password);
      navigate(useSettingsStore.getState().onboardingCompleted ? '/tabs/home' : readOnboardingProgress(useAuthStore.getState().user?.userId), { replace: true });
    } catch (err) { setError(err instanceof Error ? err.message : t('auth.loginError', 'Connexion impossible')); }
    finally { setBusy(false); }
  };
  return <FullScreenPage><div className="onboard-auth">
    <Link to="/onboarding/welcome" className="onboard-back">← {t('common.back', 'Retour')}</Link>
    <p className="onboard-eyebrow">VERSYFLOW</p><h1>{t('onboardingJourney.signInTitle', 'Heureux de vous revoir')}</h1>
    <p>{t('onboardingJourney.signInDesc', 'Connectez-vous pour retrouver votre espace.')}</p>
    <form onSubmit={submit} className="onboard-form">
      {isDemoMode && <p>{t('onboardingJourney.demoNotice', 'Démo locale : utilisez des identifiants fictifs, sans mot de passe personnel. Ce compte ne sera pas synchronisé.')}</p>}
      <label>{t('auth.email', 'Adresse e-mail')}<Input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
      <label>{t('onboardingJourney.password', 'Mot de passe')}<Input type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} /></label>
      {error && <p role="alert" className="text-error">{error}</p>}
      <Button type="submit" disabled={busy}>{busy ? t('common.loading', 'Chargement…') : t('onboardingJourney.signIn', 'Se connecter')}</Button>
    </form><Link to="/auth/signup">{t('onboardingJourney.createAccount', 'Créer mon compte')}</Link>
  </div></FullScreenPage>;
}
