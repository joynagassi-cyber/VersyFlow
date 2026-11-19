import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { DuoIcon } from '@/components/ui/DuoIcon';
import {
  EyeIcon as Eye,
  SparklesIcon as Sparkles,
  BrainIcon as Brain,
  Layers01Icon as Layers,
  PenLineIcon as PenLine,
  Target01Icon as Target,
  ChevronRightIcon as ChevronRight,
} from '@/components/ui/solar-icons';
import { FullScreenPage } from '@/components/layout/FullScreenPage';
import { Button } from '@/components/ui/button';
import type { ExerciseStrategy } from '@/domains/memorization/entities';

interface VerseData {
  reference: string;
  text: string;
  bookId: string;
  chapter: number;
  verse: number;
}

interface Props {
  verseData: VerseData;
}

const STRATEGIES: {
  id: ExerciseStrategy;
  key: string;
  icon: typeof Eye;
}[] = [
  { id: 'progressive-masking', key: 'strat.progressive', icon: Eye },
  { id: 'incremental-reveal', key: 'strat.incremental', icon: Sparkles },
  { id: 'active-recall', key: 'strat.activeRecall', icon: Brain },
  { id: 'flashcard', key: 'strat.flashcard', icon: Layers },
  { id: 'recall-writing', key: 'strat.writing', icon: PenLine },
  { id: 'smart-masking', key: 'strat.smart', icon: Target },
];

export default function MemorizationStartScreen({ verseData }: Props) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [selected, setSelected] = useState<ExerciseStrategy>('progressive-masking');

  const handleStart = () => {
    const qs = new URLSearchParams({
      strategy: selected,
      bookId: verseData.bookId,
      chapter: verseData.chapter.toString(),
      verse: verseData.verse.toString(),
      reference: verseData.reference,
      text: verseData.text,
    }).toString();
    navigate('/memorization/session?' + qs);
  };

  return (
    <FullScreenPage
      title={t('memory.chooseMethod', 'Choisir une methode')}
      showBack
      backPath="/tabs/home"
    >
      <div className="screen-column space-y-5">
        {/* Verse preview */}
        <div className="g2 p-5">
          <p className="text-sm font-semibold text-primary">{verseData.reference}</p>
          <p className="mt-2 font-serif text-base leading-relaxed text-text-primary">
            {verseData.text}
          </p>
        </div>

        {/* Strategies */}
        <div className="space-y-2">
          {STRATEGIES.map((s) => {
            const active = selected === s.id;
            const Icon = s.icon;
            return (
              <button
                key={s.id}
                onClick={() => setSelected(s.id)}
                className={
                  'flex w-full items-center gap-4 rounded-2xl border-2 p-4 text-left transition ' +
                  (active
                    ? 'border-primary bg-surface shadow-sm'
                    : 'border-transparent bg-surface shadow-sm')
                }
              >
                <span
                  className={
                    'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ' +
                    (active ? 'bg-primary text-on-primary' : 'bg-surface-tint text-primary')
                  }
                >
                  <DuoIcon icon={Icon} size={22} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="card-title block">
                    {t(s.key, s.id)}
                  </span>
                  <span className="text-sm text-text-muted">{t(s.key + '.desc', s.id)}</span>
                </span>
                {active ? (
                  <DuoIcon icon={ChevronRight} size={18} className="text-primary" />
                ) : null}
              </button>
            );
          })}
        </div>

        <Button variant="default" className="w-full" onClick={handleStart}>
          {t('memory.start', 'Commencer')}
        </Button>
      </div>
    </FullScreenPage>
  );
}
