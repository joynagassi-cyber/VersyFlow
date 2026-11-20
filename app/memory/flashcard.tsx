import { goBackSafely } from '@/lib/navigation';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { DuoIcon } from '@/components/ui/DuoIcon';
import {
  EyeIcon as Eye,
  RotateCcwIcon as RotateCcw,
  ArrowLeft01Icon as ArrowLeft,
} from '@/components/ui/solar-icons';
import { FullScreenPage } from '@/components/layout/FullScreenPage';
import { useLocalSearchParams } from '@/hooks/useIonicNavigation';
import { useMemoryCapability } from '@/capabilities/memory/store';

/** Retour vers le chapitre quand on sait d'où l'on vient, sinon l'atelier. */
function versePreviewBackPath(bookId: string, chapter: number): string {
  return bookId && chapter > 0
    ? `/bible/explorer/${bookId}/${chapter}`
    : '/memory/start';
}

export default function FlashcardScreen() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const params = useLocalSearchParams();
  const { sessionState, startSession } = useMemoryCapability();
  const text = (params.text as string) ?? '';
  const bookId = (params.bookId as string) ?? '';
  const chapter = Number(params.chapter ?? 0);
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
  }, []);

  return (
    <FullScreenPage
      title={t('memory.flashcard', 'Flashcard')}
      showBack
      backPath={versePreviewBackPath(bookId, chapter)}
    >
      <div className="screen-column space-y-5">
        <div className="g2 p-6">
          {/* Le verset n'est pas écrit en clair ici : les puces ci-dessous sont
              le seul chemin vers le texte, une révélation à la fois. */}
          <p className="text-sm text-text-muted">
            {t('memory.revealFromMemory', 'Retrouvez le verset mot après mot, sans le lire.')}
          </p>
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
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-primary py-3 font-bold text-on-primary active:scale-[0.99]"
          >
            <DuoIcon icon={Eye} size={18} />
            {t('memory.reveal', 'Reveler')}
          </button>
          <button
            onClick={() => setRevealed(0)}
            aria-label={t('memory.restartReveal', 'Revoir depuis le début')}
            className="flex items-center justify-center gap-2 rounded-2xl border border-border px-4 text-text-secondary"
          >
            <DuoIcon icon={RotateCcw} size={18} />
          </button>
        </div>

        <button
          onClick={() => goBackSafely(navigate)}
          className="flex w-full items-center justify-center gap-2 py-3 text-sm text-text-muted"
        >
          <DuoIcon icon={ArrowLeft} size={16} />
          {t('common.back', 'Retour')}
        </button>
      </div>
    </FullScreenPage>
  );
}
