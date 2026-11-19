/** Types du module `split-lsg.mjs` (script de projection + tests). */

export interface RawVerse {
  number: number;
  text: string;
}

export interface RawChapter {
  number: number;
  verses: RawVerse[];
}

export interface RawBook {
  id: string;
  name?: Record<string, string>;
  testament?: 'old' | 'new';
  chapterCount: number;
  chapters: RawChapter[];
}

export interface RawDataset {
  id?: string;
  language?: string;
  name?: string;
  year?: number;
  books: RawBook[];
}

export declare function bookMeta(book: RawBook): {
  id: string;
  name?: Record<string, string>;
  testament?: 'old' | 'new';
  chapterCount: number;
  chapterVerseCounts: { number: number; verses: number }[];
};

/** Fichiers attendus de la projection, indexés par chemin relatif. */
export declare function buildProjection(dataset: RawDataset): Map<string, string>;

/** Défauts structurels du corpus ; tableau vide si le corpus est sain. */
export declare function validateDataset(dataset: RawDataset): string[];
