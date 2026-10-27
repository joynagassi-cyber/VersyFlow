# VersyFlow — Design Tokens

## Document généré par Agent D — UI / Design System

---

## 1. Color Tokens

### Primary Palette (Rose)

| Token | Hex | RGB | Usage |
|-------|-----|-----|-------|
| `--color-primary-50` | `#FFF0F6` | `rgb(255 240 246)` | Backgrounds légers, overlay doux |
| `--color-primary-100` | `#FFE4EE` | `rgb(255 228 238)` | Surfaces secondaires, cards inactives |
| `--color-primary-200` | `#FFB6C9` | `rgb(255 182 201)` | Bordures, accents légers, dividers |
| `--color-primary-300` | `#FF87A6` | `rgb(255 135 166)` | Hover states, progress fills light |
| `--color-primary-400` | `#E91E8C` | `rgb(233 30 140)` | Couleur primary principale, boutons, icons actifs |
| `--color-primary-500` | `#D11073` | `rgb(209 16 115)` | Textes strong, liens, badges |
| `--color-primary-600` | `#AD0B5C` | `rgb(173 11 92)` | Pressed states, hover deep links |
| `--color-primary-700` | `#8B0A4A` | `rgb(139 10 74)` | Ombres teintées, depths |

### Neutral Palette (Blanc/Gris Chaud)

| Token | Hex | RGB | Usage |
|-------|-----|-----|-------|
| `--color-neutral-50` | `#FAFAFA` | `rgb(250 250 250)` | Background app principal |
| `--color-neutral-100` | `#F5F5F5` | `rgb(245 245 245)` | Cartes, surfaces, inputs background |
| `--color-neutral-200` | `#E8E8E8` | `rgb(232 232 232)` | Dividers, borders, separators |
| `--color-neutral-300` | `#D1D1D1` | `rgb(209 209 209)` | Borders disabled, placeholders |
| `--color-neutral-400` | `#A0A0A0` | `rgb(160 160 160)` | Secondary text, icons inactifs |
| `--color-neutral-500` | `#6E6E6E` | `rgb(110 110 110)` | Body text secondaire, captions |
| `--color-neutral-600` | `#4A4A4A` | `rgb(74 74 74)` | Textes principaux body |
| `--color-neutral-700` | `#2D2D2D` | `rgb(45 45 45)` | Headings, texte fort |
| `--color-neutral-800` | `#1A1A1A` | `rgb(26 26 26)` | Texte ultra-dense, titres principaux |
| `--color-neutral-900` | `#0D0D0D` | `rgb(13 13 13)` | Noir absolu (rarement utilisé) |

### Semantic Tokens

| Token | Hex | Usage |
|-------|-----|-------|
| `--color-success` | `#34C759` | Succès, complété, verset maîtrisé |
| `--color-warning` | `#FF9500` | Avertissement, en cours de mémorisation |
| `--color-error` | `#FF3B30` | Erreur, suppression destructive |
| `--color-info` | `#5AC8FA` | Information neutre, hints |
| `--color-new-badge` | `#A0A0A0` | Status "nouveau" verset |
| `--color-inprogress-badge` | `#E91E8C` | Status "en cours" verset |
| `--color-mastered-badge` | `#34C759` | Status "maîtrisé" verset |

### Dark Mode Mapping

| Token | Light | Dark | Notes |
|-------|-------|------|-------|
| `bg-app` | `#FAFAFA` | `#1A1A1A` | Fond principal |
| `bg-card` | `#FFFFFF` | `#2D2D2D` | Cartes et surfaces |
| `text-primary` | `#2D2D2D` | `#F5F5F5` | Texte principal |
| `text-secondary` | `#6E6E6E` | `#A0A0A0` | Texte secondaire |
| `color-primary-400` | `#E91E8C` | `#FF6BA4` | Primary ajusté pour contraste dark |
| `color-primary-700` | `#8B0A4A` | `#FF87A6` | Ombres/dark adjustments |
| `border-default` | `#E8E8E8` | `#4A4A4A` | Bordures standard |

