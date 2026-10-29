/**
 * ModeCards — 3D flashcard turn practice (F).
 *
 * The verse is shown on the front face (centered serif, big). Tapping the
 * card flips it 180° (rotateY with perspective) to the back face (hint +
 * full expected text). The 4 FSRS buttons below the card rate the flip
 * ("Je m'en souvenais ?").
 *
 * When a record already has multiple verseTexts (a passage), the card
 * iterates them; otherwise the single verse.
 *
 * Premium design: 3D flip (.mem-flashcard / .mem-flashcard-inner with
 * rotateY(180deg) + backface-visibility: hidden), layered depth shadows,
 * and a "PROCHAIN" outline on the recommended next mode.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  CheckIcon as Check,
  Maximize01Icon as Maximize2,
  Minimize01Icon as Minimize2,
} from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { Rating as FsrsRating } from '@/services/review-rating-service';
import { RatingBar } from '@/components/ui/RatingBar';
import type { MemorizationRecord } from '@/domains/memorization/entities';

export interface ModeCardsProps {
  text: string;
  referenceLabel: string;
  record?: MemorizationRecord | null;
  /** Persist an FSRS rating (drives the engine + PowerSync). */
  onRate: (rating: FsrsRating) => Promise<void>;
  /** Called after the user rates (for the "next mode" recommendation). */
  onRecommendNext?: (score: number) => void;
  /** The "next" button handler (jump to ModeWrite, etc.). */
  onNextMode?: () => void;
}

const RATING_OPTIONS: Parameters<typeof RatingBar>[0]['options'] = [
  { value: FsrsRating.AGAIN, label: 'À revoir', className: 'bg-error-light text-error' },
  { value: FsrsRating.HARD, label: 'Difficile', className: 'bg-warning-light text-warning' },
  { value: FsrsRating.GOOD, label: 'Bon', className: 'bg-primary text-on-primary' },
  { value: FsrsRating.EASY, label: 'Facile', className: 'bg-success-light text-success' },
];

/** Heuristic "score" from the FSRS rating (drives the next-mode badge).
 *  AGAIN/HARD = 0.2, GOOD = 0.7, EASY = 0.95. */
function ratingToScore(r: FsrsRating): number {
  switch (r) {
    case FsrsRating.AGAIN: return 0.2;
    case FsrsRating.HARD:  return 0.2;
    case FsrsRating.GOOD:  return 0.7;
    case FsrsRating.EASY:  return 0.95;
  }
}

