/**
 * Memorization Confirm Screen — results + next-review after a session.
 * Reads FSRS result from router state when available; graceful fallback.
 * Tailwind + i18n + Lucide.
 */

import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PartyPopper, CalendarClock, ArrowRight, Home } from 'lucide-react';
import FullScreenPage from '@/components/layout/FullScreenPage';
import { Button } from '@/components/ui/button';

interface ConfirmState {
  interval?: number;
  reference?: string;
  rating?: number;
}

export default function MemorizationConfirm() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  const state = (location.state as ConfirmState | null) ?? {};
  const interval = state.interval ?? 3;
  const reference = state.reference;

  const ratingMeta = [
    { max: 0, label: t('session.ratingAgain', 'À revoir'), color: 'text-error' },
    { max: 1, label: t('session.ratingHard', 'Difficile'), color: 'text-warning' },
    { max: 2, label: t('session.ratingGood', 'Bon'), color: 'text-success' },
    { max: Infinity, label: t('session.ratingEasy', 'Facile'), color: 'text-info' },
  ];
  const meta = ratingMeta.find((m) => (state.rating ?? 0) <= m.max) ?? ratingMeta[2];

  return (
    <FullScreenPage
      title={t('session.memorizing', 'Mémorisation')}
      backPath={reference ? '/memorization/session' : '/tabs/home'}
    >
      <div className="flex flex-col items-center py-8">
        <span className="text-6xl">✨</span>
        <h1 className="mt-4 text-2xl font-bold text-text-primary">
          {t('session.verseComplete', "Verset mémorisé! ✨")}
        </h1>
        {reference && (
          <p className="mt-2 text-base font-semibold text-primary">{reference}</p>
        )}
      </div>

      {/* Result card */}
      <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-sm text-text-muted">
            {t('session.nextReview', 'Prochain rappel')}
          </span>
          <span className="text-3xl font-bold text-primary">{interval}j</span>
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-divider pt-4">
          <span className="flex items-center gap-1.5 text-sm text-text-muted">
            <CalendarClock size={15} />
            {t('session.nextReview', { days: interval })}
          </span>
          <span className={`text-sm font-semibold ${meta.color}`}>{meta.label}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-6 flex flex-col gap-3">
        <Button onClick={() => navigate('/memorization/session')}>
          <PartyPopper size={16} />
          {t('session.proceed', 'Continuer à mémoriser')}
        </Button>
        <Button variant="outline" onClick={() => navigate('/tabs/home')}>
          <Home size={16} />
          {t('common.done', "Retour à l'accueil")}
        </Button>
        <button
          onClick={() => navigate('/review/queue')}
          className="mx-auto mt-1 flex items-center gap-1 text-sm font-semibold text-primary"
        >
          {t('review.startReview', 'Voir mes révisions')}
          <ArrowRight size={14} />
        </button>
      </div>
    </FullScreenPage>
  );
}
