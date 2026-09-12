/**
 * Bible Infrastructure — Corpus Validator tests (§52–§55, D5)
 *
 * The validator is a pure function: it takes a `BibleDocument` (normalized,
 * VersyFlow ids) plus a canonical expectation object and returns a structured
 * report. No I/O.
 */

import { describe, it, expect } from 'vitest';
import { validateDocument, type ValidationReport, type CanonExpectation } from '@/infrastructure/bible/bible-validator';
import type { BibleDocument } from '@/domains/bible/document';
import type { BibleBookData } from '@/domains/bible/repository-local';

/** Build a minimal valid 2-book BibleDocument (normalized, VersyFlow ids). */
function makeDoc(overrides: { books?: Array<{ id: string; chapters: Array<{ number: number; verses: Array<{ number: number; text: string }> }> }> } = {}): BibleDocument {
  return {
    books: overrides.books ?? [
      {
        id: 'gen',
        chapters: [
          {
            number: 1,
            verses: [
              { number: 1, text: 'Au commencement, Dieu créa les cieux et la terre.' },
              { number: 2, text: 'La terre était informe et vide.' },
            ],
          },
        ],
      },
      {
        id: 'mat',
        chapters: [
          {
            number: 1,
            verses: [{ number: 1, text: 'Généalogie de Jésus-Christ.' }],
          },
        ],
      },
    ],
  };
}

/** Canon expectation: 2 books (gen, mat), 1 chapter each, gen=2 verses. */
const expectation: CanonExpectation = {
  expectedBooks: ['gen', 'mat'],
  expectedChapterCount: { gen: 1, mat: 1 },
  expectedVerseCount: { gen: 2, mat: 1 },
};

describe('validateDocument', () => {
  it('passes a fully valid document', () => {
    const report: ValidationReport = validateDocument(makeDoc(), expectation);
    expect(report.pass).toBe(true);
    expect(report.issues).toHaveLength(0);
  });

  it('flags missing books', () => {
    const doc = makeDoc({
      books: [
        {
          id: 'gen',
          chapters: [
            {
              number: 1,
              verses: [
                { number: 1, text: 'v1' },
                { number: 2, text: 'v2' },
              ],
            },
          ],
        },
      ],
    });
    const report = validateDocument(doc, expectation);
    expect(report.pass).toBe(false);
    expect(report.issues.some((i) => i.code === 'MISSING_BOOK')).toBe(true);
    expect(report.issues.find((i) => i.code === 'MISSING_BOOK')?.severity).toBe('error');
  });

  it('flags chapter-count mismatch', () => {
    const doc = makeDoc({
      books: [
        {
          id: 'gen',
          chapters: [
            {
              number: 1,
              verses: [{ number: 1, text: 'v' }, { number: 2, text: 'v' }],
            },
          ],
        },
        {
          id: 'mat',
          chapters: [
            {
              number: 1,
              verses: [{ number: 1, text: 'v' }],
            },
            {
              number: 2,
              verses: [{ number: 1, text: 'v' }],
            },
          ],
        },
      ],
    });
    const report = validateDocument(doc, expectation);
    expect(report.issues.some((i) => i.code === 'CHAPTER_COUNT_MISMATCH')).toBe(true);
  });

  it('flags verse-count mismatch', () => {
    const doc = makeDoc({
      books: [
        {
          id: 'gen',
          chapters: [
            {
              number: 1,
              verses: [{ number: 1, text: 'only one verse' }],
            },
          ],
        },
        {
          id: 'mat',
          chapters: [
            {
              number: 1,
              verses: [{ number: 1, text: 'v' }],
            },
          ],
        },
      ],
    });
    const report = validateDocument(doc, expectation);
    expect(report.issues.some((i) => i.code === 'VERSE_COUNT_MISMATCH')).toBe(true);
    expect(report.issues.find((i) => i.code === 'VERSE_COUNT_MISMATCH')?.severity).toBe('error');
  });

  it('flags empty verse text', () => {
    const doc = makeDoc({
      books: [
        {
          id: 'gen',
          chapters: [
            {
              number: 1,
              verses: [
                { number: 1, text: 'v1' },
                { number: 2, text: '   ' },
              ],
            },
          ],
        },
        {
          id: 'mat',
          chapters: [
            {
              number: 1,
              verses: [{ number: 1, text: 'v' }],
            },
          ],
        },
      ],
    });
    const report = validateDocument(doc, expectation);
    expect(report.issues.some((i) => i.code === 'EMPTY_VERSE')).toBe(true);
    expect(report.issues.find((i) => i.code === 'EMPTY_VERSE')?.severity).toBe('error');
  });

  it('flags non-consecutive verse numbers within a chapter', () => {
    const doc = makeDoc({
      books: [
        {
          id: 'gen',
          chapters: [
            {
              number: 1,
              verses: [
                { number: 1, text: 'v1' },
                { number: 3, text: 'v3' }, // verse 2 is missing
              ],
            },
          ],
        },
        {
          id: 'mat',
          chapters: [
            {
              number: 1,
              verses: [{ number: 1, text: 'v' }],
            },
          ],
        },
      ],
    });
    const report = validateDocument(doc, expectation);
    expect(report.issues.some((i) => i.code === 'VERSE_GAP')).toBe(true);
    expect(report.issues.find((i) => i.code === 'VERSE_GAP')?.severity).toBe('error');
  });

  it('flags duplicate book ids', () => {
    const doc = makeDoc({
      books: [
        {
          id: 'gen',
          chapters: [
            {
              number: 1,
              verses: [
                { number: 1, text: 'v1' },
                { number: 2, text: 'v2' },
              ],
            },
          ],
        },
        {
          id: 'gen', // duplicate
          chapters: [
            {
              number: 1,
              verses: [{ number: 1, text: 'v' }],
            },
          ],
        },
      ],
    });
    const report = validateDocument(doc, { ...expectation, expectedBooks: ['gen'] });
    expect(report.issues.some((i) => i.code === 'DUPLICATE_BOOK')).toBe(true);
    expect(report.issues.find((i) => i.code === 'DUPLICATE_BOOK')?.severity).toBe('error');
  });

  it('reports structured summary with total issues', () => {
    const doc = makeDoc({
      books: [
        {
          id: 'gen',
          chapters: [
            {
              number: 1,
              verses: [
                { number: 1, text: 'v1' },
                { number: 2, text: '' }, // empty
              ],
            },
          ],
        },
      ],
    });
    const report = validateDocument(doc, expectation);
    expect(report.issues.length).toBeGreaterThan(0);
    expect(report.pass).toBe(false);
    expect(report.totalIssues).toBe(report.issues.length);
  });

  it('returns a report with known issue codes as a set', () => {
    const report = validateDocument(makeDoc(), expectation);
    const codes = new Set(report.issues.map((i) => i.code));
    const knownCodes = new Set([
      'MISSING_BOOK',
      'EXTRA_BOOK',
      'DUPLICATE_BOOK',
      'CHAPTER_COUNT_MISMATCH',
      'VERSE_COUNT_MISMATCH',
      'EMPTY_VERSE',
      'VERSE_GAP',
      'UNICODE_SURROGATE',
    ]);
    for (const c of codes) {
      expect(knownCodes.has(c)).toBe(true);
    }
  });
});
