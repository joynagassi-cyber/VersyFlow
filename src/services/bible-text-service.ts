/**
 * BibleTextService — chargement de la Bible livrée avec l'application.
 *
 * La LSG 1910 est projetée en fichiers par chapitre
 * (`scripts/bible/split-lsg.mjs`) sous `public/data/bible/lsg/` :
 *
 *   index.json              structure des 66 livres, ~37 Ko, chargée d'office
 *   <bookId>/<n>.json       un chapitre (~4 Ko), chargé à la demande
 *
 * Trois niveaux de lecture, du plus léger au plus lourd :
 *   - `loadBibleIndex(id)`   la structure seule (navigation, compteurs).
 *   - `loadBibleChapter(...)` un chapitre (le lecteur).
 *   - `loadTranslationData(id)` / `loadTranslationBooks(id)` le corpus entier,
 *     reconstruit — réservé à la recherche plein texte, aux statistiques et à
 *     l'export. Le lecteur ne l'appelle jamais.
 *
 * Une traduction peut aussi n'exister que sous forme de fichier monolithique
 * (`<id>.json`) : c'est la forme historique et la source de vérité de la LSG.
 * Le service essaie la projection éclatée puis retombe sur le fichier unique.
 *
 * Aucun réseau tiers : tout vient de `public/data/bible/`.
 */

import {
  LocalBibleRepository,
  InMemoryBibleTextSource,
  type ILocalBibleRepository,
  type IBibleTextSource,
  type BibleBookData,
  type BibleChapterData,
  type BibleTranslationData,
  parseTranslationData,
  filterCanonicalBooks,
} from '@/domains/bible/repository-local';
import { BibleJsonFileSource } from '@/infrastructure/bible/bible-json-source';
import { SplitBibleTextSource } from '@/infrastructure/bible/split-bible-source';
import {
  indexChapterCount,
  indexVerseCount,
  type SplitBibleIndex,
} from '@/domains/bible/split-index';
import {
  createBibleDatasetCache,
  type IBibleDatasetCache,
} from '@/infrastructure/bible/bible-dataset-cache';

// Static catalogue of the translations shipped with the app.
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
import datasetCatalogJson from '../../data/bible/dataset-catalog.json';

export interface BibleDatasetCatalogEntry {
  id: string;
  checksum: string;
  sizeBytes: number;
  builtAt: string;
}

/**
 * Entrée cataloguée mais non construite : `checksum` vaut la chaîne littérale
 * `sha256:pending`. Ces entrées sont exclues de `BIBLE_DATASET_CATALOG`.
 */
export interface PendingDatasetCatalogEntry {
  id: string;
  checksum: string; // 'sha256:pending'
  sizeBytes: number;
  builtAt: string;
  status: 'pending';
}

type RawCatalogEntry = BibleDatasetCatalogEntry | PendingDatasetCatalogEntry;

function isBuilt(entry: RawCatalogEntry): entry is BibleDatasetCatalogEntry {
  return !/^sha256:pending$/.test(entry.checksum);
}

/** Catalogue des traductions réellement disponibles dans le build. */
export const BIBLE_DATASET_CATALOG: BibleDatasetCatalogEntry[] = (
  datasetCatalogJson as unknown as RawCatalogEntry[]
).filter(isBuilt);

/**
 * Entrée de catalogue d'une traduction, ou null.
 *
 * Les fichiers sont des assets locaux : le mode démo les lit comme n'importe
 * quel autre asset, il n'y a pas de requête tierce à éviter.
 */
export function findRemoteDatasetEntry(
  translationId: string,
): BibleDatasetCatalogEntry | null {
  return BIBLE_DATASET_CATALOG.find((e) => e.id === translationId) ?? null;
}

/**
 * Dossier des datasets — celui de l'application, pas un bucket distant.
 *
 * Les fichiers sont livrés dans `public/data/bible/`, donc « télécharger une
 * traduction » est une lecture d'asset de même origine : disponible hors ligne
 * dès que l'application est installée, sans dépendance tierce.
 */
export function datasetBaseUrl(): string {
  return '/data/bible';
}

type LoadResult = BibleBookData[] | null;

const repo: ILocalBibleRepository = new LocalBibleRepository(new BibleJsonFileSource());
let cache: IBibleDatasetCache | null = null;
/** Sources éclatées, une par traduction (elles cachent index et chapitres). */
const splitSources = new Map<string, SplitBibleTextSource>();
/** Corpus complets déjà reconstruits, par traduction. */
const corpusCache = new Map<string, BibleTranslationData>();

