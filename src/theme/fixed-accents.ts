import { PRESET_CATALOG } from './preset-catalog';

/** Six accents existants du catalogue de thèmes ; aucune palette parallèle. */
const IDS = ['lara-red', 'cream-space', 'yellow-sun', 'cyan-future-teal', 'amethyst-haze', 'blue-enterprise'] as const;
export const FIXED_ACCENTS = IDS.map((id) => {
  const preset = PRESET_CATALOG.find((entry) => entry.id === id);
  if (!preset) throw new Error(`Accent de thème introuvable : ${id}`);
  return { id, label: preset.label, color: preset.primary };
});
export function findFixedAccent(id: string | null | undefined) {
  return FIXED_ACCENTS.find((accent) => accent.id === id) ?? null;
}
