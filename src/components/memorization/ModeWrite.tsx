/**
 * ModeWrite — write-the-verse-from-memory drill (D).
 *
 * The user types the verse into a wide textarea. No pre-fill, no
 * ghost text — they really have to produce the verse. After tapping
 * "Vérifier", a diff card shows up: the original verse (with the
 * "Livre : Chap : Verset" title case on the left) and the user's
 * written text on the right, errors underlined in red.
 *
 * This mode is the LAST of the four modes (recommended after F).
 *
 * Premium design: 3D card surface (.mw-card), the diff result is laid
 * out in two columns (.mw-diff-grid) with word-level colored chips
 * (.word-missing / .word-wrong / .word-extra), and the 4 FSRS buttons
 * sit at the very bottom of the card.
 */

import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, PenLine } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getComparisonEngine } from '@/services/recall-comparison-service';
import type { WrittenRecallResult } from '@/domains/memorization/comparison-engine';
import { Rating as FsrsRating } from '@/services/review-rating-service';
import { RatingBar } from '@/components/ui/RatingBar';

export interface ModeWriteProps {
  text: string;
  referenceLabel: string;
  onRate: (rating: FsrsRating) => Promise<void>;
  onRecommendNext?: (score: number) => void;
}

const RATING_OPTIONS: Parameters<typeof RatingBar>[0]['options'] = [
  { value: FsrsRating.AGAIN, label: 'À revoir', className: 'bg-error-light text-error' },
  { value: FsrsRating.HARD, label: 'Difficile', className: 'bg-warning-light text-warning' },
  { value: FsrsRating.GOOD, label: 'Bon', className: 'bg-primary text-white' },
  { value: FsrsRating.EASY, label: 'Facile', className: 'bg-success-light text-success' },
];

export function ModeWrite({
  text,
  referenceLabel,
  onRate,
  onRecommendNext,
}: ModeWriteProps) {
  const { t } = useTranslation();
  const [written, setWritten] = useState('');
  const [verified, setVerified] = useState<WrittenRecallResult | null>(null);

  const handleVerify = () => {
    if (!written.trim()) return;
    const result = getComparisonEngine().compareWrittenRecall(written, text);
    setVerified(result);
    onRecommendNext?.(result.matchScore);
  };

  const handleRate = async (value: number | string) => {
    await onRate(value as FsrsRating);
  };

  const originalWords = useMemo(() => text.split(/\s+/).filter(Boolean), [text]);

  return (
    <div className="space-y-3">
      {/* Title case — separate from the verse (per user requirement) */}
      <div className="rounded-2xl bg-surface p-4 shadow-sm">
        <p className="mw-label">{t('workspace.titleCase', 'TITRE DU VERSET')}</p>
        <p className="text-base font-bold text-text-primary">{referenceLabel}</p>
      </div>

      {/* The write area */}
      <div className="mw-card">
        <div className="mb-3 flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-tint text-primary">
            <PenLine size={16} />
          </span>
          <div>
            <p className="text-sm font-extrabold text-text-primary">
              {t('workspace.writingRecall', 'Rappel par écriture')}
            </p>
            <p className="text-xs text-text-muted">
              {t('workspace.writeFromMemory', 'Écrivez le verset de mémoire')}
            </p>
          </div>
        </div>
        <textarea
          value={written}
          onChange={(e) => setWritten(e.target.value)}
          rows={4}
          placeholder={t('workspace.writePlaceholder', 'Écrivez le verset...')}
          className={cn(
            'min-h-[120px] w-full resize-y rounded-2xl p-4 text-base outline-none transition',
            verified && verified.matchScore < 0.7 && 'border-2 border-error/40 bg-error/5',
            verified && verified.matchScore >= 0.7 && 'border-2 border-success/40 bg-success/5',
            !verified && 'bg-surface-tint focus:ring-2 focus:ring-primary',
          )}
        />
        <button
          type="button"
          onClick={handleVerify}
          disabled={!written.trim() || verified != null}
          className="mw-pill mt-3"
        >
          <Check size={16} />
          {t('workspace.verify', 'Vérifier')}
        </button>
      </div>

      {/* Diff result — original on the left, written on the right */}
      {verified && (
        <div className={cn('mw-card relative', verified.matchScore >= 0.9 && 'overflow-hidden')} style={verified.matchScore >= 0.9 ? { background: 'color-mix(in srgb, var(--color-success) 8%, var(--color-surface))' } : undefined}>
          {/* Soft confetti burst on a successful verify (≥ 90 %) */}
          {verified.matchScore >= 0.9 && (
            <div className="mw-confetti">
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
          )}
          <div className="mb-3 flex items-center justify-between">
            <span className="mw-label">{t('workspace.result', 'RÉSULTAT')} · {t('workspace.diffWord', 'diff mot à mot')}</span>
            <span
              className={cn(
                'text-2xl font-extrabold',
                verified.matchScore >= 0.9
                  ? 'text-success'
                  : verified.matchScore >= 0.7
                    ? 'text-warning'
                    : 'text-error',
              )}
            >
              {Math.round(verified.matchScore * 100)}%
            </span>
          </div>

          <div className="mw-diff-grid">
            {/* Original (left) with the title case */}
            <div className="mw-diff-col original">
              <span className="col-label">{referenceLabel}</span>
              <p className="verse">{originalWords.join(' ')}</p>
            </div>

            {/* Written (right) with errors in red */}
            <div className="mw-diff-col written">
              <span className="col-label">{t('workspace.youWrote', 'Vous avez écrit')}</span>
              <p className="verse">
                {verified.wordDiffs.map((d, i) => {
                  if (d.type === 'extra') {
                    return (
                      <span key={`${i}-extra`} className="word-extra">
                        {d.word}{' '}
                      </span>
                    );
                  }
                  if (d.type === 'missing') {
                    return (
                      <span key={`${i}-missing`} className="word-missing">
                        {d.word}{' '}
                      </span>
                    );
                  }
                  if (d.type === 'wrong') {
                    return (
                      <span key={`${i}-wrong`} className="word-wrong">
                        {d.word}{' '}
                      </span>
                    );
                  }
                  return <span key={`${i}`}>{d.word} </span>;
                })}
              </p>
            </div>
          </div>

          {/* 4 FSRS buttons at the bottom of the mode */}
          <p className="mw-label mt-4">{t('workspace.commentWasIt', 'COMMENT C\'ÉTAIT ?')}</p>
          <RatingBar options={RATING_OPTIONS} onSelect={(v) => void handleRate(v)} />
        </div>
      )}
    </div>
  );
}

export default ModeWrite;
