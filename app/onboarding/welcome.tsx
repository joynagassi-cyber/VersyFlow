import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { JourneyArtwork } from '@/components/onboarding/JourneyArtwork';
import { useAuthStore } from '@/store/auth-store';

export default function WelcomeScreen() {
  const { t } = useTranslation();
  const authenticated = useAuthStore((s) => s.isAuthenticated);
  return <main className="journey-page journey-welcome">
    <div className="journey-visual"><div className="journey-brand">VERSYFLOW <span>✦</span></div><JourneyArtwork index={0} /><p>{t('onboardingJourney.welcomeKicker', 'Un chemin de foi, un verset à la fois.')}</p></div>
    <section className="journey-content"><div className="journey-copy">
      <p className="journey-overline">{t('onboardingJourney.welcomeLabel', 'BIENVENUE CHEZ VOUS')}</p>
      <h1>{t('onboardingJourney.welcomeTitle', 'La Parole, près de votre cœur.')}</h1>
      <p className="journey-lead">{t('onboardingJourney.welcomeMessage', 'Résister au diable par la Parole. Conserver un héritage éternel.')}</p>
      <p>{t('onboardingJourney.welcomeDesc', 'Mémorisez les Écritures, grandissez à votre rythme et transmettez ce qui compte, ensemble.')}</p>
      <div className="journey-actions">{authenticated ? <Link className="journey-primary" to="/onboarding/language-select">{t('common.continue', 'Continuer')} <span>→</span></Link> : <><Link className="journey-primary" to="/auth/signup">{t('onboardingJourney.createAccount', 'Créer mon compte')} <span>→</span></Link><Link className="journey-secondary" to="/auth/login">{t('onboardingJourney.signIn', 'Se connecter')}</Link></>}</div>
    </div></section>
  </main>;
}
