/**
 * Bible Domain — Multi-translation Registry (pure)
 *
 * A registry is a *catalogue*: it describes which translations exist, in
 * which language, under which licence, and whether a dataset is actually
 * bundled. It performs NO I/O — it only reads the manifest list it is
 * constructed with. Reading texts is the job of a repository
 * (`repository-local.ts`).
 *
 * This is the extensibility point required by the product: adding a new
 * translation = adding one manifest entry. No `if (language === 'fr')`
 * anywhere.
 *
 * Orthogonality (non-negotiable):
 *   UI language  ≠  Bible language  ≠  Bible translation  ≠  Bible dataset
 * The registry keys off the *Bible language* (ISO 639-1), never the UI language.
 *
 * See: docs/11-bible-domain.md, system prompt §7 (Bible multi-traductions).
 */

/**
 * Licence status for a translation dataset. A translation may only be
 * shipped in production when `VERIFIED_FREE` (or an explicit authorisation).
 * `UNVERIFIED` must NOT be used in production.
 */
export type LicenseStatus =
  | 'VERIFIED_FREE'
  | 'LICENSE_REQUIRED'
  | 'LEGAL_REVIEW_REQUIRED'
  | 'UNVERIFIED';

export type TextDirection = 'ltr' | 'rtl';

/** How the bundled dataset is stored locally (LOCAL_ONLY). */
export type BibleDataFormat = 'json' | 'sqlite' | 'sqlite-bundled' | 'pdf';

/**
 * Metadata describing one Bible translation (the manifest entry).
 * This is deliberately *not* the full text — text lives in a dataset.
 */
export interface BibleTranslationManifest {
  /** Stable translation id, e.g. `lsg`, `kujv`, `web`. */
  id: string;
  /** Bible language (ISO 639-1), e.g. `fr`, `en`, `ar`. NOT the UI language. */
  language: string;
  /** Human-readable display name, e.g. "Louis Segond (1910)". */
  name: string;
  /** Edition year, when known. */
  year?: number;
  /** Author / translator name, when known. */
  author?: string;
  /** Licence posture — governs whether the dataset may ship to production. */
  license: LicenseStatus;
  /** Optional source URL used to (re-)verify the licence/download. */
  sourceUrl?: string;
  /** Reading direction for the target language. */
  direction?: TextDirection;
  /** Versification, e.g. `protestant-1189`. */
  versification?: string;
  /** Local storage format of the bundled dataset. */
  format?: BibleDataFormat;
  /**
   * Whether a dataset for this translation is currently bundled and loadable.
   * `false` = listed for the future / legal-review pending.
   */
  available: boolean;
}

/**
 * Port for a read-only multi-translation catalogue.
 */
export interface IBibleTranslationRegistry {
  /** Every registered translation. */
  listTranslations(): BibleTranslationManifest[];
  /** Translations for a given *Bible* language. */
  getByLanguage(language: string): BibleTranslationManifest[];
  /** A single translation by id. */
  getById(id: string): BibleTranslationManifest | undefined;
  /** True when a bundled dataset can be loaded for this id. */
  isAvailable(id: string): boolean;
  /** The default translation id used when none is requested. */
  defaultTranslation(): string;
}

/**
 * Default translation when the user has not chosen one.
 */
export const DEFAULT_TRANSLATION_ID = 'lsg';

/**
 * In-memory registry. Pure: behaviour derives only from the manifest list.
 *
 * The constructor is seeded with a conservative catalogue: only translations
 * we can defend as free to ship are `available: true`; the rest are listed as
 * placeholders (`available: false`) so the UI can render them without us
 * asserting an unverified licence.
 */
export class BibleTranslationRegistry implements IBibleTranslationRegistry {
  private readonly byId: Map<string, BibleTranslationManifest>;
  private readonly defaultId: string;

  constructor(
    translations: BibleTranslationManifest[],
    defaultId: string = DEFAULT_TRANSLATION_ID,
  ) {
    this.byId = new Map(translations.map((t) => [t.id, t]));
    this.defaultId = defaultId;
    if (!this.byId.has(defaultId)) {
      // The default must always be resolvable.
      throw new Error(
        `[BibleRegistry] default translation "${defaultId}" is not in the catalogue`,
      );
    }
  }

  listTranslations(): BibleTranslationManifest[] {
    return [...this.byId.values()];
  }

  getByLanguage(language: string): BibleTranslationManifest[] {
    const lang = language.toLowerCase();
    return [...this.byId.values()].filter((t) => t.language.toLowerCase() === lang);
  }

  getById(id: string): BibleTranslationManifest | undefined {
    return this.byId.get(id);
  }

  isAvailable(id: string): boolean {
    return this.byId.get(id)?.available === true;
  }

  defaultTranslation(): string {
    return this.defaultId;
  }
}

/**
 * The app's default seeded catalogue.
 *
 * Only LSG is asserted `available` + `VERIFIED_FREE`. KJV / Ostervald / Darby
 * are listed so the UI can surface them, but are NOT asserted free — KJV in
 * particular needs jurisdiction review (public domain in the US/UK, not
 * universally). Adjust these once the source licence is verified.
 */
export const DEFAULT_BIBLE_TRANSLATIONS: BibleTranslationManifest[] = [
  {
    id: 'lsg',
    language: 'fr',
    name: 'Louis Segond (1910)',
    year: 1910,
    author: 'Louis Segond',
    license: 'VERIFIED_FREE',
    direction: 'ltr',
    versification: 'protestant-1189',
    format: 'json',
    available: true,
  },
  {
    id: 'kujv',
    language: 'en',
    name: 'King James Version (1611)',
    year: 1611,
    license: 'LEGAL_REVIEW_REQUIRED',
    sourceUrl: 'https://www.biblegateway.com/passage/?search=John+3:16&version=KJV',
    direction: 'ltr',
    versification: 'protestant-1189',
    format: 'json',
    available: false,
  },
  {
    id: 'ostervald',
    language: 'fr',
    name: 'Ostervald (1930)',
    year: 1930,
    license: 'LICENSE_REQUIRED',
    direction: 'ltr',
    format: 'json',
    available: false,
  },
  {
    id: 'darby',
    language: 'fr',
    name: 'Darby (1865)',
    year: 1865,
    license: 'LICENSE_REQUIRED',
    direction: 'ltr',
    format: 'json',
    available: false,
  },
];
