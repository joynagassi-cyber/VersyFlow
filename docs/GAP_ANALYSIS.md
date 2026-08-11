# VersyFlow — Gap Analysis: Documentation vs Cartographie Complète

**Date**: 2026-08-03
**Source**: `versyflow_bmad_output/C-UX-Scenarios/`
**Cartographie référence**: Prompt utilisateur

---

## 📊 Résumé Exécutif

| Métrique | Documentation BMAD | Cartographie Complète | Gap |
|----------|-------------------|----------------------|-----|
| **Écrans documentés** | 48 | 70 | **22 manquants** |
| **Scénarios UX** | 8 | 12 | **4 manquants** |
| **Capabilities couvertes** | 6/15 | 15 | **9 non documentées** |
| **Pages de specs** | 48 | 70 | **22 à créer** |

---

## ✅ ÉCRANS DÉJÀ DOCUMENTÉS (BMAD)

### 00 — App & Auth (4 écrans)
| # | Screen | Fichier | Statut |
|---|--------|---------|--------|
| 1 | SplashScreen | `00.1-splash-screen.md` | ✅ |
| 2 | BootScreen | `00.2-boot-screen.md` | ✅ |
| 3 | LoginScreen | `00.1-login-screen.md` | ✅ |
| 4 | SignupScreen | `00.2-signup-screen.md` | ✅ |

### 01 — Onboarding Complet (9 écrans)
| # | Screen | Fichier | Statut |
|---|--------|---------|--------|
| 5 | WelcomeScreen | `01.1-welcome-screen.md` | ✅ |
| 6 | LanguagePicker | `01.2-language-picker.md` | ✅ |
| 7 | TranslationPicker | `01.3-translation-picker.md` | ✅ |
| 8 | HomeDashboard | `01.4-home-screen.md` | ✅ |
| 9 | HomeDashboard (enhanced) | `01.4-home-screen-enhanced.md` | ✅ |
| 10 | DailyVerseModal | `01.5-daily-verse-modal.md` | ✅ |
| 11 | RTLWarningBanner | `01.6-rtl-warning-banner.md` | ✅ |
| 12 | FSRSIntroduction | `01.7-fsrs-introduction.md` | ✅ |

### 02 — Mémorisation Verset (16 écrans)
| # | Screen | Fichier | Statut |
|---|--------|---------|--------|
| 13 | BookList | `02.1-book-list.md` | ✅ |
| 14 | ChapterList | `02.2-chapter-list.md` | ✅ |
| 15 | VerseList | `02.3-verse-list.md` | ✅ |
| 16 | VerseDetail | `02.4-verse-detail.md` | ✅ |
| 17 | VerseDetail (enhanced) | `02.4-verse-detail-enhanced.md` | ✅ |
| 18 | MemorizationSession | `02.5-memorization-session.md` | ✅ |
| 19 | MemorizationSession (enhanced) | `02.5-memorization-session-enhanced.md` | ✅ |
| 20 | Confirmation | `02.6-confirmation.md` | ✅ |
| 21 | Confirmation (enhanced) | `02.6-confirmation-enhanced.md` | ✅ |
| 22 | ReadMode | `02.7-read-mode.md` | ✅ |
| 23 | Flashcard | `02.8-flashcard.md` | ✅ |
| 24 | FocusMode | `02.9-focus-mode.md` | ✅ |
| 25 | SmartMask | `02.10-smart-mask.md` | ✅ |
| 26 | FillMissing | `02.11-fill-missing.md` | ✅ |
| 27 | Verification | `02.12-verification.md` | ✅ |
| 28 | ComparisonResult | `02.13-comparison-result.md` | ✅ |

### 03 — Navigation Biblique (6 écrans)
| # | Screen | Fichier | Statut |
|---|--------|---------|--------|
| 29 | BibleExplorer | `03.1-bible-explorer.md` | ✅ |
| 30 | ChapterList (enhanced) | `03.2-chapter-list-enhanced.md` | ✅ |
| 31 | VerseList (enhanced) | `03.3-verse-list-enhanced.md` | ✅ |
| 32 | ReferenceSearch | `03.4-reference-search.md` | ✅ |
| 33 | HistoryScreen | `03.5-history-screen.md` | ✅ |
| 34 | FavoritesScreen | `03.6-favorites-screen.md` | ✅ |

