/**
 * Bible Service — Application Layer
 *
 * Fournit une API pour naviguer et rechercher dans la Bible.
 * Implémente le port IBibleService defini dans le domaine.
 *
 * Propriétaire : Anvil (src/services/bible-service.ts)
 *
 * Uses BibleRepository to access Bible data.
 * Provides higher-level operations like search, navigation, and reference resolution.
 */

import { BibleRepository } from '@/domains/bible/repository';
import { BibleBook, BibleTranslation, BibleVerse } from '@/domains/bible/schema';
import { parseReference, resolveBookId, BOOK_ALIASES } from '@/domains/bible';

/**
 * Erreur levée quand une référence Bible n'est pas valide.
 */
class BibleNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BibleNotFoundError';
  }
}

/**
 * Erreur levée quand un chapitre n'est pas trouvé dans un livre.
 */
class ChapterNotFoundError extends Error {
  constructor(bookId: string, chapterNumber: number) {
    super(`Chapitre ${chapterNumber} non trouvé dans le livre ${bookId}`);
    this.name = 'ChapterNotFoundError';
  }
}

/**
 * Erreur levée quand un verset n'est pas trouvé dans un chapitre.
 */
class VerseNotFoundError extends Error {
  constructor(bookId: string, chapterNumber: number, verseNumber: number) {
    super(`Verset ${verseNumber} non trouvé dans le chapitre ${chapterNumber} du livre ${bookId}`);
    this.name = 'VerseNotFoundError';
  }
}

/**
 * Service pour accéder aux données de la Bible.
 */
export class BibleService {
  private repository = BibleRepository.getInstance();

  /**
 * Initialise le service en chargeant les données de la Bible.
 */
  public initialize(): BibleService {
    this.repository.load();
    return this;
  }

  /**
 * Récupère tous les livres de la Bible.
 */
  public getAllBooks(): BibleBook[] {
    return this.repository.getAllBooks();
  }

  /**
 * Récupère tous les livres du Vieil Testament.
 */
  getOldTestamentBooks(): BibleBook[] {
    return this.repository.getOldTestamentBooks();
  }

  /**
 * Récupère tous les livres du Nouvel Testament.
 */
  getNewTestamentBooks(): BibleBook[] {
    return this.repository.getNewTestamentBooks();
  }

  /**
 * Récupère un livre par son ID.
 */
  getBookById(bookId: string): BibleBook | null {
    return this.repository.getBookById(bookId);
  }

  /**
 * Résout un alias de livre en l'ID canonique.
 * Ex: "Gen" → "gen", "Jn" → "joh"
 */
  resolveBookId(bookId: string): string | null {
    return resolveBookId(bookId);
  }

  /**
 * Récupère un chapitre spécifique d'un livre.
 */
  getChapter(bookId: string, chapterNumber: number): BibleChapter | null {
    return this.repository.getChapter(bookId, chapterNumber);
  }

  /**
 * Récupère un verset spécifique.
 */
  getVerse(bookId: string, chapterNumber: number, verseNumber: number): BibleVerse | null {
    return this.repository.getVerse(bookId, chapterNumber, verseNumber);
  }

  /**
 * Récupère tous les versets d'un chapitre.
 */
  getChapterVerses(bookId: string, chapterNumber: number): BibleVerse[] {
    return this.repository.getChapterVerses(bookId, chapterNumber);
  }

