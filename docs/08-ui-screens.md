# VersyFlow — Écrans UI Détaillés

## Document généré par Agent D — UI / Design System

---

## 1. Écran: Bienvenue (WelcomeScreen)

**Parcours**: Onboarding — Premier lancement
**Navigation**: Écran racine (full screen entry modal)

### Structure hiérarchique
```
WelcomeScreen (safeArea, centered content, scrollable)
├── LogoContainer (center, scale animation entrance)
│   ├── VersyFlowLogoSVG (rose gradient)
│   └── TaglineText ("Mémorisation biblique intuitive") — subtle fade-in
├── FeaturePreviews (swipeable carousel, 3 slides)
│   ├── Slide1: "Choisissez votre traduction" + illustration
│   ├── Slide2: "Mémorisez avec FSRS" + illustration
│   └── Slide3: "Suivez votre progression" + illustration
└── ActionRow (bottom aligned, sticky)
    ├── SkipButton (ghost, small text link style) — optionnel
    └── StartButton (primary, rose full-width pill)
```

### Interactions
- Swipe carousel slides (horizontal)
- Tap Skip (optional, goes directly to Home with onboarding incomplete flag)
- Tap Start → LanguagePickerScreen

### État
- `hasCompletedOnboarding`: boolean (persisted in MMKV)
- `currentSlideIndex`: number
- `isLoadingBibleData`: boolean (first-time LSG download)

---

## 2. Écran: Choix Langue (LanguagePickerScreen)

**Parcours**: Onboarding — Étape 1
**Navigation**: Welcome → LanguagePicker → TranslationPicker

### Structure
```
LanguagePickerScreen (scrollable list in grid)
├── HeaderBar
│   ├── BackButton (optionnel sur onboarding)
│   └── TitleText "Langue de l'interface"
├── RegionGroup (repeat for each region)
│   ├── RegionLabel "Européen" (sticky section header)
│   └── LanguageGrid (2 columns on mobile)
│       └── LanguageCard xN (repeat)
│           ├── FlagEmoji or LanguageIcon
│           ├── LanguageNameNative ("Français", "English"...  )
│           ├── LanguageNameFrench ("French", "Anglais"... )
│           └── SelectionIndicator (checkmark circle — rose filled)
├── RTLWarningBanner (appears when Arabic selected)
│   └── "L'interface passera en lecture droite-gauche" + icon
└── BottomActionBar (sticky)
    └── ContinueButton (disabled until selection made)
```

### Données
```typescript
interface Language {
  code: string; // ISO 639-1: 'fr', 'en', 'ar', 'de', 'zh'
  name: string; // Native language name
  displayName: string; // French display name
  rtl: boolean;
}
const SUPPORTED_LANGUAGES: Language[] = [...]
```

### Sélection courante: string (lang code)
### Persistance: `settings.language`

---

## 3. Écran: Choix Traduction (TranslationPickerScreen)

**Parcours**: Onboarding — Étape 2
**Navigation**: LanguagePicker → TranslationPicker → Home

### Structure
```
TranslationPickerScreen (scrollable list)
├── HeaderBar
│   └── TitleText "Traduction biblique"
├── DefaultBadge (appears next to LSG)
│   └── "Traduction par défaut" (small pink pill)
├── TranslationCard (repeat per translation)
│   ├── TranslationName ("Louis Segond 1910", "King James Version"...)
│   ├── YearRange ("1950 • Moderne", "1611 • Classique"... )
│   ├── DescriptionText (2 lignes max)
│   ├── SampleVersePreview (mini snippet Jean 3:16 in that translation)
│   └── SelectionRadio (circle checkmark — selected state filled rose)
└── BottomActionBar
    └── ContinueButton (disabled until selection made)
```

### État
- `translationsAvailable`: array of available translations
- `selectedTranslation`: string (translation ID)
- `loadingState`: 'idle' | 'downloading' | 'ready' (premier lancement LSG)

---

## 4. Écran: Accueil (HomeScreen)

**Parcours**: Écran principal après onboarding
**Navigation**: Tab navigator — selectedIndex = 0

