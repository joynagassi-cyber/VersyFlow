/**
 * ModeMask — manual or auto-masked word recall (E).
 *
 * The verse is displayed as a flowing serif block; some words are
 * masked (blue underline in the croquis E style). The user picks which
 * words to mask ("Je choisis les mots" = tap a word to toggle), or lets
 * the engine pick them ("Auto progressif" = target the most-forgotten
 * words, via the record's wordPerformance).
 *
 * Toggling a masked word reveals it; "Vérifier" computes an in-place
 * word diff and feeds the recommendation for the next mode.
 *
 * Premium design: 3D card surface (.mw-card), tappable word chips
 * (.mw-mask-word) with masked/correct/missing states, and a dark pill
 * for the verify action.
 */

import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Check, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ComparisonEngine } from '@/domains/memorization/comparison-engine';
import type { WrittenRecallResult } from '@/domains/memorization/comparison-engine';
import type { MemorizationRecord } from '@/domains/memorization/entities';

export interface ModeMaskProps {
  text: string;
  referenceLabel: string;
  /** Existing record (used to seed the "auto" mask with the
   *  most-forgotten words of this verse, when available). */
  record?: MemorizationRecord | null;
  onRecommendNext?: (score: number) => void;
  onNextMode?: () => void;
}

type MaskMode = 'manual' | 'auto';

export function ModeMask({
  text,
  referenceLabel,
  record,
  onRecommendNext,
  onNextMode,
}: ModeMaskProps) {
  const { t } = useTranslation();
  const [maskMode, setMaskMode] = useState<MaskMode>('manual');
  const [masked, setMasked] = useState<Set<number>>(new Set());
  const [verified, setVerified] = useState<WrittenRecallResult | null>(null);

  const words = useMemo(() => text.split(/\s+/).filter(Boolean), [text]);

  /** In "auto" mode, pre-select the indices of the most-forgotten words
   *  (deterministic, based on the record's wordPerformance when present). */
  const autoMasked = useMemo(() => {
    if (!record?.wordPerformance?.length) return new Set<number>();
    const ranked = record.wordPerformance
      .filter((wp) => wp.failedRecalls > 0)
      .sort((a, b) => b.failedRecalls - a.failedRecalls)
      .slice(0, 5);
    const set = new Set<number>();
    ranked.forEach((wp) => set.add(wp.wordIndex));
    // Fallback: if no wordPerformance yet, mask the middle third of the verse
    // (deterministic, gives the user something to work with).
    if (set.size === 0 && words.length >= 3) {
      const start = Math.floor(words.length / 3);
      const end = Math.floor((2 * words.length) / 3);
      for (let i = start; i < end; i++) set.add(i);
    }
    return set;
  }, [record, words]);

  const activeMasked = maskMode === 'manual' ? masked : autoMasked;

  const toggle = (i: number) => {
    if (maskMode !== 'manual') return; // Auto mode: no manual toggling
    setMasked((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  /** Build a "written" string that leaves the masked words empty,
   *  and run the LCS diff to drive the "Vérifier" result. */
  const handleVerify = () => {
    const expected = words.join(' ');
    const userString = words
      .map((w, i) => (activeMasked.has(i) ? '' : w))
      .join(' ');
    const result = new ComparisonEngine().compareWrittenRecall(userString, expected);
    setVerified(result);
    // The "score" here is how much of the verse the user got right in one
    // pass. Drives the recommendation for the next mode.
    onRecommendNext?.(result.matchScore);
  };

  return (
    <div className="space-y-3">
      {/* The reference "case" + mode segmented */}
      <div className="mw-card">
        <div className="mb-4 flex items-center justify-between">
          <span className="mw-case">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 19.5A2.5 2.5 0 0 0 6.5 22H20V2H6.5A2.5 2.5 0 0 0 4 4.5v15z"/></svg>
            {referenceLabel}
          </span>
          <div className="inline-flex rounded-full bg-surface-tint p-0.5">
            <button
              type="button"
              onClick={() => setMaskMode('manual')}
              className={cn(
                'rounded-full px-3.5 py-1.5 text-xs font-bold transition',
                maskMode === 'manual'
                  ? 'bg-text-primary text-white shadow-sm'
                  : 'text-text-secondary',
              )}
            >
              {t('workspace.manualPick', 'Je choisis')}
            </button>
            <button
              type="button"
              onClick={() => setMaskMode('auto')}
              className={cn(
                'flex items-center gap-1 rounded-full px-3.5 py-1.5 text-xs font-bold transition',
                maskMode === 'auto'
                  ? 'bg-text-primary text-white shadow-sm'
                  : 'text-text-secondary',
              )}
            >
              <Sparkles size={11} />
              {t('workspace.autoProgressive', 'Auto')}
            </button>
          </div>
        </div>

        {/* Maskable word flow */}
        <div className="mw-mask-flow">
          {words.map((w, i) => {
            const isMasked = activeMasked.has(i);
            const verifiedWord = verified?.wordDiffs.find((d) => d.position === i);
            return (
              <button
                key={`${i}-${w}`}
                type="button"
                onClick={() => toggle(i)}
                disabled={verified != null || maskMode === 'auto'}
                className={cn(
                  'mw-mask-word',
                  isMasked && !verifiedWord && 'is-masked',
                  verifiedWord?.type === 'missing' && 'is-missing',
                  verifiedWord?.type === 'correct' && 'is-correct',
                  verifiedWord?.type === 'wrong' && 'is-missing',
                )}
              >
                {w}
              </button>
            );
          })}
        </div>

        {/* Footer: masked count + Vérifier */}
        <p className="mt-3 text-xs italic text-text-muted">
          {maskMode === 'manual'
            ? t('workspace.signedHint', 'Soulignés = à saisir au clavier')
            : t('workspace.autoHint', 'Mots ciblés = les plus oubliés pour vous')}
          {' · '}
          {activeMasked.size} {t('workspace.wordsMasked', 'mots masqués')}
        </p>
        <button
          type="button"
          onClick={handleVerify}
          disabled={activeMasked.size === 0 || verified != null}
          className="mw-pill mt-3"
        >
          <Check size={16} />
          {t('workspace.verify', 'Vérifier')}
        </button>
      </div>

      {/* Diff result + next-mode recommendation */}
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

          <div className="mb-4 flex flex-wrap gap-1.5">
            {(['correct', 'wrong', 'extra', 'missing'] as const).map((type) => {
              const count = verified.wordDiffs.filter((d) => d.type === type).length;
              if (count === 0) return null;
              return (
                <span
                  key={type}
                  className={cn(
                    'rounded-full px-2.5 py-1 text-xs font-bold',
                    type === 'correct' && 'bg-success/15 text-success',
                    type === 'wrong' && 'bg-error/15 text-error',
                    type === 'extra' && 'bg-surface-tint text-text-muted',
                    type === 'missing' && 'bg-warning/15 text-warning',
                  )}
                >
                  {type} {count}
                </span>
              );
            })}
          </div>

          {verified.matchScore >= 0.9 && (
            <button type="button" onClick={onNextMode} className="mw-cta-success">
              <ArrowRight size={16} />
              {t('workspace.passNextMode', 'Passer au mode suivant')}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default ModeMask;
