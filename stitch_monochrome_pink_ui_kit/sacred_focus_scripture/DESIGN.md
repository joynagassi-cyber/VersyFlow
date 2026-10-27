---
name: Sacred Focus Scripture
colors:
  surface: '#fbf9f9'
  surface-dim: '#dbdad9'
  surface-bright: '#fbf9f9'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f5f3f3'
  surface-container: '#efeded'
  surface-container-high: '#e9e8e7'
  surface-container-highest: '#e3e2e2'
  on-surface: '#1b1c1c'
  on-surface-variant: '#5a4044'
  inverse-surface: '#303031'
  inverse-on-surface: '#f2f0f0'
  outline: '#8e6f74'
  outline-variant: '#e3bdc3'
  surface-tint: '#bc004f'
  primary: '#b0004a'
  on-primary: '#ffffff'
  primary-container: '#d81b60'
  on-primary-container: '#fff2f3'
  inverse-primary: '#ffb2bf'
  secondary: '#5f5e5e'
  on-secondary: '#ffffff'
  secondary-container: '#e2dfde'
  on-secondary-container: '#636262'
  tertiary: '#5d565b'
  on-tertiary: '#ffffff'
  tertiary-container: '#766e73'
  on-tertiary-container: '#fef2f8'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffd9de'
  primary-fixed-dim: '#ffb2bf'
  on-primary-fixed: '#3f0016'
  on-primary-fixed-variant: '#90003b'
  secondary-fixed: '#e5e2e1'
  secondary-fixed-dim: '#c8c6c5'
  on-secondary-fixed: '#1c1b1b'
  on-secondary-fixed-variant: '#474746'
  tertiary-fixed: '#eae0e6'
  tertiary-fixed-dim: '#cec4ca'
  on-tertiary-fixed: '#1f1a1e'
  on-tertiary-fixed-variant: '#4b454a'
  background: '#fbf9f9'
  on-background: '#1b1c1c'
  surface-variant: '#e3e2e2'
typography:
  headline-xl:
    fontFamily: Playfair Display
    fontSize: 34px
    fontWeight: '700'
    lineHeight: 42px
    letterSpacing: -0.02em
  headline-xl-mobile:
    fontFamily: Playfair Display
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.015em
  headline-lg:
    fontFamily: Playfair Display
    fontSize: 26px
    fontWeight: '700'
    lineHeight: 34px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Playfair Display
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  scripture-body:
    fontFamily: Playfair Display
    fontSize: 22px
    fontWeight: '400'
    lineHeight: 34px
    letterSpacing: -0.005em
  scripture-body-mobile:
    fontFamily: Playfair Display
    fontSize: 19px
    fontWeight: '400'
    lineHeight: 30px
    letterSpacing: 0em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '500'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-caps:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 14px
    letterSpacing: 0.08em
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 18px
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  margin: 1.25rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style

This design system crafts a focused, tranquil environment dedicated to scripture memorization, reflection, and spiritual contemplation. The aesthetic pairs the quiet reverence of classic editorial publishing with modern, razor-sharp product design. 

The visual style is **Contemporary Editorial Minimalism with Precision Vivid Accents**. The base canvas is clean, pure, and quiet: crisp white surfaces, soft porcelain tonal layers, and deep ink-black typography eliminate cognitive distraction. A deliberate, single-accent stroke of vivid fuchsia/magenta provides energetic feedback, driving learning loops, progress rings, step completions, and primary calls to action without degrading the contemplative peace of the reading experience.

Target users seek deep focus, clarity, and daily spiritual grounding. Every visual interaction prioritizes readability, clear typographic pacing, and tangible milestones.

## Colors

The color palette is built around an intentional contrast between neutral bookish quietude and energetic, deliberate action:

- **Primary (`#D81B60` / Vivid Berry Magenta):** Reserved strictly for focal actions: primary pill CTAs, active segmented tabs, memorization progress rings, active streak dots, and high-priority interactive badges. Never used for massive ambient backgrounds unless specifically highlighting the hero revision card.
- **Secondary (`#1A1A1A` / Ink Black):** The anchoring tone for all scripture text, section headers, icon glyphs, and primary structural elements. Delivers editorial authority and pure contrast against light backgrounds.
- **Tertiary (`#F3E8EE` / Soft Petal Tint):** A gentle, desaturated rose-tinted neutral applied to active button underlays, fill masks for cloze deletion blanks, and progress track backgrounds.
- **Neutral (`#767676` / Slate Graphite):** For reference metadata (chapter, verse, translation LSG), unselected tab states, step descriptions, and subtle divider rules.

### Surface Tones & Fill States
- Canvas Background: `#FFFFFF`
- Card Container Base: `#FFFFFF`
- Tonal Container Alt: `#F8F8F9` (for secondary segments, card borders, and uncompleted pill badges)
- Masked Word Blank (Hidden Text): `#EFEFF1` (solid pill placeholder for memorization testing)
- Active Mask Boundary: Border `1.5px dashed #D81B60` on `#FDF2F7` fill.

## Typography

The typographic hierarchy establishes clear semantic duality:
1. **Sacred & Reading Tier (Playfair Display):** Assigned to verse content, biblical citations (`Jean 3:16-18`), screen titles (`Aujourd'hui`, `Révisions`), and prominent quote cards. The high stroke contrast and editorial dignity instill reverence and promote patient reading.
2. **System & Interface Tier (Inter):** Assigned to navigational tabs, interaction affordances, cloze hints, micro-labels, metrics, and metadata. Provides immediate optical clarity and frictionless scannability.

### Typographic Treatments
- **Verse Citations in Headers:** Always styled in `headline-sm` with reference metadata beneath in uppercase `label-caps` (`LSG · 3 VERSETS`).
- **Cloze Words (Fill-in-the-blank):** Maintain the same baseline and line-height as surrounding `scripture-body` text to prevent vertical stutter when hidden words are revealed.

