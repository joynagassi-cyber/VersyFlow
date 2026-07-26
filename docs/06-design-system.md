# VersyFlow — Design System

## Document généré par Agent D — UI / Design System

---

## 1. Direction Artistique

### Philosophie
"Élégance sacrée" — L'app doit sentir le sacré tout en étant radicalement moderne. Pas religieux-traditionnel, pas tech-sec. Un équilibre entre beauté spirituelle et excellence design contemporaine.

### Adjectifs Clés
- **Rose & Frais** — identité visuelle principale
- **Premium** — qualité de finition élevée
- **Intuitif** — zéro friction cognitive
- **Apaisant** — couleurs et animations douces
- **Sacré** — respect du contenu biblique

### Mood Board References
| Reference | Inspiration | Application VersyFlow |
|-----------|-------------|----------------------|
| Calm.com | Calme, espacement respiré | Espacement généreux, arrière-plans doucs |
| Apple Health | Qualité premium dans les détails | Finition des composants, micro-interactions |
| Duolingo | Gamification douce et engageante | Streaks, badges, progress bars |
| YouVersion | Familiarité biblique mais niveau au-dessus | Navigation Bible mais design supérieur |

---

## 2. Principes de Design UI

### P-D1: Espacement généreux
Chaque élément a sa propre aire. Padding minimum 16px sur mobile. Espacement entre sections 24-32px.

### P-D2: Hiérarchie typographique claire
Titre > Sous-titre > Texte > Caption — 4 niveaux maximum, jamais confus.

### P-D3: Interaction tangible
Chaque tap a un feedback visuel immédiat (scale, color shift, ripple).

### P-D4: Animation purpose-driven
Animations servent la compréhension (transition, feedback, état), jamais décoratives pures.

### P-D5: Accessibilité native
Contraste minimal 4.5:1, tailles de texte accessibles, support VoiceOver/TalkBack.

---

## 3. Composants UI (React Native)

### ButtonPrimary
- **Usage**: Action principale d'un écran
- **Props**: `onPress`, `title`, `disabled?`, `loading?`
- **États**: default, pressed (scale 0.96), disabled (opacity 0.5), loading (spinner)
- **Dimensions**: height 52px, borderRadius 26px (pill shape), paddingHorizontal 24px
- **Layout**: Full width within parent container with 16px horizontal margins
- **Couleur**: Background gradient rose primary, text white

### ButtonSecondary
- **Usage**: Actions secondaires, cancel, back
- **Props**: `onPress`, `title`, `icon?`
- **Styles**: background transparent, border 2px solid Primary Pink, text Primary Pink
- **Dimensions**: height 52px same as primary
- **Hover**: fill background with light pink at 10% opacity

### CardVerse
- **Usage**: Afficher un verset dans une liste
- **Props**: `reference`, `text`, `status`, `onPress?`, `onTapFavorite?`
- **Structure**: Container avec padding 16px, borderLeftWidth 4px color=status
- **Status indicators**: New (gray), InProgress (pink), Mastered (green)
- **Max lines for text**: 3, ellipsis at end
- **Elevation**: shadow-md

### WordChip
- **Usage**: Un mot individuel dans une session de mémorisation
- **Props**: `word`, `revealed`, `onPress?`
- **États**: hidden (gray box placeholder, 40x30px), revealed (white text on pink gradient background)
- **Border**: all 4 corners rounded (pill shape), radius 8px
- **Spacing**: 6px between chips
- **Animation**: scale + fade-in when revealed

### TabNavigation
- **Usage**: Navigation principale bottom tabs
- **Items**: Accueil | Explorer | Progression | Paramètres
- **Active state**: pink icon + pink label + top indicator bar (2px rose)
- **Inactive state**: gray icon + gray label
- **Badge**: notification count on Accueil tab

### StatCard
- **Usage**: Stats dashboard (versets mémorisés, streak, rétention)
- **Props**: `value`, `label`, `icon?`, `trend?`
- **Layout**: 2 columns in grid, full width on small screens
- **Value**: 32px bold text, primary pink color
- **Label**: 14px regular text below, neutral gray

