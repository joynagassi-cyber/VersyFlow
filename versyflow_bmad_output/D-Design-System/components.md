# VersyFlow — Design System Components

**Projet**: VersyFlow MVP
**Date**: 2026-08-03
**Version**: v0.1

---

## 1. Composants Partagés Identifiés

### 1.1 HeaderBar
**Object ID**: `vs-header-bar`
**Utilisé dans**: Tous les écrans
**Props**:
- `title`: string
- `onBack?`: () => void
- `rightAction?`: ReactNode

**Styles**:
- Height: 56px
- Background: transparent
- Padding horizontal: 16px
- Icon color: primary (rose)
- Title color: neutral-800

---

### 1.2 TabNavigation
**Object ID**: `vs-tab-nav`
**Utilisé dans**: Tous les écrans principaux
**Props**:
- `activeTab`: string
- `onTabChange`: (tab: string) => void
- `tabs`: TabItem[]

**TabItem**:
- `id`: string
- `icon`: ReactNode
- `label`: string
- `badge?: number`

**Styles**:
- Height: 64px
- Background: neutral-50
- Active icon: primary (rose)
- Inactive icon: neutral-400
- Active label: primary
- Inactive label: neutral-500
- Top indicator: 2px rose

---

### 1.3 ButtonPrimary
**Object ID**: `vs-btn-primary`
**Utilisé dans**: Tous les écrans
**Props**:
- `onPress`: () => void
- `title`: string
- `disabled?`: boolean
- `loading?`: boolean

**Styles**:
- Height: 52px
- Border radius: 26px (pill)
- Padding horizontal: 24px
- Background: primary-400 gradient
- Text: white, bold
- Disabled: opacity 0.5

**States**:
- Default: scale 1
- Pressed: scale 0.96 (150ms ease-out)
- Loading: spinner rose

---

### 1.4 ButtonSecondary
**Object ID**: `vs-btn-secondary`
**Utilisé dans**: Tous les écrans
**Props**:
- `onPress`: () => void
- `title`: string
- `icon?`: ReactNode

**Styles**:
- Height: 52px
- Border radius: 26px
- Border: 2px solid primary-400
- Background: transparent
- Text: primary-400

**States**:
- Default: transparent
- Hover: background primary-100 (10% opacity)

---

### 1.5 CardVerse
**Object ID**: `vs-card-verse`
**Utilisé dans**: Verse List, Home, Progress
**Props**:
- `reference`: string
- `text`: string
- `status`: 'new' | 'inprogress' | 'mastered'
- `onPress?`: () => void
- `onTapFavorite?`: () => void

**Styles**:
- Padding: 16px
- Border left: 4px solid (couleur status)
- Shadow: md
- Max lines text: 3
- Ellipsis at end

**Status colors**:
- New: neutral-400 (gris)
- InProgress: primary-400 (rose)
- Mastered: success (vert)

---

### 1.6 WordChip
**Object ID**: `vs-word-chip`
**Utilisé dans**: Memorization Session
**Props**:
- `word`: string
- `revealed`: boolean
- `onPress?`: () => void

**Styles**:
- Hidden: gray background, 40x30px
- Revealed: white text, pink gradient background
- Border radius: 8px (pill)
- Spacing: 6px entre chips

**Animation**:
- Reveal: scale + fade-in (300ms)
- Stagger: 50ms entre chaque mot

---

### 1.7 StatCard
**Object ID**: `vs-stat-card`
**Utilisé dans**: Home, Progress Dashboard
**Props**:
- `value`: string | number
- `label`: string
- `icon?`: ReactNode
- `trend?`: 'up' | 'down' | 'neutral'

**Styles**:
- 2 colonnes en grid
- Full width sur petits écrans
- Value: 32px bold, primary
- Label: 14px regular, neutral-500

---

### 1.8 SearchBar
**Object ID**: `vs-search-bar`
**Utilisé dans**: Book List, Chapter List, Verse List
**Props**:
- `placeholder`: string
- `onChangeText`: (text: string) => void
- `onSearch?`: () => void

**Styles**:
- Background: neutral-100
- Border radius: 12px
- Height: 48px
- Search icon: left
- Clear icon: right (apparaît quand texte présent)

**Behavior**:
- Auto-focus on enter
- Dismiss keyboard on outside tap

---

### 1.9 EmptyState
**Object ID**: `vs-empty-state`
**Utilisé dans**: Tous les écrans avec contenu
**Props**:
- `icon`: ReactNode
- `title`: string
- `description`: string
- `action?`: () => void

**Styles**:
- Icon: 64px
- Text: centré
- CTA button: optionnel

---

### 1.10 ToastNotification
**Object ID**: `vs-toast`
**Utilisé dans**: Tous les écrans
**Props**:
- `message`: string
- `type`: 'success' | 'error' | 'info'
- `duration?`: number