function peekCache(): IBibleDatasetCache {
  if (!cache) cache = createBibleDatasetCache();
  return cache;
}

/** Source éclatée d'une traduction (créée à la demande, réutilisée ensuite). */
export function getSplitSource(translationId = 'lsg'): SplitBibleTextSource {
  let source = splitSources.get(translationId);
  if (!source) {
    source = new SplitBibleTextSource({ baseDir: datasetBaseUrl() });
    splitSources.set(translationId, source);
  }
  return source;
}

/** Réinitialise les caches de session (tests, changement de build). */
export function resetBibleCaches(): void {
  splitSources.clear();
  corpusCache.clear();
  cache = null;
}

// =====================================================================
// Niveau 1 — la structure (index éclaté)
// =====================================================================

/**
 * Structure d'une traduction, sans un seul verset : 66 livres et, par
 * chapitre, le nombre de versets. C'est tout ce qu'il faut pour la liste des
 * livres, la grille des chapitres et les compteurs.
 *
 * Retourne null quand la traduction n'est pas livrée en projection éclatée
 * (fichier monolithique seulement) — l'appelant retombe alors sur le corpus.
 */
export async function loadBibleIndex(
  translationId: string = 'lsg',
): Promise<SplitBibleIndex | null> {
  try {
    return await getSplitSource(translationId).loadIndex(translationId);
  } catch {
    return null;
  }
}

/** Vrai quand la traduction peut être lue (projection éclatée présente). */
export async function isBibleAvailable(translationId: string = 'lsg'): Promise<boolean> {
  if (findRemoteDatasetEntry(translationId) === null) return false;
  return getSplitSource(translationId).has(translationId);
}

// =====================================================================
// Niveau 2 — un chapitre (le lecteur)
// =====================================================================

/**
 * Un chapitre d'une traduction : le seul chargement que fait le lecteur.
 *
 * Retourne null quand le chapitre n'existe pas (ou quand la traduction n'est
 * pas livrée en projection éclatée).
 */
export async function loadBibleChapter(
  translationId: string,
  bookId: string,
  chapterNumber: number,
): Promise<BibleChapterData | null> {
  return getSplitSource(translationId).loadChapter(translationId, bookId, chapterNumber);
}

/** Métadonnées d'un livre dans l'index (null si absent). */
export async function loadBibleBookMeta(
  translationId: string,
  bookId: string,
): Promise<SplitBibleIndex['books'][number] | null> {
  const index = await loadBibleIndex(translationId);
  return index?.books.find((book) => book.id === bookId) ?? null;
}

// =====================================================================
// Niveau 3 — le corpus complet (recherche, statistiques, export)
// =====================================================================

/**
 * Corpus complet d'une traduction ; null quand il n'est pas livré.
 *
 * Ordre de résolution :
 *   1. projection éclatée, reconstruite chapitre par chapitre (mise en cache) ;
 *   2. fichier monolithique `<id>.json` (la source de vérité de la LSG) ;
 *   3. null.
 */
export async function loadTranslationData(
  translationId: string = 'lsg',
): Promise<BibleTranslationData | null> {
  const cached = corpusCache.get(translationId);
  if (cached) return cached;

  // 1. Projection éclatée.
  try {
    const data = await getSplitSource(translationId).load(translationId);
    corpusCache.set(translationId, data);
    return data;
  } catch {
    // pas de projection pour cette traduction — on essaie le fichier unique
  }

  // 2. Fichier monolithique, quand il est livré en asset local.
  try {
    const books = await repo.getBooks(translationId);
    const data = {
      id: translationId,
      language: 'fr',
      name: translationId,
      books: books as unknown as BibleTranslationData['books'],
    } satisfies BibleTranslationData;
    corpusCache.set(translationId, data);
    return data;
  } catch {
    return null;
  }
}

/** Corpus complet (tableau de livres) ; null quand indisponible. */
export async function loadTranslationBooks(
  translationId: string = 'lsg',
): Promise<LoadResult> {
  const data = await loadTranslationData(translationId);
  return data ? data.books : null;
}

/**
 * Source d'écriture pour les moteurs qui lisent verset par verset
 * (mémorisation). Le corpus complet est déjà en cache après le premier appel.
 */
