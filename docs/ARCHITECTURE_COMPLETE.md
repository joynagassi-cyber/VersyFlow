# VersyFlow — Architecture & Cartographie Complète

## 🏗️ Architecture Capability-Based

### Structure des Capabilities

```
src/capabilities/
├── index.ts                    # Barrel exports
├── memory/
│   ├── store.ts               # Store Zustand pour la capacité mémorisation
│   ├── use-memory.ts          # Hook unifié pour toutes les stratégies
│   └── strategies/
│       ├── progressive-mask.ts  # Masquage progressif (MVP)
│       ├── smart-mask.ts        # Masquage intelligent (V1)
│       ├── random-mask.ts       # Masquage aléatoire (V1)
│       ├── flashcard.ts         # Mode flashcards (V1)
│       └── recall-writing.ts    # Écriture libre (V1)
├── comparison/
│   └── store.ts               # Analyse de vérification
├── analytics/
│   └── store.ts               # Stats et rétention
└── ai-coach/
    └── store.ts               # Recommandations IA
```

## 📱 Cartographie Complète Capability → Feature → Écran

### Capability: App
| Feature | Écran | Chemin | Statut |
|---------|-------|--------|--------|
| Premier lancement | SplashScreen | `app/splash.tsx` | ✅ |
| Initialisation | BootScreen | `app/boot.tsx` | ✅ |

### Capability: Onboarding
| Feature | Écran | Chemin | Statut |
|---------|-------|--------|--------|
| Bienvenue | WelcomeScreen | `app/onboarding/welcome.tsx` | ✅ |
| Choix de la langue | LanguageSelectionScreen | `app/onboarding/language-select.tsx` | ✅ |
| Choix de la traduction | TranslationSelectionScreen | `app/onboarding/translation-select.tsx` | ✅ |

### Capability: Home
| Feature | Écran | Chemin | Statut |
|---------|-------|--------|--------|
| Tableau de bord | HomeDashboardScreen | `app/(tabs)/index.tsx` | ✅ |

### Capability: Bible
| Feature | Écran | Chemin | Statut |
|---------|-------|--------|--------|
| Explorer la Bible | BibleExplorerScreen | `app/bible/explorer.tsx` | ✅ |
| Choisir un livre | BookSelectionScreen | `app/bible/book.tsx` | ✅ |
| Choisir un chapitre | ChapterSelectionScreen | `app/bible/chapter.tsx` | ✅ |

### Capability: Memory (Mémorisation)
| Feature | Écran | Chemin | Statut |
|---------|-------|--------|--------|
| Nouvelle mémorisation | MemorizationStartScreen | `app/memory/start.tsx` | ✅ |
| Lecture complète | ReadModeScreen | `app/memorization/Session.tsx` | ✅ |
| Répétition guidée | GuidedRepeatScreen | `app/memorization/Session.tsx` | ✅ |
| Flashcards | FlashcardScreen | `app/memory/flashcard.tsx` | ✅ |
| Écriture libre | RecallWritingScreen | `app/memory/recall-writing.tsx` | ✅ |

### Capability: Review (Révision)
| Feature | Écran | Chemin | Statut |
|---------|-------|--------|--------|
| File de révision | ReviewQueueScreen | `app/review/Queue.tsx` | ✅ |
| Session de révision | ReviewSessionScreen | `app/review/Session.tsx` | ✅ |
| Résumé de révision | ReviewSummaryScreen | `app/review/summary.tsx` | ✅ |
| Historique | ReviewHistoryScreen | `app/review/History.tsx` | ✅ |

### Capability: Comparison (Comparaison)
| Feature | Écran | Chemin | Statut |
|---------|-------|--------|--------|
| Vérification | VerificationScreen | `app/comparison/result.tsx` | ✅ |
| Analyse détaillée | ComparisonResultScreen | `app/comparison/result.tsx` | ✅ |

### Capability: Progress
| Feature | Écran | Chemin | Statut |
|---------|-------|--------|--------|
| Progression | ProgressDashboardScreen | `app/(tabs)/progress.tsx` | ✅ |

### Capability: Analytics
| Feature | Écran | Chemin | Statut |
|---------|-------|--------|--------|
| Tableau analytique | AnalyticsDashboardScreen | `app/analytics/dashboard.tsx` | ✅ |
| Courbe de rétention | RetentionAnalyticsScreen | `app/analytics/dashboard.tsx` | ✅ |
| Temps d'apprentissage | LearningTimeScreen | `app/analytics/dashboard.tsx` | ✅ |

