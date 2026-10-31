/**
 * Highlight store — surlignages de versets, avec couleur.
 *
 * CE QUI A CHANGÉ, ET POURQUOI
 * ----------------------------
 * Le magasin ne retenait qu'un `Set` de clés : un verset était surligné, ou il
 * ne l'était pas, toujours dans la même teinte déduite de l'accent. Impossible
 * de distinguer « ce que je veux mémoriser » de « ce que je veux relire ».
 *
 * Il retient maintenant une COULEUR par verset. Cinq teintes, dont la première
 * est l'accent actif — c'est celle qui s'applique par défaut, comme demandé.
 *
 * Migration : l'ancien format était un tableau de clés (`string[]`). Un tableau
 * est relu comme « tout en accent » plutôt que comme « rien » : un surlignage
 * existant ne doit pas disparaître parce que la forme des données a changé.
 *
 * La couleur n'est PAS stockée en valeur CSS mais en identifiant (`gold`,
 * `leaf`…). Le CSS décide de la teinte réelle, donc les cinq pastilles suivent
 * le thème, le mode sombre et les 39 presets sans qu'on y retouche.
 */

import { create } from 'zustand';
import { MmkvStorage } from '@/infrastructure/storage';

const storage = new MmkvStorage();
const STORAGE_KEY = 'versyflow:highlights';

/** Les cinq pastilles. L'ordre est celui de l'affichage dans la barre. */
export const HIGHLIGHT_COLOR_IDS = ['accent', 'gold', 'leaf', 'sky', 'violet'] as const;
export type HighlightColorId = (typeof HIGHLIGHT_COLOR_IDS)[number];
export const DEFAULT_HIGHLIGHT_COLOR: HighlightColorId = 'accent';

export function isHighlightColor(value: unknown): value is HighlightColorId {
  return typeof value === 'string' && (HIGHLIGHT_COLOR_IDS as readonly string[]).includes(value);
}

export interface HighlightState {
  /** Clés de versets surlignées (`bookId:ch:verse`) — conservé pour les compteurs. */
  keys: string[];
  /** Clé → couleur. C'est la source de vérité. */
  marks: Record<string, HighlightColorId>;
  /** Applique une couleur à plusieurs versets d'un coup. */
  mark: (keys: string[], color?: HighlightColorId) => void;
  /** Retire le surlignage de plusieurs versets. */
  clear: (keys: string[]) => void;
  /** Bascule un verset (compatibilité : un seul verset à la fois). */
  toggle: (key: string, color?: HighlightColorId) => void;
  colorOf: (key: string) => HighlightColorId | null;
  has: (key: string) => boolean;
}

interface PersistedV2 {
  v: 2;
  marks: Record<string, HighlightColorId>;
}

/** Relit l'ancien format (tableau) comme le nouveau (objet versionné). */
export function parseStoredHighlights(raw: string | null): Record<string, HighlightColorId> {
  if (!raw) return {};
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return {};
  }

  // v1 : `["gen:1:1", …]` — tout était de la couleur de l'accent.
  if (Array.isArray(parsed)) {
    const out: Record<string, HighlightColorId> = {};
    for (const key of parsed) if (typeof key === 'string') out[key] = DEFAULT_HIGHLIGHT_COLOR;
    return out;
  }

  if (parsed && typeof parsed === 'object' && 'marks' in parsed) {
    const source = (parsed as PersistedV2).marks;
    const out: Record<string, HighlightColorId> = {};
    if (source && typeof source === 'object') {
      for (const [key, value] of Object.entries(source)) {
        // Une couleur inconnue (version future, donnée corrompue) retombe sur
        // l'accent au lieu de perdre le surlignage.
        out[key] = isHighlightColor(value) ? value : DEFAULT_HIGHLIGHT_COLOR;
      }
    }
    return out;
  }

  return {};
}

function loadInitial(): Record<string, HighlightColorId> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) ?? null;
    return parseStoredHighlights(raw);
  } catch {
    return {};
  }
}

function persist(marks: Record<string, HighlightColorId>): void {
  const payload = JSON.stringify({ v: 2, marks } satisfies PersistedV2);
  try {
    localStorage.setItem(STORAGE_KEY, payload);
  } catch {
    /* ignore */
  }
  void storage.set(STORAGE_KEY, payload);
}

const initial = loadInitial();

export const useHighlightStore = create<HighlightState>((set, get) => {
  const write = (marks: Record<string, HighlightColorId>) => {
    set({ marks, keys: Object.keys(marks) });
    persist(marks);
  };

  return {
    marks: initial,
    keys: Object.keys(initial),

    mark: (verseKeys, color = DEFAULT_HIGHLIGHT_COLOR) => {
      if (verseKeys.length === 0) return;
      const next = { ...get().marks };
      for (const key of verseKeys) next[key] = color;
      write(next);
    },

    clear: (verseKeys) => {
      if (verseKeys.length === 0) return;
      const next = { ...get().marks };
      let changed = false;
      for (const key of verseKeys) {
        if (key in next) {
          delete next[key];
          changed = true;
        }
      }
      if (changed) write(next);
    },

    toggle: (key, color = DEFAULT_HIGHLIGHT_COLOR) => {
      const next = { ...get().marks };
      if (key in next) delete next[key];
      else next[key] = color;
      write(next);
    },

    colorOf: (key) => get().marks[key] ?? null,
    has: (key) => key in get().marks,
  };
});
