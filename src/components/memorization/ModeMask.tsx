/**
 * ModeMask — le rappel par mots masqués, en saisie réelle (E).
 *
 * Ce que l'écran était, et ce qu'il ne pouvait pas faire : le verset
 * s'affichait en mots cliquables ; « masquer » consistait à souligner un mot
 * et à laisser le texte lisible dessous, et « Vérifier » reconstruisait une
 * chaîne en remplaçant les mots masqués par du vide — l'utilisateur n'écrivait
 * jamais rien. Le score mesurait donc le silence, pas la mémoire. Et le
 * masquage n'avait aucune gradation : impossible de demander plus.
 *
 * Ce que l'écran fait maintenant :
 *
 *  1. **un mot masqué est une case vide** (`.mem-mask-input`) que l'utilisateur
 *     remplit au clavier ; le texte du verset n'est jamais lisible sous le
 *     masque ;
 *  2. **trois niveaux de masquage** (un mot sur trois, deux sur trois, tous)
 *     réglables par deux boutons (`mem-mask-less` / `mem-mask-more`) ; le
 *     niveau ne redescend pas tout seul, et changer de niveau conserve ce qui
 *     est déjà écrit ;
 *  3. **deux façons de choisir** : « Progressif » (le service propose les mots,
 *     les plus oubliés d'abord d'après `wordPerformance`) ou « Je choisis »
 *     (un mot se masque au toucher) ;
 *  4. **Vérifier compare mot à mot ce qui a été saisi** (`compareWrittenRecall`
 *     sur les seules cases), marque chaque case juste ou fausse, affiche le
 *     mot attendu sous une case fausse, et propose « Nouvel essai » — un
 *     résultat n'est plus une impasse.
 */

import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DuoIcon } from '@/components/ui/DuoIcon';
import {
  ArrowRight01Icon as ArrowRight,
  CheckIcon as Check,
  MinusSignIcon as Minus,
  PlusSignIcon as Plus,
  RefreshIcon as Refresh,
  SparklesIcon as Sparkles,
} from '@/components/ui/solar-icons';
import { cn } from '@/lib/utils';
import { getComparisonEngine } from '@/services/recall-comparison-service';
import type { MemorizationRecord } from '@/domains/memorization/entities';

export interface ModeMaskProps {
  text: string;
  referenceLabel: string;
  /** Existing record (used to seed the \"auto\" mask with the
   *  most-forgotten words of this verse, when available). */
  record?: MemorizationRecord | null;
  onRecommendNext?: (score: number) => void;
  onNextMode?: () => void;
}

type MaskMode = 'auto' | 'manual';

/** Trois paliers : le verset se masque progressivement, jamais d'un coup. */
export const MASK_LEVELS = [1 / 3, 2 / 3, 1] as const;
export type MaskLevel = 1 | 2 | 3;

/** Nombre de mots à retrouver pour un niveau donné (au moins un). */
export function maskedCountFor(level: MaskLevel, wordTotal: number): number {
  if (wordTotal <= 0) return 0;
  const ratio = MASK_LEVELS[level - 1];
  return Math.min(wordTotal, Math.max(1, Math.round(wordTotal * ratio)));
}

/**
 * Répartit `count` indices sur `total` de façon régulière : les mots masqués
 * ne s'agglutinent jamais en début de verset. Les indices prioritaires
 * (mots les plus oubliés) passent devant, sans doublon.
 */
