/**
 * Bible Domain — Bible Repository
 *
 * Charge et valide les données de la Bible (LSG.json).
 * Fournit une API pour accéder aux livres, chapitres et versets.
 *
 * Propriétaire : Anvil (src/domains/bible/repository.ts)
 *
 * See: docs/11-bible-domain.md, docs/21-bible-data-spec.md
 */

import { readFileSync } from 'fs';
import { join } from 'path';

import { BibleTranslationSchema, validateBibleData } from './schema';
import { BibleBook, BibleChapter, BibleVerse } from './entities';

// Chemin relatif vers le fichier LSG.json
const LSG_FILE_PATH = join(__dirname, '../../../../../data/bible/lsg.json');

/**
 * Cache des données de Bible pour éviter de re-lire le fichier à chaque appel.
 * Singleton pattern.
 */
class BibleRepository {
  private static instance: BibleRepository;
  private books: BibleTranslation['books'] | null = null;
  private bookMap: Record<string, BibleBook> = {};
  private loaded = false;

  private constructor() {}

  public static getInstance(): BibleRepository {
    if (!BibleRepository.instance) {
      BibleRepository.instance = new BibleRepository();
    }
    return BibleRepository.instance;
  }

  /**
 * Charge les données de la Bible à partir du fichier LSG.json.
 * Valide le contenu avec Zod.
 * Lance une erreur si le fichier est introuvable ou invalide.
 */
  public load(): BibleRepository {
    try {
      const content = readFileSync(LSG_FILE_PATH, 'utf-8');
      const rawData = JSON.parse(content);
      const validated = validateBibleData(rawData);

      // Vérifier que tous les livres sont présents (66 livres)
      if (validated.books.length !== 66) {
        throw new Error(`Le fichier LSG.json contient ${validated.books.length} livres au lieu de 66`);
      }

      this.books = validated.books;
      this.buildBookMap();
      this.loaded = true;

      console.log('Bible data loaded successfully:', validated.books.length, 'books');
    } catch (error) {
      console.error('Failed to load Bible data:', error);
      throw new Error(`Impossible de charger les données de la Bible: ${error instanceof Error ? error.message : String(error)}`);
    }

    return this;
  }

  /**
 * Construit une carte de recherche rapide par ID de livre.
 */
  private buildBookMap(): void {
    this.bookMap = {};
    this.books?.forEach(book => {
      this.bookMap[book.id] = book;
    });
  }

  /**
 * Récupère tous les livres de la Bible.
 */
  public getAllBooks(): BibleBook[] {
    if (!this.loaded) {
      throw new Error('Bible non chargée. Appeler load() d\'abord.');
    }
    return this.books?.slice() || [];
  }

  /**
 * Récupère un livre spécifique par son ID.
 */
  public getBookById(id: string): BibleBook | null {
    if (!this.loaded) {
      throw new Error('Bible non chargée.');
    }
    return this.bookMap[id] || null;
  }

  /**
 * Récupère un chapitre spécifique d'un livre.
 */
  public getChapter(bookId: string, chapterNumber: number): BibleChapter | null {
    if (!this.loaded) {
      throw new Error('Bible non chargée.');
    }

    const book = this.bookMap[bookId];
    if (!book) {
      return null;
    }

    const chapter = book.chapters.find(c => c.number === chapterNumber);
    return chapter || null;
  }

  /**
 * Récupère un verset spécifique d'un chapitre.
 */
  public getVerse(bookId: string, chapterNumber: number, verseNumber: number): BibleVerse | null {
    const chapter = this.getChapter(bookId, chapterNumber);
    if (!chapter) {
      return null;
    }

    const verse = chapter.verses.find(v => v.number === verseNumber);
    return verse || null;
  }

  /**
 * Récupère tous les versets d'un chapitre.
 */
  public getChapterVerses(bookId: string, chapterNumber: number): BibleVerse[] {
    const chapter = this.getChapter(bookId, chapterNumber);
    return chapter ? [...chapter.verses] : [];
  }

  /**
 * Vérifie si un livre existe.
 */
  public bookExists(bookId: string): boolean {
    return !!this.bookMap[bookId];
  }

  /**
 * Vérifie si un chapitre existe dans un livre.
 */
  public chapterExists(bookId: string, chapterNumber: number): boolean {
    const book = this.bookMap[bookId];
    if (!book) return false;
    return book.chapters.some(c => c.number === chapterNumber);
  }

  /**
 * Vérifie si un verset existe dans un chapitre.
 */
  public verseExists(bookId: string, chapterNumber: number, verseNumber: number): boolean {
    const chapter = this.getChapter(bookId, chapterNumber);
    if (!chapter) return false;
    return chapter.verses.some(v => v.number === verseNumber);
  }

  /**
 * Obtient le nombre total de livres.
 */
  public getBookCount(): number {
    return this.books?.length || 0;
  }

  /**
 * Obtient le nombre total de chapitres dans la Bible.
 */
  public getChapterCount(): number {
    return this.books?.reduce((sum, book) => sum + book.chapters.length, 0) || 0;
  }

  /**
 * Obtient le nombre total de versets dans la Bible.
 */
  public getVerseCount(): number {
    return this.books?.reduce((sum, book) =>
      sum + book.chapters.reduce((chapterSum, chapter) => chapterSum + chapter.verses.length, 0),
    0) || 0;
  }

  /**
 * Récupère tous les livres du Vieil Testament.
 */
  getOldTestamentBooks(): BibleBook[] {
    return this.books?.filter(b => b.testament === 'old') || [];
  }

  /**
 * Récupère tous les livres du Nouvel Testament.
 */
  getNewTestamentBooks(): BibleBook[] {
    return this.books?.filter(b => b.testament === 'new') || [];
  }

  /**
 * Récupère tous les livres d'un testament donné.
 */
  getBooksByTestament(testament: 'old' | 'new'): BibleBook[] {
    return this.books?.filter(b => b.testament === testament) || [];
  }
}

// Exporter l'instance unique
export const BibleRepository = BibleRepository.getInstance();

// Charger la Bible automatiquement à l'import
// (On charge au démarrage de l'application, pas à l'import pour éviter les side effects)
// Le caller doit explicite appeler BibleRepository.load()
