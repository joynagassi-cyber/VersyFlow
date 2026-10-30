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
import { formatChapterCount } from '@/lib/chapter-count';
import type { BibleVerseData } from '@/domains/bible/repository-local';
import type { ChapterSemanticTags } from '@/hooks/useSemanticTags';
import { useHighlightStore, type HighlightState } from '@/store/highlight-store';
import VerseSemanticTags from '@/components/semantic/VerseSemanticTags';
import { useAppearanceStore } from '@/store/appearance-store';

interface ManuscriptViewProps {
  bookId: string;
  bookName?: string;
  translationId?: string;
  chapter: number;
  verses: BibleVerseData[];
  /** Chapter semantic tags (verse → concepts), already locale-resolved. */
  tags?: ChapterSemanticTags | null;
  selectedVerse: number | null;
  onSelectVerse: (verse: number) => void;
  /** Show per-verse concept chips in-flow for the selected verse (default true). */
  showSemanticTags?: boolean;
  embedded?: boolean;
  showBookTitle?: boolean;
}

export function ManuscriptView({
  bookId,
  bookName,
  translationId,
  chapter,
  verses,
  tags,
  selectedVerse,
  onSelectVerse,
  showSemanticTags = true,
  embedded = false,
  showBookTitle = true,
}: ManuscriptViewProps) {
  const { t, i18n } = useTranslation();
  const verseLayout = useAppearanceStore((s) => s.bibleVerseLayout);
  const showVerseNumbers = useAppearanceStore((s) => s.showVerseNumbers);

  const tagsByVerse = useMemo(
    () => new Map((tags?.entries ?? []).map((e) => [e.verse, e.concepts])),
    [tags],
  );

  const selectedConcepts = selectedVerse != null ? tagsByVerse.get(selectedVerse) ?? [] : [];
  const selectedIsUser = selectedVerse != null ? (tags?.entries.find((e) => e.verse === selectedVerse)?.source ?? null) === 'user' : false;

  const highlightKeys = useHighlightStore((s: HighlightState) => s.keys);

  // O(n) Set lookup instead of O(n·m) Array.includes per verse render.
  const highlightKeySet = useMemo(
    () => new Set(highlightKeys),
    [highlightKeys],
  );

  if (verses.length === 0) {
    return (
      <p className="px-1 py-6 text-sm italic text-text-muted">
        {t('errors.verseNotFound', 'Verset non disponible dans cette traduction')}
      </p>
    );
  }


  return (
    <div className="mx-auto w-full">
      {/* Continuous manuscript text — .bible-card gets the premium
         translucent/blur surface over the image theme (globals.css). */}
      <article className={cn(embedded ? "reading-chapter" : "bible-card reading-card mx-auto")}>
        <div className={embedded ? "reading-chapter-heading" : "reading-card-heading"}>
          <div className="reading-meta">
            <span>{embedded && bookName ? `${bookName} · ` : ''}{t('bible.chapter', 'Chapitre')} {chapter}</span>
            {translationId && <span className="reading-translation">{translationId.toUpperCase()}</span>}
          </div>
          {bookName && showBookTitle && <h2>{bookName}</h2>}
          <p>{formatChapterCount(t('bible.verseCount', { count: verses.length }), verses.length, i18n.resolvedLanguage || i18n.language)}</p>
        </div>

        <p className={cn("verse-flow mt-6 text-text-primary", verseLayout === "blocks" && "verse-flow-blocks")}>
          <span className="chapter-dropcap" aria-hidden="true">{chapter}</span>
          {verses.map((verse, i) => {
            const isSelected = selectedVerse === verse.number;
            const isHighlighted = highlightKeySet.has(`${bookId}:${chapter}:${verse.number}`);
            return (
              <span
                key={verse.number}
                className={cn(
                  'manuscript-verse',
                  isSelected && 'is-selected',
                  isHighlighted && 'is-highlighted',
                  i > 0 && verseLayout === 'flow' && 'ml-2',
                )}
                role="button"
                tabIndex={0}
                aria-pressed={isSelected}
                aria-label={`${t('bible.selectVerseAria', { n: verse.number, defaultValue: `Sélectionner le verset ${verse.number}` })} : ${verse.text ?? ''}`}
                onClick={() => onSelectVerse(verse.number)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onSelectVerse(verse.number); }
                }}
              >
                {showVerseNumbers && verse.number !== 1 && <sup
                  className={cn('verse-flow-number', isSelected && 'is-selected')}
                >
                  {verse.number}
                </sup>}
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
      </article>
    </div>
  );
}

export default ManuscriptView;
