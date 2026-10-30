/**
 * Types des thèmes « photo » (fonds photoréalistes).
 *
 * Séparés de `theme-catalog.ts` pour que le fichier **généré**
 * (`photo-themes.generated.ts`, écrit par
 * `scripts/themes/import-photo-themes.mjs`) puisse importer ces types sans
 * créer de cycle de valeurs avec le catalogue.
 */

/** Formats acceptés pour les visuels d'un thème photo. */
export type PhotoThemeFormat = 'webp' | 'png' | 'jpg';

/**
 * Une scène photo déclinée en deux cadrages cohérents.
 *
 * Les fichiers attendus sont, dans `public/themes/{category}/` :
 *   - `{id}-portrait.{ext}`  → 832 × 1248 (mobile)
 *   - `{id}-landscape.{ext}` → 1248 × 832 (bureau)
 *   - `{id}-thumb.webp`      → 320 px de large (vignette du sélecteur)
 */
export interface PhotoThemeEntry {
  id: string;
  name: string;
  /** Dossier sous `public/themes/` (ex. `photos-nature`). */
  category: string;
  /** Couleur d'accent de repli, reprise d'un thème existant du catalogue. */
  color: string;
  /** Description courte affichée en info-bulle / texte d'aide. */
  motif: string;
  /** Extension réelle des fichiers portrait/paysage produits. */
  ext: PhotoThemeFormat;
  /** Horodatage de l'import (diagnostic, jamais affiché). */
  importedAt: string;
}