### 04 — Révision FSRS (7 écrans)
| # | Screen | Fichier | Statut |
|---|--------|---------|--------|
| 35 | ReviewQueue | `04.1-review-queue.md` | ✅ |
| 36 | ReviewQueue (enhanced) | `04.1-review-queue-enhanced.md` | ✅ |
| 37 | ReviewSession | `04.2-review-session.md` | ✅ |
| 38 | ReviewSession (enhanced) | `04.2-review-session-enhanced.md` | ✅ |
| 39 | SessionComplete | `04.3-session-complete.md` | ✅ |
| 40 | EmptyState | `04.4-empty-state.md` | ✅ |
| 41 | ReviewSummary | `04.5-review-summary.md` | ✅ |

### 05 — Suivi Progression (7 écrans)
| # | Screen | Fichier | Statut |
|---|--------|---------|--------|
| 42 | Dashboard | `05.1-dashboard.md` | ✅ |
| 43 | Dashboard (enhanced) | `05.1-dashboard-enhanced.md` | ✅ |
| 44 | WeeklyChart | `05.2-weekly-chart.md` | ✅ |
| 45 | Categories | `05.3-categories.md` | ✅ |
| 46 | DetailedList | `05.4-detailed-list.md` | ✅ |
| 47 | Statistics | `05.5-statistics.md` | ✅ |
| 48 | StreakScreen | `05.6-streak-screen.md` | ✅ |
| 49 | GoalsScreen | `05.7-goals-screen.md` | ✅ |

### 06 — Paramètres (6 écrans)
| # | Screen | Fichier | Statut |
|---|--------|---------|--------|
| 50 | Settings | `06.1-settings.md` | ✅ |
| 51 | Settings (enhanced) | `06.1-settings-enhanced.md` | ✅ |
| 52 | ResetModal | `06.2-reset-modal.md` | ✅ |
| 53 | StorageInfo | `06.3-storage-info.md` | ✅ |
| 54 | AboutScreen | `06.4-about-screen.md` | ✅ |
| 55 | ProfileScreen | `06.5-profile-screen.md` | ✅ |
| 56 | HelpCenter | `06.6-help-center.md` | ✅ |

### 08 — AI Coach (1 écran)
| # | Screen | Fichier | Statut |
|---|--------|---------|--------|
| 57 | DailyPlan | `08.1-daily-plan.md` | ✅ |

---

## ❌ ÉCRANS NON DOCUMENTÉS (Gap Analysis)

### 🔴 HAUTE PRIORITÉ (MVP Critique)

#### Onboarding
| # | Screen | Capability | Feature |
|---|--------|------------|---------|
| 1 | **IntroScreen** | Onboarding | Présentation de VersyFlow |
| 2 | **InitialSetupScreen** | Onboarding | Configuration initiale |

#### Bible
| # | Screen | Capability | Feature |
|---|--------|------------|---------|
| 3 | **VerseSelectionScreen** | Bible | Choisir un verset |
| 4 | **VerseReaderScreen** | Bible | Lecture d'un verset |
| 5 | **SearchScreen** | Bible | Recherche biblique |
| 6 | **CollectionsScreen** | Bible | Collections |

#### Memory
| # | Screen | Capability | Feature |
|---|--------|------------|---------|
| 7 | **MemorizationStartScreen** | Memory | Nouvelle mémorisation |
| 8 | **GuidedRepeatScreen** | Memory | Répétition guidée |
| 9 | **SentenceModeScreen** | Memory | Phrase par phrase |
| 10 | **WordModeScreen** | Memory | Mot par mot |
| 11 | **ProgressiveMaskScreen** | Memory | Masquage progressif |
| 12 | **RandomMaskScreen** | Memory | Masquage aléatoire |

#### Review/FSRS
| # | Screen | Capability | Feature |
|---|--------|------------|---------|
| 13 | **ReviewCalendarScreen** | FSRS | Calendrier |
| 14 | **ScheduleScreen** | FSRS | Planning |

#### Progress
| # | Screen | Capability | Feature |
|---|--------|------------|---------|
| 15 | **MasteryScreen** | Progress | Niveaux de maîtrise |
| 16 | **AchievementScreen** | Progress | Badges |
| 17 | **ActivityTimelineScreen** | Progress | Historique |

