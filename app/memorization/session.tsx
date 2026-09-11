/**
 * Memorization Session Screen
 * Drives a MemorizationSessionEngine from URL params (passage or single
 * verse via `reference`). Tailwind + i18n + Lucide + Shadcn Button.
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { X, Loader2, ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react';
import FullScreenPage from '@/components/layout/FullScreenPage';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  LocalBibleRepository,
  InMemoryBibleTextSource,
} from '@/domains/bible/repository-local';
import { BibleJsonFileSource } from '@/infrastructure/bible/bible-json-source';
import { getFsrsEngine } from '@/services/fsrs-factory';
import { MemorizationSessionEngine } from '@/domains/memorization/session-engine';
import { Rating } from '@/domains/fsrs';
import { resolveBookId } from '@/domains/bible/entities';

function createBibleSource() {
  if (typeof fetch === 'function') {
    return new BibleJsonFileSource({ dataDir: 'data/bible' });
  }
  return new InMemoryBibleTextSource({});
}

/** Parse a "Jean 3:16" / "Psalm 23" style reference into coordinates */
function parseReference(reference: string) {
  const match = reference.match(/^(.+?)\s*(\d+)(?::(\d+)(?:-(\d+))?)?$/i);
  if (!match) return null;
  const bookId = resolveBookId(match[1]);
  if (!bookId) return null;
  const chapter = parseInt(match[2], 10);
  const verseStart = match[3] ? parseInt(match[3], 10) : 1;
  const verseEnd = match[4] ? parseInt(match[4], 10) : verseStart;
  return { bookId, chapter, verseStart, verseEnd };
}

