/**
 * VerseNoteService — local personal notes on a specific verse.
 *
 * Keyed by `versyflow:note:{bookId}:{chapter}:{verse}` in the IStorage
 * adapter (localStorage on Web / Capacitor WebView). Saving an empty
 * note removes the entry.
 */

import { MmkvStorage } from '@/infrastructure/storage';

const storage = new MmkvStorage();

const KEY_PREFIX = 'versyflow:note:';

const keyFor = (bookId: string, chapter: number, verse: number) =>
  `${KEY_PREFIX}${bookId}:${chapter}:${verse}`;

export interface VerseNoteEntry {
  bookId: string;
  chapter: number;
  verse: number;
  /** Reference canonique `bookId:chapter:verse`. */
  verseKey: string;
  text: string;
}

/**
 * Toutes les notes personnelles enregistrées sur cet appareil.
 *
 * L'inventaire se fait par énumération des clés du stockage : une note
 * enregistrée par l'ancien code (ou par un autre écran) est donc vue ici,
 * sans registre séparé à maintenir. Les clés non conformes sont ignorées.
 *
 * La date de modification n'est **pas** disponible : le format actuel ne
 * stocke que le texte. L'écran le dit plutôt que d'afficher une date fausse.
 */
export async function listVerseNotes(): Promise<VerseNoteEntry[]> {
  const keys = await storage.getAllKeys();
  const entries: VerseNoteEntry[] = [];
  for (const key of keys) {
    if (!key.startsWith(KEY_PREFIX)) continue;
    const match = /^([^:]+):(\d+):(\d+)$/.exec(key.slice(KEY_PREFIX.length));
    if (!match) continue;
    const text = await storage.get(key);
    if (!text || !text.trim()) continue;
    entries.push({
      bookId: match[1],
      chapter: Number(match[2]),
      verse: Number(match[3]),
      verseKey: `${match[1]}:${match[2]}:${match[3]}`,
      text,
    });
  }
  return entries.sort(
    (a, b) => a.bookId.localeCompare(b.bookId) || a.chapter - b.chapter || a.verse - b.verse,
  );
}

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
