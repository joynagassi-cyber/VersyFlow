/**
 * Bible Infrastructure — Format Detector
 *
 * Sniffs a small leading slice of raw source content and returns which Bible
 * text format it is. This is the "identify format" step (§45 pipeline, §46)
 * that lets the orchestrator pick the right adapter.
 *
 * Pure, no I/O, no translation logic — only structural prefix detection.
 */

export type BibleSourceFormat = 'usfm' | 'usfx' | 'json' | 'unknown';

/**
 * Detect the source format from a leading slice of the content.
 *
 * - USFM  : first meaningful char is a backslash `\` followed by a lowercase
 *           tag letter (e.g. `\id GEN`, `\c 1`). USFM is line-structured text.
 * - USFX  : an XML document (leading `<?xml` or `<`).
 * - JSON  : leading `{` or `[` after optional whitespace / BOM.
 * - unknown: anything else.
 */
export function detectFormat(sample: string): BibleSourceFormat {
  const stripped = sample.replace(/^[\uFEFF\s]+/, ''); // BOM + leading whitespace
  if (stripped.length === 0) return 'unknown';

  if (stripped.startsWith('<?xml') || stripped.startsWith('<')) {
    return 'usfx';
  }

  // USFM: a backslash followed by at least one lowercase ASCII letter.
  if (stripped.startsWith('\\')) {
    const next = stripped.charAt(1);
    if (next >= 'a' && next <= 'z') return 'usfm';
  }

  if (stripped.startsWith('{') || stripped.startsWith('[')) {
    return 'json';
  }

  return 'unknown';
}
