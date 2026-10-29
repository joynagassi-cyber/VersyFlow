/**
 * GÉNÉRÉ par scripts/import-official-themes.mjs — métadonnées des presets
 * officiels tweakcn + des 5 hybrides fusionnés depuis leurs tokens.
 */
export interface TweakcnPresetMeta { id: string; label: string; swatch: string; hybrid?: boolean }
export const TWEAKCN_PRESETS: TweakcnPresetMeta[] = [
  { id: 'modern-minimal', label: "Modern Minimal", swatch: '#3b82f6' },
  { id: 'clean-slate', label: "Clean Slate", swatch: '#6366f1' },
  { id: 'violet-bloom', label: "Violet Bloom", swatch: '#7033ff' },
  { id: 't3-chat', label: "T3 Chat", swatch: '#a84370' },
  { id: 'mocha-mousse', label: "Mocha Mousse", swatch: '#A37764' },
  { id: 'amethyst-haze', label: "Amethyst Haze", swatch: '#8a79ab' },
  { id: 'kodama-grove', label: "Kodama Grove", swatch: '#8d9d4f' },
  { id: 'cosmic-night', label: "Cosmic Night", swatch: '#6e56cf' },
  { id: 'quantum-rose', label: "Quantum Rose", swatch: '#e6067a' },
  { id: 'elegant-luxury', label: "Elegant Luxury", swatch: '#9b2c2c' },
  { id: 'amber-minimal', label: "Amber Minimal", swatch: '#f59e0b' },
  { id: 'solar-dusk', label: "Solar Dusk", swatch: '#B45309' },
  { id: 'pastel-dreams', label: "Pastel Dreams", swatch: '#a78bfa' },
  { id: 'ocean-breeze', label: "Ocean Breeze", swatch: '#22c55e' },
  { id: 'midnight-bloom', label: "Midnight Bloom", swatch: '#6c5ce7' },
  { id: 'northern-lights', label: "Northern Lights", swatch: '#34a85a' },
  { id: 'vintage-paper', label: "Vintage Paper", swatch: '#a67c52' },
  { id: 'sunset-horizon', label: "Sunset Horizon", swatch: '#ff7e5f' },
  { id: 'starry-night', label: "Starry Night", swatch: '#3a5ba0' },
  { id: 'soft-pop', label: "Soft Pop", swatch: '#4f46e5' },
  { id: 'alabaster-zen', label: "Alabaster Zen", swatch: '#3b82f6', hybrid: true },
  { id: 'obsidian-meridian', label: "Obsidian Meridian", swatch: '#6e56cf', hybrid: true },
  { id: 'velvet-terracotta', label: "Velvet Terracotta", swatch: '#ff7e5f', hybrid: true },
  { id: 'pastel-reverie', label: "Pastel Reverie", swatch: '#4f46e5', hybrid: true },
  { id: 'quartz-deco', label: "Quartz Deco", swatch: '#9b2c2c', hybrid: true },
];

export interface GradientMeta { id: string; className: string; css: string }
export const GRADIENTS: GradientMeta[] = [
  { id: 'warm-flame', className: 'grad-warm-flame', css: "linear-gradient(45deg, #ff9a9e 0%, #fad0c4 99%, #fad0c4 100%)" },
  { id: 'juicy-peach', className: 'grad-juicy-peach', css: "linear-gradient(to right, #ffecd2 0%, #fcb69f 100%)" },
  { id: 'sunny-morning', className: 'grad-sunny-morning', css: "linear-gradient(120deg, #f6d365 0%, #fda085 100%)" },
  { id: 'malibu-beach', className: 'grad-malibu-beach', css: "linear-gradient(to right, #4facfe 0%, #00f2fe 100%)" },
  { id: 'true-sunset', className: 'grad-true-sunset', css: "linear-gradient(to right, #fa709a 0%, #fee140 100%)" },
  { id: 'morpheus-den', className: 'grad-morpheus-den', css: "linear-gradient(to top, #30cfd0 0%, #330867 100%)" },
  { id: 'plum-plate', className: 'grad-plum-plate', css: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" },
  { id: 'happy-fisher', className: 'grad-happy-fisher', css: "linear-gradient(120deg, #89f7fe 0%, #66a6ff 100%)" },
  { id: 'saint-petersburg', className: 'grad-saint-petersburg', css: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)" },
  { id: 'everlasting-sky', className: 'grad-everlasting-sky', css: "linear-gradient(135deg, #fdfcfb 0%, #e2d1c3 100%)" },
  { id: 'night-fade', className: 'grad-night-fade', css: "linear-gradient(to top, #a18cd1 0%, #fbc2eb 100%)" },
  { id: 'spring-warmth', className: 'grad-spring-warmth', css: "linear-gradient(to top, #fad0c4 0%, #fad0c4 1%, #ffd1ff 100%)" },
  { id: 'young-passion', className: 'grad-young-passion', css: "linear-gradient(to right, #ff8177 0%, #ff867a 0%, #ff8c7f 21%, #f99185 52%, #cf556c 78%, #b12a5b 100%)" },
  { id: 'lady-lips', className: 'grad-lady-lips', css: "linear-gradient(to top, #ff9a9e 0%, #fecfef 99%, #fecfef 100%)" },
  { id: 'rainy-ashville', className: 'grad-rainy-ashville', css: "linear-gradient(to top, #fbc2eb 0%, #a6c1ee 100%)" },
];
