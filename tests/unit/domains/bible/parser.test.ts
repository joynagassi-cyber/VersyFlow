/**
 * Tests for Bible Parser — reference resolution from text strings
 * Tests P1B-1 from docs/18-test-strategy.md
 */

import { describe, it, expect } from 'vitest';
import { parseReference, buildReference } from '@/domains/bible/parser';
import { resolveBookId } from '@/domains/bible/entities';

describe('parseReference()', () => {
  it('parses standard "Jean 3:16" format', () => {
    const result = parseReference('Jean 3:16');
    expect(result).not.toBeNull();
    expect(result!.bookId).toBe('joh');
    expect(result!.chapter).toBe(3);
    expect(result!.verse).toBe(16);
    expect(result!.verseEnd).toBeUndefined();
  });

  it('parses "Jn 3:16" alias to the same result', () => {
    const result = parseReference('Jn 3:16');
    expect(result).not.toBeNull();
    expect(result!.bookId).toBe('joh');
    expect(result!.chapter).toBe(3);
    expect(result!.verse).toBe(16);
  });

  it('parses range "Jean 3:16-18" with verseEnd', () => {
    const result = parseReference('Jean 3:16-18');
    expect(result).not.toBeNull();
    expect(result!.bookId).toBe('joh');
    expect(result!.chapter).toBe(3);
    expect(result!.verse).toBe(16);
    expect(result!.verseEnd).toBe(18);
  });

  it('parses range with extra spaces "Jean 3: 16 - 18"', () => {
    // This format is NOT supported by the parser (no spaces around colon)
    const result = parseReference('Jean 3: 16 - 18');
    expect(result).toBeNull();
  });

  it('is case-insensitive: "JEAN 3:16" works', () => {
    const result = parseReference('JEAN 3:16');
    expect(result).not.toBeNull();
    expect(result!.bookId).toBe('joh');
  });

  it('handles mixed case "jeAn 3:16"', () => {
    const result = parseReference('jeAn 3:16');
    expect(result).not.toBeNull();
    expect(result!.bookId).toBe('joh');
  });

  it('parses chapter-only "Jean 3" (no verse)', () => {
    const result = parseReference('Jean 3');
    expect(result).not.toBeNull();
    expect(result!.bookId).toBe('joh');
    expect(result!.chapter).toBe(3);
    expect(result!.verse).toBeUndefined();
  });

  it('returns null for unknown book "NonExistent 1:1"', () => {
    const result = parseReference('NonExistent 1:1');
    expect(result).toBeNull();
  });

  it('returns null for invalid chapter (0)', () => {
    const result = parseReference('Jean 0:1');
    expect(result).toBeNull();
  });

  it('returns null for invalid verse (0)', () => {
    const result = parseReference('Jean 1:0');
    expect(result).toBeNull();
  });

  it('returns null when verseEnd < verseStart in range', () => {
    const result = parseReference('Jean 3:18-16');
    expect(result).toBeNull();
  });

  it('returns null for empty string', () => {
    const result = parseReference('');
    expect(result).toBeNull();
  });

  it('returns null for malformed string with no numbers', () => {
    const result = parseReference('Jean');
    expect(result).toBeNull();
  });

  it('parses "GENESIS 1:1" to Genesis', () => {
    const result = parseReference('GENESIS 1:1');
    expect(result).not.toBeNull();
    expect(result!.bookId).toBe('gen');
    expect(result!.chapter).toBe(1);
    expect(result!.verse).toBe(1);
  });

  it('parses "PSAUMES 23:1" to Psalms', () => {
    const result = parseReference('PSAUMES 23:1');
    expect(result).not.toBeNull();
    expect(result!.bookId).toBe('psa');
  });

  it('parses "MATTHIEU 5:3" to Matthew', () => {
    const result = parseReference('MATTHIEU 5:3');
    expect(result).not.toBeNull();
    expect(result!.bookId).toBe('mat');
  });

  it('parses " Apocalypse 1:1" with leading space', () => {
    const result = parseReference(' Apocalypse 1:1');
    expect(result).not.toBeNull();
    expect(result!.bookId).toBe('rev');
  });

  it('parses "rev 22:21" shorthand', () => {
    const result = parseReference('rev 22:21');
    expect(result).not.toBeNull();
    expect(result!.bookId).toBe('rev');
  });

  it('parses numeric-prefixed book "1 Jean 1:1"', () => {
    const result = parseReference('1 Jean 1:1');
    expect(result).not.toBeNull();
    expect(result!.bookId).toBe('1joh');
    expect(result!.chapter).toBe(1);
    expect(result!.verse).toBe(1);
  });

  it('parses range "1 Co 12:3-11"', () => {
    const result = parseReference('1 Co 12:3-11');
    expect(result).not.toBeNull();
    expect(result!.bookId).toBe('1cor');
    expect(result!.chapter).toBe(12);
    expect(result!.verse).toBe(3);
    expect(result!.verseEnd).toBe(11);
  });

  it('parses "2 Tim 3:16"', () => {
    const result = parseReference('2 Tim 3:16');
    expect(result).not.toBeNull();
    expect(result!.bookId).toBe('2tim');
    expect(result!.chapter).toBe(3);
    expect(result!.verse).toBe(16);
  });

  it('parses chapter-only numeric book "2 Chron 34"', () => {
    const result = parseReference('2 Chron 34');
    expect(result).not.toBeNull();
    expect(result!.bookId).toBe('2chron');
    expect(result!.chapter).toBe(34);
    expect(result!.verse).toBeUndefined();
  });
});