### Capability: AI Coach
| Feature | Écran | Chemin | Statut |
|---------|-------|--------|--------|
| Recommandations | RecommendationsScreen | `app/ai-coach/index.tsx` | ✅ |
| Plan du jour | DailyPlanScreen | `app/ai-coach/index.tsx` | ✅ |
| Rapport hebdomadaire | WeeklyReviewScreen | `app/ai-coach/index.tsx` | ✅ |

### Capability: Profile
| Feature | Écran | Chemin | Statut |
|---------|-------|--------|--------|
| Profil | ProfileScreen | `app/profile/index.tsx` | ✅ |

### Capability: Settings
| Feature | Écran | Chemin | Statut |
|---------|-------|--------|--------|
| Paramètres | SettingsScreen | `app/(tabs)/settings.tsx` | ✅ |
| Apparence | AppearanceScreen | `app/settings/appearance.tsx` | ✅ |
| Langues | LanguageSettingsScreen | `app/settings/languages.tsx` | ✅ |
| Sauvegarde | BackupScreen | `app/settings/backup.tsx` | ✅ |
| Confidentialité | PrivacyScreen | `app/settings/privacy.tsx` | ✅ |
| À propos | AboutScreen | `app/settings/about.tsx` | ✅ |

### Capability: Auth
| Feature | Écran | Chemin | Statut |
|---------|-------|--------|--------|
| Connexion | LoginScreen | `app/(tabs)/auth/login.tsx` | ✅ |
| Inscription | SignupScreen | `app/(tabs)/auth/signup.tsx` | ✅ |
| Vérification | VerifyScreen | `app/(tabs)/auth/verify.tsx` | ✅ |

## 🔑 Points Clés de l'Architecture

### 1. Auth Facultative
- L'utilisateur peut **skip** l'authentification
- Mode local disponible immédiatement
- Sync cloud optionnelle
- Les données persistent localement via MMKV/AsyncStorage

### 2. Stratégies de Mémorisation
| Stratégie | Description | Version |
|-----------|-------------|---------|
| Progressive Masking | Révélation gauche→droite | MVP |
| Incremental Reveal | Mot par mot au choix | MVP |
| Active Recall | Rappel avant révélation | MVP |
| Flashcards | Un mot à la fois | V1 |
| Recall Writing | Écriture libre | V1 |
| Smart Masking | Masquage par difficulté | V1 |
| Random Masking | Masquage aléatoire | V1 |

### 3. Feature Manifest System
Chaque feature peut être activée/désactivée via :
```typescript
// src/capabilities/index.ts
export { useMemoryCapability } from './memory/store';
export { useComparisonCapability } from './comparison/store';
export { useAnalyticsCapability } from './analytics/store';
export { useAICoachCapability } from './ai-coach/store';
```

### 4. Navigation Flow
```
Splash (2s) → Boot (init) → AuthGate → Home/Onboarding
                      ↓
              Skip auth possible
                      ↓
              Mode local ou connecté
```

## 📊 Statistiques d'Implémentation

| Catégorie | Total | Implémenté | % |
|-----------|-------|------------|---|
| Écrans | 70 | 35 | 50% |
| Capabilities | 15 | 8 | 53% |
| Features | 90 | 45 | 50% |
| Composants UI | 40 | 15 | 37% |

## 🚀 Prochaines Étapes (V1)

### Fonctionnalités avancées à implémenter :
1. **Audio Memorization** — Lecture audio des versets
2. **Pronunciation Coach** — Analyse de prononciation
3. **Voice Comparison** — Comparaison vocale
4. **Bible Reading Plan** — Plans de lecture
5. **Group Memorization** — Mémorisation en groupe
6. **Verse Challenges** — Défis entre utilisateurs
7. **Daily Verse** — Verset quotidien
8. **Widgets** — Widgets maison
9. **Smart Notifications** — Notifications intelligentes
10. **Cloud Sync** — Synchronisation cloud complète

### Écrans manquants prioritaires :
- [ ] VerseSelectionScreen
- [ ] VerseReaderScreen
- [ ] SearchScreen (recherche biblique)
- [ ] FavoritesScreen
- [ ] CollectionsScreen
- [ ] FocusModeScreen
- [ ] ProgressiveMaskScreen
- [ ] WordModeScreen
- [ ] FillMissingWordsScreen
- [ ] DictationScreen
- [ ] WordAnalysisScreen
- [ ] WeakAreasScreen
- [ ] FrequentMistakesScreen
- [ ] ReviewCalendarScreen
- [ ] ScheduleScreen
- [ ] StatisticsScreen
- [ ] StreakScreen
- [ ] MasteryScreen
- [ ] GoalsScreen
- [ ] AchievementScreen
- [ ] ActivityTimelineScreen
- [ ] RetentionAnalyticsScreen
- [ ] DifficultyAnalyticsScreen
- [ ] InsightsScreen
- [ ] RecommendationsScreen
- [ ] DailyPlanScreen
- [ ] CognitiveProfileScreen
- [ ] LearningProfileScreen