---

## 2. Typography Tokens

### Font Families

| Token | Value | Platform Fallback | Usage |
|-------|-------|-------------------|-------|
| `--font-family-primary` | `'Inter', system-ui, -apple-system, sans-serif` | iOS: SF Pro, Android: Roboto | Body text, UI elements |
| `--font-family-heading` | `'Inter', system-ui, -apple-system, sans-serif` | Same as primary | Headings, titles |
| `--font-family-serif` | `'Georgia', 'Noto Serif', serif` | Platform serif | Verset quotes, accent stylistique |
| `--font-family-monospace` | `'JetBrains Mono', 'SF Mono', monospace` | Platform mono | Code blocks (future) |

### Font Sizes

| Token | iOS (pt) | Android (sp) | Web (px) | Usage |
|-------|----------|-------------|----------|-------|
| `--text-size-xs` | 11 | 11 | 11 | Captions, badges, timestamps |
| `--text-size-sm` | 13 | 13 | 13 | Secondary text, labels |
| `--text-size-base` | 16 | 16 | 16 | Body text, verset text |
| `--text-size-lg` | 20 | 20 | 20 | Subheadings, card titles |
| `--text-size-xl` | 24 | 24 | 24 | Section headers |
| `--text-size-2xl` | 32 | 32 | 32 | Page titles |
| `--text-size-3xl` | 40 | 40 | 40 | Hero text, streak milestones |

### Font Weights

| Token | CSS Value | iOS Weight | Android Weight | Usage |
|-------|-----------|------------|----------------|-------|
| `--font-weight-light` | 300 | Light | Light | Decorative text |
| `--font-weight-regular` | 400 | Regular | Regular | Body text |
| `--font-weight-medium` | 500 | Medium | Medium | Labels, secondary headings |
| `--font-weight-semibold` | 600 | Semibold | Semibold | Card titles, section headers |
| `--font-weight-bold` | 700 | Bold | Bold | Page titles, emphasis |

### Line Heights

| Token | Value | Usage |
|-------|-------|-------|
| `--line-height-tight` | 1.2 | Headings only (title, page header) |
| `--line-height-normal` | 1.5 | Body text, UI labels |
| `--line-height-relaxed` | 1.7 | Verset text, long-form reading |
| `--line-height-extra` | 1.9 | Accessibility large text |

---

## 3. Spacing Tokens

| Token | Value (pt/dp) | Usage |
|-------|---------------|-------|
| `--space-xs` | 4 | Tight spacing between inline elements |
| `--space-sm` | 8 | Small gaps (padding inside components) |
| `--space-md` | 16 | Standard padding/margin (screen edges, card padding) |
| `--space-lg` | 24 | Section spacing (between groups of content) |
| `--space-xl` | 32 | Major section dividers |
| `--space-2xl` | 48 | Screen-level spacing (hero sections) |
| `--space-3xl` | 64 | Break spacing (between major screens/flows) |

### Spacing Pattern Rules
- **Padding internal composants**: `--space-sm` (8px) minimum, `--space-md` (16px) preferred
- **Margin between sections**: `--space-lg` (24px) minimum
- **Screen horizontal margin**: `--space-md` (16px) de chaque côté
- **Vertical scale**: multiples de 4px uniquement (4, 8, 12, 16, 20, 24, 32...)

---

## 4. Border Radius Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-sm` | 8px | Small badges, tags, word chips |
| `--radius-md` | 12px | Standard cards, input fields |
| `--radius-lg` | 16px | Large containers, modals |
| `--radius-xl` | 24px | Modal overlays, bottom sheets |
| `--radius-full` | 9999px | Pills buttons, avatar circles, tabs segmented |

---

## 5. Shadow Tokens

