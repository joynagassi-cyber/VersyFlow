# Scénario 03: Navigation Biblique

**Persona**: Étudiant en théologie (Secondaire)
**Objectif**: Trouver rapidement un verset spécifique dans la Bible
**Drive Force**: Want — Accès au contenu / Fear — Interface confuse

---

## Journey Overview

```
[Home]
    ↓ (tap tab Explorer)
[Book List Screen]
    ↓ (tap livre)
[Chapter List Screen]
    ↓ (tap chapitre)
[Verse List Screen]
    ↓ (tap verset ou recherche)
[Verse Detail Screen]
```

---

## Page 01: Book List Screen

### Contexte
- **Entry**: Tab Explorer
- **Goal**: Parcourir les 66 livres de la Bible
- **Exit**: Sélection livre ou recherche

### Layout
```
┌─────────────────────────┐
│  [🔍 Rechercher un livre] │
│                         │
│  ── Ancien Testament ── │
│  ┌───────────────────┐  │
│  │ 📖 Genèse     50  │  │
│  └───────────────────┘  │
│  ┌───────────────────┐  │
│  │ 📖 Exode      40  │  │
│  └───────────────────┘  │
│  ...                      │
│                         │
│  ── Nouveau Testament ──│
│  ┌───────────────────┐  │
│  │ 📖 Matthieu   28  │  │
│  └───────────────────┘  │
│  ...                      │
└─────────────────────────┘
│  [🏠]  [🔍]  [📊]  [⚙️]│
└─────────────────────────┘
```

### Composants
- `SearchBar`: Recherche par nom, abrégé, ou code
- `BookSectionHeader`: Groupe Ancien/Nouveau Testament
- `BookItem`: Carte avec nom + nombre de chapitres + indicator mémorisation

### Interactions
- Tap livre → Chapter List
- Recherche en temps réel → filtrage des livres
- Swipe horizontal → raccourci vers chapitre aléatoire

### États
- **Loading**: Skeleton screens
- **Filtered**: Résultats recherche
- **Has memorized**: Indicator visuel sur chapitres avec versets mémorisés

---

## Page 02: Chapter List Screen

### Contexte
- **Entry**: From Book List
- **Goal**: Sélectionner un chapitre
- **Exit**: Sélection chapitre ou verset aléatoire

### Layout
```
┌─────────────────────────┐
│  [← Genèse]             │
│                         │
│  "Chapitres"            │
│                         │
│  ┌───┐ ┌───┐ ┌───┐ ┌───┐│
│  │ 1 │ │ 2 │ │ 3 │ │ 4 ││
│  └───┘ └───┘ └───┘ └───┘│
│  ┌───┐ ┌───┐ ┌───┐ ┌───┐│
│  │ 5 │ │ 6 │ │ 7 │ │ 8 ││
│  └───┘ └───┘ └───┘ └───┘│
│  ... (50 chapitres)       │
│                         │
│  [🎲 Verset aléatoire]  │
└─────────────────────────┘
│  [🏠]  [🔍]  [📊]  [⚙️]│
└─────────────────────────┘
```

### Composants
- `HeaderBar`: Titre livre + retour
- `ChapterGrid`: Grille 5x10 des chapitres
- `ChapterTile`: Numéro + nombre de versets + indicator mémorisation
- `RandomVerseButton`: Bouton verset aléatoire

### Interactions
- Tap chapitre → Verse List
- Tap verset aléatoire → Verse Detail direct
- Long press chapitre → infos rapides

### États
- **Empty**: Chapitre sans versets (exception)
- **Partial**: Certains versets mémorisés
- **Complete**: Tous versets mémorisés

---

## Page 03: Verse List Screen

### Contexte
- **Entry**: From Chapter List
- **Goal**: Parcourir les versets d'un chapitre
- **Exit**: Sélection verset ou recherche

### Layout
```
┌─────────────────────────┐
│  [← Genèse 1]           │
│  [🔍 Verset 1-25...]    │
│                         │
│  ┌─────────────────────┐│
│  │ 1 Au commencement   ││
│  │   Dieu créa les     ││
│  │   cieux et la terre.││
│  │   [Nouveau]         ││
│  └─────────────────────┘│
│  ┌─────────────────────┐│
│  │ 2 Et la terre était ││
│  │   sans forme et       ││
│  │   vide...            ││
│  │   [Nouveau]         ││
│  └─────────────────────┘│
│  ... (50 versets)       │
│                         │
│  [🎲 Verset aléatoire]  │
└─────────────────────────┘
│  [🏠]  [🔍]  [📊]  [⚙️]│
└─────────────────────────┘
```

### Composants
- `HeaderBar`: Titre chapitre + retour
- `SearchBar`: Recherche par numéro (1-50)
- `VerseCard`: Verset avec texte + status chip
- `InfiniteScroll`: Chargement progressif

### Interactions
- Tap verset → Verse Detail
- Scroll vertical → charger plus de versets
- Recherche → filtrage versets

### États
- **Loading**: Skeleton screens
- **Empty**: Aucun verset (erreur)
- **Filtered**: Résultats recherche
- **Scroll**: Loading spinner bottom

---

## Page 04: Reference Search (Overlay)

### Contexte
- **Entry**: From any screen (search bar)
- **Goal**: Trouver un verset par référence rapide
- **Exit**: Navigation vers Verse Detail

### Layout
```
┌─────────────────────────┐
│  [✕]                    │
│                         │
│  🔍 Rechercher          │
│  ┌───────────────────┐  │
│  │ Jean 3:16         │  │
│  └───────────────────┘  │
│                         │
│  Suggestions:           │
│  • Jean 3:16           │
│  • Jean 3:17           │
│  • Jean 3:1            │
│                         │
│  Formats acceptés:      │
│  • "Jean 3:16"         │
│  • "Jn 3:16"           │
│  • "Genèse 1:1"        │
│  • "1 Co 13:4"         │
└─────────────────────────┘
```

### Composants
- `SearchOverlay`: Modal plein écran
- `SearchInput`: Input avec auto-focus
- `SuggestionList`: Suggestions en temps réel
- `FormatHint`: Aide sur les formats

### Interactions
- Tap suggestion → navigation Verse Detail
- Tap outside → fermer overlay
- Tap clear → reset search

### États
- **Focused**: Input actif, clavier visible
- **Searching**: Animation loading
- **Found**: Suggestion sélectionnée
- **Not found**: Message erreur

---

## Navigation Map

```
Home (tab Explorer)
    ↓
Book List (searchable)
    ↓ (tap book)
Chapter List (grid)
    ↓ (tap chapter)
Verse List (scrollable)
    ↓ (tap verse)
Verse Detail (actions)
    ↓
[Mémoriser] → Scenario 02
```

---

## Design Intent

- **Rapidité**: Navigation fluide 3 taps max
- **Clarté**: Hiérarchie visuelle forte
- **Performance**: Chargement progressif, pas de freeze
- **Recherche**: Flexible, tolérante aux formats
- **Offline**: Tout fonctionne sans connexion