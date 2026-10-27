/**
 * VerseNoteService — local personal notes on a specific verse.
 *
 * Keyed by `versyflow:note:{bookId}:{chapter}:{verse}` in the IStorage
 * adapter (localStorage on Web / Capacitor WebView). Saving an empty
 * note removes the entry.
 */

import { MmkvStorage } from '@/infrastructure/storage';

const storage = new MmkvStorage();

const keyFor = (bookId: string, chapter: number, verse: number) =>
  `versyflow:note:${bookId}:${chapter}:${verse}`;

export async function getVerseNote(
  bookId: string,
  chapter: number,
  verse: number,
): Promise<string> {
  return (await storage.get(keyFor(bookId, chapter, verse))) ?? '';
}

export async function saveVerseNote(
  bookId: string,
  chapter: number,
  verse: number,
  text: string,
): Promise<void> {
  const key = keyFor(bookId, chapter, verse);
  if (text.trim()) {
    await storage.set(key, text.trim());
  } else {
    await storage.delete(key);
  }
}
