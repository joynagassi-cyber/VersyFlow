/**
 * Catalogue unique des presets de thème proposés à l'utilisateur.
 *
 * Deux familles cohabitent, dans cet ordre d'affichage :
 *  1. `VENDORED_PRESETS` — les thèmes demandés au contrat n°3, servis par le
 *     registre officiel tweakcn (`tweakcn.com/r/themes/<id>`), figés dans
 *     `scripts/data/vendored-themes.json` et générés dans
 *     `src/styles/vendored-themes.css` (voir `scripts/import-vendored-themes.mjs`).
 *     Le premier de la liste est le thème par défaut de l'application.
 *  2. `TWEAKCN_PRESETS` — les 25 presets historiques du projet, inchangés.
 *
 * Ce module ne contient AUCUNE couleur : il ne fait qu'assembler les deux
 * catalogues générés, pour que l'écran Apparence et les tests lisent la même
 * source que le CSS.
 */
import {
  DEFAULT_VENDORED_PRESET_ID,
  VENDORED_PRESETS,
  type VendoredPresetMeta,
} from './vendored-themes';
import { TWEAKCN_PRESETS, type TweakcnPresetMeta } from './tweakcn-presets';

/** Forme minimale dont l'écran Apparence a besoin pour dessiner un aperçu. */
export type PresetMeta = TweakcnPresetMeta & {
  darkOnly?: boolean;
  source?: string;
  /** Thème appliqué au premier lancement (un seul dans le catalogue). */
  isDefault?: boolean;
};

export const PRESET_CATALOG: PresetMeta[] = [
  ...VENDORED_PRESETS.map(
    (p: VendoredPresetMeta): PresetMeta => ({ ...p, darkOnly: p.darkOnly }),
  ),
  ...TWEAKCN_PRESETS,
];

/** Identifiant du thème appliqué au premier lancement (thème par défaut). */
export const DEFAULT_PRESET = DEFAULT_VENDORED_PRESET_ID;

/** Retrouve un preset par identifiant ; `null` si inconnu. */
export function findPreset(id: string | null | undefined): PresetMeta | null {
  if (!id) return null;
  return PRESET_CATALOG.find((p) => p.id === id) ?? null;
}
