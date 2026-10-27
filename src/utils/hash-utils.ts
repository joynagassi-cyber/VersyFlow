/**
 * Hash Utility — Generate deterministic IDs for MemorizationRecord
 */

/**
 * Create a stable ID for a verse combination.
 * Format: hash of bookId:chapter:verse:translationId
 */
export function generateVerseId(bookId: string, chapter: number, verse: number, translationId: string): string {
  const input = `${bookId}:${chapter}:${verse}:${translationId}`;
  // Simple hash (djb2 algorithm — sufficient for MVP)
  let hash = 5381;
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) + hash + input.charCodeAt(i)) >>> 0;
  }
  return `v_${hash.toString(36).slice(0, 8)}`;
}
