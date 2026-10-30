/**
 * Flashcards — révision par cartes à glisser.
 *
 * Cet écran était un DOUBLON FACTICE de `app/memory/flashcard.tsx` : trois
 * cartes écrites dans le fichier (« Jean 3:16 », « Psaume 23:1 »…), un
 * « maîtrisé » qui ne changeait rien, et aucune route entrante. L'audit
 * `docs/AUDIT-COMPLETITE.md` l'avait relevé (décision D-2), sans le trancher.
 *
 * Décision prise ici : l'écran reste (il est référencé par la carte de design
 * `r3_flashcard_recto` et par l'API de navigation), mais il ne fabrique plus
 * de contenu. Il lit les versets réellement mémorisés sur l'appareil via le
 * service de mémorisation, et dit honnêtement « rien à réviser » quand il n'y
 * en a pas — au lieu de montrer un faux progrès.
 *
 * Les gestes sont inchangés (glisser à gauche : à revoir ; à droite : maîtrisé),
 * mais les durées viennent des jetons de mouvement (`--motion-*`) et les
 * surfaces des cartes du thème (`g2`/`g3`), donc elles suivent le preset et
 * le fond image.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { DuoIcon } from '@/components/ui/DuoIcon';
import {
  BookOpen01Icon as BookOpen,
  CheckIcon as Check,
  CheckmarkCircle02Icon as CheckCircle2,
  HandIcon as Hand,
  HelpCircleIcon as HelpCircle,
  RefreshIcon as RefreshCw,
} from '@/components/ui/solar-icons';
import { FullScreenPage } from '@/components/layout/FullScreenPage';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingBlock } from '@/components/ui/Skeleton';
import { getMemorizationService } from '@/services/memorization-service-factory';

interface Flashcard {
  id: string;
  reference: string;
  front: string;
  back: string;
  mastered: boolean;
}

/** Coupe le verset à mi-parcours, sur un mot, pour le recto de la carte. */
function preview(text: string): string {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length <= 6) return text;
  return `${words.slice(0, Math.ceil(words.length / 2)).join(' ')}…`;
}

