/**
 * ManuscriptView — flowing "manuscript" rendering of a chapter.
 *
 * Instead of one card per verse, the whole chapter is a single continuous
 * serif text block. Each verse keeps its number inline as a small tappable
 * rose superscript; tapping the number (or the verse text) selects the
 * verse, which highlights its span and reveals the contextual
 * `VerseActionBar`.
 *
 * Presentation only: no data fetching, no business logic.
 */

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import type { BibleVerseData } from '@/domains/bible/repository-local';
import type { ChapterSemanticTags } from '@/hooks/useSemanticTags';
import { useHighlightStore, type HighlightState } from '@/store/highlight-store';
import VerseSemanticTags from '@/components/semantic/VerseSemanticTags';

interface ManuscriptViewProps {
  bookId: string;
  chapter: number;
  verses: BibleVerseData[];
  /** Chapter semantic tags (verse → concepts), already locale-resolved. */
  tags?: ChapterSemanticTags | null;
  selectedVerse: number | null;
  onSelectVerse: (verse: number) => void;
  /** Show per-verse concept chips in-flow for the selected verse (default true). */
  showSemanticTags?: boolean;
}

export function ManuscriptView({
  bookId,
  chapter,
  verses,
  tags,
  selectedVerse,
  onSelectVerse,
  showSemanticTags = true,
}: ManuscriptViewProps) {
  const { t } = useTranslation();

  const tagsByVerse = useMemo(
    () => new Map((tags?.entries ?? []).map((e) => [e.verse, e.concepts])),
    [tags],
  );

  if (verses.length === 0) {
    return (
      <p className="px-1 py-6 text-sm italic text-text-muted">
        {t('errors.verseNotFound', 'Verset non disponible dans cette traduction')}
      </p>
    );
  }

  const selectedConcepts = selectedVerse != null ? tagsByVerse.get(selectedVerse) ?? [] : [];
  const selectedIsUser = selectedVerse != null ? (tags?.entries.find((e) => e.verse === selectedVerse)?.source ?? null) === 'user' : false;

  const highlightKeys = useHighlightStore((s: HighlightState) => s.keys);

  return (
    <div className="mx-auto w-full">
      {/* Continuous manuscript text — .bible-card gets the premium
         translucent/blur surface over the image theme (globals.css). */}
      <div className="bible-card mx-auto rounded-3xl bg-surface px-5 py-6 shadow-sm sm:px-7">
        <div className="text-center">
          <span className="text-sm font-semibold text-text-primary">
            {t('bible.chapter', 'Chapitre')} {chapter}
          </span>
          <p className="mt-1 text-xs text-text-muted">
            {verses.length} {t('bible.verses', 'versets')}
          </p>
        </div>

        <p className="verse-flow mt-6 text-text-primary">
          {verses.map((verse, i) => {
            const isSelected = selectedVerse === verse.number;
            const isHighlighted = highlightKeys.includes(`${bookId}:${chapter}:${verse.number}`);
            return (
              <span
                key={verse.number}
                className={cn(
                  'manuscript-verse',
                  isSelected && 'is-selected',
                  isHighlighted && 'is-highlighted',
                  i > 0 && 'ml-2',
                )}
                onClick={() => onSelectVerse(verse.number)}
              >
                <sup
                  className={cn('verse-flow-number', isSelected && 'is-selected')}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectVerse(verse.number);
                  }}
                  aria-label={`Sélectionner le verset ${verse.number}`}
                >
                  {verse.number}
                </sup>
                {verse.text ? verse.text : (
                  <em className="text-sm text-text-muted not-italic">
                    {t('bible.emptyVerse', 'Verset vide dans cette traduction')}
                  </em>
                )}
                {' '}
              </span>
            );
          })}
        </p>

        {/* Semantic concepts for the selected verse, in-flow */}
        {showSemanticTags && selectedVerse != null && selectedConcepts.length > 0 && (
          <div className="mt-5 border-t border-[color:var(--color-divider)] pt-4">
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-text-muted">
              {t('semantic.concepts', 'Concepts')} · {t('bible.verse', 'Verset')} {selectedVerse}
            </p>
            <VerseSemanticTags concepts={selectedConcepts} userSource={selectedIsUser} />
          </div>
        )}
      </div>
    </div>
  );
}

export default ManuscriptView;