export default function MemorizationSession() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { t } = useTranslation();

  const [engine, setEngine] = useState<MemorizationSessionEngine | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reference, setReference] = useState('');
  const [progress, setProgress] = useState(0);
  const [complete, setComplete] = useState(false);

  const bookIdParam = params.get('bookId') ?? '';
  const chapterParam = parseInt(params.get('chapter') ?? '0', 10);
  const verseStartParam = parseInt(params.get('verseStart') ?? params.get('verse') ?? '0', 10);
  const verseEndParam = parseInt(params.get('verseEnd') ?? '0', 10);
  const refParam = params.get('reference') ?? '';
  const translationId = params.get('translationId') ?? 'lsg';
  const learnerProfileId = params.get('learnerProfileId') ?? 'default';

  useEffect(() => {
    let cancelled = false;

    // Resolve coordinates: explicit params, or fall back to `reference`
    let bookId = bookIdParam;
    let chapter = chapterParam;
    let verseStart = verseStartParam;
    let verseEnd = verseEndParam || verseStart;
    if (!bookId && refParam) {
      const parsed = parseReference(refParam);
      if (parsed) {
        bookId = parsed.bookId;
        chapter = parsed.chapter;
        verseStart = parsed.verseStart;
        verseEnd = parsed.verseEnd;
      }
    }

    if (!bookId || !chapter || !verseStart) {
      setError(t('errors.verseNotFound'));
      setLoading(false);
      return;
    }

    async function init() {
      try {
        const source = createBibleSource();
        const bibleRepo = new LocalBibleRepository(source);
        const fsrsEngine = getFsrsEngine();
        const memorizationEngine = new MemorizationSessionEngine(bibleRepo, fsrsEngine);

        await memorizationEngine.startPassage({
          bookId,
          chapter,
          verseStart,
          verseEnd: verseEnd || verseStart,
          translationId,
          learnerProfileId,
        });
        if (cancelled) return;

        setEngine(memorizationEngine);
        setReference(
          refParam ||
            `${bookId}:${chapter}:${verseStart}${
              verseEnd !== verseStart ? `-${verseEnd}` : ''
            }`,
        );
        setProgress(memorizationEngine.getProgress());
        setComplete(memorizationEngine.isComplete());
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    init();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refresh = useCallback(() => {
    if (!engine) return;
    setProgress(engine.getProgress());
    setComplete(engine.isComplete());
  }, [engine]);

  if (loading) {
    return (
      <FullScreenPage title={t('session.memorizing', 'Mémorisation')} backPath="/tabs/home" showBack={false}>
        <div className="flex flex-col items-center justify-center py-24">
          <Loader2 size={36} className="animate-spin text-primary" />
          <p className="mt-3 text-sm text-text-tertiary">
            {t('session.startingPassage', 'Démarrage du passage...')}
          </p>
        </div>
      </FullScreenPage>
    );
  }

  if (error) {
    return (
      <FullScreenPage title={t('session.memorizing', 'Mémorisation')} backPath="/tabs/home">
        <div className="flex flex-col items-center py-16 text-center">
          <p className="text-base text-error">{error}</p>
          <Button className="mt-6" variant="secondary" onClick={() => navigate(-1)}>
            {t('common.back', 'Retour')}
          </Button>
        </div>
      </FullScreenPage>
    );
  }

  if (!engine) return null;
  const verseData = engine.getCurrentVerseData();
  const totalVerses = engine.getTotalVerses();
  const currentIndex = engine.getCurrentVerseIndex();

  return (
    <FullScreenPage
      title={t('session.memorizing', 'Mémorisation')}
      showBack={false}
      right={
        <button
          onClick={() => {
            engine.abandon();
            navigate(-1);
          }}
          className="flex items-center gap-1 text-sm font-semibold text-text-secondary"
        >
          <X size={16} />
          {t('common.close', 'Fermer')}
        </button>
      }
    >
      {/* Reference + progress */}
      <div className="mb-4 text-center">
        <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
          {t('session.verseReference', 'Référence du verset')}
        </p>
        <p className="text-lg font-semibold text-text-primary">{reference}</p>
        <p className="mt-1 text-sm text-text-secondary">
          {t('session.verseOf', { current: currentIndex + 1, total: totalVerses })}
        </p>
      </div>

      {/* Verse text */}
      <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
        <p className="bible-text text-base leading-7 text-text-primary">{verseData?.text}</p>
        <p className="mt-3 text-xs text-text-tertiary">
          {t('session.tapToReveal', 'Appuyez pour révéler')}
        </p>
      </div>

      {/* Rating buttons */}
      <div className="mt-5 grid grid-cols-4 gap-2">
        {(
          [
            { rating: Rating.AGAIN, label: t('session.ratingAgain', 'À revoir'), cls: 'bg-error-light text-error' },
            { rating: Rating.HARD, label: t('session.ratingHard', 'Difficile'), cls: 'bg-warning-light text-warning' },
            { rating: Rating.GOOD, label: t('session.ratingGood', 'Bon'), cls: 'bg-primary text-white' },
            { rating: Rating.EASY, label: t('session.ratingEasy', 'Facile'), cls: 'bg-success-light text-success' },
          ] as const
        ).map(({ rating, label, cls }) => (
          <button
            key={rating}
            onClick={() => {
              engine.rateCurrentVerse(rating);
              refresh();
            }}
            className={cn('rounded-xl py-3 text-sm font-semibold', cls)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Navigation */}
      <div className="mt-5 flex gap-3">
        <Button
          variant="outline"
          className="flex-1"
          disabled={currentIndex === 0}
          onClick={() => {
            engine.prevVerse();
            refresh();
          }}
        >
          <ArrowLeft size={15} />
          {t('session.goBack', 'Retour')}
        </Button>
        <Button
          className="flex-1"
          onClick={() => {
            engine.nextVerse();
            refresh();
            if (engine.isComplete()) {
              navigate('/memorization/confirm', { state: { reference } });
            }
          }}
        >
          {t('session.proceed', 'Continuer')}
          <ArrowRight size={15} />
        </Button>
      </div>

      {complete && (
        <div className="mt-5 flex items-center justify-center gap-2 rounded-xl bg-success-light p-4 text-success">
          <CheckCircle size={18} />
          <span className="text-base font-semibold">
            {t('session.passageComplete', 'Passage terminé!')}
          </span>
        </div>
      )}

      {/* Progress bar */}
      <div className="mt-5">
        <div className="h-1.5 overflow-hidden rounded-full bg-surface-tint">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${Math.round(progress * 100)}%` }}
          />
        </div>
      </div>
    </FullScreenPage>
  );
}
