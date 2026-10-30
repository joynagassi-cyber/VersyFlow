/**
 * Tailwind ne sait pas décomposer une variable CSS : sans ce helper,
 * `bg-primary/10` ne génère AUCUNE règle (le modificateur d'opacité est
 * silencieusement perdu). On lui donne la fonction qui fabrique l'alpha.
 * Sans modificateur, Tailwind passe 1 → couleur pleine, comportement inchangé.
 */
const alpha = (token) => `color-mix(in srgb, ${token} calc(<alpha-value> * 100%), transparent)`;

/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: alpha('var(--color-primary)'),
          light: alpha('var(--color-primary-light)'),
          dark: alpha('var(--color-primary-dark)'),
        },
        accent: alpha('var(--color-accent)'),
        'on-primary': alpha('var(--color-on-primary)'),
        background: alpha('var(--color-background)'),
        // card / popover / muted / ring sont eux aussi dérivables en alpha :
        // sans cela, la recette de verre `bg-card/40` ne générait aucune règle.
        card: { DEFAULT: alpha('var(--card)'), foreground: alpha('var(--card-foreground)') },
        popover: { DEFAULT: alpha('var(--popover)'), foreground: alpha('var(--popover-foreground)') },
        muted: { DEFAULT: alpha('var(--muted)'), foreground: alpha('var(--muted-foreground)') },
        ring: alpha('var(--ring)'),
        'primary-foreground': alpha('var(--primary-foreground)'),
        surface: alpha('var(--color-surface)'),
        'surface-tint': alpha('var(--color-surface-tint)'),
        'surface-elevated': alpha('var(--color-surface-elevated)'),
        'text-primary': alpha('var(--color-text-primary)'),
        'text-secondary': alpha('var(--color-text-secondary)'),
        'text-tertiary': alpha('var(--color-text-tertiary)'),
        'text-muted': alpha('var(--color-text-muted)'),
        'text-placeholder': alpha('var(--color-text-placeholder)'),
        border: alpha('var(--color-border)'),
        divider: alpha('var(--color-divider)'),
        success: 'var(--color-success)',
        'success-light': 'var(--color-success-light)',
        error: 'var(--color-error)',
        'error-light': 'var(--color-error-light)',
        warning: 'var(--color-warning)',
        'warning-light': 'var(--color-warning-light)',
        info: 'var(--color-info)',
        'info-light': 'var(--color-info-light)',
        // Encre des surfaces d'état (voir globals.css, `--on-status`) : le
        // seul jeton à poser sur `bg-error`/`bg-success`/`bg-warning`/`bg-info`.
        'on-status': 'var(--on-status)',
        'icon-bg-rose': 'var(--color-icon-bg-rose)',
        'icon-bg-purple': 'var(--color-icon-bg-purple)',
        'icon-bg-blue': 'var(--color-icon-bg-blue)',
        'icon-bg-green': 'var(--color-icon-bg-green)',
        'icon-bg-orange': 'var(--color-icon-bg-orange)',
      },
      // Rayons pilotés par le preset actif : `--radius-scale` vaut 1 pour le
      // thème par défaut (0.5rem), donc 8/12/16/20/24 px restent EXACTEMENT
      // les valeurs historiques. Un thème à 1.875rem (Emerald) donne 3.75 et
      // arrondit l'interface proportionnellement. Voir vendored-themes.css.
      borderRadius: {
        sm: 'calc(8px * var(--radius-scale, 1))',
        md: 'calc(12px * var(--radius-scale, 1))',
        lg: 'calc(16px * var(--radius-scale, 1))',
        xl: 'calc(20px * var(--radius-scale, 1))',
        '2xl': 'calc(24px * var(--radius-scale, 1))',
        '3xl': 'calc(32px * var(--radius-scale, 1))',
        full: '9999px',
      },
      spacing: {
        xs: '4px',
        sm: '8px',
        md: '16px',
        lg: '24px',
        xl: '32px',
        '2xl': '48px',
      },
      // Trois ombres, pas quatre, et aucune ombre colorée : la profondeur vient
      // de l'encre du thème, jamais d'une teinte inventée. Valeurs dans
      // globals.css (--shadow-card/float/lift) pour qu'elles suivent le thème.
      boxShadow: {
        card: 'var(--shadow-card)',
        float: 'var(--shadow-float)',
        lift: 'var(--shadow-lift)',
      },
      // `--font-sans` est posée par le preset actif ; Inter en repli pour que
      // l'interface reste identique si le CSS du preset n'est pas encore chargé.
      fontFamily: {
        sans: [
          'var(--font-sans, Inter)', '-apple-system', 'BlinkMacSystemFont',
          'SF Pro Text', 'Roboto', 'Segoe UI', 'sans-serif',
        ],
        serif: ['var(--font-serif, "Source Serif 4")', 'Georgia', 'serif'],
        mono: ['var(--font-mono, ui-monospace)', 'SFMono-Regular', 'monospace'],
      },
      // Échelle typographique explicite (interface). Les tailles de contenu
      // biblique restent pilotées par les réglages de lecture (theme-fonts.ts).
      fontSize: {
        '2xs': ['11px', { lineHeight: '14px' }],
        xs: ['12px', { lineHeight: '16px' }],
        sm: ['13px', { lineHeight: '18px' }],
        base: ['14px', { lineHeight: '21px' }],
        md: ['15px', { lineHeight: '22px' }],
        lg: ['16px', { lineHeight: '24px' }],
        xl: ['17px', { lineHeight: '26px' }],
        '2xl': ['18px', { lineHeight: '27px' }],
        '3xl': ['22px', { lineHeight: '28px' }],
        '4xl': ['26px', { lineHeight: '32px' }],
        '5xl': ['30px', { lineHeight: '36px' }],
      },
      // Largeurs de contenu : la mesure de lecture, pas la largeur de l'écran.
      maxWidth: {
        reading: 'var(--reading-width)',
        content: 'var(--reading-wide)',
      },
    },
  },
  plugins: [],
};

export default config;
