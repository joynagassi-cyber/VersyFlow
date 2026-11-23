/**
 * Bible Infrastructure — source éclatée (lazy loading)
 *
 * Lit une traduction projetée en fichiers par chapitre :
 *
 *   <base>/<translationId>/index.json          structure seule (~37 Ko)
 *   <base>/<translationId>/<bookId>/<n>.json   un chapitre (texte)
 *
 * Deux résolutions, selon l'usage :
 *   - `loadIndex(id)` : ce que le lecteur charge à l'ouverture — les 66 livres
 *     et le nombre de versets par chapitre, sans un seul verset.
 *   - `loadChapter(id, bookId, n)` : le chapitre demandé, et seulement lui.
 *   - `load(id)` : le corpus entier, reconstruit chapitre par chapitre, pour
 *     les rares écrans qui en ont besoin (recherche plein texte, statistiques,
 *     export). Jamais appelé par le lecteur.
 *
 * Deux backends, mêmes fichiers :
 *   - Web / WebView : `fetch` sur `${BASE_URL}data/bible/<id>/…` (même origine,
 *     donc disponible hors ligne une fois le service worker passé).
 *   - Node (scripts, tests) : lecture disque quand `fetch` n'existe pas ou que
 *     `useNodeFs` est vrai.
 *
 * C'est le SEUL endroit qui sait comment la Bible est découpée sur le disque.
 */

import type {
  BibleChapterData,
  BibleTranslationData,
  IBibleTextSource,
} from '@/domains/bible/repository-local';
import {
  BibleChapterDataSchema,
  filterCanonicalBooks,
  parseTranslationData,
} from '@/domains/bible/repository-local';
import { parseSplitIndex, type SplitBibleIndex } from '@/domains/bible/split-index';

export interface SplitBibleSourceOptions {
  /**
   * Dossier des traductions éclatées.
   * - Web : résolu contre `BASE_URL` par défaut (`data/bible`).
   * - Node : résolu contre le cwd du projet.
   */
  baseDir?: string;
  /** Force la lecture disque (scripts, tests). */
  useNodeFs?: boolean;
  /** Remplace `fetch` (tests). */
  fetchImpl?: typeof fetch;
  /** Remplace la lecture disque (tests). */
  readFileImpl?: (absolutePath: string) => Promise<string>;
}

/** Ids de traduction sûrs : pas de `/`, pas de `.`, pas de `..`. */
const SAFE_ID = /^[a-z0-9_-]+$/;

export class SplitBibleTextSource implements IBibleTextSource {
  private readonly baseDir: string;
  private readonly useNodeFs: boolean;
  private readonly fetchImpl: typeof fetch | null;
  private readonly readFileImpl: ((absolutePath: string) => Promise<string>) | null;
  private readonly indices = new Map<string, SplitBibleIndex>();
  /** Chapitres déjà lus, par `translationId:bookId:chapter`. */
  private readonly chapters = new Map<string, BibleChapterData>();

  constructor(options: SplitBibleSourceOptions = {}) {
    const hasFetch = typeof fetch === 'function' || options.fetchImpl != null;
    this.useNodeFs = options.useNodeFs ?? !hasFetch;
    this.baseDir =
      options.baseDir ??
      (this.useNodeFs ? 'public/data/bible' : `${import.meta.env.BASE_URL}data/bible`);
    // `fetch` garde son receiver global : stocké nu puis appelé détaché, il
    // lève « Illegal invocation » dans WebKit.
    this.fetchImpl =
      options.fetchImpl ?? (typeof fetch === 'function' ? fetch.bind(globalThis) : null);
    this.readFileImpl = options.readFileImpl ?? null;
  }

  /** Vrai quand les fichiers de cette traduction existent (projection éclatée). */
  async has(translationId: string): Promise<boolean> {
    try {
      await this.loadIndex(translationId);
      return true;
    } catch {
      return false;
    }
  }