### Structure
```
HomeScreen (pull-to-refresh enabled scroll view)
├── HeaderGreeting
│   ├── HelloText("Bonjour, Marie 👋")
│   └── DateText("Mardi 24 juillet")
├── ReviewReminderCard (appears if reviews due — rose gradient bg)
│   ├── IconClock
│   ├── Text("X versets à réviser aujourd'hui")
│   └── LaunchReviewButton (white pill, full-width)
├── StreakBadge (prominent, always visible — white card with shadow)
│   ├── FlameIcon (animated — subtle flicker)
│   └── CountText("7 jours de suite!")
├── QuickActions (2-column grid)
│   ├── QuickCard "Explorer la Bible" → navigate Explorer
│   └── QuickCard "Verset du jour" → show daily verse modal
├── RecentVerses (horizontal scroll list)
│   └── MiniVerseCard x3-5
└── UpcomingReviewsSection
    └── VerseReviewCard x2-3
```

### États conditionnels
- `hasReviewsDue: boolean` → show/hide ReviewReminderCard
- `streakCount: number` → update badge dynamically
- `hasContent: boolean` → show empty state illustration if no verses yet

---

## 5. Écran: Explorateur Bible (BibleExplorerScreen)

**Parcours**: Sélection de verset
**Navigation**: Home → Explorer (pushed screen)

### État 1: Vue Liste des Livres (root)
```
BibleExplorerScreen
├── HeaderBar("Explorer la Bible")
├── SearchBar(ReferenceSearchInput — "Jean 3:16", "Genèse 1:1")
├── TabSegmented("Ordre" | "Alphabet")
├── OldTestamentGroup (sticky header "Ancien Testament")
│   └── BookItem (repeat 39x)
│       ├── BookName ("Genèse", "Exode"...)
│       └── ChapterCount ("50 chapitres")
└── NewTestamentGroup (sticky header "Nouveau Testament")
    └── BookItem (repeat 27x)
```

### État 2: Vue Liste des Chapitres (pushed over État 1)
```
[Book Header with BackButton]
├── BackButton + BookName ("Jean")
└── ChapterGrid (7 columns x max chapters)
    └── ChapterTile (tap target)
        ├── ChapterNumber (large bold)
        └── VerseCount ("21 versets") — secondary gray text
```

### État 3: Vue Liste des Versets (pushed over État 2)
```
[Chapter Header with BackButton]
├── BackButton + ChapterRef("Jean 3")
├── ChapterTitle("Chapitre 3")
└── VerseCard (repeat for each verse in chapter)
    ├── VerseNumber (large, pink accent color)
    ├── VerseText (word-wrap, line-height relaxed 1.7)
    ├── MemorizationStatusChip (New/In Progress/Mastered — colored pill)
    └── ActionRow("Mémoriser" primary | "Favoris" secondary)
```

---

## 6. Écran: Session Mémorisation (MemorizationSessionScreen)

**Parcours**: Cœur du produit — mémorisation active
**Navigation**: BibleExplorer → MemorizationSession (full screen overlay, centered)

### Structure
```
MemorizationSessionScreen (focused mode, safe area)
├── SessionHeader (minimal, fades out after 5s)
│   ├── CloseButton (dismiss session, keep progress)
│   ├── ReferenceText("Jean 3:16") — large serif font
│   └── TimerDisplay (counting up, appears after 10s)
├── WordRevealArea (center screen, large text, flex-grow)
│   ├── HiddenWordsRow (gray boxes, word placeholders ~40px tall)
│   └── RevealedWordRow (full text, word by word tap reveal)
├── ProgressIndicator
│   └── Dots or Bar (words revealed X/Y)
├── ControlButtons (appear after all words revealed or during)
│   ├── NeedMoreTimeButton (secondary, shows verse again)
│   └── IMemorizedButton (primary, full-width pill, rose)
└── SessionFooter (small, bottom)
    └── "FSRS va calculer votre prochain rappel optimal"
```

### Animations
- **Word reveal**: staggered fade-in + slide-up (each word 50ms delay, 200ms duration)
- **Need more time**: verse smoothly scrolls to top and displays full text
- **Memorized**: checkmark animation → transition to confirmation

### États internes
- `phase`: 'preview' | 'reveal' | 'validate' | 'confirming'
- `revealedWords`: Set<number>
- `timer`: number (seconds elapsed)

---

## 7. Écran: Confirmation Mémorisation (MemorizationConfirmScreen)

**Parcours**: Fin de session mémorisation
**Navigation**: MemorizationSession → Confirm (pushed)

