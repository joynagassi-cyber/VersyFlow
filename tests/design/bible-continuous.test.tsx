import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { useAppearanceStore } from '@/store/appearance-store';
import { describe, expect, it, vi } from 'vitest';
import ContinuousBibleReader, { flattenChapters } from '@/components/bible/ContinuousBibleReader';
import type { BibleChapterData } from '@/domains/bible/repository-local';
import type { SplitBibleIndex } from '@/domains/bible/split-index';

vi.mock('@/hooks/useSemanticTags', () => ({ useChapterSemanticTags: () => ({ tags: null, loading: false }) }));
vi.mock('@/components/bible/VerseActionBar', () => ({ default: ({ bookId, chapter, verses }: { bookId: string; chapter: number; verses: number[] }) => <output>{`${bookId}:${chapter}:${verses.join(',')}`}</output> }));
vi.mock('react-i18next', () => ({ useTranslation: () => ({ i18n: { language: 'fr', resolvedLanguage: 'fr' }, t: (_key: string, fallback: string | { count: number }) => typeof fallback === 'string' ? fallback : `${fallback.count} versets` }) }));
const index: SplitBibleIndex = {
  id: 'lsg', language: 'fr', name: 'Louis Segond (1910)', year: 1910,
  books: [
    { id: 'gen', name: { fr: 'GEN' }, testament: 'old', chapterCount: 2, chapterVerseCounts: [{ number: 1, verses: 1 }, { number: 2, verses: 1 }] },
    { id: 'exo', name: { fr: 'EXO' }, testament: 'old', chapterCount: 1, chapterVerseCounts: [{ number: 1, verses: 1 }] },
  ],
};

const texts: Record<string, BibleChapterData> = {
  'gen:1': { number: 1, verses: [{ number: 1, text: 'Texte un' }] },
  'gen:2': { number: 2, verses: [{ number: 1, text: 'Texte deux' }] },
  'exo:1': { number: 1, verses: [{ number: 1, text: 'Texte trois' }] },
};

/** Accès paresseux : résout immédiatement, comme le cache du hook. */
async function getChapter(bookId: string, chapter: number): Promise<BibleChapterData | null> {
  return texts[`${bookId}:${chapter}`] ?? null;
}

describe('manuscrit biblique continu', () => {
  it('conserve la suite des chapitres au changement de livre', () => {
    expect(flattenChapters(index).map(({ bookId, chapter }) => `${bookId}:${chapter}`)).toEqual(['gen:1', 'gen:2', 'exo:1']);
  });
  it('affiche deux chapitres d’affilée et sélectionne le verset avec sa vraie référence', async () => {
    const host = document.createElement('div'); document.body.append(host);
    const root = createRoot(host);
    await act(async () => { root.render(<MemoryRouter><ContinuousBibleReader index={index} initialBookId="gen" initialChapter={2} translationId="lsg" getChapter={getChapter} /></MemoryRouter>); });
    expect(host.querySelectorAll('.reading-chapter')).toHaveLength(2);
    // La lettrine flottante a cédé la place à un numéral de chapitre posé en
    // marge : elle décalait le premier verset de deux lignes à chaque chapitre.
    expect(host.querySelectorAll('.chapter-numeral')).toHaveLength(2);
    expect(host.querySelectorAll('.verse-flow-number')).toHaveLength(0);
    expect(host.textContent).toContain('Genèse');
    expect(host.textContent).toContain('Exode');
    const verse = host.querySelectorAll('.manuscript-verse')[1] as HTMLElement;
    await act(async () => { verse.click(); });
    expect(host.querySelector('output')?.textContent).toBe('exo:1:1');
    expect(verse.getAttribute('aria-pressed')).toBe('true');
    const previous = host.querySelector('.continuous-more') as HTMLButtonElement;
    await act(async () => { previous.click(); });
    expect(host.querySelectorAll('.reading-chapter')).toHaveLength(3);
    await act(async () => { useAppearanceStore.getState().setBibleContinuous(false); useAppearanceStore.getState().setBibleVerseLayout('blocks'); });
    expect(host.querySelectorAll('.reading-chapter')).toHaveLength(1);
    expect(host.querySelector('.verse-flow-blocks')).not.toBeNull();
    expect(host.querySelector('.chapter-pagination')).not.toBeNull();
    await act(async () => { root.unmount(); }); host.remove();
    useAppearanceStore.getState().resetToDefaults();
  });
});