### EmptyState
- **Usage**: When no content available
- **Props**: `icon`, `title`, `description`, `action?`
- **Pattern**: Large icon top (64px), centered text block, optional CTA button
- **Layout**: vertically centered, horizontally centered

### ToastNotification
- **Usage**: Brief feedback messages
- **Pattern**: Top banner, auto-dismiss after 3s
- **Variants**: success (green bg), error (red bg), info (blue bg)
- **Dimensions**: full width minus 32px margin, height 48px

### SearchBar
- **Usage**: Recherche de référence biblique ou de texte
- **Props**: `placeholder`, `onChangeText`, `onSearch?`
- **Style**: background neutral-100, borderRadius 12px, height 48px
- **Icon**: search icon left, clear "x" icon right (appears when text present)
- **Behavior**: dismiss keyboard on outside tap, auto-focus on enter

### HeaderBar
- **Usage**: Barre de navigation standard d'un écran
- **Props**: `title`, `leftAction?`, `rightAction?`
- **Height**: 56px
- **Style**: transparent background, icons text primary pink
- **Layout**: flex row, space-between

---

## 4. Micro-interactions

### M-I-1: Swipe-to-favorite
- Verset swipe horizontal → heart icon appears → tap to favorite
- Haptic feedback on favorite confirmed
- Heart animation: scale from 0 to 1 with spring (bounciness 12)

### M-I-2: Word reveal pulse
- Tapping a hidden word → ripple animation expanding outward (radius 40px, 300ms)
- Word text fades in with slight upward motion (10px translate Y, 200ms ease-out)
- Each word staggered by 50ms in group reveals

### M-I-3: Streak fire animation
- Daily streak counter has subtle flame emoji that grows with count
- Milestones (7, 30, 100 days): confetti burst animation (30 particles, 500ms)
- Continuous glow effect on current day's streak number

### M-I-4: Progress fill
- Completion percentage fills left to right
- Gradient color from light pink (#FFB6C9) to deep pink (#E91E8C) based on progress
- Number counts up (animated counter, duration 600ms, easing easeOut)

### M-I-5: Pull-to-refresh
- Default pull indicator with VersyFlow rose color
- On complete: checkmark animation in rose circle (40ms delay after refresh)

### M-I-6: Screen transition
- Push navigation: slide from right with 300ms ease-out
- Modal presentation: fade + scale from 0.95 to 1.0 (400ms spring)
- Tab switch: crossfade with 200ms

---

## 5. États et Conditions Spéciales

### Loading States
- **Skeleton screens** pour listes (animaation shimmer rose/neutral-100)
- **Spinner** pour actions uniques (rose gradient rotation, 800ms loop)
- **Progress bar** pour téléchargements longs (barre rose fill animé)

### Error States
- **Toast** pour erreurs mineures non-bloquantes
- **Inline** pour erreurs de formulaire (champ rouge + message sous le champ)
- **Full screen** pour erreurs critiques (icône error + message + retry button)

### Empty States
- **Illustration** SVG abstraite (style line-art rose)
- **Message** centré expliquant le contexte
- **CTA** optionnel si action recommandée existe

---

## 6. Accessibilité

### WCAG 2.1 AA Compliance
- Color contrast ratio ≥ 4.5:1 for normal text
- Color contrast ratio ≥ 3:1 for large text (≥18pt or ≥14pt bold)
- All interactive elements ≥ 44x44pt touch targets
- Dynamic type support (up to 200% scaling)
- VoiceOver labels on all icons and buttons
- Reduced motion respect (`motionPreference === 'reduced'` → disable animations)

### Patterns d'accessibilité spécifiques
- **Verset texte**: minimum 16pt line-height relaxed (1.7) pour lecture longue
- **Word Chips**: minimum 44x44pt tappable area even if visually smaller
- **Navigation tabs**: accessible labels explicites ("Accueil", "Explorer la Bible", etc.)
- **Couleur sémantique**: toujours accompagnée d'une icône ou texte (pas uniquement couleur)

---

*Document approuvé. Transmis à l'Agent D pour Design Tokens.*
