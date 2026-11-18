import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import FullScreenPage from '@/components/layout/FullScreenPage';
import { isDemoMode } from '@/dev/demo-mode';

/** Isolated, in-memory prototype. It never calls family or sync services. */
export function FamilyDemo({ onReal }: { onReal: () => void }) {
  const { t } = useTranslation();
  const [reviews, setReviews] = useState(3);
  const [challenge, setChallenge] = useState(false);
  return <FullScreenPage title={t('demo.familyTitle', 'Famille · démo')} backPath="/tabs/home" column="wide">
    <div className="family-demo">
      <section className="g2 family-demo-card">
        <p className="family-demo-kicker">{t('demo.familyKicker', 'Espace de démonstration')}</p>
        <h2>{t('demo.familyName', 'Famille Horizon')}</h2>
        <p role="status">{t('demo.familyNotice', 'Données fictives, gardées en mémoire uniquement. Les modifications disparaissent en quittant cet écran et ne touchent pas votre famille réelle.')}</p>
        {!isDemoMode && <button type="button" className="home-secondary" onClick={onReal}>{t('demo.familyReal', 'Ouvrir l’espace réel')}</button>}
      </section>
      <div className="family-demo-grid">
        <section className="g2 family-demo-card">
          <h2>{t('demo.familyMembers', 'Membres fictifs')}</h2>
          <ul><li>Sarah · {t('demo.familyParent', 'parent')}</li><li>David · {t('demo.familyParent', 'parent')}</li><li>Anna · {t('demo.familyChild', 'enfant')}</li></ul>
        </section>
        <section className="g2 family-demo-card">
          <h2>{t('demo.familyActivity', 'Activité de test')}</h2>
          <p>{t('demo.familyReviews', '{{count}} révisions simulées', { count: reviews })}</p>
          <button type="button" className="home-primary" onClick={() => setReviews((value) => value + 1)}>{t('demo.familyAddReview', 'Simuler une révision')}</button>
        </section>
      </div>
      <section className="g2 family-demo-card">
        <h2>{t('demo.familyChallenge', 'Défi de test')}</h2>
        <p>{challenge ? t('demo.familyChallengeStarted', 'Défi fictif en cours') : t('demo.familyChallengeReady', 'Prêts à mémoriser ensemble ?')}</p>
        <button type="button" className="home-secondary" onClick={() => setChallenge((value) => !value)}>{challenge ? t('demo.familyResetChallenge', 'Réinitialiser le défi') : t('demo.familyStartChallenge', 'Démarrer le défi fictif')}</button>
      </section>
    </div>
  </FullScreenPage>;
}
