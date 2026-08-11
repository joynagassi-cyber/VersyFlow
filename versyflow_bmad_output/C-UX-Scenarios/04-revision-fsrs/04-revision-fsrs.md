# Scénario 04: Révision FSRS

**Persona**: Marie (Principal)
**Objectif**: Réviser les versets au moment optimal prédit par FSRS
**Drive Force**: Want — Mémorisation durable / Fear — Découragement

---

## Journey Overview

```
[Home]
    ↓ (badge "X à réviser" ou tap Review)
[Review Queue Screen]
    ↓ (tap réviser ou auto-start)
[Review Session Screen]
    ↓ (each verse)
[Verse Review] → [Rating: Again/Hard/Good/Easy]
    ↓
[Session Complete] → [Stats Summary]
    ↓
[Home]
```

---

## Page 01: Review Queue Screen

### Contexte
- **Entry**: From Home (badge tap ou tab navigation)
- **Goal**: Afficher la file d'attente de révisions triée par urgence
- **Exit**: Start review ou skip

### Layout
```
┌─────────────────────────┐
│  [← Accueil]            │
│                         │
│  "3 versets à réviser"  │
│                         │
│  ── Aujourd'hui ─────── │
│  ┌─────────────────────┐│
│  │ 🕐 Jean 3:16        ││
│  │    En cours • 2j    ││
│  └─────────────────────┘│
│  ┌─────────────────────┐│
│  │ 🕐 Psaume 23:1      ││
│  │    En cours • 1j    ││
│  └─────────────────────┘│
│                         │
│  ── À venir ─────────── │
│  ┌─────────────────────┐│
│  │ 📅 Jean 1:1         ││
│  │    En cours • 3j    ││
│  └─────────────────────┘│
│                         │
│  [Commencer la révision]│
└─────────────────────────┘
│  [🏠]  [🔍]  [📊]  [⚙️]│
└─────────────────────────┘
```

### Composants
- `HeaderBar`: Titre + retour
- `QueueSection`: Groupes par urgence (Today/Upcoming)
- `ReviewItemCard`: Verset + statut + prochain rappel
- `StartButton`: CTA principal

### Interactions
- Tap item → directe au verset dans la session
- Tap "Commencer" → start session from top
- Swipe item → options (skip, reschedule)

### États
- **Empty**: "Tout est à jour! ✓" + stats session
- **Loading**: Skeleton screens
- **Overdue**: Badge rouge sur versets en retard
- **Scheduled**: Badge jaune sur versets du jour

---

## Page 02: Review Session Screen

### Contexte
- **Entry**: From Review Queue (start review)
- **Goal**: Réviser un verset avec auto-évaluation
- **Exit**: Next verse ou session complète

### Layout — Presentation
```
┌─────────────────────────┐
│  [✕ Quitter]  2/3       │
│                         │
│  Jean 3:16              │
│                         │
│  ┌─────────────────────┐│
│  │                     ││
│  │  Car [Dieu] [tant]  ││
│  │  [aimé] [le] [monde]││
│  │  qu'[il] [a] [donné]││
│  │  [son] [Fils]...    ││
│  │                     ││
│  └─────────────────────┘│
│                         │
│  ⏱️ 30s sans réponse    │
│                         │
│  [Auto-révélation...]   │
└─────────────────────────┘
```

### Layout — Rating (après révélation)
```
┌─────────────────────────┐
│  [✕ Quitter]  2/3       │
│                         │
│  Jean 3:16              │
│                         │
│  ┌─────────────────────┐│
│  │                     ││
│  │  Car Dieu a tant    ││
│  │  aimé le monde...   ││
│  │                     ││
│  └─────────────────────┘│
│                         │
│  Comment s'est passé?   │
│                         │
│  [😰 Encore] [😐 Dur] [🙂 Bon] [😎 Facile]│
│   Again      Hard      Good     Easy│
│                         │
│  Prochain: ~2 jours     │
└─────────────────────────┘
```

### Composants
- `HeaderBar`: Progression (2/3) + quitter
- `VerseDisplay`: Verset partiellement masqué
- `Timer`: 30s avant auto-révélation
- `RatingButtons`: Again/Hard/Good/Easy
- `NextInterval`: Prochain intervalle prédit

### Interactions
- Tap word → reveal word (comme mémorisation)
- Auto-révélation après 30s
- Tap rating → FSRS update + next verse
- Tap quitter → pause session, sauvegarder

### États
- **Presenting**: Verset partiellement caché
- **Auto-reveal**: 30s écoulés, verset révélé
- **Rating**: Boutons d'évaluation visibles
- **Transition**: Animation vers suivant

---

## Page 03: Session Complete Screen

### Contexte
- **Entry**: After last review verse
- **Goal**: Résumer la session et motiver
- **Exit**: Retour Home ou review future

### Layout
```
┌─────────────────────────┐
│                         │
│      🎉                 │
│                         │
│  Session terminée!      │
│                         │
│  ┌─────────────────┐    │
│  │ 3/3 corrects    │    │
│  │ 2 Hard, 1 Good  │    │
│  └─────────────────┘    │
│                         │
│  Streak: 7 jours 🔥     │
│                         │
│  Prochaines révisions:  │
│  5 versets demain       │
│                         │
│      [Terminer]         │
│                         │
└─────────────────────────┘
```

### Composants
- `CelebrationIcon`: Animation félicitations
- `SessionStats`: Cards with correct/hard/again counts
- `StreakDisplay`: Série actuelle avec flame
- `NextReviews`: Aperçu des prochaines révisions
- `FinishButton`: Retour Home

### Interactions
- Tap "Terminer" → navigation Home + stats update
- Tap stats → details modale

### États
- **Complete**: Stats affichées
- **Zero reviews**: "Aucune révision aujourd'hui"
- **Streak milestone**: Confetti animation (7, 30, 100 jours)

---

## Page 04: Empty State (No Reviews)

### Contexte
- **Entry**: When no reviews scheduled
- **Goal**: Motiver à mémoriser de nouveaux versets
- **Exit**: Navigation vers Explorer ou Home

### Layout
```
┌─────────────────────────┐
│                         │
│      ✓                  │
│                         │
│  Tout est à jour!       │
│                         │
│  Aucune révision        │
│  prévue aujourd'hui.    │
│                         │
│  Mémorisez de nouveaux  │
│  versets pour continuer │
│  votre progression.     │
│                         │
│    [Explorer la Bible]  │
│                         │
└─────────────────────────┘
```

### Composants
- `EmptyStateIcon`: Checkmark ou celebration
- `EmptyMessage`: Message motivant
- `CTAButton`: Navigation Explorer

### Interactions
- Tap CTA → navigation Explorer

---

## Navigation Map

```
Home (badge)
    ↓
Review Queue
    ↓ (tap start)
Review Session (per verse)
    ↓ (rate)
Next verse or Session Complete
    ↓
Home
```

---

## Design Intent

- **Urgence claire**: Groupement par priorité (Today/Upcoming)
- **Rapidité**: Rating en 1 tap, pas de friction
- **Feedback immédiat**: FSRS recalculé après chaque réponse
- **Motivation**: Stats positives, streak visible
- **Flexibilité**: Pause/reprendre sans perdre progression