## Layout & Spacing

The layout is built for mobile ergonomics with strict fluid horizontal bounds and disciplined vertical stacking:

- **Layout Model:** Single fluid column bound to mobile viewport widths (360px–430px) with standard `1.25rem` outer canvas padding. For tablets and desktop viewports, content pins to a centered 480px reader card to preserve optical focus.
- **Component Padding Scale:**
  - Compact chips & step badges: `space-xs` (4px) vertical, `space-sm` (8px) horizontal.
  - Buttons & standard controls: `space-md` (16px) vertical, `space-lg` (24px) horizontal.
  - Interactive scripture & review cards: `space-lg` (24px) uniform interior padding.
- **Rhythm & Stacking:** Cards stack with consistent `space-md` (16px) vertical spacing. Major logical blocks (e.g., Hero verse vs. Daily queue) separate by `space-xl` (32px).

## Elevation & Depth

This system avoids heavy drop shadows, relying instead on clean tonal layers, soft ghost borders, and focused ambient glows:

- **Base Surfaces (`Level 0`):** Solid `#FFFFFF` screen canvas with optional `#F9F9FA` tinted backing for content groups.
- **Standard Cards (`Level 1`):** Solid `#FFFFFF` fill bounded by a crisp 1px ghost border in `rgba(0, 0, 0, 0.06)`. Accompanied by an extra-diffused ambient shadow: `0 4px 20px -2px rgba(26, 26, 26, 0.04)`.
- **Primary Hero Accent Cards:** Solid primary gradient fill (`#D81B60` to `#C2185B`) or deep ink background, cast with an ambient magenta rim shadow: `0 8px 24px -4px rgba(216, 27, 96, 0.25)`.
- **Floating Controls & Action Bars:** Fixed bottom floating action controls utilize `backdrop-filter: blur(16px)` with `rgba(255, 255, 255, 0.9)` surface fill, framed by a soft top border (`rgba(0, 0, 0, 0.05)`).
- **Interactive Word Blanks:** Flat `#EFEFF1` fill with zero shadow in resting state. When active/focused, elevated by a `1.5px dashed #D81B60` stroke and a soft glow: `0 2px 8px rgba(216, 27, 96, 0.15)`.

## Shapes

The interface embraces approachable, ergonomic roundedness that feels comfortable under thumbs and gentle on the eyes:

- **Cards & Memorization Panels:** 1rem (`rounded-lg`) to 1.5rem (`rounded-xl`) outer radius.
- **Action Buttons & Segment Switchers:** Fully pill-shaped (`9999px` border radius) for tactile, inviting taps.
- **Cloze Words (Hidden Verse Blanks):** 0.375rem (6px) rounded corners, conforming naturally to the shape and width of the hidden text.
- **Progress Trackers & Indicators:** Circular or heavily rounded pill tracks (`rounded-full`) for smooth visual completion.

## Components

### Buttons & Interactive Controls
- **Primary Action CTA (`Phrase suivante →` / `Lancer la session`):** Full-width or auto-flex pill button with `#D81B60` background, pure white bold text (`label-md`), 54px minimum touch target height, and subtle active scale-down (0.98x).
- **Secondary / Ghost Buttons (`Tout révéler`, `Revoir la phrase`):** White fill, 1px border (`#E5E5EA`), ink black text (`#1A1A1A`), pill-shaped.
- **Circular Icon Actions (`Next`, `More`, `Audio`):** 44px x 44px circular disks. In primary state: `#D81B60` fill with white glyph. In neutral state: `#F4F4F6` fill with `#1A1A1A` glyph.

### Memorization Cloze Cards
- **Verse Display Box:** Clean white card surrounded by `1px rgba(0,0,0,0.06)` border. Contains the scripture text in `scripture-body` serif.
- **Hidden Word Tokens (Blanks):** Inline blocks with dynamic width matching the obscured word. Rendered with `#E4E4E8` smooth background. Active/next word to reveal renders with `#FDEEF4` pink fill and `#D81B60` dotted outline.

### Progress & Step Trackers
- **Radial Progress Ring:** Dual-stroke SVG meter (neutral background stroke `#F0F0F2`, active progress stroke `#D81B60`). Inner center displays progress ratio (`2/4`, `Maîtrise 62%`) in `label-sm` or `headline-sm`.
- **Top Step Tabs (`Révélation`, `Masquage`, `Flashcard`, `Écriture`):** Text labels in `label-caps`. Active tab is highlighted with an ink or magenta underline indicator and `#D81B60` label color.
- **Weekly Habit Circles:** 36px circular badges for days of the week (`L M M J V S D`). Completed days feature solid `#D81B60` fill with white checkmark; incomplete days remain flat neutral `#EBEBF0`.

### Chips & Filter Pills
- Grouped filter pills (`Tous`, `En retard`, `Aujourd'hui`, `À venir`):
  - Inactive: `#F3F3F5` background, `#555555` text, zero border.
  - Active: `#1A1A1A` background with white text, or soft tinted background (`#FDF0F5`) with `#D81B60` text when filtering by urgency.

### Sliders (Masking Intensity)
- Linear track (4px height) with `#F0F0F2` background and `#D81B60` fill on the completed range.
- Thumb is a 20px solid white circle framed by a 3px `#D81B60` outer ring and soft ambient drop shadow.

### Bottom Navigation Bar
- Fixed at viewport bottom with 64px height + safe area inset.
- High-contrast iconography (Home, Bible, Memorize, Progress, Settings).
- Active item displays an energetic accent dot or magenta tint (`#D81B60`) beneath the icon and label.