### 🟡 MOYENNE PRIORITÉ (MVP Important)

#### Analytics
| # | Screen | Capability | Feature |
|---|--------|------------|---------|
| 18 | **RetentionAnalyticsScreen** | Analytics | Courbe de rétention |
| 19 | **LearningTimeScreen** | Analytics | Temps d'apprentissage |
| 20 | **DifficultyAnalyticsScreen** | Analytics | Difficultés |

#### AI Coach
| # | Screen | Capability | Feature |
|---|--------|------------|---------|
| 21 | **RecommendationsScreen** | AI Coach | Recommandations |
| 22 | **RecommendedExerciseScreen** | AI Coach | Exercice recommandé |
| 23 | **WeeklyReviewScreen** | AI Coach | Rapport hebdomadaire |

#### Insights
| # | Screen | Capability | Feature |
|---|--------|------------|---------|
| 24 | **InsightsScreen** | Insights | Conseils personnalisés |

#### Comparison
| # | Screen | Capability | Feature |
|---|--------|------------|---------|
| 25 | **WordAnalysisScreen** | Comparison | Analyse mot par mot |
| 26 | **WeakAreasScreen** | Comparison | Portions fragiles |
| 27 | **FrequentMistakesScreen** | Comparison | Erreurs fréquentes |

#### Settings
| # | Screen | Capability | Feature |
|---|--------|------------|---------|
| 28 | **BibleTranslationScreen** | Settings | Traductions |
| 29 | **AccessibilityScreen** | Settings | Accessibilité |
| 30 | **ExportDataScreen** | Settings | Export |

#### Profile
| # | Screen | Capability | Feature |
|---|--------|------------|---------|
| 31 | **PreferencesScreen** | Profile | Préférences |

#### Help
| # | Screen | Capability | Feature |
|---|--------|------------|---------|
| 32 | **FAQScreen** | Help | FAQ |
| 33 | **TutorialsScreen** | Help | Tutoriels |

### 🟢 BASSE PRIORITÉ (V1+)

| # | Screen | Capability | Feature |
|---|--------|------------|---------|
| 34 | **DictationScreen** | Memory | Dictée |
| 35 | **CognitiveProfileScreen** | Knowledge | Résumé cognitif |
| 36 | **LearningProfileScreen** | Knowledge | Forces/Faiblesses |
| 37 | **ExperimentScreen** | Experiment | Tests A/B |
| 38 | **NotificationCenterScreen** | Notifications | Centre notifications |
| 39 | **ReminderSettingsScreen** | Notifications | Paramètres rappel |
| 40 | **DiagnosticsScreen** | Developer | Diagnostics |
| 41 | **DebugScreen** | Developer | Logs |

---

## 📋 FONCTIONNALITÉS AVANCÉES (V1) NON DOCUMENTÉES

| # | Fonctionnalité | Capability | Priorité |
|---|----------------|------------|----------|
| 1 | Audio Memorization | Memory | 🟡 |
| 2 | Pronunciation Coach | Comparison | 🟡 |
| 3 | Voice Comparison | Comparison | 🟡 |
| 4 | AI Conversation | AI Coach | 🟢 |
| 5 | Bible Reading Plan | Bible | 🟡 |
| 6 | Group Memorization | Memory | 🟢 |
| 7 | Verse Challenges | Progress | 🟢 |
| 8 | Daily Verse | Home | 🟡 |
| 9 | Widgets | App | 🟢 |
| 10 | Smart Notifications | Notifications | 🟢 |
| 11 | Cloud Sync | App | 🟡 |
| 12 | Family Mode | Profile | 🟢 |
| 13 | Church Groups | Profile | 🟢 |
| 14 | Leaderboard | Progress | 🟢 |
| 15 | Offline Packs | Bible | 🟢 |
| 16 | Multi-Version Comparison | Comparison | 🟢 |
| 17 | Cross References | Bible | 🟢 |
| 18 | Notes | Bible | 🟢 |
| 19 | Highlighting | Bible | 🟢 |
| 20 | Verse Collections | Bible | 🟢 |
| 21 | AI Generated Exercises | AI Coach | 🟢 |
| 22 | Adaptive Difficulty | Memory | 🟢 |
| 23 | Cognitive Mirror | Knowledge | 🟢 |
| 24 | Learning Personas | Knowledge | 🟢 |
| 25 | Community Statistics | Analytics | 🟢 |
| 26 | Research Mode | Bible | 🟢 |

