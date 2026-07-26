/**
 * String Utility — Reference parsing helpers
 */

/**
 * Normalize a reference string for searching.
 * Converts to lowercase, trims, removes special chars except colons/hyphens.
 */
export function normalizeReference(ref: string): string {
  return ref.toLowerCase().trim().replace(/[^a-zàâäéèêëïîôùûüÿçœæ0-9:\s\-]/g, '');
}

/**
 * Build a display reference from parts.
 * Format: "Book Chapter:Verse"
 */
export function buildDisplayRef(bookName: string, chapter: number, verse?: number): string {
  if (verse !== undefined) {
    return `${bookName} ${chapter}:${verse}`;
  }
  return `${bookName} ${chapter}`;
}

/**
 * Sanitize text for safe storage/display.
 */
export function sanitizeText(text: string): string {
  return text.trim();
}