export function spreadMaskedIndices(
  count: number,
  total: number,
  priority: number[] = [],
): number[] {
  if (count <= 0 || total <= 0) return [];
  if (count >= total) return Array.from({ length: total }, (_, index) => index);

  const picked: number[] = [];
  const seen = new Set<number>();
  for (const index of priority) {
    if (picked.length >= count) break;
    if (index >= 0 && index < total && !seen.has(index)) {
      seen.add(index);
      picked.push(index);
    }
  }
  if (picked.length >= count) return picked;

  // Pas à pas entier : `Math.round((k * (total - 1)) / (count - 1))` peut
  // répéter un indice quand count est grand, d'où le while de rattrapage.
  let cursor = 0;
  while (picked.length < count && cursor < total) {
    const index = Math.round((cursor * (total - 1)) / Math.max(1, count - 1));
    if (!seen.has(index)) {
      seen.add(index);
      picked.push(index);
    }
    cursor += 1;
  }
  // Filet de sécurité : verset très court, la répartition peut caler.
  for (let index = 0; picked.length < count && index < total; index += 1) {
    if (!seen.has(index)) {
      seen.add(index);
      picked.push(index);
    }
  }
  return picked.sort((a, b) => a - b);
}

/** Indices des mots les plus souvent oubliés, du plus oublié au moins oublié. */
function forgottenFirst(record: MemorizationRecord | null | undefined): number[] {
  if (!record?.wordPerformance?.length) return [];
  return [...record.wordPerformance]
    .filter((entry) => entry.failedRecalls > 0)
    .sort((a, b) => b.failedRecalls - a.failedRecalls)
    .map((entry) => entry.wordIndex);
}

interface WordCheck {
  index: number;
  expected: string;
  given: string;
  correct: boolean;
}

