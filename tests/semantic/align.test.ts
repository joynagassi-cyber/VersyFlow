/**
 * Stage B — Align: book-token alignment and label canonicalization.
 * Pure, no network, no I/O.
 */
import { describe, it, expect } from 'vitest';
import {
  alignBookId,
  alignReference,
  normalizeLabel,
  alignTopics,
} from '../../scripts/semantic/align';

describe('stage B — align', () => {
  describe('alignBookId', () => {
    it('resolves canonical ids directly', () => {
      expect(alignBookId('gen')).toBe('gen');
      expect(alignBookId('Joh')).toBe('joh'); // case-insensitive
      expect(alignBookId('luk')).toBe('luk');
      expect(alignBookId('1joh')).toBe('1joh');
    });

    it('resolves common USFM/display aliases', () => {
      expect(alignBookId('matthew')).toBe('mat');
      expect(alignBookId('genèse')).toBe('gen'); // accent-stripped
      expect(alignBookId('deu')).toBe('deb');
      expect(alignBookId('1sa')).toBe('1sam');
    });

    it('resolves numeric book numbers', () => {
      expect(alignBookId('1')).toBe('gen');
      expect(alignBookId('66')).toBe('rev');
    });

    it('returns null for unknown tokens', () => {
      expect(alignBookId('')).toBe(null);
      expect(alignBookId('zzz')).toBe(null);
    });
  });

  describe('alignReference', () => {
    it('maps a source reference to the canonical verse key', () => {
      expect(alignReference({ book: 'matthew', chapter: 5, verse: 16 })).toEqual({
        verseId: 'mat:5:16',
        bookId: 'mat',
      });
    });

    it('returns null when the book cannot be resolved', () => {
      expect(alignReference({ book: 'zzz', chapter: 1, verse: 1 })).toBe(null);
    });

    it('returns null for out-of-range chapter/verse', () => {
      expect(alignReference({ book: 'gen', chapter: 0, verse: 1 })).toBe(null);
      expect(alignReference({ book: 'gen', chapter: 1, verse: 0 })).toBe(null);
    });
  });

  describe('normalizeLabel', () => {
    it('folds aliased labels into the canonical key', () => {
      const hit = normalizeLabel('torrey', 'faith');
      expect(hit.canonicalKey).toBe('nave:faith'); // aliased to the Nave canonical
      expect(hit.labelsByLanguage).toEqual({ torrey: 'faith' });
    });

    it('keeps a label self-canonical when no alias matches', () => {
      const self = normalizeLabel('nave', 'Zorblat');
      expect(self.canonicalKey).toBe('nave:zorblat');
      expect(self.label).toBe('Zorblat');
    });
  });

  describe('alignTopics', () => {
    it('canonicalizes raw topics and counts the stats', () => {
      const res = alignTopics([
        { key: 'nave:foi', label: 'Foi' },
        { key: 'torrey:faith', label: 'Faith' },
        { key: 'nave:hope', label: 'Hope' },
      ]);
      expect(res.stats.total_raw).toBe(3);
      // foi/faith fold onto one canonical key via the alias table.
      expect(res.stats.alias_hits).toBeGreaterThanOrEqual(1);
      expect(res.stats.canonical).toBeLessThanOrEqual(3);
    });

    it('is deterministic on identical input', () => {
      const topics = [
        { key: 'nave:love', label: 'Love' },
        { key: 'torrey:grace', label: 'Grace' },
      ];
      const a = alignTopics(topics);
      const b = alignTopics(topics.slice());
      expect(JSON.stringify(a.normalized)).toBe(JSON.stringify(b.normalized));
    });
  });
});