export async function resolveBibleTextSource(
  translationId: string = 'lsg',
): Promise<IBibleTextSource> {
  const split = getSplitSource(translationId);
  if (await split.has(translationId)) return split;
  const data = await loadTranslationData(translationId);
  if (!data) {
    throw new Error(
      `Traduction « ${translationId} » non disponible dans cette version de l’application.`,
    );
  }
  return new InMemoryBibleTextSource({ [translationId]: data });
}

/**
 * Charge explicitement une traduction dans le cache de session (action
 * « Télécharger » de l'écran des traductions).
 *
 * La projection éclatée est déjà sur le disque : il n'y a rien à télécharger.
 * L'opération réchauffe le cache chapitre par chapitre en rapportant une
 * progression réelle, puis rend le corpus complet.
 */
export async function downloadAndLoadTranslationData(
  translationId: string,
  onProgress?: (percent: number, receivedBytes: number) => void,
  options: { signal?: AbortSignal } = {},
): Promise<BibleTranslationData> {
  if (findRemoteDatasetEntry(translationId) === null) {
    throw new Error(`No remote dataset registered for translation "${translationId}"`);
  }
  if (!/^[a-z0-9_-]+$/.test(translationId)) {
    throw new Error(`Invalid translation id "${translationId}"`);
  }
  if (options.signal?.aborted) throw new DOMException('Download aborted', 'AbortError');

  const split = getSplitSource(translationId);
  if (!(await split.has(translationId))) {
    throw new Error(
      `Traduction « ${translationId} » non disponible dans cette version de l’application.`,
    );
  }
  const index = await split.loadIndex(translationId);
  const total = indexChapterCount(index);
  let done = 0;
  let bytes = 0;

  for (const book of index.books) {
    for (const chapter of book.chapterVerseCounts) {
      if (options.signal?.aborted) throw new DOMException('Download aborted', 'AbortError');
      const loaded = await split.loadChapter(translationId, book.id, chapter.number);
      bytes += loaded?.verses.reduce((sum, verse) => sum + verse.text.length, 0) ?? 0;
      done += 1;
      onProgress?.(Math.min(99, Math.round((done / total) * 100)), bytes);
    }
  }
  onProgress?.(100, bytes);

  const data = await split.load(translationId);
  corpusCache.set(translationId, data);
  return data;
}

export async function downloadAndLoadTranslationBooks(
  translationId: string,
  onProgress?: (percent: number, receivedBytes: number) => void,
  options: { signal?: AbortSignal } = {},
): Promise<BibleBookData[]> {
  return (await downloadAndLoadTranslationData(translationId, onProgress, options)).books;
}

// Re-export for tests that build a local source directly.
export { InMemoryBibleTextSource };

// =====================================================================
// Statistiques d'une traduction (chapitres / versets) — lues dans l'index
// =====================================================================

export interface TranslationStats {
  chapters: number;
  verses: number;
  /** Year found in the dataset, when present. */
  year?: number;
}

/**
 * Statistiques d'une traduction.
 *
 * Elles viennent de l'index éclaté quand il existe : compter les chapitres et
 * versets d'un index de 37 Ko est instantané, là où la version précédente
 * parsait 6,9 Mo de JSON (et cachait le résultat 24 h dans localStorage pour
 * éviter de le refaire).
 */
export async function getTranslationStats(
  translationId: string,
): Promise<TranslationStats | null> {
  if (findRemoteDatasetEntry(translationId) === null) return null;

  const index = await loadBibleIndex(translationId);
  if (index) {
    const stats: TranslationStats = {
      chapters: indexChapterCount(index),
      verses: indexVerseCount(index),
      year: index.year,
    };
    return stats;
  }

  // Repli : corpus monolithique, compté une fois puis gardé en session.
  const data = await loadTranslationData(translationId);
  if (!data) return null;
  let chapters = 0;
  let verses = 0;
  for (const book of data.books) {
    chapters += book.chapters.length;
    verses += filterCanonicalBooks([book] as never)[0]
      ? book.chapters.reduce((sum, chapter) => sum + chapter.verses.length, 0)
      : 0;
  }
  return { chapters, verses, year: data.year };
}

/** Compte les chapitres et versets d'un corpus déjà validé. */
export function computeStats(data: BibleTranslationData): TranslationStats {
  let chapters = 0;
  let verses = 0;
  for (const book of data.books) {
    chapters += book.chapters.length;
    for (const chapter of book.chapters) verses += chapter.verses.length;
  }
  return { chapters, verses, year: data.year };
}

// Garde-fou : `parseTranslationData` reste la seule porte d'entrée des
// datasets, y compris pour la projection éclatée.
export { parseTranslationData };
