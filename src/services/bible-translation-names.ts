/**
 * BibleTranslationNames — conventional (non-technical) display names for
 * every dataset id in `data/bible/dataset-catalog.json`.
 *
 * The catalog ids are technical (`frlsg-eb`, `ru-synodal`…). The UI must
 * show the name people actually know: "Louis Segond", "Synodale russe"…
 *
 * Each entry carries:
 *   - `name`          — the full conventional name (subtitle in the picker).
 *   - `abbreviation`  — the short label people actually say/see in public
 *                       (KJV, LSG, RV…). Shown as the main label. When a
 *                       translation has no stable public abbreviation, this
 *                       equals the conventional name.
 *   - `language`      — the reader's language of the text.
 */

export interface TranslationDisplayInfo {
  /** Conventional full name users know (edition when it matters). */
  name: string;
  /** Short public abbreviation ("KJV", "LSG", "RV", …) — the main label. */
  abbreviation: string;
  /** Short language label shown next to the name. */
  language: string;
}

const INFO: Record<string, TranslationDisplayInfo> = {
  // ── Français ────────────────────────────────────────────────
  lsg: { name: 'Louis Segond', abbreviation: 'LSG', language: 'Français' },
  'frlsg-eb': { name: 'Louis Segond (édition eBible)', abbreviation: 'LSG eBible', language: 'Français' },
  ostervald: { name: 'Ostervald', abbreviation: 'Ostervald', language: 'Français' },
  darby: { name: 'Darby', abbreviation: 'Darby', language: 'Français' },
  francrampon: { name: 'Crampon', abbreviation: 'Crampon', language: 'Français' },

  // ── Anglais ────────────────────────────────────────────────
  kujv: { name: 'King James Version', abbreviation: 'KJV', language: 'Anglais' },
  web: { name: 'World English Bible', abbreviation: 'WEB', language: 'Anglais' },
  webu: { name: 'World English Bible (Updated)', abbreviation: 'WEBU', language: 'Anglais' },
  asv: { name: 'American Standard Version (1901)', abbreviation: 'ASV', language: 'Anglais' },
  bsb: { name: 'Berean Standard Bible', abbreviation: 'BSB', language: 'Anglais' },

  // ── Allemand ───────────────────────────────────────────────
  luther1912: { name: 'Luther (1912)', abbreviation: 'Luther', language: 'Allemand' },
  schlatter1951: { name: 'Schlatter (1951)', abbreviation: 'Schlatter', language: 'Allemand' },
  'de-tkw': { name: 'Textbibel Kautzsch-Weizsäcker (1906)', abbreviation: 'TKW', language: 'Allemand' },

  // ── Espagnol ───────────────────────────────────────────────
  rv1909: { name: 'Reina-Valera (1909)', abbreviation: 'RV', language: 'Espagnol' },
  'es-onbv': { name: 'Nueva Biblia Viva', abbreviation: 'NBV', language: 'Espagnol' },
  'es-godword': { name: 'Palabra de Dios (God’s Word)', abbreviation: 'God’s Word', language: 'Espagnol' },

  // ── Russe / Ukrainien ─────────────────────────────────────
  'ru-synodal': { name: 'Synodale', abbreviation: 'Synodale', language: 'Russe' },
  'uk-kulish1871': { name: 'Koulitch (1871)', abbreviation: 'Koulitch', language: 'Ukrainien' },
  'uk-bju1996': { name: 'Bible de l’Église (1996)', abbreviation: 'Bible de l’Église', language: 'Ukrainien' },

  // ── Langue latine ─────────────────────────────────────────
  'la-vulgate': { name: 'Vulgate latine', abbreviation: 'Vulgate', language: 'Latin' },

  // ── Italien ────────────────────────────────────────────────
  'it-diodati1885': { name: 'Diodati (1885)', abbreviation: 'Diodati', language: 'Italien' },
  'it-riveduta1927': { name: 'Riveduta (1927)', abbreviation: 'Riveduta', language: 'Italien' },

  // ── Portugais ──────────────────────────────────────────────
  // eBible's Portuguese dataset is "Oraçao" (Araújo), NOT the Spanish NBV.
  'pt-onbv': { name: 'Oraçao (Araújo)', abbreviation: 'Oraçao', language: 'Portugais' },
  'pt-brbsl': { name: 'Bíblia Portuguesa Mundial', abbreviation: 'BPM', language: 'Portugais' },

  // ── Néerlandais / Danois / Suédois ────────────────────────
  'nl-1917': { name: 'Édition 1917', abbreviation: 'Édition 1917', language: 'Néerlandais' },
  'nl-nbg1951': { name: 'NBG (1951)', abbreviation: 'NBG', language: 'Néerlandais' },
  'da-1931': { name: 'Édition 1931', abbreviation: 'Édition 1931', language: 'Danois' },
  'sv-ntplus': { name: 'Nouveau Testament Plus', abbreviation: 'NT+', language: 'Suédois' },

  // ── Arabe / Persan ────────────────────────────────────────
  'ar-nav': { name: 'Bible en arabe (NAV)', abbreviation: 'NAV', language: 'Arabe' },
  'fa-opcb': { name: 'Bible persane (OPCB)', abbreviation: 'OPCB', language: 'Persan' },

  // ── Chinois / Japonais / Coréen ───────────────────────────
  'cmn-uvs': { name: 'Version unifiée (chinois simplifié)', abbreviation: 'UVS', language: 'Chinois' },
  cmnswcb: { name: 'Bible standard (chinois simplifié)', abbreviation: 'SWCB', language: 'Chinois' },
  'cmn-cu89t': { name: '和合本 / Union Version (CUV 1919, chinois traditionnel)', abbreviation: 'CUV', language: 'Chinois' },
  'jp-freedom': { name: 'Freedom Bible', abbreviation: 'Freedom', language: 'Japonais' },
  'ko-1910': { name: 'Édition 1910', abbreviation: 'Édition 1910', language: 'Coréen' },

  // ── Asie du Sud / Sud-Est ──────────────────────────────────
  'vie1934': { name: 'Kinh Thánh (1925)', abbreviation: 'Kinh Thánh', language: 'Vietnamien' },
  'myajvb': { name: 'Judson Burmese Bible (1956)', abbreviation: 'Judson 1956', language: 'Birman' },

  // ── Hébreu ─────────────────────────────────────────────────
  heb: { name: 'Tanakh (hébreu)', abbreviation: 'Tanakh', language: 'Hébreu' },

  // ── Autres langues ─────────────────────────────────────────
  'hi-irv': { name: 'Indian Revised Version', abbreviation: 'IRV', language: 'Hindi' },
  'ml-irv': { name: 'Indian Revised Version', abbreviation: 'IRV', language: 'Malayalam' },
  'so-bible': { name: 'Bible en somali', abbreviation: 'Somali', language: 'Somali' },
  'sw-ulb': { name: 'ULB (Langue unifiée)', abbreviation: 'ULB', language: 'Swahili' },
  'tl-ulb': { name: 'ULB (Langue unifiée)', abbreviation: 'ULB', language: 'Tagalog' },
};

