/**
 * Tests for BibleService — higher-level Bible access layer
 * Tests search, reference parsing, and book retrieval
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BibleService } from '@/services/bible-service';
import type { IBibleRepository } from '@/domains/bible/repository';
import type { BibleBook } from '@/domains/bible/entities';

function makeMockRepository(overrides: Partial<IBibleRepository> = {}): IBibleRepository {
  const books: BibleBook[] = [
    { id: 'gen', name: { fr: 'Genèse', en: 'Genesis' }, testament: 'old', chapterCount: 50, orderIndex: 1 },
    { id: 'joh', name: { fr: 'Jean', en: 'John' }, testament: 'new', chapterCount: 21, orderIndex: 43 },
  ];

  return {
    load: vi.fn().mockReturnThis(),
    getAllBooks: vi.fn(() => books),
    getBookById: vi.fn((id: string) => books.find(b => b.id === id) ?? null),
    getOldTestamentBooks: vi.fn(() => books.filter(b => b.testament === 'old')),
    getNewTestamentBooks: vi.fn(() => books.filter(b => b.testament === 'new')),
    getChapter: vi.fn(),
    getVerse: vi.fn(),
    getChapterVerses: vi.fn(),
    bookExists: vi.fn((id: string) => books.some(b => b.id === id)),
    chapterExists: vi.fn(() => true),
    verseExists: vi.fn(() => true),
    getBookCount: vi.fn(() => books.length),
    getChapterCount: vi.fn(() => 71),
    getVerseCount: vi.fn(() => 31102),
    ...overrides,
  } as unknown as IBibleRepository;
}

describe('BibleService', () => {
  let repo: IBibleRepository;
  let service: BibleService;

  beforeEach(() => {
    repo = makeMockRepository();
    service = new BibleService(repo);
  });

  describe('getAllBooks()', () => {
    it('delegates to repository', () => {
      const books = service.getAllBooks();
      expect(books).toEqual([
        { id: 'gen', name: { fr: 'Genèse', en: 'Genesis' }, testament: 'old', chapterCount: 50, orderIndex: 1 },
        { id: 'joh', name: { fr: 'Jean', en: 'John' }, testament: 'new', chapterCount: 21, orderIndex: 43 },
      ]);
      expect(repo.getAllBooks).toHaveBeenCalled();
    });
  });

  describe('getOldTestamentBooks()', () => {
    it('returns only old testament books', () => {
      const books = service.getOldTestamentBooks();
      expect(books.every(b => b.testament === 'old')).toBe(true);
      expect(books).toHaveLength(1);
    });
  });

  describe('getNewTestamentBooks()', () => {
    it('returns only new testament books', () => {
      const books = service.getNewTestamentBooks();
      expect(books.every(b => b.testament === 'new')).toBe(true);
      expect(books).toHaveLength(1);
    });
  });

  describe('getBookById()', () => {
    it('returns book when found', () => {
      const book = service.getBookById('gen');
      expect(book).not.toBeNull();
      expect(book!.id).toBe('gen');
    });

    it('returns null when book not found', () => {
      const book = service.getBookById('nonexistent');
      expect(book).toBeNull();
    });
  });

  describe('resolveBookId()', () => {
    it('resolves "jean" to "joh"', () => {
      expect(service.resolveBookId('jean')).toBe('joh');
    });

    it('resolves "gen" to "gen"', () => {
      expect(service.resolveBookId('gen')).toBe('gen');
    });

    it('returns null for unknown book', () => {
      expect(service.resolveBookId('unknown')).toBeNull();
    });

    it('is case-insensitive', () => {
      expect(service.resolveBookId('JEAN')).toBe('joh');
      expect(service.resolveBookId('Jean')).toBe('joh');
    });
  });

  describe('parseReference()', () => {
    it('parses "Jean 3:16" correctly', () => {
      const result = service.parseReference('Jean 3:16');
      expect(result).not.toBeNull();
      expect(result!.bookId).toBe('joh');
      expect(result!.chapter).toBe(3);
      expect(result!.verse).toBe(16);
    });

    it('parses range "Jean 3:16-18"', () => {
      const result = service.parseReference('Jean 3:16-18');
      expect(result).not.toBeNull();
      expect(result!.verse).toBe(16);
      expect(result!.verseEnd).toBe(18);
    });

    it('returns null for invalid book', () => {
      const result = service.parseReference('Inconnu 1:1');
      expect(result).toBeNull();
    });

    it('returns null when repository rejects book existence', () => {
      const mockRepo = makeMockRepository({
        bookExists: vi.fn(() => false),
        chapterExists: vi.fn(() => true),
      });
      const svc = new BibleService(mockRepo);
      const result = svc.parseReference('Jean 3:16');
      expect(result).toBeNull();
    });

    it('returns null for invalid chapter existence', () => {
      const mockRepo = makeMockRepository({
        bookExists: vi.fn(() => true),
        chapterExists: vi.fn((_id: string, _ch: number) => false),
      });
      const svc = new BibleService(mockRepo);
      const result = svc.parseReference('Jean 3:16');
      expect(result).toBeNull();
    });

    it('returns null for invalid verse existence', () => {
      const mockRepo = makeMockRepository({
        bookExists: vi.fn(() => true),
        chapterExists: vi.fn(() => true),
        verseExists: vi.fn(() => false),
      });
      const svc = new BibleService(mockRepo);
      const result = svc.parseReference('Jean 3:16');
      expect(result).toBeNull();
    });

    it('returns null for range with non-existent verse', () => {
      const mockRepo = makeMockRepository({
        bookExists: vi.fn(() => true),
        chapterExists: vi.fn(() => true),
        verseExists: vi.fn((_id: string, _ch: number, v: number) => v <= 5),
      });
      const svc = new BibleService(mockRepo);
      const result = svc.parseReference('Jean 3:1-10');
      expect(result).toBeNull();
    });

    it('returns parsed reference with verseEnd for ranges', () => {
      const mockRepo = makeMockRepository({
        bookExists: vi.fn(() => true),
        chapterExists: vi.fn(() => true),
        verseExists: vi.fn(() => true),
      });
      const svc = new BibleService(mockRepo);
      const result = svc.parseReference('Jean 3:10-15');
      expect(result).not.toBeNull();
      expect(result!.verseEnd).toBe(15);
    });
  });

  describe('getVerseByReference()', () => {
    it('returns verse for valid reference', () => {
      const mockRepo = makeMockRepository({
        bookExists: vi.fn(() => true),
        chapterExists: vi.fn(() => true),
        verseExists: vi.fn(() => true),
        getVerse: vi.fn(() => ({ number: 16, text: 'Car Dieu a tant aimé le monde' })),
      });
      const svc = new BibleService(mockRepo);
      const verse = svc.getVerseByReference('Jean 3:16');
      expect(verse).not.toBeNull();
      expect(verse!.number).toBe(16);
    });

    it('returns null when reference cannot be parsed', () => {
      const mockRepo = makeMockRepository({
        bookExists: vi.fn(() => true),
        chapterExists: vi.fn(() => true),
        verseExists: vi.fn(() => true),
      });
      const svc = new BibleService(mockRepo);
      const verse = svc.getVerseByReference('Invalid');
      expect(verse).toBeNull();
    });

    it('returns null for chapter-only reference (no verse)', () => {
      const mockRepo = makeMockRepository({
        bookExists: vi.fn(() => true),
        chapterExists: vi.fn(() => true),
        verseExists: vi.fn(() => true),
      });
      const svc = new BibleService(mockRepo);
      const verse = svc.getVerseByReference('Jean 3');
      expect(verse).toBeNull();
    });
  });

  describe('searchReferences()', () => {
    it('finds exact reference match', () => {
      const results = service.searchReferences('Jean 3:16');
      expect(results).toHaveLength(1);
      expect(results[0].type).toBe('exact');
      expect(results[0].bookId).toBe('joh');
    });

    it('finds books by French name', () => {
      const results = service.searchReferences('Genèse');
      expect(results).toHaveLength(1);
      expect(results[0].type).toBe('book');
      expect(results[0].books).toContain('gen');
    });

    it('finds books by English name', () => {
      const results = service.searchReferences('Genesis');
      expect(results).toHaveLength(1);
      expect(results[0].type).toBe('book');
      expect(results[0].books).toContain('gen');
    });

    it('finds books by ID', () => {
      const results = service.searchReferences('joh');
      expect(results).toHaveLength(1);
      expect(results[0].type).toBe('book');
      expect(results[0].books).toContain('joh');
    });

    it('returns empty array for unknown query', () => {
      const results = service.searchReferences('xyznonexistent');
      expect(results).toHaveLength(0);
    });
  });

  describe('getBookSummary()', () => {
    it('returns summary for existing book', () => {
      const summary = service.getBookSummary('gen');
      expect(summary).not.toBeNull();
      expect(summary!.bookId).toBe('gen');
      expect(summary!.chapterCount).toBe(50);
      expect(summary!.testament).toBe('old');
      expect(summary!.chapterCountOld).toBe(50);
      expect(summary!.chapterCountNew).toBe(0);
    });

    it('returns null for non-existent book', () => {
      const summary = service.getBookSummary('nonexistent');
      expect(summary).toBeNull();
    });
  });

  describe('getBookList()', () => {
    it('returns list of all books with metadata', () => {
      const list = service.getBookList();
      expect(list).toHaveLength(2);
      expect(list[0].bookId).toBe('gen');
      expect(list[0].name).toEqual({ fr: 'Genèse', en: 'Genesis' });
      expect(list[0].testament).toBe('old');
      expect(list[0].chapterCount).toBe(50);
    });
  });

  describe('getChapter() / getVerse() / getChapterVerses()', () => {
    it('delegates getChapter to repository', () => {
      const mockRepo = makeMockRepository({
        getChapter: vi.fn(() => ({ number: 3, verses: [] })),
      });
      const svc = new BibleService(mockRepo);
      const chapter = svc.getChapter('joh', 3);
      expect(chapter).not.toBeNull();
      expect(mockRepo.getChapter).toHaveBeenCalledWith('joh', 3);
    });

    it('delegates getVerse to repository', () => {
      const mockRepo = makeMockRepository({
        getVerse: vi.fn(() => ({ number: 16, text: 'test' })),
      });
      const svc = new BibleService(mockRepo);
      const verse = svc.getVerse('joh', 3, 16);
      expect(verse).not.toBeNull();
      expect(mockRepo.getVerse).toHaveBeenCalledWith('joh', 3, 16);
    });

    it('delegates getChapterVerses to repository', () => {
      const mockRepo = makeMockRepository({
        getChapterVerses: vi.fn(() => [{ number: 1, text: 'a' }, { number: 2, text: 'b' }]),
      });
      const svc = new BibleService(mockRepo);
      const verses = svc.getChapterVerses('joh', 3);
      expect(verses).toHaveLength(2);
      expect(mockRepo.getChapterVerses).toHaveBeenCalledWith('joh', 3);
    });
  });

  describe('constructor with default repository', () => {
    it('uses provided repository', () => {
      const customRepo = makeMockRepository();
      const svc = new BibleService(customRepo);
      expect(svc.getAllBooks()).toHaveLength(2);
    });
  });
});