  /** L'index (structure) d'une traduction ; mis en cache pour la session. */
  async loadIndex(translationId: string): Promise<SplitBibleIndex> {
    const cached = this.indices.get(translationId);
    if (cached) return cached;
    const raw = await this.readJson(`${translationId}/index.json`);
    const index = parseSplitIndex(raw);
    this.indices.set(translationId, index);
    return index;
  }

  /** Un chapitre, ou null s'il n'existe pas dans cette traduction. */
  async loadChapter(
    translationId: string,
    bookId: string,
    chapterNumber: number,
  ): Promise<BibleChapterData | null> {
    if (!Number.isInteger(chapterNumber) || chapterNumber <= 0) return null;
    const key = `${translationId}:${bookId}:${chapterNumber}`;
    const cached = this.chapters.get(key);
    if (cached) return cached;
    let raw: unknown;
    try {
      raw = await this.readJson(`${translationId}/${bookId}/${chapterNumber}.json`);
    } catch {
      return null;
    }
    const parsed = BibleChapterDataSchema.safeParse(raw);
    if (!parsed.success) return null;
    this.chapters.set(key, parsed.data);
    return parsed.data;
  }

  /**
   * Le corpus complet, reconstruit. Réservé aux écrans qui parcourent tous les
   * versets (recherche, statistiques) : le lecteur ne l'appelle jamais.
   */
  async load(translationId: string): Promise<BibleTranslationData> {
    const index = await this.loadIndex(translationId);
    const books = [] as unknown as BibleTranslationData['books'];
    for (const bookMeta of index.books) {
      const chapters: BibleChapterData[] = [];
      for (const chapterMeta of bookMeta.chapterVerseCounts) {
        const chapter = await this.loadChapter(translationId, bookMeta.id, chapterMeta.number);
        // Un chapitre annoncé mais absent rendrait un corpus troué : mieux vaut
        // une erreur explicite qu'une Bible silencieusement incomplète.
        if (!chapter) {
          throw new Error(
            `Split dataset "${translationId}" is missing chapter ${bookMeta.id} ${chapterMeta.number}`,
          );
        }
        chapters.push(chapter);
      }
      books.push({
        id: bookMeta.id,
        name: bookMeta.name,
        testament: bookMeta.testament,
        chapterCount: chapters.length,
        chapters,
      } as BibleTranslationData['books'][number]);
    }
    // Le même contrat que le fichier monolithique : validation + canon.
    return parseTranslationData({
      id: index.id,
      language: index.language,
      name: index.name,
      year: index.year,
      books: filterCanonicalBooks(books as never),
    });
  }

  private async readJson(relativePath: string): Promise<unknown> {
    const parts = relativePath.split('/');
    const valid = parts.every((part, index) =>
      index === parts.length - 1
        ? part === 'index.json' || /^[0-9]+\.json$/.test(part)
        : SAFE_ID.test(part),
    );
    if (!valid || parts.length < 2 || parts.length > 3) {
      throw new Error(`Invalid split dataset path "${relativePath}"`);
    }
    const text = await this.readText(relativePath);
    return JSON.parse(text);
  }

  private async readText(relativePath: string): Promise<string> {
    if (this.useNodeFs) {
      const absolute = `${this.baseDir}/${relativePath}`;
      if (this.readFileImpl) return this.readFileImpl(absolute);
      const { readFile } = await import('node:fs/promises');
      const { resolve } = await import('node:path');
      const isAbsolutePath = absolute.startsWith('/') || /^[A-Za-z]:[\\/]/.test(absolute);
      return readFile(isAbsolutePath ? absolute : resolve(process.cwd(), absolute), 'utf-8');
    }
    if (!this.fetchImpl) throw new Error('No fetch implementation available');
    const response = await this.fetchImpl(`${this.baseDir}/${relativePath}`);
    if (!response.ok) {
      throw new Error(`Failed to load ${relativePath} (HTTP ${response.status})`);
    }
    return response.text();
  }
}