/** A translation id grouped under its reader-language label. */
export interface TranslationByLanguage {
  /** Display language (from the dataset, e.g. "Français", "Anglais"). */
  language: string;
  /** The dataset ids available in that language. */
  ids: string[];
}

/**
 * Sort order within a language group for the "Versions de la Bible" UI:
 * French and English translations first (the 8 most-used editions),
 * then every other dataset alphabetically by id.
 */
export const PREFERRED_TRANSLATION_ORDER: string[] = [
  'lsg',
  'frlsg-eb',
  'ostervald',
  'darby',
  'francrampon',
  'kujv',
  'web',
  'webu',
];

export function sortTranslationsInLanguage(ids: string[]): string[] {
  const preferredIndex = new Map(PREFERRED_TRANSLATION_ORDER.map((id, i) => [id, i]));
  return [...ids].sort((a, b) => {
    const pa = preferredIndex.get(a);
    const pb = preferredIndex.get(b);
    if (pa !== undefined && pb !== undefined) return pa - pb;
    if (pa !== undefined) return -1;
    if (pb !== undefined) return 1;
    return a.localeCompare(b);
  });
}

/**
 * Group translation ids by their reader-language, keeping a stable display
 * order: French and English first (the most common), then alphabetical.
 * Within each language, the 8 preferred editions (fr + en) come first.
 */
export function groupTranslationsByLanguage(ids: string[]): TranslationByLanguage[] {
  const byLanguage = new Map<string, string[]>();
  for (const id of ids) {
    const lang = getTranslationDisplayInfo(id).language;
    const list = byLanguage.get(lang) ?? [];
    list.push(id);
    byLanguage.set(lang, list);
  }
  const preferred = new Map<string, number>();
  preferred.set('Français', 0);
  preferred.set('Anglais', 1);
  const groups = Array.from(byLanguage, ([language, groupIds]) => ({
    language,
    ids: sortTranslationsInLanguage(groupIds),
  }));
  groups.sort((a, b) => {
    const pa = preferred.get(a.language) ?? 100;
    const pb = preferred.get(b.language) ?? 100;
    if (pa !== pb) return pa - pb;
    return a.language.localeCompare(b.language);
  });
  return groups;
}

export function getTranslationDisplayInfo(id: string): TranslationDisplayInfo {
  return INFO[id] ?? { name: id, abbreviation: id.toUpperCase(), language: 'Bible' };
}

/** "KJV — King James Version" or just the abbreviation for compact places. */
export function bibleTranslationDisplayName(
  id: string,
  includeLanguage = false,
): string {
  const info = getTranslationDisplayInfo(id);
  // Abbreviation is the main label; full name is the subtitle. When they are
  // identical (no stable public abbreviation) there is no redundancy to hide.
  const main = info.abbreviation === info.name ? info.name : info.abbreviation;
  return includeLanguage ? `${main} — ${info.language}` : main;
}
