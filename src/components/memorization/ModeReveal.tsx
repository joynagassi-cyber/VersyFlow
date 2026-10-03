/**
 * ModeReveal — incremental verse reveal (Progressive Disclosure, G).
 *
 * The user works with **blocks** (phrases when 1–2 verses, verse-by-verse
 * when 3+ are selected). Tapping a masked block reveals the next block
 * until the whole passage is visible. No input — pure attention /
 * recognition drill. When the last block is revealed, a "Passer au mode
 * suivant" recommendation appears if the user's best score was ≥ 90%.
 *
 * This is the DEFAULT mode of the unified Memorization Workspace.
 *
 * Premium design: 3D card surface (.mw-card), pulsing ring on the current
 * block (.mw-block.current), green check on done blocks (.mw-check), and a
 * success CTA (.mw-cta-success) on completion.
 */

import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Check, Play } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ModeRevealProps {
  /** The verse (or a passage, when the user selected several verses). */
  text: string;
  /** The reference label that sits in the "case" of the reveal card
   *  (Jean 3:16, Psaumes 23:1–3, …). */
  referenceLabel: string;
  /** When the user is done (last block revealed + recommendation shown),
   *  this callback fires so the workspace can persist + advance mode. */
  onRecommendNext?: (score: number) => void;
  /** The "next" button handler (jump to ModeCards, ModeWrite, …). */
  onNextMode?: () => void;
}

/** Split a passage into "blocks" for incremental reveal.
 *  1 verse  → split into 2–4 phrases at sentence/clause boundaries.
 *  3+ verses → one block per verse.
 */
function toBlocks(text: string): string[] {
  const verses = text
    .split(/\n+/)
    .map((v) => v.trim())
    .filter(Boolean);
  // Single verse: phrase-level reveal.
  if (verses.length === 1) {
    return splitIntoPhrases(verses[0]);
  }
  // 2 verses: phrase-level too (per the user's 2-verse rule).
  if (verses.length === 2) {
    const phraseCount = Math.min(4, Math.max(2, Math.floor(verses[0].length / 30)));
    const halves: string[][] = [
      splitIntoPhrases(verses[0]).slice(0, phraseCount),
      splitIntoPhrases(verses[1]).slice(0, phraseCount),
    ];
    return halves.flat();
  }
  // 3+ verses: verse-level reveal (one block per verse).
  return verses;
}

