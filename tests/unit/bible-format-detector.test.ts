/**
 * Bible Infrastructure — format detector tests (§45 pipeline, §46)
 *
 * Pure, no I/O. Verifies the orchestrator can route source slices to the
 * correct adapter by sniffing the content prefix.
 */

import { describe, it, expect } from 'vitest';
import { detectFormat } from '@/infrastructure/bible/bible-format-detector';

describe('detectFormat', () => {
  it('detects USFM (backslash + lowercase tag)', () => {
    expect(detectFormat('\\id GEN\n\\h GENESIS\n\\c 1\n\\v 1 text')).toBe('usfm');
    expect(detectFormat('\\c 1')).toBe('usfm');
    expect(detectFormat('  \n\\id JHN')).toBe('usfm');
  });

  it('detects USFX / XML', () => {
    expect(detectFormat('<?xml version="1.0" encoding="utf-8"?>\n<usfx>')).toBe('usfx');
    expect(detectFormat('<usfx xmlns="x">')).toBe('usfx');
  });

  it('detects JSON', () => {
    expect(detectFormat('{ "id": "lsg" }')).toBe('json');
    expect(detectFormat('[1,2,3]')).toBe('json');
    expect(detectFormat('  \n {')).toBe('json');
  });

  it('detects BOM + JSON', () => {
    expect(detectFormat('﻿{ "id": "x" }')).toBe('json');
  });

  it('returns unknown for non-Bible / backslash-uppercase / empty', () => {
    expect(detectFormat('plain text, no markers')).toBe('unknown');
    expect(detectFormat('')).toBe('unknown');
    expect(detectFormat('   ')).toBe('unknown');
    // A backslash NOT followed by a lowercase letter is not USFM.
    expect(detectFormat('\\')).toBe('unknown');
    expect(detectFormat('\\9digit')).toBe('unknown'); // digit after backslash
    // But a backslash followed by lowercase IS USFM.
    expect(detectFormat('\\id')).toBe('usfm');
  });
});
