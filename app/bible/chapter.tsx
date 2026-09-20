/**
 * Chapter Screen — multi-verse passage view with memorization CTA
 * Tailwind + i18n + Lucide + FullScreenPage.
 */

import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BrainCircuit, FileText } from 'lucide-react';
import FullScreenPage from '@/components/layout/FullScreenPage';
import { Button } from '@/components/ui/button';
import { BIBLE_BOOKS } from '@/domains/bible/entities';
import { loadTranslationBooks } from '@/services/bible-text-service';

export default function ChapterScreen() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const bookId = params.get('book') ?? 'gen';
  const chapter = Number(params.get('chapter') ?? '1');
  const book = BIBLE_BOOKS.find((b) => b.id === bookId) || BIBLE_BOOKS[0];
  const lang = (i18n.language ?? 'fr') as string;

  const [verseTexts, setVerseTexts] = useState<Record<number, string>>({});

  useEffect(() => {
    let cancelled = false;
    loadTranslationBooks().then((booksData) => {
      if (cancelled || !booksData) return;
      const b = booksData.find((x) => x.id === bookId);
      const ch = b?.chapters.find((c) => c.number === chapter);
      const map: Record<number, string> = {};
      ch?.verses.forEach((v) => {
        map[v.number] = v.text;
      });
      if (!cancelled) setVerseTexts(map);
    });
    return () => {
      cancelled = true;
    };
  }, [bookId, chapter]);

  const memorizePassage = () => {
    const params = new URLSearchParams();
    params.set('reference', `${book.name.fr} ${chapter}`);
    navigate(`/memorization/session?${params.toString()}`);
  };

  return (
    <FullScreenPage
      title={`${book.name[lang] || book.name.fr} ${chapter}`}
      subtitle={t('bible.chapter', 'Chapitre')}
      backPath={`/bible/book/${book.id}`}
    >
      <div className="flex flex-col gap-3">
        {Array.from({ length: 30 }, (_, i) => i + 1).map((n) => {
            const text = verseTexts[n];
            return (
              <div key={n} className="rounded-2xl bg-surface p-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface-tint text-xs font-bold text-primary">
                    {n}
                  </span>
                  {text ? (
                    <p className="bible-text flex-1 text-base leading-6 text-text-secondary">
                      {text}
                    </p>
                  ) : (
                    <p className="flex-1 text-sm italic text-text-muted">
                      {t('errors.verseNotFound', 'Verset non disponible dans cette traduction')}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        <Button className="mt-2 w-full" onClick={memorizePassage}>
          <BrainCircuit size={16} />
          {t('bible.memorize', 'Mémoriser ce passage')}
        </Button>
      </div>
    </FullScreenPage>
  );
}