### Structure
```
MemorizationConfirmScreen (centered card layout, minimal padding)
├── SuccessIcon (animated checkmark circle, rose, scale bounce entrance)
├── TitleText("Verset mémorisé! ✨")
├── ReferenceText("Jean 3:16") — serif font
├── FSRSResultCard (white card, shadow-md)
│   ├── NewInterval ("Prochain rappel: dans 3 jours")
│   ├── StabilityScore ("Stabilité estimée: 85%")
│   └── DifficultyEstimate ("Difficulté: moyenne")
└── ActionRow
    ├── DoneButton (secondary, retour Accueil)
    └── AddAnotherButton (primary, nouveau verset → back to Explorer)
```

---

## 8. Écran: File de Révision (ReviewQueueScreen)

**Parcours**: Révision FSRS
**Navigation**: Home → Reviews (pushed from tab or home card)

### Structure
```
ReviewQueueScreen (scrollable list)
├── HeaderBar("Révisions du jour")
├── SummaryStrip (horizontal pills row)
│   ├── TotalDue ("12 à réviser") — rose background
│   ├── Overdue ("3 en retard") — orange background
│   └── EstimatedTime ("~15 min") — neutral background
├── ReviewCategorySection("En Retard") (only if overdue exists)
│   └── ReviewItemCard xN (red left border accent)
├── ReviewCategorySection("À l'heure")
│   └── ReviewItemCard xN (pink left border accent)
└── StartReviewButton (primary, fixed bottom, full-width pill)
```

---

## 9. Écran: Session de Révision (ReviewSessionScreen)

**Parcours**: Active review — révision de plusieurs versets
**Navigation**: ReviewQueue → ReviewSession (full screen overlay)

### Structure
```
ReviewSessionScreen (focused full-screen mode)
├── SessionProgressBar (top of screen, thin rose bar)
│   └── "3 / 12"
├── ReviewCardArea (center, large, flex-grow)
│   ├── ReferenceLabel("Jean 3:16") — serif font, medium size
│   ├── PartialVerseDisplay (some words shown, some as gray placeholders)
│   └── TapToRevealZone (full card tappable — reveals whole verse)
├── ResponseButtons (appear after tap reveals verse, stacked vertically)
│   ├── "J'ai recallé" (green, large primary)
│   ├── "Presque" (yellow/amber, secondary)
│   └── "J'ai oublié" (red, tertiary)
└── FSRSFeedback (after response, dismisses after 2s)
    └── "Prochain rappel: dans 4 jours ← nouvelle estimation"
```

---

## 10. Écran: Dashboard Progression (ProgressDashboardScreen)

**Parcours**: Suivi de progression
**Navigation**: Tab navigator — selectedIndex = 2

### Structure
```
ProgressDashboardScreen (scrollable dashboard)
├── Header("Votre Progression")
├── StatsGrid (2x2 grid)
│   ├── StatCard("Versets Mémorisés") value: 47 icon: book
│   ├── StatCard("Streak") value: "14j" icon: flame
│   ├── StatCard("Rétention") value: "89%" icon: target
│   └── StatCard("À Réviser") value: "8" icon: clock
├── WeeklyChartSection
│   ├── SectionTitle("Cette semaine")
│   └── BarChart horizontal bars showing daily sessions
├── VersesByStatusSection
│   ├── MasteredList (tappable → navigate to memorized verse detail)
│   ├── InProgressList
│   └── DueForReviewList
└── AchievementsSection (future, currently hidden/empty state)
```

---

## 11. Écran: Paramètres (SettingsScreen)

**Parcours**: Configuration
**Navigation**: Tab navigator — selectedIndex = 3

### Structure
```
SettingsScreen (grouped list view, iOS-style grouped tables)
├── Header("Paramètres")
├── SettingGroup("Préférences")
│   ├── SettingRow("Langue de l'interface") → value + chevron → navigate LanguagePicker
│   └── SettingRow("Traduction biblique") → value + chevron → navigate TranslationPicker
├── SettingGroup("Apparence")
│   └── SettingRow("Thème") → "Clair" + chevron → (future)
├── SettingGroup("Données")
│   ├── SettingRow("Stockage utilisé") → "12.4 MB"
│   └── SettingRow("Exporter mes données") → action sheet
├── SettingGroup("À propos")
│   ├── SettingRow("Version") → "0.1.0"
│   └── SettingRow("Documentation") → opens browser
└── SettingGroupDangerous
    └── SettingRowDestructive("Réinitialiser toute la progression") → confirm modal
```

---

*Document approuvé. Transmis à l'Agent E (Architecture) pour spécification technique.*
