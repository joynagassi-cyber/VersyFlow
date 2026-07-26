# VersyFlow — Fonctionnalités Détaillées

## Document généré par Agent B — Features

---

## 1. Fonctionnalités MVP (V0.1)

### F-001: Onboarding de Configuration

**Description**: Premier lancement — choix langue UI + traduction biblique en 2 étapes simples.

**Composants UI requis**: `WelcomeScreen`, `LanguagePickerScreen`, `TranslationPickerScreen`, `ConfirmButton`

**Données impliquées**: `UserSettings.uiLanguage`, `UserSettings.bibleTranslation`, `UserSettings.onboardingCompleted`

**Priorité**: MUST

#### Sous-fonctionnalités
| ID | Fonctionnalité | Description |
|----|---------------|-------------|
| F-001-A | Sélection langue interface | Grid de 5 langues avec noms natifs, flags, groupement par région |
| F-001-B | Sélection traduction biblique | Liste des traductions, LSG pré-sélectionné, description de chaque |
| F-001-C | Persistance locale | Settings sauvegardés dans MMKV après chaque changement |
| F-001-D | Support RTL auto | Détection automatique si arabe → direction RTL appliquée |
| F-001-E | Skip onboarding | Optionnel sur WelcomeScreen → va directement aux paramètres |
| F-001-F | Skip si déjà config | Si `onboardingCompleted === true`, skip direct vers Accueil |

---

### F-002: Navigation Biblique

**Description**: Parcourir la Bible complète — Livres (66), Chapitres (~1,189), Versets (~31,102 pour LSG).

**Composants UI requis**: `BookListScreen`, `ChapterListScreen`, `VerseListScreen`, `ReferenceSearchInput`, `BookItem`, `ChapterTile`, `VerseCard`

**Données impliquées**: BibleBook[], ChapterInfo[], BibleVerse, TranslationRegistry

**Priorité**: MUST

#### Sous-fonctionnalités
| ID | Fonctionnalité | Description |
|----|---------------|-------------|
| F-002-A | Liste des 66 livres | Groupés Ancien/Nouveau Testament, ordre canonique, nom localisé |
| F-002-B | Liste des chapitres | Grille de chapitres avec nombre de versets affiché |
| F-002-C | Liste des versets | Verse par verse avec texte complet et status indicator |
| F-002-D | Recherche par référence | Input qui accepte "Jean 3:16", "Jn 3:16", "Genèse 1:1" → resolution auto |
| F-002-E | Indicateur statut mémorisation | Chip coloré sur chaque verset: Nouveau (gris), En cours (rose), Maîtrisé (vert) |
| F-002-F | Versets favoris | Marquer/démarquer un verset comme favori — stocké dans MemorizationRecord.favorite |

---

### F-003: Session de Mémorisation Interactive

**Description**: Le cœur du produit. Interface interactive où l'utilisateur mémorise activement un verset mot par mot.

**Composants UI requis**: `MemorizationSessionScreen`, `WordChip`, `ProgressIndicator`, `ButtonPrimary`, `ButtonSecondary`

**Données impliquées**: MemorizationRecord, FsrsState, BibleVerse

**Priorité**: MUST — **C'EST LA FONCTIONNALITÉ DIFFÉRENCIANTE PRINCIPALE**

#### Sous-fonctionnalités
| ID | Fonctionnalité | Description |
|----|---------------|-------------|
| F-003-A | Aperçu verset | Affichage verset complet pendant 10 secondes avant masquage |
| F-003-B | Masquage progressif | Mots deviennent des placeholders gris un par un |
| F-003-C | Tap-to-reveal | Tapper sur un placeholder pour révéler le mot (animation pulse) |
| F-003-D | Validation réponse | Boutons "J'ai mémorisé" / "Besoin de plus de temps" |
| F-003-E | Feedback visuel | Animation checkmark + nouvelle estimation FSRS |
| F-003-F | Timer session | Compteurs le temps de session (affiché après 10s) |
| F-003-G | Pause/Reprendre | Fermer session sans perdre la progression |

---

### F-004: Moteur FSRS

**Description**: Algorithme de répétition espacée de précision scientifique pour prédire le moment optimal de rappel.

**Composants UI requis**: Aucun directement — service pur derrière `IFsrsEngine`

**Données impliquées**: FsrsState, ReviewLog, MemorizationRecord.nextReviewAt

**Priorité**: MUST

#### Sous-fonctionnalités
| ID | Fonctionnalité | Description |
|----|---------------|-------------|
| F-004-A | Calcul FSRS complet |稳定性, difficulté, intervalle, recall probability via Rust WASM |
| F-004-B | Interface d'abstraction | IFsrsEngine TypeScript port — swap implémentation transparent |
| F-004-C | Bridge WASM | Chargement asynchrone du .wasm avec health check |
| F-004-D | Fallback SM-2 JS | Algorithme classique si WASM échoue |
| F-004-E | Historique révision | Chaque révision enregistrée dans ReviewLog |
| F-004-F | Prédiction prochain rappel | Affiché à l'utilisateur après chaque session |

