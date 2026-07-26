/**
 * Reference Parser — resolves "Jean 3:16" → { bookId, chapter, verse }
 * See docs/11-bible-domain.md section Résolution de Références
 */

import { resolveBookId } from './entities';

export interface ParsedReference {
  bookId: string;
  chapter: number;
  verse?: number;
  verseEnd?: number; // For ranges: "Jean 3:16-18"
}

/**
 * Parse common reference formats:
 * - "Jean 3:16" → { bookId: 'joh', chapter: 3, verse: 16 }
 * - "Jn 3:16" → same (alias resolved)
 * - "Jean 3:16-18" → { verseEnd: 18 }
 * - "3:16" → contextual (requires book context)
 * - "GENESE 1:1" → case-insensitive
 */
export function parseReference(refString: string): ParsedReference | null {
  try {
    const trimmed = refString.trim();

    // Pattern: BookName Chapter:Verse or BookName Chapter:Verse-VerseEnd
    const rangePattern = /^([a-zÀ-ÿ\s-]+)\s+(\d+):(\d+)\s*-\s*(\d+)$/i;
    const singlePattern = /^([a-zÀ-ÿ\s-]+)\s+(\d+):(\d+)$/i;
    const chapterOnlyPattern = /^([a-zÀ-ÿ\s-]+)\s+(\d+)$/i;

    let match = trimmed.match(rangePattern);
    if (match) {
      const [, bookName, chapterStr, verseStartStr, verseEndStr] = match;
      const bookId = resolveBookId(bookName);
      if (!bookId) return null;
      const chapter = parseInt(chapterStr, 10);
      const verseStart = parseInt(verseStartStr, 10);
      const verseEnd = parseInt(verseEndStr, 10);
      if (chapter <= 0 || verseStart <= 0 || verseEnd < verseStart) return null;
      return { bookId, chapter, verse: verseStart, verseEnd };
    }

    match = trimmed.match(singlePattern);
    if (match) {
      const [, bookName, chapterStr, verseStr] = match;
      const bookId = resolveBookId(bookName);
      if (!bookId) return null;
      const chapter = parseInt(chapterStr, 10);
      const verse = parseInt(verseStr, 10);
      if (chapter <= 0 || verse <= 0) return null;
      return { bookId, chapter, verse };
    }

    match = trimmed.match(chapterOnlyPattern);
    if (match) {
      const [, bookName, chapterStr] = match;
      const bookId = resolveBookId(bookName);
      if (!bookId) return null;
      const chapter = parseInt(chapterStr, 10);
      if (chapter <= 0) return null;
      return { bookId, chapter };
    }

    return null;
  } catch {
    return null;
  }
}

/** Generate a display reference string: "Jean 3:16" */
export function buildReference(bookId: string, chapter: number, verse: number, uiLanguage: string = 'fr'): string {
  // Will be implemented with full localized book names
  return `${uiLanguage === 'en' ? getEnglishName(bookId) : bookId} ${chapter}:${verse}`;
}

function getEnglishName(bookId: string): string {
  const names: Record<string, string> = {
    'gen': 'Genesis', 'exo': 'Exodus', 'psa': 'Psalms', 'joh': 'John',
    'mat': 'Matthew', 'rev': 'Revelation',
  };
  return names[bookId] || bookId;
}