| Token | Elevation | Shadow Definition (CSS-style) | Usage |
|-------|-----------|-------------------------------|-------|
| `--shadow-sm` | 1 | `0 1px 2px rgba(0,0,0,0.05)` | Inline cards, small elevated elements |
| `--shadow-md` | 2 | `0 4px 6px rgba(0,0,0,0.07)` | Standard cards, buttons, dropdowns |
| `--shadow-lg` | 3 | `0 10px 15px rgba(0,0,0,0.1)` | Modals, bottom sheets, floating elements |
| `--shadow-xl` | 4 | `0 20px 25px rgba(0,0,0,0.12)` | Floating action buttons, toasts elevated |

### Shadow Rose Tint (optionnel décoratif)
```css
--shadow-rose-glow: 0 4px 20px rgba(233, 30, 140, 0.15);
```
Utilisé pour: bouton primary pressed state glow, streak fire animation surround.

---

## 6. Animation Tokens

| Token | Duration | Easing Curve | Usage |
|-------|----------|--------------|-------|
| `--duration-instant` | 0ms | none | Instant state changes (color switch) |
| `--duration-fast` | 150ms | ease-out | Pressed feedback, tap states |
| `--duration-normal` | 300ms | ease-out | Standard transitions, word reveal |
| `--duration-slow` | 500ms | ease-in-out | Page transitions, modal presentations |
| `--duration-entrance` | 400ms | spring(bounciness: 12, stiffness: 300) | Screen entrance animations |
| `--duration-count-up` | 600ms | easeOutExpo | Number counting animations |

### Easing Curves Précises
- **ease-out**: `cubic-bezier(0, 0, 0.2, 1)`
- **ease-in-out**: `cubic-bezier(0.4, 0, 0.2, 1)`
- **easeOutExpo**: `cubic-bezier(1, 0, 1, 1)`
- **spring**: `{ tension: 300, friction: 25 }` (React Native Reanimated spring)

---

## 7. Z-Index / Elevation Scale

| Token | Elevation Value | Usage |
|-------|----------------|-------|
| `--z-base` | 0 | Default content |
| `--z-elevated` | 100 | Elevated cards on scroll |
| `--z-modal` | 500 | Modal overlays |
| `--z-toast` | 600 | Toast notifications |
| `--z-bottom-sheet` | 700 | Bottom sheets |
| `--z-popover` | 800 | Popovers, dropdowns |
| `--z-floating` | 900 | FAB, floating elements |
| `--z-top-bar` | 1000 | Header bars, tab navigation |

---

## 8. Implémentation React Native

### Tokens en TypeScript
```typescript
// src/tokens/index.ts

export const colors = {
  primary: {
    50: '#FFF0F6',
    100: '#FFE4EE',
    200: '#FFB6C9',
    300: '#FF87A6',
    400: '#E91E8C',
    500: '#D11073',
    600: '#AD0B5C',
    700: '#8B0A4A',
  },
  neutral: {
    50: '#FAFAFA',
    100: '#F5F5F5',
    // ... etc
  },
  semantic: {
    success: '#34C759',
    warning: '#FF9500',
    error: '#FF3B30',
    info: '#5AC8FA',
  },
} as const;

export const spacing = {
  xs: 4, sm: 8, md: 16, lg: 24, xl: 32, '2xl': 48, '3xl': 64,
} as const;

export const typography = {
  families: {
    primary: 'Inter',
    heading: 'Inter',
    serif: 'Georgia',
  } as const,
  sizes: {
    xs: 11, sm: 13, base: 16, lg: 20, xl: 24, '2xl': 32, '3xl': 40,
  } as const,
} as const;
```

### Utilisation dans un composant
```typescript
import { colors, spacing, typography } from '@/tokens';

const style = StyleSheet.create({
  card: {
    backgroundColor: colors.neutral[100],
    borderRadius: 12,
    padding: spacing.md,
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
  },
  title: {
    fontFamily: typography.families.heading,
    fontWeight: '600',
    fontSize: typography.sizes.xl,
    color: colors.neutral[800],
  },
});
```

---

*Document approuvé. Transmis à l'Agent D pour UI Screens spécifications.*
