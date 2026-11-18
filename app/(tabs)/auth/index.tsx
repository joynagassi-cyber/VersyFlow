import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/auth-store';

/** Local identity is deliberately not treated as an authenticated session. */
export default function AuthGate() {
  const { t } = useTranslation();
  const authenticated = useAuthStore((s) => s.isAuthenticated);
  return <div className="onboard-auth">
    <p className="onboard-eyebrow">VERSYFLOW</p>
    <h1>{authenticated ? t('auth.ready', 'Vous êtes connecté(e)') : t('onboardingJourney.signInTitle', 'Heureux de vous revoir')}</h1>
    {authenticated ? <Link className="journey-primary" to="/tabs/home">{t('common.continue', 'Continuer')}</Link> : <><Link className="journey-primary" to="/auth/login">{t('onboardingJourney.signIn', 'Se connecter')}</Link><Link className="journey-secondary" to="/auth/signup">{t('onboardingJourney.createAccount', 'Créer mon compte')}</Link></>}
  </div>;
}