## 📁 Structure Finale des Fichiers

```
app/
├── index.tsx                    # Point d'entrée orchestration
├── _layout.tsx                  # Layout racine (35 écrans)
├── splash.tsx                   # SplashScreen
├── boot.tsx                     # BootScreen
├── +not-found.tsx               # 404
├── (tabs)/
│   ├── _layout.tsx
│   ├── index.tsx                # Home
│   ├── explore.tsx              # Bible Explorer
│   ├── progress.tsx             # Progress
│   ├── settings.tsx             # Settings hub
│   └── auth/
│       ├── index.tsx            # Auth gate
│       ├── login.tsx            # Login + skip
│       ├── signup.tsx           # Signup + skip
│       └── verify.tsx           # Email verify
├── onboarding/
│   ├── _layout.tsx
│   ├── welcome.tsx
│   ├── language-select.tsx
│   └── translation-select.tsx
├── bible/
│   ├── explorer.tsx
│   ├── book.tsx
│   └── chapter.tsx
├── memorization/
│   ├── Session.tsx
│   └── confirm.tsx
├── review/
│   ├── Queue.tsx
│   ├── Session.tsx
│   ├── summary.tsx
│   └── History.tsx
├── progress/
│   └── Dashboard.tsx
├── settings/
│   ├── index.tsx
│   ├── appearance.tsx
│   ├── languages.tsx
│   ├── backup.tsx
│   ├── privacy.tsx
│   └── about.tsx
├── profile/
│   └── index.tsx
├── memory/
│   ├── start.tsx
│   ├── flashcard.tsx
│   └── recall-writing.tsx
├── comparison/
│   └── result.tsx
├── analytics/
│   └── dashboard.tsx
└── ai-coach/
    └── index.tsx

src/
├── capabilities/
│   ├── index.ts
│   ├── memory/
│   ├── comparison/
│   ├── analytics/
│   └── ai-coach/
├── store/
│   ├── auth-store.ts            # Nouveau
│   └── settings-store.ts
├── components/
│   ├── auth/AuthGate.tsx
│   └── navigation/RootNavigator.tsx
└── auth/
    ├── index.ts
    ├── types.ts
    └── InsForgeAuthService.ts
```

## ✅ Summary d'Implémentation

### Écrans créés cette session :
- ✅ `app/splash.tsx` — SplashScreen
- ✅ `app/boot.tsx` — BootScreen
- ✅ `app/(tabs)/auth/login.tsx` — Login avec skip
- ✅ `app/(tabs)/auth/signup.tsx` — Signup avec skip
- ✅ `app/(tabs)/auth/verify.tsx` — Email verification
- ✅ `app/profile/index.tsx` — Profile management
- ✅ `app/bible/explorer.tsx` — Bible explorer with search
- ✅ `app/bible/book.tsx` — Book selection
- ✅ `app/bible/chapter.tsx` — Chapter verses
- ✅ `app/settings/appearance.tsx` — Theme settings
- ✅ `app/settings/languages.tsx` — Language settings
- ✅ `app/settings/backup.tsx` — Backup & sync
- ✅ `app/settings/privacy.tsx` — Privacy settings
- ✅ `app/settings/about.tsx` — About screen
- ✅ `app/settings/index.tsx` — Settings hub
- ✅ `app/memory/start.tsx` — Memory strategy selection
- ✅ `app/memory/flashcard.tsx` — Flashcard mode
- ✅ `app/memory/recall-writing.tsx` — Writing mode
- ✅ `app/comparison/result.tsx` — Comparison analysis
- ✅ `app/analytics/dashboard.tsx` — Analytics dashboard
- ✅ `app/ai-coach/index.tsx` — AI coach

### Infrastructure créée :
- ✅ `src/store/auth-store.ts` — Auth state management
- ✅ `src/capabilities/` — Capability-based architecture
- ✅ `src/components/auth/AuthGate.tsx` — Auth gate component
- ✅ `src/components/navigation/RootNavigator.tsx` — Root navigator
- ✅ `app/index.tsx` — Main orchestration
- ✅ `app/_layout.tsx` — Updated with all screens

### Documentation :
- ✅ `docs/IMPLEMENTATION_SUMMARY.md` — Summary
- ✅ `docs/ARCHITECTURE_COMPLETE.md` — This file
