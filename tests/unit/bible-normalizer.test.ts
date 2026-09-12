/**
 * Bible Infrastructure — Normalizer tests (§49, D4)
 *
 * Verifies the normalizer converts a canonical `BibleDocument` (USFM source
 * codes) into a `BibleTranslationData` that passes `parseTranslationData`,
 * using the canonical 66-book seed map with per-book display names filled in.
 */

import { describe, it, expect } from 'vitest';
import { normalizeDocument } from '@/infrastructure/bible/bible-normalizer';
import { parseTranslationData } from '@/domains/bible/repository-local';
import {
  USFM_TO_VFLOW,
  VFLOW_DISPLAY_NAMES,
  usfmTestament,
} from '@/domains/bible/canon-maps';
import type { BibleDocument } from '@/domains/bible/document';

/** Minimal 2-book USFM-style document (Genesis + Matthew). */
const doc: BibleDocument = {
  books: [
    {
      id: 'GEN',
      chapters: [
        {
          number: 1,
          verses: [
            { number: 1, text: 'Au commencement, Dieu créa les cieux et la terre.' },
            { number: 2, text: 'La terre était vide.' },
          ],
        },
      ],
    },
    {
      id: 'MAT',
      chapters: [
        {
          number: 1,
          verses: [{ number: 1, text: 'Généalogie de Jésus-Christ, fils de David.' }],
        },
      ],
    },
  ],
};

describe('normalizeDocument', () => {
  it('maps USFM codes to VersyFlow ids via the canonical map', () => {
    const data = normalizeDocument(doc, {
      id: 'lsg-test',
      language: 'fr',
      name: 'Test LSG',
    });
    expect(data.books.map((b) => b.id)).toEqual(['gen', 'mat']);
  });

  it('fills localised book names from the display-name map', () => {
    const names: Record<string, Record<string, string>> = Object.fromEntries(
      Object.entries(VFLOW_DISPLAY_NAMES).map(([id, n]) => [id, { fr: n.fr, en: n.en }]),
    );
    const data = normalizeDocument(doc, { id: 'x', language: 'fr', name: 'x' }, { names });
    expect(data.books[0].name.fr).toBe('Genèse');
    expect(data.books[0].name.en).toBe('Genesis');
    expect(data.books[1].name.fr).toBe('Matthieu');
  });

  it('assigns testament via the PROTESTANT_66 split', () => {
    const data = normalizeDocument(doc, { id: 'x', language: 'fr', name: 'x' });
    expect(data.books[0].testament).toBe('old'); // GEN
    expect(data.books[1].testament).toBe('new'); // MAT
  });

  it('produces data that passes parseTranslationData', () => {
    const data = normalizeDocument(doc, {
      id: 'lsg-test',
      language: 'fr',
      name: 'Test LSG',
      year: 1910,
      author: 'Test',
    });
    const parsed = parseTranslationData(data as unknown as Record<string, unknown>);
    expect(parsed.books).toHaveLength(2);
    expect(parsed.books[0].chapters[0].verses[0].text).toContain('commencement');
  });

  it('honours an injected custom codeMap / testament', () => {
    const data = normalizeDocument(
      { books: [{ id: 'XXX', chapters: [{ number: 1, verses: [{ number: 1, text: 't' }] }] }] },
      { id: 'x', language: 'fr', name: 'x' },
      {
        codeMap: { XXX: 'custom' },
        testament: () => 'new',
      },
    );
    expect(data.books[0].id).toBe('custom');
    expect(data.books[0].testament).toBe('new');
  });

  it('exposes the canonical 66-book seed map', () => {
    expect(Object.keys(USFM_TO_VFLOW)).toHaveLength(66);
    expect(usfmTestament('GEN')).toBe('old');
    expect(usfmTestament('REV')).toBe('new');
    expect(USFM_TO_VFLOW.JHN).toBe('joh');
    expect(USFM_TO_VFLOW.PHM).toBe('philem');
  });
});