export function ModeMask({
  text,
  referenceLabel,
  record,
  onRecommendNext,
  onNextMode,
}: ModeMaskProps) {
  const { t } = useTranslation();
  const [maskMode, setMaskMode] = useState<MaskMode>('auto');
  const [level, setLevel] = useState<MaskLevel>(1);
  const [manualMasked, setManualMasked] = useState<Set<number>>(new Set());
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [checks, setChecks] = useState<WordCheck[] | null>(null);

  const words = useMemo(() => text.split(/\s+/).filter(Boolean), [text]);

  const autoMasked = useMemo(() => {
    const count = maskedCountFor(level, words.length);
    return new Set(spreadMaskedIndices(count, words.length, forgottenFirst(record)));
  }, [level, record, words.length]);

  const masked = maskMode === 'auto' ? autoMasked : manualMasked;
  const maskedIndices = useMemo(
    () => [...masked].sort((a, b) => a - b),
    [masked],
  );

  const locked = checks !== null;
  const score = useMemo(() => {
    if (!checks || checks.length === 0) return 0;
    return checks.filter((check) => check.correct).length / checks.length;
  }, [checks]);

  const toggleWord = (index: number) => {
    if (locked) return;
    // Le choix manuel reste possible quel que soit le mode : c'est le geste
    // qui décide, et il bascule sur « Je choisis » pour rester lisible.
    setMaskMode('manual');
    setManualMasked((previous) => {
      const next = new Set(previous);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const changeLevel = (delta: 1 | -1) => {
    if (locked) return;
    setMaskMode('auto');
    setLevel((previous) => {
      const next = Math.min(3, Math.max(1, previous + delta)) as MaskLevel;
      return next;
    });
  };

  const handleVerify = () => {
    if (maskedIndices.length === 0) return;
    const engine = getComparisonEngine();
    const result: WordCheck[] = maskedIndices.map((index) => {
      const expected = words[index] ?? '';
      const given = (answers[index] ?? '').trim();
      const correct =
        given.length > 0 && engine.normalize(given) === engine.normalize(expected);
      return { index, expected, given, correct };
    });
    setChecks(result);
    const ratio = result.filter((check) => check.correct).length / result.length;
    onRecommendNext?.(ratio);
  };

  const handleRetry = () => {
    setChecks(null);
    setAnswers({});
  };

  const checkFor = (index: number) => checks?.find((check) => check.index === index);
  const canGoDown = level > 1 && !locked;
  const canGoUp = level < 3 && !locked;

  return (
    <div className="space-y-3">
      <div className="mem-card">
        <div className="mb-4 flex items-center justify-between gap-2">
          <span className="mem-case">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 19.5A2.5 2.5 0 0 0 6.5 22H20V2H6.5A2.5 2.5 0 0 0 4 4.5v15z"/></svg>
            {referenceLabel}
          </span>
          <div className="inline-flex rounded-full bg-surface-tint p-0.5" role="group" aria-label={t('workspace.maskMode', 'Mode de masquage')}>
            <button
              type="button"
              onClick={() => setMaskMode('auto')}
              aria-pressed={maskMode === 'auto'}
              className={cn(
                'flex items-center gap-1 rounded-full px-3.5 py-1.5 text-xs font-bold transition',
                maskMode === 'auto'
                  ? 'bg-text-primary text-background shadow-sm'
                  : 'text-text-secondary',
              )}
            >
              <DuoIcon icon={Sparkles} size={11} />
              {t('workspace.autoProgressive', 'Progressif')}
            </button>
            <button
              type="button"
              onClick={() => setMaskMode('manual')}
              aria-pressed={maskMode === 'manual'}
              className={cn(
                'rounded-full px-3.5 py-1.5 text-xs font-bold transition',
                maskMode === 'manual'
                  ? 'bg-text-primary text-background shadow-sm'
                  : 'text-text-secondary',
              )}
            >
              {t('workspace.manualPick', 'Je choisis')}
            </button>
          </div>
        </div>

        {/* Niveau de masquage — deux boutons, une valeur, une explication. */}
        <div className="mb-3 flex items-center justify-between gap-3 rounded-2xl bg-surface-tint px-3 py-2">
          <div className="min-w-0">
            <p className="text-xs font-extrabold text-text-primary">
              {t('workspace.maskLevel', 'Niveau de masquage')} ·{' '}
              <span className="tabular-nums">{t('workspace.levelValue', 'Niveau {{level}} / 3', { level })}</span>
            </p>
            <p id="mem-mask-level-hint" className="text-2xs leading-tight text-text-muted">
              {maskMode === 'manual'
                ? t('workspace.manualMaskHint', 'Touchez un mot pour le masquer ou le démasquer.')
                : t('workspace.maskLevelHint', 'Plus le niveau monte, plus il y a de mots à retrouver.')}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={() => changeLevel(-1)}
              disabled={!canGoDown}
              aria-label={t('workspace.decreaseMask', 'Masquer moins de mots')}
              aria-describedby="mem-mask-level-hint"
              className="mem-level-btn"
            >
              <DuoIcon icon={Minus} size={14} />
            </button>
            <button
              type="button"
              onClick={() => changeLevel(1)}
              disabled={!canGoUp}
              aria-label={t('workspace.increaseMask', 'Masquer plus de mots')}
              aria-describedby="mem-mask-level-hint"
              className="mem-level-btn"
            >
              <DuoIcon icon={Plus} size={14} />
            </button>
          </div>
        </div>

        {/* Le verset : mots lisibles, cases vides là où il faut écrire. */}
        <div className="mem-mask-flow">
          {words.map((word, index) => {
            const check = checkFor(index);
            if (!masked.has(index)) {
              return (
                <button
                  key={`${index}-${word}`}
                  type="button"
                  onClick={() => toggleWord(index)}
                  disabled={locked}
                  title={t('workspace.maskThisWord', 'Masquer ce mot')}
                  className={cn('mem-mask-word', maskMode === 'manual' && !locked && 'is-tappable')}
                >
                  {word}
                </button>
              );
            }
            return (
              <span key={`${index}-${word}`} className="inline-flex flex-col items-center">
                <input
                  type="text"
                  value={answers[index] ?? ''}
                  onChange={(event) =>
                    setAnswers((previous) => ({ ...previous, [index]: event.target.value }))
                  }
                  onFocus={() => {
                    /* Une case se remplit au clavier : rien à masquer ici. */
                  }}
                  readOnly={locked}
                  aria-label={t('workspace.maskedWordInput', 'Mot masqué {{index}}', {
                    index: index + 1,
                  })}
                  aria-invalid={check ? !check.correct : undefined}
                  aria-describedby={check && !check.correct ? `mem-mask-answer-${index}` : undefined}
                  autoComplete="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  enterKeyHint="next"
                  className={cn(
                    'mem-mask-input',
                    check?.correct && 'is-correct',
                    check && !check.correct && 'is-wrong',
                  )}
                  style={{ width: `${Math.min(14, Math.max(3, word.length + 1))}ch` }}
                />
                {check && !check.correct && (
                  <span
                    id={`mem-mask-answer-${index}`}
                    className="mt-0.5 text-2xs font-bold text-warning"
                  >
                    {t('workspace.expectedWord', 'Attendu : {{word}}', { word: check.expected })}
                  </span>
                )}
              </span>
            );
          })}
        </div>

        <p className="mt-3 text-xs italic text-text-muted">
          {maskMode === 'manual'
            ? t('workspace.manualHint', 'Touchez un mot lisible pour le masquer.')
            : t('workspace.typeHint', 'Écrivez dans les cases : c’est la mémoire qui parle, pas le texte.')}
          {' · '}
          {maskedIndices.length} {t('workspace.wordsMasked', 'mots masqués')}
        </p>

        {!locked ? (
          <button
            type="button"
            onClick={handleVerify}
            disabled={maskedIndices.length === 0}
            className="mem-pill mt-3"
          >
            <DuoIcon icon={Check} size={16} />
            {t('workspace.verify', 'Vérifier')}
          </button>
        ) : (
          <button type="button" onClick={handleRetry} className="mem-pill-ghost mt-3">
            <DuoIcon icon={Refresh} size={16} />
            {t('workspace.retry', 'Nouvel essai')}
          </button>
        )}
      </div>

      {checks && (
        <div
          className={cn('mem-card relative', score >= 0.9 && 'overflow-hidden')}
          style={
            score >= 0.9
              ? { background: 'color-mix(in srgb, var(--color-success) 8%, var(--color-surface))' }
              : undefined
          }
        >
          {score >= 0.9 && (
            <div className="mem-confetti">
              {[0, 1, 2, 3, 4].map((index) => (
                <span
                  key={index}
                  style={{
                    left: `${15 + index * 15}%`,
                    background: index % 2 === 0 ? 'var(--color-primary)' : 'var(--color-success)',
                    animationDelay: `${index * 120}ms`,
                  }}
                />
              ))}
            </div>
          )}
          <div className="mb-3 flex items-center justify-between">
            <span className="mem-label">
              {t('workspace.result', 'RÉSULTAT')} · {t('workspace.wordsFound', 'mots retrouvés')}
            </span>
            <span
              className={cn(
                'stat-value text-2xl',
                score >= 0.9 ? 'text-success' : score >= 0.7 ? 'text-warning' : 'text-error',
              )}
            >
              {checks.filter((check) => check.correct).length}/{checks.length}
            </span>
          </div>

          <div className="mb-4 flex flex-wrap gap-1.5" aria-live="polite">
            <span className="rounded-full bg-success/15 px-2.5 py-1 text-xs font-bold text-success">
              {t('workspace.correctCount', 'justes')} {checks.filter((check) => check.correct).length}
            </span>
            {checks.some((check) => !check.correct) && (
              <span className="rounded-full bg-warning/15 px-2.5 py-1 text-xs font-bold text-warning">
                {t('workspace.wrongCount', 'à revoir')}{' '}
                {checks.filter((check) => !check.correct).length}
              </span>
            )}
          </div>

          {score >= 0.9 && (
            <button type="button" onClick={onNextMode} className="mem-cta-success">
              <DuoIcon icon={ArrowRight} size={16} />
              {t('workspace.passNextMode', 'Passer au mode suivant')}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default ModeMask;