/** Split a long verse into 2–4 phrase-sized blocks at clause boundaries. */
function splitIntoPhrases(verse: string): string[] {
  // Clause-like breaks (comma/colon/semicolon/period + space), fallback to
  // word count when the verse has no punctuation.
  const parts = verse
    .split(/(?<=[,;:.…])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (parts.length < 2) {
    const words = verse.split(/\s+/);
    const per = Math.max(1, Math.ceil(words.length / 3));
    const out: string[] = [];
    for (let i = 0; i < words.length; i += per) {
      out.push(words.slice(i, i + per).join(' '));
    }
    return out;
  }
  // Group into up to 4 chunks of roughly equal length.
  const n = Math.min(4, Math.max(2, Math.ceil(parts.length / 2)));
  const buckets: string[][] = Array.from({ length: n }, () => []);
  parts.forEach((p, i) => buckets[i % n].push(p));
  return buckets.map((b) => b.join(' ')).filter(Boolean);
}

/** Build the visual "dots" mask for a block. */
function maskDots(length: number): string {
  return '█'.repeat(Math.min(24, Math.max(8, length)));
}

export function ModeReveal({
  text,
  referenceLabel,
  onRecommendNext,
  onNextMode,
}: ModeRevealProps) {
  const { t } = useTranslation();
  const blocks = useMemo(() => toBlocks(text), [text]);
  const [revealed, setRevealed] = useState(0);

  const allRevealed = revealed >= blocks.length;

  const advance = () => {
    if (allRevealed) return;
    const next = revealed + 1;
    setRevealed(next);
    if (next >= blocks.length) {
      // Heuristic "score": proportion of blocks the user revealed in one
      // pass without going back (1.0 = no back-tracking). This drives the
      // "Passer au mode suivant" recommendation.
      onRecommendNext?.(1.0);
    }
  };

  const goBack = () => setRevealed((r) => Math.max(0, r - 1));

  return (
    <div className="space-y-3">
      <div className="mw-card">
        {/* The reference "case" (Livre : Chap : Verset) — always visible, top-left */}
        <div className="mb-4 flex items-center justify-between">
          <span className="mw-case">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 19.5A2.5 2.5 0 0 0 6.5 22H20V2H6.5A2.5 2.5 0 0 0 4 4.5v15z"/></svg>
            {referenceLabel}
          </span>
          <span className="text-xs font-bold uppercase tracking-wider text-text-muted">
            {t('workspace.revealProgress', {
              current: Math.min(revealed + 1, blocks.length),
              total: blocks.length,
              defaultValue: 'Bloc {{current}} / {{total}}',
            })}
          </span>
        </div>

        {/* Progress dots (done / current / locked) */}
        <div className="mb-4 flex items-center gap-1.5">
          {blocks.map((_, i) => (
            <span
              key={i}
              className={cn(
                'h-1.5 rounded-full transition-all duration-300',
                i < revealed && 'w-4 bg-primary',
                i === revealed && !allRevealed && 'w-6 bg-primary',
                i > revealed && 'w-1.5 bg-border',
                allRevealed && 'w-4 bg-success',
              )}
            />
          ))}
        </div>

        {/* The incremental reveal area */}
        <div className="flex flex-col gap-2">
          {blocks.map((block, i) => {
            const isRevealed = i < revealed;
            const isCurrent = i === revealed && !allRevealed;
            const isLocked = i > revealed && !allRevealed;
            return (
              <button
                key={i}
                type="button"
                onClick={isCurrent ? advance : undefined}
                disabled={!isCurrent && !isRevealed}
                className={cn(
                  'mw-block text-left',
                  isRevealed && 'done',
                  isCurrent && 'current',
                  isLocked && 'locked',
                )}
              >
                {isRevealed ? (
                  <>
                    <span>{block}</span>
                    <span className="mw-check"><Check size={10} /></span>
                  </>
                ) : (
                  <>
                    <span className="select-none">{maskDots(block.length)}</span>
                    {isCurrent && (
                      <span className="mw-hint">
                        <ArrowRight size={11} />
                        {t('workspace.tapToReveal', 'Touchez pour révéler')}
                      </span>
                    )}
                  </>
                )}
              </button>
            );
          })}
        </div>

        {/* Nav: back / advance */}
        <div className="mt-4 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={goBack}
            disabled={revealed === 0}
            className="mw-pill-ghost"
          >
            <ArrowRight className="rotate-180" size={14} />
            {t('workspace.prev', 'Précédent')}
          </button>
          {!allRevealed && (
            <button type="button" onClick={advance} className="mw-pill" style={{ width: 'auto', padding: '12px 20px' }}>
              <Play size={14} />
              {t('workspace.revealNext', 'Révéler le bloc')}
            </button>
          )}
        </div>
      </div>

      {/* Completion banner + "next mode" recommendation */}
      {allRevealed && (
        <div className="mw-card relative overflow-hidden" style={{ background: 'color-mix(in srgb, var(--color-success) 8%, var(--color-surface))' }}>
          {/* Soft confetti burst (non-interactive) */}
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
          <div className="flex items-center gap-3">
            <span className="mw-success-celebration">
              <span className="ring" />
              <span className="ic"><Check size={22} /></span>
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-extrabold text-success">
                {t('workspace.revealDone', 'Verset révélé')}
              </p>
              <p className="mt-0.5 text-xs text-text-secondary">
                {t(
                  'workspace.revealRecommendation',
                  'Le mode suivant est recommandé pour consolider la mémoire : {{next}}',
                ).replace('{{next}}', 'Écriture (D)')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onNextMode}
            className="mw-cta-success mt-4"
          >
            <ArrowRight size={16} />
            {t('workspace.passNextMode', 'Passer au mode suivant')}
          </button>
        </div>
      )}
    </div>
  );
}

export default ModeReveal;