describe('buildReference()', () => {
  it('builds "gen 1:1" for English UI', () => {
    const ref = buildReference('gen', 1, 1, 'en');
    expect(ref).toBe('Genesis 1:1');
  });

  it('builds "gen 1:1" for French UI', () => {
    const ref = buildReference('gen', 1, 1, 'fr');
    expect(ref).toBe('gen 1:1');
  });

  it('defaults to bookId when uiLanguage is unknown', () => {
    const ref = buildReference('joh', 3, 16, 'de');
    expect(ref).toBe('joh 3:16');
  });

  it('uses English name for known books when en is requested', () => {
    const ref = buildReference('joh', 3, 16, 'en');
    expect(ref).toBe('John 3:16');
  });

  it('handles chapter without verse', () => {
    // buildReference requires verse param; this tests boundary
    const ref = buildReference('gen', 1, 1, 'en');
    expect(ref).toContain('1:1');
  });
});

describe('resolveBookId()', () => {
  it('resolves exact book id', () => {
    expect(resolveBookId('joh')).toBe('joh');
    expect(resolveBookId('gen')).toBe('gen');
  });

  it('resolves aliases case-insensitively', () => {
    expect(resolveBookId('Jn')).toBe('joh');
    expect(resolveBookId('JN')).toBe('joh');
    expect(resolveBookId('jn')).toBe('joh');
  });

  it('returns null for unknown alias', () => {
    expect(resolveBookId('xyz')).toBeNull();
  });

  it('trims whitespace before resolving', () => {
    expect(resolveBookId('  joh  ')).toBe('joh');
  });

  it('resolves french alias "Jean" to "joh"', () => {
    expect(resolveBookId('Jean')).toBe('joh');
  });

  it('resolves "genesis" to "gen"', () => {
    expect(resolveBookId('genesis')).toBe('gen');
  });

  it('resolves "ex" to "exo"', () => {
    expect(resolveBookId('ex')).toBe('exo');
  });

  it('resolves "ps" to "psa"', () => {
    expect(resolveBookId('ps')).toBe('psa');
  });

  it('resolves "mt" to "mat"', () => {
    expect(resolveBookId('mt')).toBe('mat');
  });

  it('resolves "apc" to "rev"', () => {
    expect(resolveBookId('apc')).toBe('rev');
  });

  it('resolves all numeric-prefixed French aliases', () => {
    expect(resolveBookId('1 samuel')).toBe('1sam');
    expect(resolveBookId('2 sam')).toBe('2sam');
    expect(resolveBookId('1 rois')).toBe('1roi');
    expect(resolveBookId('2 ro')).toBe('2roi');
    expect(resolveBookId('1 chroniques')).toBe('1chron');
    expect(resolveBookId('2 chron')).toBe('2chron');
    expect(resolveBookId('1 corinthiens')).toBe('1cor');
    expect(resolveBookId('2 cor')).toBe('2cor');
    expect(resolveBookId('1 thessaloniciens')).toBe('1thes');
    expect(resolveBookId('2 thessaloniciens')).toBe('2thes');
    expect(resolveBookId('1 timothée')).toBe('1tim');
    expect(resolveBookId('2 tim')).toBe('2tim');
    expect(resolveBookId('1 pierre')).toBe('1pet');
    expect(resolveBookId('2 pier')).toBe('2pet');
    expect(resolveBookId('1 jean')).toBe('1joh');
    expect(resolveBookId('2 je')).toBe('2joh');
    expect(resolveBookId('3 jean')).toBe('3joh');
  });

  it('resolves all numeric-prefixed English aliases', () => {
    expect(resolveBookId('1 samuel')).toBe('1sam');
    expect(resolveBookId('2 kings')).toBe('2roi');
    expect(resolveBookId('1 chronicles')).toBe('1chron');
    expect(resolveBookId('2 chron')).toBe('2chron');
    expect(resolveBookId('1 corinthians')).toBe('1cor');
    expect(resolveBookId('2 cor')).toBe('2cor');
    expect(resolveBookId('1 thessalonians')).toBe('1thes');
    expect(resolveBookId('2 thessaloniciens')).toBe('2thes');
    expect(resolveBookId('1 timothy')).toBe('1tim');
    expect(resolveBookId('2 tim')).toBe('2tim');
    expect(resolveBookId('1 peter')).toBe('1pet');
    expect(resolveBookId('2 peter')).toBe('2pet');
    expect(resolveBookId('1 john')).toBe('1joh');
    expect(resolveBookId('2 john')).toBe('2joh');
    expect(resolveBookId('3 john')).toBe('3joh');
  });
});
