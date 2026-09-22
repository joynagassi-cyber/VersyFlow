/**
 * BibleTranslationNames — conventional (non-technical) display names for
 * every dataset id in `data/bible/dataset-catalog.json`.
 *
 * The catalog ids are technical (`frlsg-eb`, `ru-synodal`…). The UI must
 * show the name people actually know: "Louis Segond", "Synodale russe"…
 */

export interface TranslationDisplayInfo {
  /** Conventional name users know (edition when it matters). */
  name: string;
  /** Short language label shown next to the name. */
  language: string;
}

const INFO: Record<string, TranslationDisplayInfo> = {
  // ── Français ────────────────────────────────────────────────
  lsg: { name: 'Louis Segond', language: 'Français' },
  'frlsg-eb': { name: 'Louis Segond (édition eBible)', language: 'Français' },
  ostervald: { name: 'Ostervald', language: 'Français' },
  darby: { name: 'Darby', language: 'Français' },
  francrampon: { name: 'Crampon', language: 'Français' },

  // ── Anglais ────────────────────────────────────────────────
  kujv: { name: 'King James Version', language: 'Anglais' },
  web: { name: 'World English Bible', language: 'Anglais' },
  webu: { name: 'World English Bible (Updated)', language: 'Anglais' },

  // ── Allemand ───────────────────────────────────────────────
  luther1912: { name: 'Luther (1912)', language: 'Allemand' },
  schlatter1951: { name: 'Schlatter (1951)', language: 'Allemand' },

  // ── Espagnol ───────────────────────────────────────────────
  rv1909: { name: 'Reina-Valera (1909)', language: 'Espagnol' },
  'es-onbv': { name: 'Nueva Biblia Viva', language: 'Espagnol' },
  'es-godword': { name: "Palabra de Dios (God's Word)", language: 'Espagnol' },

  // ── Russe / Ukrainien ─────────────────────────────────────
  'ru-synodal': { name: 'Synodale', language: 'Russe' },
  'uk-kulish1871': { name: 'Koulitch (1871)', language: 'Ukrainien' },
  'uk-bju1996': { name: 'Bible de l’Église (1996)', language: 'Ukrainien' },

  // ── Langue latine ──────────────────────────────────────────
  'la-vulgate': { name: 'Vulgate latine', language: 'Latin' },

  // ── Italien ────────────────────────────────────────────────
  'it-diodati1885': { name: 'Diodati (1885)', language: 'Italien' },
  'it-riveduta1927': { name: 'Riveduta (1927)', language: 'Italien' },

  // ── Portugais ──────────────────────────────────────────────
  'pt-onbv': { name: 'Nueva Biblia Viva', language: 'Portugais' },

  // ── Néerlandais / Danois / Suédois ────────────────────────
  'nl-1917': { name: 'Édition 1917', language: 'Néerlandais' },
  'nl-nbg1951': { name: 'NBG (1951)', language: 'Néerlandais' },
  'da-1931': { name: 'Édition 1931', language: 'Danois' },
  'sv-ntplus': { name: 'Nouveau Testament Plus', language: 'Suédois' },

  // ── Arabe / Persan ────────────────────────────────────────
  'ar-nav': { name: 'Bible en arabe (NAV)', language: 'Arabe' },
  'fa-opcb': { name: 'Bible persane (OPCB)', language: 'Persan' },

  // ── Chinois / Japonais / Coréen ───────────────────────────
  'cmn-uvs': { name: 'Version unifiée (chinois simplifié)', language: 'Chinois' },
  cmnswcb: { name: 'Bible standard (chinois simplifié)', language: 'Chinois' },
  'jp-freedom': { name: 'Freedom Bible', language: 'Japonais' },
  'ko-1910': { name: 'Édition 1910', language: 'Coréen' },

  // ── Autres langues ─────────────────────────────────────────
  'hi-irv': { name: 'IRV', language: 'Hindi' },
  'ml-irv': { name: 'IRV', language: 'Malayalam' },
  'so-bible': { name: 'Bible en somali', language: 'Somali' },
  'sw-ulb': { name: 'ULB (Langue unifiée)', language: 'Swahili' },
  'tl-ulb': { name: 'ULB (Langue unifiée)', language: 'Tagalog' },
};

export function getTranslationDisplayInfo(id: string): TranslationDisplayInfo {
  return INFO[id] ?? { name: id.toUpperCase(), language: 'Bible' };
}

/** "Louis Segond — Français" or just the name for compact places. */
export function bibleTranslationDisplayName(
  id: string,
  includeLanguage = false,
): string {
  const info = getTranslationDisplayInfo(id);
  return includeLanguage ? `${info.name} — ${info.language}` : info.name;
}
