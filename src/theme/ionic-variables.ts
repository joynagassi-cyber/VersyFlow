/**
 * Ionic CSS Variables — VersyFlow Design System
 *
 * Maps all VersyFlow tokens to Ionic CSS custom properties.
 * Include this in index.html or import in main.tsx.
 */

export const IONIC_CSS_VARIABLES = `
/* ─── Color Palette ─────────────────────────────────────────────────────── */

/* Primary — Sacred Rose */
:root,
[data-theme="light"] {
  --ion-color-primary: #E91E8C;
  --ion-color-primary-rgb: 233, 30, 140;
  --ion-color-primary-contrast: #FFFFFF;
  --ion-color-primary-shade: #CC1A7A;
  --ion-color-primary-tint: #EB3598;

  --vf-primary: #E91E8C;
  --vf-primary-light: #FFB6CC;
  --vf-primary-dark: #B30069;

  /* Backgrounds */
  --ion-background-color: #fcf9f8;
  --ion-background-color-rgb: 252, 249, 248;
  --ion-item-background: #FFFFFF;
  --ion-card-background: #FFFFFF;
  --ion-toolbar-background: #FFFFFF;

  /* Text */
  --ion-text-color: #2D2D2D;
  --ion-text-color-rgb: 45, 45, 45;
  --ion-text-color-secondary: #594048;
  --ion-text-color-tertiary: #6E6E6E;
  --ion-text-color-muted: #A0A0A0;
  --ion-text-color-step-1: #2D2D2D;
  --ion-text-color-step-2: #594048;
  --ion-text-color-step-3: #6E6E6E;

  /* Borders */
  --ion-border-color: #FFE4EE;
  --ion-border-color-rgb: 255, 228, 238;
  --ion-item-border-color: #FFF0F6;

  /* Semantic */
  --vf-success: #008733;
  --vf-error: #FF6B6B;
  --vf-warning: #FF9500;
  --vf-info: #007AFF;

  /* VersyFlow tokens */
  --vf-background: #fcf9f8;
  --vf-surface: #FFFFFF;
  --vf-text-primary: #2D2D2D;
  --vf-text-secondary: #594048;
  --vf-text-tertiary: #6E6E6E;
  --vf-text-muted: #A0A0A0;
  --vf-border: #FFE4EE;
  --vf-divider: #FFF0F6;
  --vf-radius-sm: 8px;
  --vf-radius-md: 12px;
  --vf-radius-lg: 16px;
  --vf-radius-xl: 20px;
  --vf-radius-2xl: 24px;
  --vf-radius-full: 9999px;
  --vf-stack-sm: 8px;
  --vf-stack-md: 16px;
  --vf-stack-lg: 24px;
  --vf-spacing-xs: 4px;
  --vf-spacing-sm: 8px;
  --vf-spacing-md: 16px;
  --vf-spacing-lg: 24px;
  --vf-spacing-xl: 32px;
  --vf-tab-bar-height: 64px;
  --vf-header-height: 56px;
}

[data-theme="dark"] {
  --ion-color-primary: #E91E8C;
  --ion-color-primary-rgb: 233, 30, 140;
  --ion-color-primary-contrast: #FFFFFF;
  --ion-color-primary-shade: #CC1A7A;
  --ion-color-primary-tint: #EB3598;

  --vf-primary: #E91E8C;
  --vf-primary-light: #FFB6CC;
  --vf-primary-dark: #FF6BAC;

  /* Backgrounds */
  --ion-background-color: #121212;
  --ion-background-color-rgb: 18, 18, 18;
  --ion-item-background: #1E1E1E;
  --ion-card-background: #1E1E1E;
  --ion-toolbar-background: #1E1E1E;

  /* Text */
  --ion-text-color: #FFFFFF;
  --ion-text-color-rgb: 255, 255, 255;
  --ion-text-color-secondary: #B3B3B3;
  --ion-text-color-tertiary: #6E6E6E;
  --ion-text-color-muted: #535353;
  --ion-text-color-step-1: #FFFFFF;
  --ion-text-color-step-2: #B3B3B3;
  --ion-text-color-step-3: #6E6E6E;

  /* Borders */
  --ion-border-color: rgba(255, 255, 255, 0.08);
  --ion-border-color-rgb: 255, 255, 255, 0.08;
  --ion-item-border-color: rgba(255, 255, 255, 0.06);

  /* Semantic */
  --vf-success: #00C853;
  --vf-error: #FF5252;
  --vf-warning: #FFB300;
  --vf-info: #448AFF;

  /* VersyFlow tokens */
  --vf-background: #121212;
  --vf-surface: #1E1E1E;
  --vf-text-primary: #FFFFFF;
  --vf-text-secondary: #B3B3B3;
  --vf-text-tertiary: #6E6E6E;
  --vf-text-muted: #535353;
  --vf-border: rgba(255, 255, 255, 0.08);
  --vf-divider: rgba(255, 255, 255, 0.06);
}

/* ─── Typography ─────────────────────────────────────────────────────────── */

:root,
[data-theme="light"],
[data-theme="dark"] {
  --vf-font-primary: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  --vf-font-heading: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  --vf-font-mono: 'Courier New', monospace;
  --vf-font-bible: 'Georgia', 'Times New Roman', serif;

  --vf-text-display-large: 32px;
  --vf-text-headline-medium: 24px;
  --vf-text-headline-small: 20px;
  --vf-text-title-large: 18px;
  --vf-text-title-medium: 16px;
  --vf-text-title-small: 14px;
  --vf-text-body-large: 16px;
  --vf-text-body-medium: 14px;
  --vf-text-body-small: 12px;
  --vf-text-label-large: 14px;
  --vf-text-label-medium: 12px;
  --vf-text-label-small: 11px;
  --vf-text-bible: 20px;
}

/* ─── Ionic Component Overrides ──────────────────────────────────────────── */

:root,
[data-theme="light"],
[data-theme="dark"] {
  --ion-safe-area-top: env(safe-area-inset-top, 0px);
  --ion-safe-area-bottom: env(safe-area-inset-bottom, 0px);
  --ion-safe-area-left: env(safe-area-inset-left, 0px);
  --ion-safe-area-right: env(safe-area-inset-right, 0px);
}

/* ─── Button Overrides ───────────────────────────────────────────────────── */

:root,
[data-theme="light"],
[data-theme="dark"] {
  --ion-button-border-radius: 26px;
  --ion-button-font-weight: 600;
}

/* ─── Card Overrides ─────────────────────────────────────────────────────── */

:root,
[data-theme="light"],
[data-theme="dark"] {
  --ion-card-border-radius: 20px;
  --ion-card-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

/* ─── Tab Bar Overrides ──────────────────────────────────────────────────── */

:root,
[data-theme="light"],
[data-theme="dark"] {
  --ion-tab-bar-height: 64px;
  --ion-tab-bar-border-width: 0;
}
`;

/**
 * Apply CSS variables to document
 * Call this once during app initialization
 */
export function applyIonicVariables() {
  const styleEl = document.createElement('style');
  styleEl.textContent = IONIC_CSS_VARIABLES;
  document.head.appendChild(styleEl);
}

export default IONIC_CSS_VARIABLES;