export function ModeCards({
  text,
  referenceLabel,
  record,
  onRate,
  onRecommendNext,
  onNextMode,
}: ModeCardsProps) {
  const { t } = useTranslation();
  const [flipped, setFlipped] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [cardIndex, setCardIndex] = useState(0);
  const [lastScore, setLastScore] = useState<number | null>(null);
  /** F-005-C — countdown seconds to the auto-flip (null once flipped). */
  const [autoFlipLeft, setAutoFlipLeft] = useState<number | null>(null);
  const autoFlipTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * F-005-C: auto-flip the card after 30 s of inactivity (spec
   * "auto-révélation 30s sans réponse"). Presentation-only: the timer
   * lives in the component, never in the domain layer.
   */
  useEffect(() => {
    if (autoFlipTimer.current) {
      clearTimeout(autoFlipTimer.current);
      autoFlipTimer.current = null;
    }
    setAutoFlipLeft(null);
    if (flipped) return;
    let remaining = 30;
    setAutoFlipLeft(remaining);
    autoFlipTimer.current = setTimeout(function tick() {
      remaining -= 1;
      if (remaining <= 0) {
        autoFlipTimer.current = null;
        setFlipped(true);
        setAutoFlipLeft(null);
        return;
      }
      setAutoFlipLeft(remaining);
      autoFlipTimer.current = setTimeout(tick, 1000);
    }, 1000);
    return () => {
      if (autoFlipTimer.current) {
        clearTimeout(autoFlipTimer.current);
        autoFlipTimer.current = null;
      }
    };
  }, [flipped, cardIndex]);

  const verses = useMemo(
    () =>
      record?.verseTexts && record.verseTexts.length > 1
        ? record.verseTexts
        : [text],
    [record, text],
  );
  const currentVerse = verses[Math.min(cardIndex, verses.length - 1)];

  const handleRate = async (value: number | string) => {
    const r = value as FsrsRating;
    const score = ratingToScore(r);
    setLastScore(score);
    onRecommendNext?.(score);
    await onRate(r);
    // Advance to the next card in the passage (or stay on the last).
    setFlipped(false);
    if (cardIndex < verses.length - 1) setCardIndex((i) => i + 1);
  };

  return (
    <div className="space-y-3">
      {/* 3D flashcard */}
      <div
        className={cn(
          'mem-flashcard',
          fullscreen && 'min-h-[60vh]',
        )}
      >
        <div className={cn('mem-flashcard-inner', flipped && 'is-flipped')}>
          {/* Front face — the verse, big serif, centered */}
          <div className="mem-flashcard-face front">
            <span className="mem-flashcard-corner">{referenceLabel}</span>
            {verses.length > 1 && (
              <span className="mem-flashcard-counter">{cardIndex + 1}/{verses.length}</span>
            )}
            <p className="verse">{currentVerse}</p>
            <p className="hint">
              {t('workspace.cardsHint', 'Touchez pour retourner · glissez pour passer')}
            </p>
            {autoFlipLeft !== null && autoFlipLeft > 0 && (
              <p className="hint text-xs tabular-nums">
                {t('workspace.autoFlipIn', 'Retour auto dans {{seconds}}s', { seconds: autoFlipLeft })}
              </p>
            )}
            <button
              type="button"
              onClick={() => setFlipped(true)}
              className="mem-pill-ghost"
              style={{ marginTop: 8 }}
            >
              <HugeiconsIcon icon={Check} size={14} />
              {t('workspace.flip', 'Retourner la carte')}
            </button>
          </div>

          {/* Back face — "verso" hint + expected full text */}
          <div className="mem-flashcard-face back">
            <span className="mem-flashcard-corner">{referenceLabel}</span>
            <p className="verse">{currentVerse}</p>
            <p className="hint">
              {t('workspace.cardsBack', 'Verso · repérez les mots clés')}
            </p>
          </div>
        </div>

        {/* Zoom toggle (full-screen card) */}
        <button
          type="button"
          onClick={() => setFullscreen((f) => !f)}
          className="mem-flashcard-zoom"
          aria-label={fullscreen ? t('workspace.exitFullscreen', 'Quitter le plein écran') : t('workspace.fullscreen', 'Plein écran')}
        >
          {fullscreen ? <HugeiconsIcon icon={Minimize2} size={16} /> : <HugeiconsIcon icon={Maximize2} size={16} />}
        </button>
      </div>

      {/* 4 FSRS buttons ("Je m'en souvenais ?") */}
      <div>
        <p className="mem-label">{t('workspace.didYouRemember', 'JE M\'EN SOUVENAIS ?')}</p>
        <RatingBar options={RATING_OPTIONS} onSelect={(v) => void handleRate(v)} />
      </div>

      {/* "Passer au mode suivant" when the user rated with Bon / Facile */}
      {lastScore !== null && lastScore >= 0.7 && (
        <div className="mem-card relative overflow-hidden" style={{ background: 'color-mix(in srgb, var(--color-success) 8%, var(--color-surface))' }}>
          {/* Soft confetti burst (non-interactive) */}
          <div className="mem-confetti">
            {[0, 1, 2, 3, 4].map((i) => (
              <span
                key={i}
                style={{
                  left: `${15 + i * 15}%`,
                  background: i % 2 === 0 ? 'var(--color-primary)' : 'var(--color-success)',
                  animationDelay: `${i * 120}ms`,
                }}
              />
            ))}
          </div>
          <div className="flex items-center gap-3">
            <span className="mem-success-celebration">
              <span className="ring" />
              <span className="ic"><HugeiconsIcon icon={Check} size={22} /></span>
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-extrabold text-success">
                {t('workspace.cardsRecommendation', 'Excellent ! Le mode Écrire est recommandé.')}
              </p>
            </div>
          </div>
          <button type="button" onClick={onNextMode} className="mem-cta-success mt-3">
            <HugeiconsIcon icon={Check} size={16} />
            {t('workspace.passNextMode', 'Passer au mode Écrire')}
          </button>
        </div>
      )}
    </div>
  );
}

export default ModeCards;
