# Scénario 05: Suivi de Progression

**Persona**: Étudiant en théologie (Secondaire)
**Objectif**: Visualiser sa progression de mémorisation
**Drive Force**: Want — Beauté expérience / Fear — Découragement

---

## Journey Overview

```
[Home]
    ↓ (tap tab Progression)
[Progress Dashboard]
    ↓ (scroll)
[Weekly Chart]
    ↓ (scroll)
[Verse Categories]
    ↓ (tap category)
[Detailed Verse List]
```

---

## Page 01: Progress Dashboard

### Contexte
- **Entry**: Tab Progression
- **Goal**: Afficher un aperçu global de la progression
- **Exit**: Scroll vers sections détaillées

### Layout
```
┌─────────────────────────┐
│  "Progression"          │
│                         │
│  ┌─────────┐ ┌─────────┐│
│  │   47    │ │   7     ││
│  │Verset   │ │Streak  ││
│  │mémor.   │ │ jours 🔥││
│  └─────────┘ └─────────┘│
│  ┌─────────┐ ┌─────────┐│
│  │  85%    │ │    3    ││
│  │Rétention│ │À réviser││
│  └─────────┘ └─────────┘│
│                         │
│  ── Cette semaine ──────│
│  [████████░░░░] 70%     │
│  Lun Mar Mer Jeu Ven Sam│
│                         │
│  ── Versets récents ────│
│  • Jean 3:16 • 2j       │
│  • Psaume 23:1 • 5j     │
│  • Romains 8:28 • 1j    │
│                         │
│  [Voir tout →]          │
└─────────────────────────┘
│  [🏠]  [🔍]  [📊]  [⚙️]│
└─────────────────────────┘
```

### Composants
- `StatGrid`: 4 stats clés (2x2 grid)
- `WeeklyChart`: Bar chart des sessions par jour
- `RecentVerses`: Liste des 5 derniers mémorisés
- `TrendIndicator`: Flèche hausse/baisse

### Interactions
- Tap stat card → detail modal
- Tap verset → Verse Detail
- Tap "Voir tout" → Detailed Verse List

### États
- **Loading**: Skeleton screens
- **Empty**: "Commencez à mémoriser!" avec CTA
- **First week**: Chart avec données limitées
- **Milestone**: Animation confetti (10, 50, 100 versets)

---

## Page 02: Weekly Chart Detail

### Contexte
- **Entry**: Tap sur Weekly Chart
- **Goal**: Voir les détails des sessions hebdomadaires
- **Exit**: Retour Dashboard

### Layout
```
┌─────────────────────────┐
│  [← Retour]             │
│                         │
│  "Semaine en cours"     │
│                         │
│  ┌─────────────────────┐│
│  │                     ││
│  │  Session  │  12 min ││
│  │  Session  │  8 min  ││
│  │  Session  │  15 min ││
│  │           │         ││
│  │  Session  │  10 min ││
│  │  Session  │  5 min  ││
│  │  Session  │  20 min ││
│  │                     ││
│  └─────────────────────┘│
│                         │
│  Total: 70 min          │
│  Moyenne: 10 min/jour   │
│                         │
└─────────────────────────┘
```

### Composants
- `BarChart`: Graphique vertical des durées
- `DayLabels`: Lun-Mar-Mer-Jeu-Ven-Sam-Dim
- `StatsFooter`: Total et moyenne

### Interactions
- Tap bar → day detail
- Swipe horizontal → changer de semaine

### États
- **No data**: "Aucune session cette semaine"
- **Partial**: Quelques jours seulement
- **Complete**: Semaine complète

---

## Page 03: Verse Categories

### Contexte
- **Entry**: Dashboard scroll ou tap categories
- **Goal**: Voir les versets groupés par statut
- **Exit**: Tap category → Detailed List

### Layout
```
┌─────────────────────────┐
│  [← Retour]             │
│                         │
│  "Catégories"           │
│                         │
│  ┌─────────────────────┐│
│  │ 🟢 Maîtrisés (23)   ││
│  │   >30 jours         ││
│  └─────────────────────┘│
│  ┌─────────────────────┐│
│  │ 🌸 En cours (15)    ││
│  │   <30 jours         ││
│  └─────────────────────┘│
│  ┌─────────────────────┐│
│  │ ⚪ Nouveaux (9)     ││
│  │   Jamais révisés    ││
│  └─────────────────────┘│
│  ┌─────────────────────┐│
│  │ ⚠️ À renforcer (4)  ││
│  │   <3 jours          ││
│  └─────────────────────┘│
│                         │
└─────────────────────────┘
```

### Composants
- `CategoryCard`: Groupe avec count + description
- `ColorCoding`: Vert/Rose/Gris/Rouge par statut

### Interactions
- Tap category → Detailed Verse List filtered

### États
- **Empty category**: Message "Aucun verset dans cette catégorie"

---

## Page 04: Detailed Verse List

### Contexte
- **Entry**: From Category tap
- **Goal**: Voir tous les versets d'une catégorie
- **Exit**: Tap verset → Verse Detail

### Layout
```
┌─────────────────────────┐
│  [← Maîtrisés]          │
│  23 versets             │
│                         │
│  ┌─────────────────────┐│
│  │ Jean 3:16           ││
│  │ Car Dieu a tant...  ││
│  │ 🟢 Maîtrisé • 45j   ││
│  └─────────────────────┘│
│  ┌─────────────────────┐│
│  │ Psaume 23:1         ││
│  │ L'Éternel est mon...││
│  │ 🟢 Maîtrisé • 32j   ││
│  └─────────────────────┘│
│  ... (23 versets)       │
│                         │
└─────────────────────────┘
```

### Composants
- `VerseList`: Liste scrollable
- `VerseCard`: Référence + texte + statut + days since review
- `FilterBar`: Tri par date, référence, statut

### Interactions
- Tap verset → Verse Detail
- Swipe → options (favorite, review now)
- Filter → tri personnalisé

### États
- **Loading**: Skeleton screens
- **Empty**: "Aucun verset dans cette catégorie"

---

## Navigation Map

```
Home (tab Progression)
    ↓
Dashboard
    ↓ (tap stat / scroll)
Weekly Chart | Categories | Recent
    ↓ (tap category)
Detailed Verse List
    ↓ (tap verse)
Verse Detail
```

---

## Design Intent

- **Motivation**: Chiffres positifs, streaks visibles
- **Clarté**: Catégories distinctes, couleurs sémantiques
- **Profondeur**: Drill-down depuis dashboard vers détails
- **Inspiration**: Milestones célébrés avec animations
- **Perspective**: Vue hebdo/mensuelle pour contexte