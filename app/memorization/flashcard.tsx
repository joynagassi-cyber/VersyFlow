// Fixed: Structure — memorization flashcard screen now wrapped in FullScreenPage shell; icon-only buttons carry aria-labels
import { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Settings2,
  Check,
  CheckCircle2,
  HelpCircle,
  BookOpen,
  RefreshCw,
  Hand,
} from 'lucide-react';
import FullScreenPage from '@/components/layout/FullScreenPage';

interface Flashcard {
  id: string;
  reference: string;
  front: string;
  back: string;
  mastered: boolean;
}

const SAMPLE_CARDS: Flashcard[] = [
  {
    id: '1',
    reference: 'Jean 3:16',
    front: "Car Dieu a tant aime le monde...",
    back: "Car Dieu a tellement aime le monde qu'il a donne son Fils unique, afin que quiconque croit en lui ne perisse pas, mais qu'il ait la vie eternelle.",
    mastered: false,
  },
  {
    id: '2',
    reference: 'Psaume 23:1',
    front: "L'Eternel est mon berger...",
    back: "L'Eternel est mon berger: je ne manquerai de rien.",
    mastered: true,
  },
  {
    id: '3',
    reference: 'Philippiens 4:13',
    front: 'Je puis tout par celui...',
    back: 'Je puis tout par celui qui me fortifie.',
    mastered: true,
  },
];

export default function FlashcardScreen() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [cards, setCards] = useState<Flashcard[]>(SAMPLE_CARDS);
  const [transform, setTransform] = useState('none');
  const [opacity, setOpacity] = useState(1);
  const swipeX = useRef<number | null>(null);

  const currentCard = cards[currentIndex];
  const progress = ((currentIndex + 1) / cards.length) * 100;

  const advance = useCallback(
    (direction: 'left' | 'right') => {
      const width = window.innerWidth;
      const slideOut = direction === 'right' ? width + 100 : -(width + 100);
      setTransform('translateX(' + slideOut + 'px) rotate(' + slideOut / 40 + 'deg)');
      setOpacity(0);
      setTimeout(() => {
        if (direction === 'right') {
          setCards((prev) =>
            prev.map((card, idx) =>
              idx === currentIndex ? { ...card, mastered: true } : card,
            ),
          );
        }
        setCurrentIndex((prev) => (prev + 1) % cards.length);
        setIsFlipped(false);
        setTransform('none');
        setOpacity(1);
      }, 280);
    },
    [currentIndex, cards.length],
  );

  const onDown = (e: React.PointerEvent) => {
    swipeX.current = e.clientX;
  };
  const onMove = (e: React.PointerEvent) => {
    if (swipeX.current === null) return;
    const dx = e.clientX - swipeX.current;
    setTransform('translateX(' + dx + 'px) rotate(' + dx / 40 + 'deg)');
  };
  const onUp = (e: React.PointerEvent) => {
    if (swipeX.current === null) return;
    const dx = e.clientX - swipeX.current;
    swipeX.current = null;
    if (dx > 100) advance('right');
    else if (dx < -100) advance('left');
    else setTransform('none');
  };

  return (
    <FullScreenPage
      title={t('session.flashcards', 'Flashcards')}
      showBack
      subtitle={`${currentIndex + 1} / ${cards.length}`}
      right={
        <button
          onClick={() => navigate(-1)}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-surface shadow-sm"
          aria-label={t('common.close', 'Fermer')}
        >
          <Settings2 size={18} className="text-text-secondary" />
        </button>
      }
    >
      <div className="flex min-h-full flex-col">
        {/* Progress */}
        <div className="px-5">
          <div className="h-1.5 overflow-hidden rounded-full bg-[color:var(--color-divider)]">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: progress + '%' }}
            />
          </div>
        </div>

        {/* Card stack */}
        <div className="relative flex flex-1 items-center justify-center overflow-hidden px-6">
          {cards.slice(currentIndex + 1, currentIndex + 3).map((_, idx) => (
            <div
              key={'bg-' + idx}
              className="absolute h-[400px] w-[min(92vw,520px)] rounded-3xl bg-surface shadow-lg"
              style={{ zIndex: 10 - idx, transform: 'scale(' + (1 - idx * 0.04) + ')' }}
            />
          ))}
          <div
            className="relative h-[400px] w-[min(92vw,520px)] select-none rounded-3xl bg-surface shadow-2xl"
            style={{ transform, opacity, transition: 'transform .28s ease, opacity .28s ease' }}
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={onUp}
          >
            <button
              onClick={() => setIsFlipped((f) => !f)}
              className="flex h-full w-full flex-col justify-between p-6 text-left"
            >
              {!isFlipped ? (
                <>
                  <span
                    className={
                      'inline-flex items-center gap-2 self-start rounded-full px-3 py-1.5 text-xs font-semibold ' +
                      (currentCard.mastered
                        ? 'bg-success/15 text-success'
                        : 'bg-surface-tint text-primary')
                    }
                  >
                    {currentCard.mastered ? (
                      <CheckCircle2 size={14} />
                    ) : (
                      <HelpCircle size={14} />
                    )}
                    {currentCard.mastered
                      ? t('session.mastered', 'Maitrise')
                      : t('session.toMemorize', 'A memoriser')}
                  </span>
                  <div>
                    <p className="text-xl font-bold text-text-primary">
                      {currentCard.reference}
                    </p>
                    <p className="mt-2 text-sm text-text-muted">
                      {t('session.completePrompt', 'Complete ce verset:')}
                    </p>
                    <p className="mt-3 text-2xl font-medium text-text-secondary">
                      {currentCard.front}
                    </p>
                  </div>
                  <p className="flex items-center gap-2 text-xs text-text-muted">
                    <RefreshCw size={14} />
                    {t('session.tapToFlip', 'Tape pour voir la suite')}
                  </p>
                </>
              ) : (
                <>
                  <span className="inline-flex items-center gap-2 self-start rounded-full bg-surface-tint px-3 py-1.5 text-xs font-semibold text-primary">
                    <BookOpen size={14} />
                    {t('session.fullVerse', 'Verset complet')}
                  </span>
                  <div>
                    <p className="text-xl font-bold text-text-primary">
                      {currentCard.reference}
                    </p>
                    <p className="mt-3 flex-1 text-lg leading-relaxed text-text-secondary">
                      {currentCard.back}
                    </p>
                  </div>
                  <p className="flex items-center gap-2 text-xs text-text-muted">
                    <RefreshCw size={14} />
                    {t('session.tapToBack', 'Tape pour revenir')}
                  </p>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Hints */}
        <div className="flex justify-around px-10 py-3 text-xs text-text-muted">
          <span className="flex items-center gap-2">
            <Hand size={18} />
            {t('session.swipeLeft', 'Glisser gauche: A revoir')}
          </span>
          <span className="flex items-center gap-2">
            <Hand size={18} className="-scale-x-100" />
            {t('session.swipeRight', 'Glisser droite: Maitrise')}
          </span>
        </div>

        {/* Actions */}
        <div className="flex gap-4 px-10 pb-8">
          <button
            onClick={() => advance('left')}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl border-2 border-error py-4 font-bold text-error active:scale-[0.99]"
          >
            <RefreshCw size={20} />
            {t('session.review', 'A revoir')}
          </button>
          <button
            onClick={() => advance('right')}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-success py-4 font-bold text-white active:scale-[0.99]"
          >
            <Check size={20} />
            {t('session.mastered', 'Maitrise')}
          </button>
        </div>
      </div>
    </FullScreenPage>
  );
}
