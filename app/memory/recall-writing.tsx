import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { RotateCcw, Scale } from 'lucide-react';
import { FullScreenPage } from '@/components/layout/FullScreenPage';
import { Button } from '@/components/ui/button';
import { useLocalSearchParams } from '@/hooks/useIonicNavigation';
import { useMemoryCapability } from '@/capabilities/memory/store';
import { compareWrittenRecall } from '@/services/recall-comparison-service';
import type { WrittenRecallResult } from '@/services/recall-comparison-service';

type WordDiff = WrittenRecallResult['wordDiffs'][number];

function chipClass(type: WordDiff['type']) {
  switch (type) {
    case 'correct':
      return 'bg-success/15 text-success';
    case 'wrong':
      return 'bg-error/15 text-error';
    case 'missing':
      return 'bg-warning/15 text-warning';
    case 'extra':
    default:
      return 'bg-surface-tint text-text-muted';
  }
}

export default function RecallWritingScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams();
  const { sessionState, startSession } = useMemoryCapability();
  const [text, setText] = useState('');
  const [result, setResult] = useState<WrittenRecallResult | null>(null);

  const expectedVerse = (params.verse as string) ?? sessionState?.verseText ?? '';

  useEffect(() => {
    const verse = (params.verse as string) ?? expectedVerse;
    if (!sessionState && verse) {
      const words = verse.split(' ').filter(Boolean);
      startSession({
        phase: 'preview',
        verseText: verse,
        words,
        revealedWordIndices: new Set<number>(),
        startedAt: Date.now(),
        durationSeconds: 0,
        wordsRevealed: 0,
        totalWords: words.length,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCompare = () => {
    if (!text.trim() || !expectedVerse) return;
    setResult(compareWrittenRecall(text, expectedVerse));
  };

  const handleReset = () => {
    setText('');
    setResult(null);
  };

  const scoreColor = result
    ? result.matchScore >= 0.9
      ? 'var(--color-success)'
      : result.matchScore >= 0.7
        ? 'var(--color-warning)'
        : 'var(--color-error)'
    : 'var(--color-text-muted)';

  return (
    <FullScreenPage
      title={t('recallWriting.title', "Ecriture de memoire")}
      showBack
      backPath="/tabs/home"
    >
      <div className="mx-auto max-w-md space-y-4">
        {expectedVerse && (
          <div className="rounded-2xl bg-surface p-4 shadow-sm">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-text-muted">
              {t('semantic.expected', 'Texte attendu')}
            </p>
            <p className="font-serif italic text-base leading-relaxed text-text-primary">
              {expectedVerse}
            </p>
          </div>
        )}

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t('recallWriting.placeholder', "Ecrivez le verset de memoire...")}
          className="min-h-[150px] w-full resize-y rounded-2xl bg-surface p-4 text-base text-text-primary shadow-sm outline-none focus:ring-2 focus:ring-[color:var(--color-primary)]"
        />

        <div className="flex gap-3">
          <Button
            variant="default"
            className="flex-1"
            onClick={handleCompare}
            disabled={!text.trim() || !expectedVerse}
          >
            <Scale size={18} />
            {t('recallWriting.compare', 'Comparer')}
          </Button>
          {result && (
            <Button variant="secondary" className="flex-1" onClick={handleReset}>
              <RotateCcw size={18} />
              {t('recallWriting.reset', 'Recommencer')}
            </Button>
          )}
        </div>

        {result && (
          <div className="rounded-2xl bg-surface p-4 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                {t('recallWriting.matchScore', 'Similarite')}
              </span>
              <span className="text-3xl font-extrabold" style={{ color: scoreColor }}>
                {Math.round(result.matchScore * 100)}%
              </span>
            </div>

            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
              {t('semantic.verses', 'Verset')}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {result.wordDiffs
                .filter((d) => d.type !== 'extra')
                .map((d, i) => (
                  <span key={i} className={'rounded px-2 py-0.5 text-sm ' + chipClass(d.type)}>
                    {d.word}
                  </span>
                ))}
            </div>

            {result.wordDiffs.some((d) => d.type === 'extra') && (
              <div className="mt-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
                  {t('recallWriting.extraWords', 'Mots en trop')}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {result.wordDiffs
                    .filter((d) => d.type === 'extra')
                    .map((d, i) => (
                      <span key={i} className={'rounded px-2 py-0.5 text-sm ' + chipClass(d.type)}>
                        {d.word}
                      </span>
                    ))}
                </div>
              </div>
            )}

            <div className="mt-4 space-y-1.5">
              {(['correct', 'wrong', 'missing'] as const).map((type) => (
                <div key={type} className="flex items-center gap-2">
                  <span className={'rounded px-1.5 text-sm opacity-70 ' + chipClass(type)}>•</span>
                  <span className="text-sm text-text-muted">
                    {type === 'correct'
                      ? t('recallWriting.correct', 'Correct')
                      : type === 'wrong'
                        ? t('recallWriting.wrong', 'Incorrect')
                        : t('recallWriting.missing', 'Manquant')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </FullScreenPage>
  );
}