---

## 🗺️ MATRICE DE COUVERTURE PAR CAPABILITY

| Capability | Écrans | Documentés | Manquants | % |
|------------|--------|------------|-----------|---|
| **App** | 2 | 2 | 0 | 100% ✅ |
| **Onboarding** | 4 | 2 | 2 | 50% ⚠️ |
| **Home** | 1 | 1 | 0 | 100% ✅ |
| **Bible** | 9 | 6 | 3 | 67% ⚠️ |
| **Memory** | 11 | 7 | 4 | 64% ⚠️ |
| **Comparison** | 5 | 3 | 2 | 60% ⚠️ |
| **Review** | 3 | 3 | 0 | 100% ✅ |
| **FSRS** | 2 | 0 | 2 | 0% ❌ |
| **Progress** | 7 | 4 | 3 | 57% ⚠️ |
| **Analytics** | 4 | 1 | 3 | 25% ❌ |
| **Insights** | 1 | 0 | 1 | 0% ❌ |
| **AI Coach** | 4 | 1 | 3 | 25% ❌ |
| **Knowledge** | 2 | 0 | 2 | 0% ❌ |
| **Experiment** | 1 | 0 | 1 | 0% ❌ |
| **Notifications** | 2 | 0 | 2 | 0% ❌ |
| **Settings** | 8 | 5 | 3 | 63% ⚠️ |
| **Profile** | 2 | 1 | 1 | 50% ⚠️ |
| **Help** | 3 | 1 | 2 | 33% ❌ |
| **Developer** | 2 | 0 | 2 | 0% ❌ |
| **TOTAL** | **70** | **42** | **28** | **60%** |

---

## 📊 STRUCTURE DE DOCUMENTATION RECOMMANDÉE

```
versyflow_bmad_output/C-UX-Scenarios/
├── 00-app/                          # ✅ EXISTANT
├── 00-auth/                         # ✅ EXISTANT
├── 01-onboarding-complet/           # ✅ EXISTANT
├── 02-memorisation-verset/          # ✅ EXISTANT
├── 03-navigation-biblique/          # ✅ EXISTANT
├── 04-revision-fsrs/                # ✅ EXISTANT
├── 05-suivi-progression/            # ✅ EXISTANT
├── 06-parametres/                   # ✅ EXISTANT
├── 07-cas-erreur/                   # ✅ EXISTANT
├── 08-ai-coach/                     # ✅ EXISTANT (partiel)
│
├── 09-memorisation-avancee/         # ❌ À CRÉER
│   ├── 09-memorisation-avancee.md
│   └── pages/
│       ├── 09.1-memorization-start.md
│       ├── 09.2-guided-repeat.md
│       ├── 09.3-sentence-mode.md
│       ├── 09.4-word-mode.md
│       ├── 09.5-progressive-mask.md
│       ├── 09.6-random-mask.md
│       └── 09.7-dictation.md
│
├── 10-bible-avance/                 # ❌ À CRÉER
│   ├── 10-bible-avance.md
│   └── pages/
│       ├── 10.1-verse-selection.md
│       ├── 10.2-verse-reader.md
│       ├── 10.3-search-screen.md
│       ├── 10.4-collections.md
│       └── 10.5-cross-references.md
│
├── 11-fsrs-avance/                  # ❌ À CRÉER
│   ├── 11-fsrs-avance.md
│   └── pages/
│       ├── 11.1-review-calendar.md
│       └── 11.2-schedule.md
│
├── 12-analytics-insights/           # ❌ À CRÉER
│   ├── 12-analytics-insights.md
│   └── pages/
│       ├── 12.1-retention-analytics.md
│       ├── 12.2-learning-time.md
│       ├── 12.3-difficulty-analytics.md
│       └── 12.4-insights-screen.md
│
├── 13-ai-coach-complete/            # ❌ À CRÉER
│   ├── 13-ai-coach-complete.md
│   └── pages/
│       ├── 13.1-recommendations.md
│       ├── 13.2-recommended-exercise.md
│       └── 13.3-weekly-review.md
│
├── 14-knowledge-profile/            # ❌ À CRÉER
│   ├── 14-knowledge-profile.md
│   └── pages/
│       ├── 14.1-cognitive-profile.md
│       └── 14.2-learning-profile.md
│
├── 15-notifications/                # ❌ À CRÉER
│   ├── 15-notifications.md
│   └── pages/
│       ├── 15.1-notification-center.md
│       └── 15.2-reminder-settings.md
│
├── 16-settings-avance/              # ❌ À CRÉER
│   ├── 16-settings-avance.md
│   └── pages/
│       ├── 16.1-bible-translation.md
│       ├── 16.2-accessibility.md
│       └── 16.3-export-data.md
│
├── 17-profile-avance/               # ❌ À CRÉER
│   ├── 17-profile-avance.md
│   └── pages/
│       └── 17.1-preferences.md
│
├── 18-help-center/                  # ❌ À CRÉER
│   ├── 18-help-center.md
│   └── pages/
│       ├── 18.1-faq.md
│       └── 18.2-tutorials.md
│
└── 19-developer/                    # ❌ À CRÉER
    ├── 19-developer.md
    └── pages/
        ├── 19.1-diagnostics.md
        └── 19.2-debug-screen.md
```

