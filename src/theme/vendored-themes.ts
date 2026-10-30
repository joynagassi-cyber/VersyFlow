/**
 * GÉNÉRÉ par scripts/import-vendored-themes.mjs — NE PAS ÉDITER À LA MAIN.
 * Thèmes tweakcn demandés au contrat n°3, servis par le registre officiel.
 * `swatch` = couleur primaire du mode clair (pastille de l’écran Apparence).
 */
export interface VendoredPresetMeta {
  id: string;
  label: string;
  swatch: string;
  bg: string;
  card: string;
  fg: string;
  primary: string;
  accent: string;
  muted: string;
  primaryFg: string;
  /** URL du registre officiel d’où viennent les valeurs (traçabilité). */
  source: string;
  /** Thème conçu pour le sombre : `:root` ≡ `.dark` chez tweakcn. */
  darkOnly: boolean;
  /** Thème appliqué au premier lancement. */
  isDefault: boolean;
}

export const VENDORED_PRESETS: VendoredPresetMeta[] = [
  { id: 'lara-red', label: 'Lara Red', swatch: '#fb2c36', bg: '#fafafa', card: '#fdfdfd', fg: '#0a0a0a', primary: '#fb2c36', accent: '#fb2c36', muted: '#f1f5f9', primaryFg: '#000000', source: 'https://tweakcn.com/r/themes/cmvukmb1k000004iifp7x5wji', darkOnly: false, isDefault: true },
  { id: 'emerald', label: 'Emerald', swatch: '#30bd2e', bg: '#ffffff', card: '#ffffff', fg: '#103c1f', primary: '#30bd2e', accent: '#dbffde', muted: '#f2f2f2', primaryFg: '#000000', source: 'https://tweakcn.com/r/themes/cmli3sqr4000004le5a0y0d9f', darkOnly: false, isDefault: false },
  { id: 'blue-enterprise', label: 'Blue Enterprise', swatch: '#0b72f9', bg: '#fdfdff', card: '#ffffff', fg: '#0d0d12', primary: '#0b72f9', accent: '#f0f6ff', muted: '#f1f1f8', primaryFg: '#000000', source: 'https://tweakcn.com/r/themes/cmoywv3xi000004joegevhg1g', darkOnly: false, isDefault: false },
  { id: 'neutral-minimal', label: 'Neutral Minimal', swatch: '#171717', bg: '#ffffff', card: '#fdfdfd', fg: '#0a0a0a', primary: '#171717', accent: '#eeeeee', muted: '#eeeeee', primaryFg: '#fafafa', source: 'https://tweakcn.com/r/themes/cmho4nr9l000h04l1gu419ckw', darkOnly: false, isDefault: false },
  { id: 'deep-purple', label: 'Deep Purple', swatch: '#6b26d9', bg: '#f8fafc', card: '#ffffff', fg: '#030711', primary: '#6b26d9', accent: '#f3edfd', muted: '#f3f4f6', primaryFg: '#f8fafc', source: 'https://tweakcn.com/r/themes/cmlh0x713000104jrgmds6vcd', darkOnly: false, isDefault: false },
  { id: 'orange-autoblog', label: 'Orange Autoblog', swatch: '#f2470c', bg: '#fdfdfd', card: '#fdfdfd', fg: '#000000', primary: '#f2470c', accent: '#fff0eb', muted: '#f5f5f5', primaryFg: '#000000', source: 'https://tweakcn.com/r/themes/cmhxosuz5000804l7gqzefqxg', darkOnly: false, isDefault: false },
  { id: 'cyan-future-teal', label: 'Cyan Future Teal', swatch: '#00bba7', bg: '#f9fdff', card: '#ffffff', fg: '#031a1e', primary: '#00bba7', accent: '#c3ecdf', muted: '#ebf4f4', primaryFg: '#000000', source: 'https://tweakcn.com/r/themes/cmnl3tsn3000204l3ff39foko', darkOnly: false, isDefault: false },
  { id: 'neon-pink-black', label: 'Neon Pink Black', swatch: '#ff00c8', bg: '#000000', card: '#000000', fg: '#ffffff', primary: '#ff00c8', accent: '#ff00c8', muted: '#111111', primaryFg: '#000000', source: 'https://tweakcn.com/r/themes/cmh70ioup000104jr60yx9c30', darkOnly: true, isDefault: false },
  { id: 'dark-green', label: 'Dark Green', swatch: '#2fe92b', bg: '#000000', card: '#0f0f0f', fg: '#ffffff', primary: '#2fe92b', accent: '#1b1b1d', muted: '#1b1b1d', primaryFg: '#0f0f0f', source: 'https://tweakcn.com/r/themes/cmninq0c3000604l25wvb3xgh', darkOnly: true, isDefault: false },
  { id: 'violet-amber', label: 'Violet Amber', swatch: '#7b2cbf', bg: '#f9f9fb', card: '#ffffff', fg: '#18181b', primary: '#7b2cbf', accent: '#ff9e00', muted: '#f1f1f4', primaryFg: '#ffffff', source: 'https://tweakcn.com/r/themes/cmog0awkr000004lg13pkhovw', darkOnly: false, isDefault: false },
  { id: 'cream-space', label: 'Cream Space', swatch: '#ce7e4f', bg: '#faf9f5', card: '#faf9f5', fg: '#3d3929', primary: '#ce7e4f', accent: '#e9e6dc', muted: '#ede9de', primaryFg: '#000000', source: 'https://tweakcn.com/r/themes/cmm4y9w3o000004l79sky7cqm', darkOnly: false, isDefault: false },
  { id: 'sand-lifeos', label: 'Sand LifeOS', swatch: '#bb5e3a', bg: '#fcfbf7', card: '#fafeff', fg: '#1c1c1a', primary: '#bb5e3a', accent: '#ecb37e', muted: '#f2f1eb', primaryFg: '#000000', source: 'https://tweakcn.com/r/themes/cmnxpdhkt000004l49lq9b07w', darkOnly: false, isDefault: false },
  { id: 'yellow-sun', label: 'Yellow Sun', swatch: '#ffc23d', bg: '#fffcf0', card: '#fffcf0', fg: '#19191a', primary: '#ffc23d', accent: '#f5f5f5', muted: '#f7f4e9', primaryFg: '#161616', source: 'https://tweakcn.com/r/themes/cmn7c96e2000104l88vcy27jo', darkOnly: false, isDefault: false },
  { id: 'lara', label: 'Lara', swatch: '#fb2c36', bg: '#fafafa', card: '#fdfdfd', fg: '#0a0a0a', primary: '#fb2c36', accent: '#fb2c36', muted: '#f1f5f9', primaryFg: '#000000', source: 'https://tweakcn.com/r/themes/cmm2769u2000004jobride6q4', darkOnly: false, isDefault: false },
];

export const DEFAULT_VENDORED_PRESET_ID =
  'lara-red';
