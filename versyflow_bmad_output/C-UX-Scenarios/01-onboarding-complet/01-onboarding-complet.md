# Scénario 01: Onboarding Complet

**Persona**: Marie (Principal)
**Objectif**: Configurer l'application en moins de 60 secondes
**Drive Force**: Want — Accessibilité universelle / Fear — Découragement

---

## Journey Overview

```
[App Launch]
    ↓
{Première ouverture?}
    ├─ OUI → [Welcome Screen] → [Language Picker] → [Translation Picker] → [Home]
    └─ NON → [Home direct]
```

---

## Page 01: Welcome Screen

### Contexte
- **Entry**: App launch, first time
- **Goal**: Captiver l'utilisateur, présenter la valeur, offrir un CTA clair
- **Exit**: Tap "Commencer" ou "Skip"

### Layout
```
┌─────────────────────────┐
│                         │
│    [Logo VersyFlow]     │
│    (animation 3s)       │
│                         │
│   "Mémorisation biblique │
│       intuitive"        │
│                         │
│                         │
│    [Commencer]          │
│    [Skip] (small)       │
│                         │
└─────────────────────────┘
```

### Composants
- `LogoAnimated`: Animation du logo, delay 3s avant bouton
- `TaglineText`: "Mémorisation biblique intuitive"
- `ButtonPrimary`: "Commencer" — full width, pill shape
- `ButtonSecondary`: "Skip" — small, bottom center

### Interactions
- Tap "Commencer" → transition vers Language Picker
- Tap "Skip" → retour aux paramètres (si onboarding déjà fait)
- Auto-advance si onboarding déjà complété (skip direct vers Home)

### États
- **Loading**: Logo animation en cours
- **Ready**: Boutons visibles
- **Skipped**: Utilisateur a skipé, retour Home

---

## Page 02: Language Picker

### Contexte
- **Entry**: From Welcome Screen
- **Goal**: Permettre à l'utilisateur de choisir la langue de l'interface
- **Exit**: Sélection confirmée → Translation Picker

### Layout
```
┌─────────────────────────┐
│  [← Retour]             │
│                         │
│  "Choisissez votre langue"│
│                         │
│  ┌───────────────────┐  │
│  │ 🇫🇷 Français      │  │
│  └───────────────────┘  │
│  ┌───────────────────┐  │
│  │ 🇬🇧 English       │  │
│  └───────────────────┘  │
│  ┌───────────────────┐  │
│  │ 🇩🇪 Deutsch       │  │
│  └───────────────────┘  │
│  ┌───────────────────┐  │
│  │ 🇸🇦 العربية       │  │
│  └───────────────────┘  │
│  ┌───────────────────┐  │
│  │ 🇨🇳 中文          │  │
│  └───────────────────┘  │
│                         │
│      [Continuer]        │
└─────────────────────────┘
```

### Composants
- `HeaderBar`: Titre + bouton retour
- `LanguageGrid`: Liste des 5 langues avec drapeaux et noms natifs
- `ButtonPrimary`: "Continuer" — disabled tant qu'aucune sélection

### Interactions
- Tap sur une langue → sélection mise en surbrillance
- Tap "Continuer" → transition vers Translation Picker (détection RTL auto pour arabe)

### États
- **Selected**: Langue sélectionnée, bouton activé
- **RTL detected**: Si arabe sélectionné, direction RTL appliquée
- **Error**: Langue non disponible → fallback FR puis EN

---

## Page 03: Translation Picker

### Contexte
- **Entry**: From Language Picker
- **Goal**: Permettre à l'utilisateur de choisir la traduction biblique
- **Exit**: Sélection confirmée → Home

### Layout
```
┌─────────────────────────┐
│  [← Retour]             │
│                         │
│  "Choisissez votre Bible"│
│                         │
│  ┌───────────────────┐  │
│  │ 📖 LSG            │  │
│  │ Louis Segond 1910 │  │
│  │ ◆ Sélectionné     │  │
│  └───────────────────┘  │
│  ┌───────────────────┐  │
│  │ 📖 King James     │  │
│  │ Version 1611      │  │
│  │ (V1+)             │  │
│  └───────────────────┘  │
│                         │
│      [Continuer]        │
└─────────────────────────┘
```

### Composants
- `HeaderBar`: Titre + bouton retour
- `TranslationList`: Liste des traductions avec description
- `TranslationCard`: Carte avec nom, année, style, sélection
- `ButtonPrimary`: "Continuer"

### Interactions
- Tap sur une traduction → sélection mise à jour
- Tap "Continuer" → persist settings + transition vers Home

### États
- **LSG default**: Pré-sélectionné, description visible
- **Downloading**: Si traduction non présente, affichage loading
- **Error**: Traduction non trouvée → reset LSG

---

## Page 04: Home (Post-Onboarding)

### Contexte
- **Entry**: From Translation Picker
- **Goal**: Présenter l'accueil avec actions principales
- **Exit**: Navigation vers Explorer ou Révisions

### Layout
```
┌─────────────────────────┐
│                         │
│  "Bienvenue, Marie"     │
│                         │
│  ┌─────────────────┐    │
│  │ 📖 3 versets    │    │
│  │    à réviser    │    │
│  └─────────────────┘    │
│                         │
│  [Mémoriser un verset]  │
│  [Réviser maintenant]   │
│                         │
│  ─────────────────────  │
│  Versets récents:       │
│  • Jean 3:16 (En cours) │
│  • Psaume 23:1 (Maîtrisé)│
│                         │
└─────────────────────────┘
│  [🏠]  [🔍]  [📊]  [⚙️]│
└─────────────────────────┘
```

### Composants
- `GreetingText`: Personnalisation avec nom
- `ReviewBadge`: Badge "X versets à réviser"
- `ActionCard`: "Mémoriser" / "Réviser" — cartes cliquables
- `RecentVerses`: Liste des 5 derniers versets mémorisés
- `TabNavigation`: Barre de navigation inférieure

### Interactions
- Tap "Mémoriser" → navigation vers Explorer
- Tap "Réviser" → navigation vers Review Queue
- Tap tab → navigation vers section correspondante

### États
- **No reviews**: Badge masqué si 0 révisions
- **Has reviews**: Badge affiché avec compteur
- **First time**: Pas de versets récents, empty state

---

## Navigation Map

```
Welcome Screen
    ↓ (tap Commencer)
Language Picker
    ↓ (tap Continuer)
Translation Picker
    ↓ (tap Continuer)
Home (Accueil)
    ↓ (tap tab)
Explorer | Progression | Paramètres
```

---

## Design Intent

- **Simplicité**: 3 écrans maximum, pas d'étapes inutiles
- **Rapidité**: Onboarding complet en < 60 secondes
- **Flexibilité**: Skip possible, reprise ultérieure dans Paramètres
- **Pré-sélection**: LSG sélectionné par défaut, FR sélectionné par défaut
- **RTL auto**: Détection automatique si arabe → direction RTL appliquée