import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/auth-store';
import { FullScreenPage } from '@/components/layout/FullScreenPage';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { isDemoMode } from '@/dev/demo-mode';
import { readOnboardingProgress } from '@/onboarding/progress';

export default function SignupScreen() {
  const { t } = useTranslation(); const navigate = useNavigate();
  const signUp = useAuthStore((s) => s.signUp);
  const [email, setEmail] = useState(''); const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [confirmation, setConfirmation] = useState(false);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setBusy(true); setError('');
    try {
      await signUp(email.trim(), password);
      await useAuthStore.getState().checkSession();
      if (useAuthStore.getState().isAuthenticated) navigate(readOnboardingProgress(useAuthStore.getState().user?.userId), { replace: true });
      else setConfirmation(true);
    } catch (err) { setError(err instanceof Error ? err.message : t('auth.signupError', 'Inscription impossible')); }
    finally { setBusy(false); }
  };
  return <FullScreenPage><div className="onboard-auth">
    <Link to="/onboarding/welcome" className="onboard-back">← {t('common.back', 'Retour')}</Link>
    <p className="onboard-eyebrow">VERSYFLOW</p><h1>{t('onboardingJourney.signUpTitle', 'Commençons ensemble')}</h1>
    <p>{t('onboardingJourney.signUpDesc', 'Créez votre compte pour préparer votre espace personnel.')}</p>
    {confirmation ? <p role="status">{t('onboardingJourney.confirmEmail', 'Vérifiez votre e-mail pour confirmer votre compte, puis connectez-vous.')}</p> : <form onSubmit={submit} className="onboard-form">
      {isDemoMode && <p>{t('onboardingJourney.demoNotice', 'Démo locale : utilisez des identifiants fictifs, sans mot de passe personnel. Ce compte ne sera pas synchronisé.')}</p>}
      <label>{t('auth.email', 'Adresse e-mail')}<Input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
      <label>{t('onboardingJourney.password', 'Mot de passe')}<Input type="password" required minLength={6} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} /></label>
      {error && <p role="alert" className="text-error">{error}</p>}
      <Button type="submit" disabled={busy}>{busy ? t('common.loading', 'Chargement…') : t('onboardingJourney.createAccount', 'Créer mon compte')}</Button>
    </form>}
    <Link to="/auth/login">{t('onboardingJourney.alreadyAccount', 'Vous avez déjà un compte ? Se connecter')}</Link>
  </div></FullScreenPage>;
}