---

## 🎯 PLAN D'ACTION RECOMMANDÉ

### Phase 1: Documentation Critique (Semaine 1)
1. ✅ **IntroScreen** — Présentation de VersyFlow
2. ✅ **InitialSetupScreen** — Configuration initiale
3. ✅ **VerseSelectionScreen** — Choisir un verset
4. ✅ **VerseReaderScreen** — Lecture d'un verset
5. ✅ **SearchScreen** — Recherche biblique

### Phase 2: Memory Avancé (Semaine 2)
6. ✅ **GuidedRepeatScreen** — Répétition guidée
7. ✅ **SentenceModeScreen** — Phrase par phrase
8. ✅ **WordModeScreen** — Mot par mot
9. ✅ **ProgressiveMaskScreen** — Masquage progressif
10. ✅ **RandomMaskScreen** — Masquage aléatoire

### Phase 3: FSRS & Progress (Semaine 3)
11. ✅ **ReviewCalendarScreen** — Calendrier
12. ✅ **ScheduleScreen** — Planning
13. ✅ **MasteryScreen** — Niveaux maîtrise
14. ✅ **AchievementScreen** — Badges
15. ✅ **ActivityTimelineScreen** — Timeline

### Phase 4: Analytics & Insights (Semaine 4)
16. ✅ **RetentionAnalyticsScreen** — Rétention
17. ✅ **LearningTimeScreen** — Temps apprentissage
18. ✅ **DifficultyAnalyticsScreen** — Difficultés
19. ✅ **InsightsScreen** — Conseils personnalisés
20. ✅ **RecommendationsScreen** — Recommandations IA

### Phase 5: Features Avancées (Semaine 5+)
21. ✅ **DictationScreen** — Dictée
22. ✅ **CognitiveProfileScreen** — Profil cognitif
23. ✅ **LearningProfileScreen** — Profil apprentissage
24. ✅ **NotificationCenterScreen** — Centre notifications
25. ✅ **WeeklyReviewScreen** — Rapport hebdo

---

## 📈 STATISTIQUES DE PROGRESSION

```
Documentation BMAD:     ████████████████████░░░░░░░░░░  60% (42/70)
Écrans implémentés:     ████████████████████████████░░  85% (41/48*)
Gap documentation:      ████████░░░░░░░░░░░░░░░░░░░░░░  32% (22/70)

* 48 écrans déjà codés, 70 au total selon la cartographie
```

---

## 🔗 LIENS UTILS

- **Documentation existante**: `versyflow_bmad_output/C-UX-Scenarios/`
- **Cartographie complète**: Voir prompt utilisateur
- **Architecture**: `docs/ARCHITECTURE_COMPLETE.md`
- **Gap Analysis**: `docs/GAP_ANALYSIS.md` (ce fichier)

---

*Analyse générée automatiquement le 2026-08-03*
*48 écrans documentés · 22 écrans manquants · 26 fonctionnalités V1*
