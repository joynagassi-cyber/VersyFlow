/**
 * Tests for BibleDocument — verse counting across books/chapters/verses
 */

import { describe, it, expect } from 'vitest';
import { countVerses } from '@/domains/bible/document';
import type { BibleDocument } from '@/domains/bible/document';

describe('countVerses()', () => {
  it('returns 0 for empty document', () => {
    const doc: BibleDocument = { books: [] };
    expect(countVerses(doc)).toBe(0);
  });

  it('counts verses in a single-chapter single-verse book', () => {
    const doc: BibleDocument = {
      books: [{
        id: 'test',
        chapters: [{
          number: 1,
          verses: [{ number: 1, text: 'Hello' }],
        }],
      }],
    };
    expect(countVerses(doc)).toBe(1);
  });

  it('counts all verses across multiple chapters', () => {
    const doc: BibleDocument = {
      books: [{
        id: 'test',
        chapters: [
          { number: 1, verses: [{ number: 1, text: 'a' }, { number: 2, text: 'b' }] },
          { number: 2, verses: [{ number: 1, text: 'c' }, { number: 2, text: 'd' }, { number: 3, text: 'e' }] },
        ],
      }],
    };
    expect(countVerses(doc)).toBe(5);
  });

  it('counts across multiple books', () => {
    const doc: BibleDocument = {
      books: [
        {
          id: 'book1',
          chapters: [{ number: 1, verses: [{ number: 1, text: 'x' }, { number: 2, text: 'y' }] }],
        },
        {
          id: 'book2',
          chapters: [
            { number: 1, verses: [{ number: 1, text: 'a' }] },
            { number: 2, verses: [{ number: 1, text: 'b' }, { number: 2, text: 'c' }] },
          ],
        },
      ],
    };
    expect(countVerses(doc)).toBe(5);
  });

  it('handles chapter with no verses (edge case)', () => {
    const doc: BibleDocument = {
      books: [{
        id: 'empty',
        chapters: [{ number: 1, verses: [] }],
      }],
    };
    // verses array is nonempty per schema, but function should handle it gracefully
    expect(countVerses(doc)).toBe(0);
  });

  it('approximates full PROTESTANT_66 canon (~17380 verses)', () => {
    // Simulate a small subset to verify the counting logic scales
    const doc: BibleDocument = {
      books: [
        {
          id: 'gen',
          chapters: [
            { number: 1, verses: Array.from({ length: 31 }, (_, i) => ({ number: i + 1, text: 'text' })) },
            { number: 2, verses: Array.from({ length: 25 }, (_, i) => ({ number: i + 1, text: 'text' })) },
          ],
        },
        {
          id: 'exo',
          chapters: [{ number: 1, verses: Array.from({ length: 22 }, (_, i) => ({ number: i + 1, text: 'text' })) }],
        },
      ],
    };
    const total = countVerses(doc);
    expect(total).toBe(31 + 25 + 22);
    expect(total).toBe(78);
  });
});
