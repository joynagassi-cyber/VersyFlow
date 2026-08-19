# Design System: VersyFlow
**Project ID:** Sacred Modern

## 1. Visual Theme & Atmosphere

VersyFlow incarne une **"Élégance Sacrée"** — un équilibre raffiné entre beauté spirituelle et excellence design contemporaine. L'interface se veut **apaisante et premium**, avec des espaces respirés et une palette rose poudré qui évoque à la fois la tradition biblique et la modernité. Le design est **intuitif et chaleureux**, avec des micro-interactions soignées qui rendent l'apprentissage engageant sans être infantilisant.

**Key Characteristics:**
- Espacement généreux créant une sensation de calme et de sophistication
- Palette rose primaire (#E91E8C) utilisée avec retenue pour les actions principales
- Fond crème très clair (#fcf9f8) évitant le blanc clinique
- Ombres whisper-soft pour la profondeur sans lourdeur
- Typographie sobre avec hiérarchie claire (sans serif moderne)

## 2. Color Palette & Roles

### Primary Foundation
- **Sacred Rose** (#E91E8C) — Primary accent, CTAs, active states, progress indicators
- **Cream Canvas** (#fcf9f8) — Primary background, page canvas
- **Pure White** (#FFFFFF) — Card backgrounds, surface elevations
- **Soft Pink** (#FFF0F6) — Tinted backgrounds, subtle highlights
- **Rose Blush** (#FFE4EE) — Borders, dividers, input backgrounds

### Accent & Interactive
- **Sage Green** (#008733) — Success states, mastered content, positive indicators
- **Coral Red** (#FF6B6B) — Error states, destructive actions, low streak warnings
- **Amber Warning** (#FF9500) — Warning states, in-progress indicators
- **Royal Blue** (#007AFF) — Secondary actions, info states

### Typography & Text Hierarchy
- **Charcoal Ink** (#2D2D2D) — Primary text, headings, strong contrast
- **Warm Taupe** (#594048) — Secondary text, body copy, descriptions
- **Soft Gray** (#6E6E6E) — Tertiary text, labels, metadata
- **Silver Mist** (#A0A0A0) — Placeholder text, disabled states, icons
- **Pale Dust** (#C0C0C0) — Border lines, subtle dividers

### Dark Mode Tokens
- **Deep Canvas** (#121212) — Dark background
- **Surface Card** (#1E1E1E) — Card/surface backgrounds
- **Elevated Surface** (#2A2A2A) — Elevated cards, modals
- **On Dark Primary** (#FFFFFF) — Primary text on dark
- **On Dark Secondary** (#B3B3B3) — Secondary text on dark
- **On Dark Muted** (#6E6E6E) — Muted text on dark

## 3. Typography Rules

**Primary Font Family:** System sans-serif (SF Pro on iOS, Roboto on Android)
**Character:** Clean, modern, highly legible

### Hierarchy & Weights
- **Display (Hero):** 32px, Bold (700), line-height 40px
- **Heading 1:** 24px, Bold (700), line-height 32px
- **Heading 2:** 18px, Semibold (600), line-height 24px
- **Body:** 16px, Regular (400), line-height 24px
- **Caption:** 13px, Regular (400), line-height 18px
- **Micro:** 11px, Regular (400), line-height 16px

### Spacing Principles
- Base unit: 8px grid
- Component padding: 16px minimum
- Section margins: 24-32px
- Card internal padding: 20px

## 4. Component Stylings

### Buttons
- **Primary CTA:** Full-width, height 52px, pill shape (radius 26px), rose background (#E91E8C), white text
- **Secondary CTA:** Outlined, height 52px, rose border (2px), transparent background
- **Ghost Button:** No border, text-only, rose color
- **Icon Button:** Circular (44x44px), soft pink background (#FFF0F6), rose icon

### Cards
- **Elevated Card:** White background, radius 16px, whisper-soft shadow (opacity 0.05)
- **Flat Card:** White background, radius 16px, no shadow, subtle border (#FFF0F6)
- **Feature Card:** Tinted background (#FFF0F6), radius 20px, icon in colored circle

### Navigation
- **Bottom Tab Bar:** White background, height 64px, rose active state, gray inactive
- **Header:** White background, padding 20px, bottom border (#FFE4EE)
- **Modal:** Bottom sheet, white background, radius 24px top corners

### Inputs & Forms
- **Search Input:** Height 48px, radius 12px, soft pink background (#FFF0F6), search icon left
- **Text Input:** Height 48px, radius 12px, white background, border (#FFE4EE)

### Badges & Chips
- **Status Badge:** Pill shape, radius 20px, appropriate status color
- **Category Chip:** Soft background tint, colored text, radius 20px

## 5. Layout Principles

### Grid & Structure
- **Max Content Width:** 100% (mobile-first)
- **Column System:** Flexbox, single column on mobile
- **Spacing:** 16px horizontal margins, 24px between sections

### Whitespace Strategy
- Base unit: 8px
- Component padding: 16px minimum
- Section margins: 24-32px
- Card internal: 20px

### Alignment & Visual Balance
- Left-aligned body text (optimal readability)
- Centered hero elements for impact
- Consistent vertical rhythm (8px grid)

### Dark Mode
- **Background:** #121212
- **Cards:** #1E1E1E
- **Elevated:** #2A2A2A
- **Text Primary:** #FFFFFF
- **Text Secondary:** #B3B3B3
- **Borders:** rgba(255,255,255,0.1)

## 6. Design System Notes for Stitch Generation

When creating new screens for this project using Stitch, reference these specific instructions:

### Language to Use
- **Atmosphere:** "Sacred elegance with modern warmth"
- **Button Shapes:** "Pill-shaped, generously rounded"
- **Shadows:** "Whisper-soft diffused shadows"
- **Spacing:** "Generous breathing room, calm and uncluttered"
- **Dark Mode:** "Deep charcoal backgrounds with elevated surfaces"

### Color References
Always use the descriptive names with hex codes:
- Primary CTA: "Sacred Rose (#E91E8C)"
- Background: "Cream Canvas (#fcf9f8)"
- Card Surface: "Pure White (#FFFFFF)"
- Text Primary: "Charcoal Ink (#2D2D2D)"
- Text Secondary: "Warm Taupe (#594048)"
- Dark BG: "Deep Canvas (#121212)"
- Dark Card: "Surface Card (#1E1E1E)"

### Component Prompts
- "Create a primary CTA button in Sacred Rose (#E91E8C) with pill shape and white text"
- "Design an elevated card with whisper-soft shadow and 16px radius"
- "Add a bottom tab navigation with rose active state and gray inactive"
