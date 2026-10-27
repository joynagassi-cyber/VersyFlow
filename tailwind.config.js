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
          DEFAULT: 'var(--color-primary)',
          light: 'var(--color-primary-light)',
          dark: 'var(--color-primary-dark)',
        },
        background: 'var(--color-background)',
        surface: 'var(--color-surface)',
        'surface-tint': 'var(--color-surface-tint)',
        'surface-elevated': 'var(--color-surface-elevated)',
        'text-primary': 'var(--color-text-primary)',
        'text-secondary': 'var(--color-text-secondary)',
        'text-tertiary': 'var(--color-text-tertiary)',
        'text-muted': 'var(--color-text-muted)',
        'text-placeholder': 'var(--color-text-placeholder)',
        border: 'var(--color-border)',
        divider: 'var(--color-divider)',
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
        sm: '0 1px 2px rgba(0,0,0,0.03)',
        md: '0 2px 4px rgba(0,0,0,0.05)',
        lg: '0 4px 8px rgba(0,0,0,0.08)',
        xl: '0 8px 16px rgba(0,0,0,0.1)',
        rose: '0 4px 12px rgba(233,30,140,0.3)',
      },
      fontFamily: {
        sans: [
          '-apple-system', 'BlinkMacSystemFont', 'SF Pro Text',
          'Roboto', 'Segoe UI', 'sans-serif',
        ],
        serif: ['Source Serif 4', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
};

export default config;