**Styles**:
- Full width minus 32px margin
- Height: 48px
- Auto-dismiss: 3s
- Position: top

**Variants**:
- Success: green background
- Error: red background
- Info: blue background

---

### 1.11 ConfirmModal
**Object ID**: `vs-confirm-modal`
**Utilisé dans**: Reset Progress, Quit Session
**Props**:
- `title`: string
- `message`: string
- `confirmText`: string
- `cancelText?: string
- `onConfirm`: () => void
- `onCancel`: () => void
- `requireText?`: string (pour confirmation texte)

**Styles**:
- Overlay: semi-transparent
- Modal: white background, rounded corners
- Destructive: red accents

---

## 2. Design Tokens

### Couleurs
```typescript
const colors = {
  primary: {
    50: '#FFF0F6',
    100: '#FFE4EE',
    200: '#FFB6C9',
    300: '#FF87A6',
    400: '#E91E8C',  // Primary principale
    500: '#D11073',
    600: '#AD0B5C',
    700: '#8B0A4A',
  },
  neutral: {
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#E8E8E8',
    300: '#D1D1D1',
    400: '#A0A0A0',
    500: '#6E6E6E',
    600: '#4A4A4A',
    700: '#2D2D2D',
    800: '#1A1A1A',
    900: '#0D0D0D',
  },
  semantic: {
    success: '#34C759',
    warning: '#FF9500',
    error: '#FF3B30',
    info: '#5AC8FA',
  },
  status: {
    new: '#A0A0A0',
    inprogress: '#E91E8C',
    mastered: '#34C759',
  },
};
```

### Espacements
```typescript
const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
};
```

### Typographie
```typescript
const typography = {
  families: {
    primary: 'Inter',
    heading: 'Inter',
    serif: 'Georgia',
  },
  sizes: {
    xs: 11,
    sm: 13,
    base: 16,
    lg: 20,
    xl: 24,
    '2xl': 32,
    '3xl': 40,
  },
  weights: {
    light: 300,
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  lineHeights: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.7,
  },
};
```

### Border Radius
```typescript
const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};
```

### Shadows
```typescript
const shadows = {
  sm: '0 1px 2px rgba(0,0,0,0.05)',
  md: '0 4px 6px rgba(0,0,0,0.07)',
  lg: '0 10px 15px rgba(0,0,0,0.1)',
  xl: '0 20px 25px rgba(0,0,0,0.12)',
};
```

---

## 3. Navigation Map Complète

```
┌─────────────────────────────────────────────────────────────┐
│                      APP SHELL                               │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │
│  │  Accueil │ │ Explorer │ │Progress.│ │ Param.  │           │
│  │  (🏠)    │ │  (🔍)   │ │  (📊)   │ │  (⚙️)   │           │
│  └────┬─────┘ └────┬────┘ └────┬────┘ └────┬────┘           │
└───────┼─────────────┼───────────┼───────────┼───────────────┘
        │             │           │           │
        ▼             ▼           ▼           ▼
   ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐
   │  Home   │  │  Book   │  │  Stats  │  │Settings │
   │ Screen  │  │  List   │  │Dashboard│  │ Screen  │
   └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘
        │             │           │           │
        │             ▼           │           ▼
        │       ┌─────────┐       │    ┌──────────┐
        │       │Chapter  │       │    │Language  │
        │       │ List    │       │    │Picker    │
        │       └────┬────┘       │    └────┬─────┘
        │            │            │         │
        │            ▼            │         ▼
        │       ┌─────────┐       │    ┌──────────┐
        │       │Verse    │       │    │Translation│
        │       │ List    │       │    │Picker    │
        │       └────┬────┘       │    └────┬─────┘
        │            │            │         │
        │            ▼            │         ▼
        │       ┌─────────┐       │    ┌──────────┐
        │       │Verse    │       │    │Reset     │
        │       │Detail   │       │    │Modal     │
        │       └────┬────┘       │    └──────────┘
        │            │            │
        │            ▼            │
        │       ┌─────────┐       │
        │       │Memorize │       │
        │       │Session  │       │
        │       └────┬────┘       │
        │            │            │
        │            ▼            │
        │       ┌─────────┐       │
        │       │Confirm  │       │
        │       │Screen   │       │
        │       └─────────┘       │
        │                         │
        └─────────────────────────┘
                  │
                  ▼
           ┌──────────┐
           │Review    │
           │Queue     │
           └────┬─────┘
                │
                ▼
           ┌──────────┐
           │Review    │
           │Session   │
           └────┬─────┘
                │
                ▼
           ┌──────────┐
           │Session    │
           │Complete   │
           └──────────┘
```

---

*Document généré automatiquement depuis les spécifications de phase 4.*