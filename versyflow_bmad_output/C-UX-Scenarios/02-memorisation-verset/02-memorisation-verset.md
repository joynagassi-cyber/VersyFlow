# Scénario 02: Mémorisation d'un Verset

**Persona**: Marie (Principal)
**Objectif**: Mémoriser activement un verset en moins de 3 minutes
**Drive Force**: Want — Mémorisation durable / Fear — Découragement

---

## Journey Overview

```
[Home]
    ↓ (tap "Mémoriser" ou tab Explorer)
[Explorer Tab]
    ↓
[Book List Screen] → [Chapter List Screen] → [Verse List Screen]
    ↓ (tap un verset)
[Verse Detail Screen]
    ↓ (tap "Mémoriser ce verset")
[Memorization Preview] (10s)
    ↓
[Memorization Session] (mot par mot)
    ↓ (validation)
[Confirmation Screen]
    ↓
[Home]
```

---

## Page 01: Book List Screen

### Contexte
- **Entry**: From Home (tab Explorer ou action rapide)
- **Goal**: Permettre à l'utilisateur de sélectionner un livre biblique
- **Exit**: Tap sur un livre → Chapter List

### Layout
```
┌─────────────────────────┐
│  [🔍 Recherche]         │
│  [Ancien Testament]     │
│  ┌─────────────────┐    │
│  │ 📖 Genèse  (50) │    │
│  └─────────────────┘    │
│  ┌─────────────────┐    │
│  │ 📖 Exode  (40)  │    │
│  └─────────────────┘    │
│  ... (39 livres)        │
│  [Nouveau Testament]    │
│  ┌─────────────────┐    │
│  │ 📖 Matthieu (28)│    │
│  └─────────────────┘    │
│  ... (27 livres)        │
└─────────────────────────┘
│  [🏠]  [🔍]  [📊]  [⚙️]│
└─────────────────────────┘
```

### Composants
- `SearchBar`: Recherche par nom de livre ou abrégé
- `BookSection`: Groupes Ancien/Nouveau Testament
- `BookItem`: Carte avec nom + nombre de chapitres

### Interactions
- Tap sur un livre → navigation vers Chapter List
- Tap sur Recherche → focus input + recherche en temps réel

### États
- **Loading**: Skeleton screens pendant chargement
- **Empty**: Aucun résultat trouvé
- **Filtered**: Résultats de recherche affichés

---

## Page 02: Chapter List Screen

### Contexte
- **Entry**: From Book List (tap sur un livre)
- **Goal**: Permettre à l'utilisateur de sélectionner un chapitre
- **Exit**: Tap sur un chapitre → Verse List

### Layout
```
┌─────────────────────────┐
│  [← Jean]               │
│                         │
│  "Chapitres"            │
│                         │
│  ┌───┐ ┌───┐ ┌───┐     │
│  │ 1 │ │ 2 │ │ 3 │ ... │
│  └───┘ └───┘ └───┘     │
│  ┌───┐ ┌───┐ ┌───┐     │
│  │ 4 │ │ 5 │ │ 6 │ ... │
│  └───┘ └───┘ └───┘     │
│  ... (21 chapitres)     │
│                         │
│  [Verset aléatoire]     │
└─────────────────────────┘
│  [🏠]  [🔍]  [📊]  [⚙️]│
└─────────────────────────┘
```

### Composants
- `HeaderBar`: Titre du livre + bouton retour
- `ChapterGrid`: Grille de chapitres avec nombre de versets
- `RandomVerseButton`: Bouton pour verset aléatoire

### Interactions
- Tap sur un chapitre → navigation vers Verse List
- Tap "Verset aléatoire" → sélection aléatoire + navigation directe

### États
- **With memorized**: Chapitres avec versets mémorisés ont indicator visuel
- **Empty**: Aucun chapitre (cas rare)

---

## Page 03: Verse List Screen

### Contexte
- **Entry**: From Chapter List (tap sur un chapitre)
- **Goal**: Permettre à l'utilisateur de sélectionner un verset spécifique
- **Exit**: Tap sur un verset → Verse Detail

### Layout
```
┌─────────────────────────┐
│  [← Jean 3]             │
│  [🔍 Rechercher...]     │
│                         │
│  ┌─────────────────────┐│
│  │ 1 Au commencement   ││
│  │    était la Parole,  ││
│  │    et la Parole était││
│  │    auprès de Dieu... ││
│  │    [Nouveau]         ││
│  └─────────────────────┘│
│  ┌─────────────────────┐│
│  │ 16 Car Dieu a tant  ││
│  │    aimé le monde...  ││
│  │    [En cours]        ││
│  └─────────────────────┘│
│  ... (36 versets)       │
│                         │
│  [Verset aléatoire]     │
└─────────────────────────┘
│  [🏠]  [🔍]  [📊]  [⚙️]│
└─────────────────────────┘
```

### Composants
- `HeaderBar`: Titre du chapitre + bouton retour
- `SearchBar`: Recherche par numéro de verset
- `VerseCard`: Carte verset avec texte (max 3 lignes) + status chip
- `StatusChip`: Nouveau (gris), En cours (rose), Maîtrisé (vert)

### Interactions
- Tap sur un verset → navigation vers Verse Detail
- Scroll infini pour charger plus de versets
- Tap "Verset aléatoire" → sélection aléatoire

### États
- **Loading**: Skeleton screens
- **Empty**: Aucun verset trouvé (erreur rare)
- **Filtered**: Résultats de recherche affichés

---

## Page 04: Verse Detail Screen

### Contexte
- **Entry**: From Verse List (tap sur un verset)
- **Goal**: Présenter le verset complet et offrir les actions de mémorisation
- **Exit**: Tap "Mémoriser" → Memorization Preview

