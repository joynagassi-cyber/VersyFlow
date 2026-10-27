import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Eye, RotateCcw, ArrowLeft } from 'lucide-react';
import { FullScreenPage } from '@/components/layout/FullScreenPage';
import { useLocalSearchParams } from '@/hooks/useIonicNavigation';
import { useMemoryCapability } from '@/capabilities/memory/store';

export default function FlashcardScreen() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const params = useLocalSearchParams();
  const { sessionState, startSession } = useMemoryCapability();
  const text = (params.text as string) ?? '';
  const words = text.split(/\s+/).filter(Boolean);
  const [revealed, setRevealed] = useState(0);

  useEffect(() => {
    if (!sessionState && text) {
      startSession({
        phase: 'preview',
        verseText: text,
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

  return (
    <FullScreenPage title={t('memory.flashcard', 'Flashcard')} showBack backPath="/tabs/home">
      <div className="mx-auto max-w-md space-y-5">
        <div className="rounded-3xl bg-surface p-6 shadow-sm">
          <p className="text-sm font-semibold text-primary">{text}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {words.map((w, i) => (
              <span
                key={i}
                className={
                  'rounded-lg px-2 py-1 text-sm font-semibold ' +
                  (i < revealed
                    ? 'bg-primary/15 text-primary'
                    : 'bg-surface-tint text-text-muted')
                }
              >
                {w}
              </span>
            ))}
          </div>
        </div>

        <div className="h-1.5 overflow-hidden rounded-full bg-[color:var(--color-divider)]">
          <div
            className="h-full rounded-full bg-primary"
            style={{ width: (revealed / Math.max(1, words.length)) * 100 + '%' }}
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setRevealed((r) => Math.min(words.length, r + 1))}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-primary py-3 font-bold text-white active:scale-[0.99]"
          >
            <Eye size={18} />
            {t('memory.reveal', 'Reveler')}
          </button>
          <button
            onClick={() => setRevealed(0)}
            className="flex items-center justify-center gap-2 rounded-2xl border border-border px-4 text-text-secondary"
          >
            <RotateCcw size={18} />
          </button>
        </div>

        <button
          onClick={() => navigate(-1)}
          className="flex w-full items-center justify-center gap-2 py-3 text-sm text-text-muted"
        >
          <ArrowLeft size={16} />
          {t('common.back', 'Retour')}
        </button>
      </div>
    </FullScreenPage>
  );
}