export default function FlashcardScreen() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [cards, setCards] = useState<Flashcard[] | null>(null);
  const [transform, setTransform] = useState('none');
  const [opacity, setOpacity] = useState(1);
  const swipeX = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const records = await getMemorizationService().getAllMemorized();
        if (cancelled) return;
        setCards(
          records
            .filter((record) => Boolean(record.bibleVerseText))
            .map((record) => ({
              id: record.id,
              reference: `${record.bookId} ${record.chapterNumber}:${record.verseNumber}`,
              front: preview(record.bibleVerseText ?? ''),
              back: record.bibleVerseText ?? '',
              mastered: record.status === 'mastered',
            })),
        );
      } catch {
        if (!cancelled) setCards([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const total = cards?.length ?? 0;
  const currentCard = cards && total > 0 ? cards[currentIndex % total] : null;
  const masteredCount = useMemo(
    () => (cards ?? []).filter((card) => card.mastered).length,
    [cards],
  );

  const advance = useCallback(
    (direction: 'left' | 'right') => {
      if (total === 0) return;
      const width = window.innerWidth;
      const slideOut = direction === 'right' ? width + 100 : -(width + 100);
      setTransform(`translateX(${slideOut}px) rotate(${slideOut / 40}deg)`);
      setOpacity(0);
      window.setTimeout(() => {
        if (direction === 'right') {
          setCards((prev) =>
            (prev ?? []).map((card, index) =>
              index === currentIndex ? { ...card, mastered: true } : card,
            ),
          );
        }
        setCurrentIndex((prev) => (prev + 1) % total);
        setIsFlipped(false);
        setTransform('none');
        setOpacity(1);
      }, 280);
    },
    [currentIndex, total],
  );

  const onDown = (event: React.PointerEvent) => {
    swipeX.current = event.clientX;
  };
  const onMove = (event: React.PointerEvent) => {
    if (swipeX.current === null) return;
    const dx = event.clientX - swipeX.current;
    setTransform(`translateX(${dx}px) rotate(${dx / 40}deg)`);
  };
  const onUp = (event: React.PointerEvent) => {
    if (swipeX.current === null) return;
    const dx = event.clientX - swipeX.current;
    swipeX.current = null;
    if (dx > 100) advance('right');
    else if (dx < -100) advance('left');
    else setTransform('none');
  };

  if (cards === null) {
    return (
      <FullScreenPage title={t('session.flashcards', 'Flashcards')} showBack backPath="/tabs/home">
        <LoadingBlock label={t('common.loading', 'Chargement…')} className="py-16" />
      </FullScreenPage>
    );
  }

  if (!currentCard) {
    return (
      <FullScreenPage title={t('session.flashcards', 'Flashcards')} showBack backPath="/tabs/home">
        <EmptyState
          icon={BookOpen}
          title={t('session.noFlashcards', 'Aucune carte à réviser')}
          description={t(
            'session.noFlashcardsHint',
            'Les cartes se remplissent avec les versets que vous mémorisez sur cet appareil.',
          )}
          actionLabel={t('session.memorizeVerse', 'Mémoriser un verset')}
          onAction={() => navigate('/memorization/session')}
        />
      </FullScreenPage>
    );
  }

  const progress = total > 0 ? ((currentIndex + 1) / total) * 100 : 0;

  return (
    <FullScreenPage
      title={t('session.flashcards', 'Flashcards')}
      showBack
      backPath="/tabs/home"
      subtitle={`${currentIndex + 1} / ${total} · ${masteredCount} ${t('session.masteredCount', 'maîtrisées')}`}
    >
      <div className="flex min-h-full flex-col">
        <div className="px-1">
          <div className="h-1.5 overflow-hidden rounded-full bg-surface-tint">
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-[var(--motion-slow)]"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Pile de cartes : deux lames derrière la carte active. */}
        <div className="relative flex flex-1 items-center justify-center overflow-hidden px-2 py-6">
          {[1, 2].map((offset) => {
            const behind = cards[(currentIndex + offset) % total];
            if (!behind) return null;
            return (
              <div
                key={behind.id}
                aria-hidden="true"
                className="g1 absolute h-[380px] w-[min(92vw,520px)]"
                style={{ transform: `scale(${1 - offset * 0.04})` }}
              />
            );
          })}
          <div
            className="g3 relative h-[380px] w-[min(92vw,520px)] select-none"
            style={{
              transform,
              opacity,
              transition:
                'transform var(--motion-base) var(--ease-standard), opacity var(--motion-base) var(--ease-standard)',
              touchAction: 'pan-y',
            }}
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={onUp}
          >
            <button
              type="button"
              onClick={() => setIsFlipped((flipped) => !flipped)}
              className="flex h-full w-full flex-col justify-between p-6 text-left"
            >
              <span
                className={
                  'inline-flex items-center gap-2 self-start rounded-full px-3 py-1.5 text-xs font-semibold ' +
                  (currentCard.mastered
                    ? 'bg-success/15 text-success'
                    : 'bg-surface-tint text-primary')
                }
              >
                <DuoIcon icon={currentCard.mastered ? CheckCircle2 : HelpCircle} size={14} />
                {currentCard.mastered
                  ? t('session.mastered', 'Maîtrisé')
                  : t('session.toMemorize', 'À mémoriser')}
              </span>

              <div>
                <p className="page-title">{currentCard.reference}</p>
                <p className="mt-2 text-sm text-text-muted">
                  {isFlipped
                    ? t('session.fullVerse', 'Verset complet')
                    : t('session.completePrompt', 'Complétez ce verset :')}
                </p>
                <p
                  className={
                    isFlipped
                      ? 'mt-3 text-lg leading-relaxed text-text-primary'
                      : 'mt-3 text-xl leading-relaxed text-text-secondary'
                  }
                >
                  {isFlipped ? currentCard.back : currentCard.front}
                </p>
              </div>

              <p className="flex items-center gap-2 text-xs text-text-muted">
                <DuoIcon icon={RefreshCw} size={14} />
                {isFlipped
                  ? t('session.tapToBack', 'Touchez pour revenir')
                  : t('session.tapToFlip', 'Touchez pour voir la suite')}
              </p>
            </button>
          </div>
        </div>

        <div className="flex justify-around gap-3 px-4 py-3 text-xs text-text-muted">
          <span className="flex items-center gap-2">
            <DuoIcon icon={Hand} size={18} />
            {t('session.swipeLeft', 'Glisser à gauche : à revoir')}
          </span>
          <span className="flex items-center gap-2">
            <DuoIcon icon={Hand} size={18} className="-scale-x-100" />
            {t('session.swipeRight', 'Glisser à droite : maîtrisé')}
          </span>
        </div>

        <div className="flex gap-3 px-4 pb-8">
          <button
            type="button"
            onClick={() => advance('left')}
            className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-2xl border-2 border-error font-semibold text-error"
          >
            <DuoIcon icon={RefreshCw} size={20} />
            {t('session.review', 'À revoir')}
          </button>
          <button
            type="button"
            onClick={() => advance('right')}
            className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-success font-semibold text-on-status"
          >
            <DuoIcon icon={Check} size={20} />
            {t('session.mastered', 'Maîtrisé')}
          </button>
        </div>
      </div>
    </FullScreenPage>
  );
}