### Layout
```
┌─────────────────────────┐
│  [← Retour]             │
│                         │
│  Jean 3:16              │
│  LSG                    │
│                         │
│  ┌─────────────────────┐│
│  │                     ││
│  │  "Car Dieu a tant  ││
│  │   aimé le monde,    ││
│  │   qu'il a donné son ││
│  │   Fils unique, afin ││
│  │   que quiconque croit││
│  │   en lui ne périsse  ││
│  │   point, mais qu'il  ││
│  │   ait la vie éternelle"││
│  │                     ││
│  └─────────────────────┘│
│                         │
│  [📖 Mémoriser]         │
│  [❤️ Favori]            │
│  [📋 Copier]            │
│                         │
│  Statut: En cours       │
│  Prochain rappel: 2 jours│
└─────────────────────────┘
│  [🏠]  [🔍]  [📊]  [⚙️]│
└─────────────────────────┘
```

### Composants
- `HeaderBar`: Titre + bouton retour
- `VerseDisplay`: Texte complet du verset en grand
- `ActionButtons`: Mémoriser, Favori, Copier
- `StatusInfo`: Statut + prochain intervalle

### Interactions
- Tap "Mémoriser" → navigation vers Memorization Preview
- Tap "Favori" → toggle favorite (haptic feedback)
- Tap "Copier" → copie presse-papier + toast confirmation

### États
- **New**: Badge "Nouveau" + bouton "Mémoriser" actif
- **InProgress**: Badge "En cours" + bouton "Continuer"
- **Mastered**: Badge "Maîtrisé" + bouton "Réviser"
- **Favorite**: Cœur rempli

---

## Page 05: Memorization Session

### Contexte
- **Entry**: From Verse Detail (tap "Mémoriser")
- **Goal**: Mémoriser activement le verset mot par mot
- **Exit**: Validation → Confirmation Screen

### Layout — Phase 1: Preview (10s)
```
┌─────────────────────────┐
│  [✕ Quitter]            │
│                         │
│  Aperçu du verset       │
│  (10 secondes)          │
│                         │
│  ┌─────────────────────┐│
│  │                     ││
│  │  Car Dieu a tant    ││
│  │  aimé le monde,     ││
│  │  qu'il a donné son  ││
│  │  Fils unique...     ││
│  │                     ││
│  └─────────────────────┘│
│                         │
│  ████████░░░░  70%      │
│                         │
└─────────────────────────┘
```

### Layout — Phase 2: Progressive Mask
```
┌─────────────────────────┐
│  [✕ Quitter]            │
│                         │
│  Mémorisation           │
│  (tap pour révéler)     │
│                         │
│  ┌─────────────────────┐│
│  │ [Car] [Dieu] [tant] ││
│  │ [aimé] [le] [monde] ││
│  │ [qu'] [il] [a] [donné]││
│  │ [son] [Fils] [unique]││
│  │ ...                 ││
│  └─────────────────────┘│
│                         │
│  8/12 mots révélés      │
│  ⏱️ 00:45               │
│                         │
│  [J'ai mémorisé]        │
│  [Besoin de plus de temps]│
└─────────────────────────┘
```

### Composants
- `HeaderBar`: Bouton quitter
- `VersePreview`: Texte complet pendant preview
- `WordChips`: Grille de mots interactifs (hidden/revealed)
- `ProgressIndicator`: Barre de progression + compteur
- `Timer`: Compte à rebours
- `ValidationButtons`: "J'ai mémorisé" / "Besoin de plus de temps"

### Interactions
- **Preview**: Compte à rebours 10s auto → transition mask
- **Mask**: Tap sur placeholder → reveal word + animation pulse
- **Validation**: Tap "J'ai mémorisé" → FSRS note + transition confirmation

### États
- **Preview**: Texte complet visible, timer actif
- **Masking**: Mots deviennent placeholders gris
- **Revealing**: Animation pulse sur tap
- **Paused**: Session pause, progression sauvegardée
- **Completed**: FSRS calculé, transition confirmation

---

## Page 06: Confirmation Screen

### Contexte
- **Entry**: From Memorization Session (validation)
- **Goal**: Confirmer la mémorisation et montrer le prochain intervalle
- **Exit**: Tap "Continuer" → Home

### Layout
```
┌─────────────────────────┐
│                         │
│      ✓                  │
│                         │
│  Verset mémorisé!       │
│                         │
│  Jean 3:16              │
│  LSG                    │
│                         │
│  Prochain rappel:       │
│  dans 2 jours           │
│                         │
│  ┌─────────────────┐    │
│  │ 📊 Voir stats   │    │
│  └─────────────────┘    │
│                         │
│      [Continuer]        │
│                         │
└─────────────────────────┘
```

### Composants
- `SuccessIcon`: Checkmark animé
- `VerseSummary`: Référence + traduction
- `NextReviewInfo`: Prochain intervalle prédit
- `ActionButtons`: Stats + Continuer

### Interactions
- Tap "Continuer" → navigation vers Home
- Tap "Voir stats" → navigation vers Progression

### États
- **Success**: Animation checkmark + confirmation
- **Fallback**: Si FSRS échoue, message "Mémorisation enregistrée"

---

## Navigation Map

```
Book List → Chapter List → Verse List → Verse Detail
                                              ↓
                                        Memorization
                                              ↓
                                        Preview (10s)
                                              ↓
                                        Session
                                              ↓
                                        Confirmation
                                              ↓
                                            Home
```

---

## Design Intent

- **Focus**: Pas de distractions pendant la session
- **Progression**: Visuelle claire de l'avancement
- **Flexibilité**: Pause/reprendre sans perdre progression
- **Feedback**: Animations et haptiques à chaque interaction
- **FSRS**: Calcul immédiat après validation