  /**
 * Résolve une référence Bible sous format texte (ex: "Jean 3:16", "Jn 3:16", "Gen 1:1-10").
 * Retourne un objet avec bookId, chapter, verse (et optionnellement verseEnd).
 */
  parseReference(refString: string): BibleService.ParsedReference | null {
    const parsed = parseReference(refString);
    if (!parsed) {
      return null;
    }

    // Vérifier que le livre existe
    if (!this.repository.bookExists(parsed.bookId)) {
      return null;
    }

    // Vérifier que le chapitre existe
    if (!this.repository.chapterExists(parsed.bookId, parsed.chapter)) {
      return null;
    }

    // Si un verset est spécifié, vérifier qu'il existe
    if (parsed.verse !== undefined && !this.repository.verseExists(parsed.bookId, parsed.chapter, parsed.verse)) {
      return null;
    }

    // Si une plage de versets est spécifiée, vérifier chaque verset
    if (parsed.verseEnd !== undefined) {
      for (let v = parsed.verse; v <= parsed.verseEnd; v++) {
        if (!this.repository.verseExists(parsed.bookId, parsed.chapter, v)) {
          return null;
        }
      }
    }

    return {
      bookId: parsed.bookId,
      chapter: parsed.chapter,
      verse: parsed.verse,
      verseEnd: parsed.verseEnd,
    };
  }

  /**
 * Récupère un verset à partir d'une chaîne de référence.
 * Ex: getVerseByReference("Jean 3:16") → verset de Jean 3:16
 */
  getVerseByReference(refString: string): BibleVerse | null {
    const parsed = this.parseReference(refString);
    if (!parsed || !parsed.verse) {
      return null;
    }

    return this.getVerse(parsed.bookId, parsed.chapter, parsed.verse);
  }

  /**
 * Récupère toutes les references possibles à partir d'une recherche texte.
 * Supporte les formats : livre, chapitre, verset, plage.
 */
  searchReferences(query: string): BibleService.SearchResult[] {
    const results: BibleService.SearchResult[] = [];

    // Essayer de parser directement la requête
    const parsed = this.parseReference(query);
    if (parsed) {
      results.push({
        type: 'exact',
        reference: query,
        bookId: parsed.bookId,
        chapter: parsed.chapter,
        verse: parsed.verse,
        verseEnd: parsed.verseEnd,
      });
      return results;
    }

    // Si pas d'exact match, essayer de trouver des livres qui correspondent
    const lowerQuery = query.toLowerCase();
    const books = this.getAllBooks();
    const matchingBooks = books.filter(book =>
      book.name.fr.toLowerCase().includes(lowerQuery) ||
      book.name.en.toLowerCase().includes(lowerQuery) ||
      book.id.toLowerCase().includes(lowerQuery)
    );

    if (matchingBooks.length > 0) {
      results.push({
        type: 'book',
        reference: query,
        books: matchingBooks.map(b => b.id),
      });
    }

    return results;
  }

  /**
 * Obtient le sommaire d'un livre (liste des chapitres).
 */
  getBookSummary(bookId: string): BibleService.BookSummary | null {
    const book = this.getBookById(bookId);
    if (!book) {
      return null;
    }

    return {
      bookId,
      name: book.name,
      testament: book.testament,
      chapterCount: book.chapterCount,
      chapterCountOld: book.testament === 'old' ? book.chapterCount : 0,
      chapterCountNew: book.testament === 'new' ? book.chapterCount : 0,
      chapters: book.chapters.map(c => c.number),
    };
  }

  /**
 * Obtient la liste de tous les livres avec leur nombre de chapitres.
 */
  getBookList(): BibleService.BookListEntry[] {
    return this.getAllBooks().map(book => ({
      bookId: book.id,
      name: book.name,
      testament: book.testament,
      chapterCount: book.chapterCount,
    }));
  }
}

// === Types pour le service ===

export namespace BibleService {
  export interface ParsedReference {
    bookId: string;
    chapter: number;
    verse?: number;
    verseEnd?: number;
  }

  export interface SearchResult {
    type: 'exact' | 'book';
    reference: string;
    bookId?: string;
    chapter?: number;
    verse?: number;
    verseEnd?: number;
    books?: string[];
  }

  export interface BookSummary {
    bookId: string;
    name: Record<string, string>;
    testament: 'old' | 'new';
    chapterCount: number;
    chapterCountOld: number;
    chapterCountNew: number;
    chapters: number[];
  }

  export interface BookListEntry {
    bookId: string;
    name: Record<string, string>;
    testament: 'old' | 'new';
    chapterCount: number;
  }
}
