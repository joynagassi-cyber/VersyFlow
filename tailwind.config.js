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
        'icon-bg-rose': 'var(--color-icon-bg-rose)',
        'icon-bg-purple': 'var(--color-icon-bg-purple)',
        'icon-bg-blue': 'var(--color-icon-bg-blue)',
        'icon-bg-green': 'var(--color-icon-bg-green)',
        'icon-bg-orange': 'var(--color-icon-bg-orange)',
      },
      borderRadius: {
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '20px',
        '2xl': '24px',
        '3xl': '32px',
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
      boxShadow: {
        rose: '0 4px 12px rgba(216,27,96,0.3)',
      },
      fontFamily: {
        sans: [
          'Inter', '-apple-system', 'BlinkMacSystemFont', 'SF Pro Text',
          'Roboto', 'Segoe UI', 'sans-serif',
        ],
        serif: ['Source Serif 4', 'Georgia', 'serif'],
      },
      boxShadow: {
        soft: '0 4px 20px -2px rgba(26,26,26,0.04)',
        hero: '0 8px 24px -4px rgba(216,27,96,0.25)',
        nav: '0 -4px 16px -2px rgba(0,0,0,0.03)',
      },
    },
  },
  plugins: [],
};

export default config;
