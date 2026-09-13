/**
 * Bible Infrastructure — USFM adapter tests (§46, §49, §50)
 *
 * The adapter is a structural state machine: it tracks book / chapter / verse
 * from USFM tags, keeps word/division/italic markers, strips footnotes &
 * cross-refs, and joins poetry lines. Book code → VersyFlow id is NOT done
 * here (that is the normalizer's job).
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { USFMAdapter } from '@/infrastructure/bible/adapters/usfm-adapter';
import type { BibleDocument } from '@/domains/bible/document';

const here = fileURLToPath(import.meta.url);
const fixture = readFileSync(
  resolve(dirname(here), '../fixtures/bible/usfm/minimal.usfm'),
  'utf-8',
);

function parseFixture(): BibleDocument {
  return USFMAdapter.parse(fixture);
}

describe('USFMAdapter (structural, §50 multi-style)', () => {
  it('parses a single book with the USFM code as id', () => {
    const doc = parseFixture();
    expect(doc.books).toHaveLength(1);
    expect(doc.books[0].id).toBe('GEN');
  });

  it('parses chapters and consecutive verses', () => {
    const doc = parseFixture();
    const gen = doc.books[0];
    expect(gen.chapters.map((c) => c.number)).toEqual([1, 2]);
    expect(gen.chapters[0].verses.map((v) => v.number)).toEqual([1, 2, 3]);
    expect(gen.chapters[1].verses.map((v) => v.number)).toEqual([1, 2]);
  });

  it('keeps word-marker text and strips strongs payload', () => {
    const doc = parseFixture();
    const v1 = doc.books[0].chapters[0].verses[0];
    expect(v1.text).toContain('commencement');
    expect(v1.text).toContain('créa');
    expect(v1.text).not.toContain('strong=');
    expect(v1.text).not.toContain('\\w');
  });

  it('strips footnotes (including nested italics inside them)', () => {
    const doc = parseFixture();
    const v1 = doc.books[0].chapters[0].verses[0];
    expect(v1.text).not.toContain('Job'); // xref/footnote refs gone
    expect(v1.text).not.toContain('\\f');
    expect(v1.text).not.toContain('\\+it');
    // Nested-italic "vide" marker inside a footnote must be stripped too.
    expect(v1.text).not.toContain('le vide');
  });

  it('strips cross-reference blocks', () => {
    const doc = parseFixture();
    const v1 = doc.books[0].chapters[0].verses[0];
    expect(v1.text).not.toContain('\\x');
    expect(v1.text).not.toContain('\\xt');
  });

  it('joins poetry (q1/q2) lines into a single verse with spaces', () => {
    const doc = parseFixture();
    const v3 = doc.books[0].chapters[0].verses[2];
    expect(v3.text).toContain('La terre n’était pas encore sortie');
    expect(v3.text).toContain('Les ténèbres couvraient l’abîme');
    // The two poetry lines are inside one verse, joined by whitespace.
    expect(v3.text).toMatch(/sortie\s*\.\s*Les ténèbres/);
  });

  it('continues verse text across multiple structural-free lines', () => {
    const doc = parseFixture();
    // Chapter 2 verse 1 has a plain continuation (two source lines).
    const v1 = doc.books[0].chapters[1].verses[0];
    expect(v1.text).toContain('Que la lumière soit');
    // The following \v 2 must be a separate verse, not swallowed into v1.
    const v2 = doc.books[0].chapters[1].verses[1];
    expect(v2.text).toBe('Et la lumière fut.');
  });

  it('collapses internal whitespace and keeps unicode accents', () => {
    const doc = parseFixture();
    const v1 = doc.books[0].chapters[0].verses[0];
    expect(v1.text).not.toMatch(/\s{2,}/); // no double spaces
    expect(v1.text).toMatch(/[àâéèê]/u); // accented chars preserved
  });

  it('reports a multi-book corpus (book switches on id)', () => {
    const two = USFMAdapter.parse([
      '\\id GEN\n\\c 1\n\\v 1 un\n',
      '\\id MAT\n\\c 1\n\\v 1 deux\n',
    ].join(''));
    expect(two.books.map((b) => b.id)).toEqual(['GEN', 'MAT']);
  });
});