---

### F-005: Session de Révision FSRS

**Description**: Révisions présentées au moment optimal prédit par FSRS, avec file d'attente intelligente.

**Composants UI requis**: `ReviewQueueScreen`, `ReviewSessionScreen`, `ReviewItemCard`, `StatCard`

**Données impliquées**: MemorizationRecord[], FsrsState, ReviewLog[]

**Priorité**: MUST

#### Sous-fonctionnalités
| ID | Fonctionnalité | Description |
|----|---------------|-------------|
| F-005-A | File d'attente triée par urgence | Overdue > Scheduled (today) > Upcoming |
| F-005-B | Présentation verset par verset | Mode rappel actif — texte partiellement caché |
| F-005-C | Auto-révélation | Si 30s sans réponse → versent révélé automatiquement |
| F-005-D | Auto-évaluation | Again / Hard / Good / Easy buttons |
| F-005-E | Recalcul immédiat | FSRS update après chaque réponse |
| F-005-F | Résumé session | Count of correct/hard/again + stability delta + time spent |

---

### F-006: Suivi de Progression

**Description**: Visualiser ses progrès de mémorisation avec statistiques et graphiques.

**Composants UI requis**: `ProgressDashboardScreen`, `StatCard`, `BarChart`, `VerseList`

**Données impliquées**: MemorizationRecord[], ReviewLog[], Streak calculation

**Priorité**: SHOULD

#### Sous-fonctionnalités
| ID | Fonctionnalité | Description |
|----|---------------|-------------|
| F-006-A | Stats Grid 2x2 | Versets mémorisés, Streak, Rétention, À réviser |
| F-006-B | Streak counter | Série de jours consécutifs avec flame animation |
| F-006-C | Graphique hebdomadaire | Bar chart des sessions par jour (7 derniers jours) |
| F-006-D | Taux de rétention | Percentage de réponses correctes sur total |
| F-006-E | Versets récents | Liste des 5 derniers mémorisés |
| F-006-F | Versets à renforcer | Versets avec stabilité < 3 jours |
| F-006G | Versets maîtrisés | Versets avec stabilité > 30 jours |

---

### F-007: Paramètres

**Description**: Gérer les préférences utilisateur — langue, traduction, données.

**Composants UI requis**: `SettingsScreen`, `SettingRow`, `SettingRowDestructive`, `ConfirmModal`

**Données impliquées**: UserSettings, Storage info

**Priorité**: MUST

#### Sous-fonctionnalités
| ID | Fonctionnalité | Description |
|----|---------------|-------------|
| F-007-A | Changer langue UI | Redirection vers LanguagePicker, apply live |
| F-007-B | Changer traduction | Redirection vers TranslationPicker, apply live |
| F-007-C | Theme (future) | Placeholder pour dark mode V1+ |
| F-007-D | Storage info | Afficher taille utilisée par données locales |
| F-007-E | Export data | Export JSON de toutes les données utilisateur |
| F-007-F | About | Version app, lien documentation |
| F-007-G | Reset progression | Action destructive avec confirmation par texte |

---

## 2. Fonctionnalités V1 (Post-MVP)

### V1-001: Multi-Traductions Bibliques
- Support KJV, NIV, NASB, ESV (+ traductions)
- Comparaison côte-à-côte de deux traductions
- Migre vers format Bible standard (BX ou JSON standard)

### V1-002: Catégorisation de Versets
- Versets thématiques (foi, amour, paix, sagesse, prière...)
- Versets populaires quotidiens ("Verset du jour" push)
- Suggestions intelligentes basées sur l'historique

### V1-003: Thèmes UI Avancés
- Mode sombre complet (dark mode tokens définis mais pas implémentés)
- Thèmes personnalisables (couleurs primaires changeables)
- Thème basé sur saison liturgique (Avent, Carême...)

### V1-004: Statistiques Avancées
- Analyse de rétention par type/thématique de verset
- Comparaison période à période (this week vs last week)
- Export CSV des données de progression

---

## 3. Fonctionnalités Futur

### FUTURE-001: Synchronisation Cloud
- Multi-appareil sync (iOS ↔ Android ↔ Web)
- Backup automatique chiffré
- Import/export complet Bible data + settings

### FUTURE-002: Notifications Intelligentes
- Rappels FSRS push notifications au moment optimal
- Verset du jour quotidien
- Streak reminders (vous allez perdre votre série!)

### FUTURE-003: Contenu Audio
- Lecture audio des versets (text-to-speech ou enregistrement humain)
- Enregistrement vocal de mémorisation (l'utilisateur écouté sa propre voix)
- Mode "écoute" pendant déplacement

### FUTURE-004: Communauté
- Défis de mémorisation entre amis (opt-in, privacy-first)
- Partage de versets favoris (image card générée)
- Tableaux de classement optionnels (leaderboard)
- Groups de mémorisation familiaux/église

---

*Document approuvé. Transmis à l'Agent C (UX Flows) et Agent D (UI Screens).*
