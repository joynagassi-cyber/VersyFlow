# Graph Report - VersyFlow  (2026-08-17)

## Corpus Check
- 249 files · ~411,384 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 864 nodes · 1185 edges · 34 communities detected
- Extraction: 72% EXTRACTED · 28% INFERRED · 0% AMBIGUOUS · INFERRED: 330 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 182|Community 182]]
- [[_COMMUNITY_Community 183|Community 183]]
- [[_COMMUNITY_Community 184|Community 184]]
- [[_COMMUNITY_Community 185|Community 185]]

## God Nodes (most connected - your core abstractions)
1. `now()` - 49 edges
2. `SessionEngine` - 27 edges
3. `split()` - 27 edges
4. `CloudSyncService` - 23 edges
5. `TelemetryService` - 20 edges
6. `BibleRepository` - 19 edges
7. `ProgressService` - 18 edges
8. `BibleService` - 15 edges
9. `resolve()` - 15 edges
10. `RenderError` - 15 edges

## Surprising Connections (you probably didn't know these)
- `NotFoundScreen()` --calls--> `useAppTheme()`  [INFERRED]
  app\+not-found.tsx → src\theme\useTheme.ts
- `BootScreen()` --calls--> `useAppTheme()`  [INFERRED]
  app\boot.tsx → src\theme\useTheme.ts
- `LanguagePickerScreen()` --calls--> `useAppTheme()`  [INFERRED]
  app\onboarding\language-select.tsx → src\theme\useTheme.ts
- `WelcomeScreen()` --calls--> `useAppTheme()`  [INFERRED]
  app\onboarding\welcome.tsx → src\theme\useTheme.ts
- `BackupScreen()` --calls--> `useAppTheme()`  [INFERRED]
  app\settings\backup.tsx → src\theme\useTheme.ts

## Communities

### Community 0 - "Community 0"
Cohesion: 0.05
Nodes (21): AsyncStorageAdapter, CloudMemorizationService, CloudSyncService, loadData(), loadData(), ConsoleLogger, migrate(), MmkvStorage (+13 more)

### Community 1 - "Community 1"
Cohesion: 0.05
Nodes (12): createTestRecord(), validateTimestamp(), EventBus, FatigueDetector, now(), calculateStreak(), calculateTrend(), calculateStreak() (+4 more)

### Community 2 - "Community 2"
Cohesion: 0.06
Nodes (53): Sm2FallbackEngine, ack(), add_target(), cmd_append(), cmd_init(), cmd_set(), entry_count(), main() (+45 more)

### Community 3 - "Community 3"
Cohesion: 0.05
Nodes (7): ComparisonEngine, handleStartMemorization(), SessionEngine, handleNextVerse(), handlePrevVerse(), handleRating(), WordFailureTracker

### Community 4 - "Community 4"
Cohesion: 0.05
Nodes (10): BibleNotFoundError, BibleService, ChapterNotFoundError, VerseNotFoundError, loadChapter(), buildReference(), getEnglishName(), parseReference() (+2 more)

### Community 5 - "Community 5"
Cohesion: 0.13
Nodes (35): ConfigError, _detect_keyed_merge_field(), load_central_config(), load_customization(), load_toml(), _merge_arrays(), merge_layers(), Shared strict TOML loading and structural merge support. (+27 more)

### Community 6 - "Community 6"
Cohesion: 0.06
Nodes (14): BackupScreen(), BootScreen(), ButtonPrimary(), EmptyState(), AuthGate(), Card(), ScreenWrapper(), SectionTitle() (+6 more)

### Community 7 - "Community 7"
Cohesion: 0.1
Nodes (4): FsrsReview, FsrsState, WasmFsrsEngine, WasmFsrsEngine

### Community 8 - "Community 8"
Cohesion: 0.1
Nodes (6): loadBook(), loadBooks(), I18nService, TranslationRegistry, handleLanguageChange(), useI18n()

### Community 9 - "Community 9"
Cohesion: 0.12
Nodes (5): getMemorizationService(), loadStats(), getMemorizationService(), loadStats(), ProgressService

### Community 10 - "Community 10"
Cohesion: 0.12
Nodes (5): getFsrsEngine(), getMemorizationService(), loadReviews(), ReviewQueueService, StrategyRecommendor

### Community 11 - "Community 11"
Cohesion: 0.1
Nodes (5): handleSignOut(), InsForgeAuthService, handleLogin(), handleSignOut(), handleSignup()

### Community 12 - "Community 12"
Cohesion: 0.18
Nodes (1): TelemetryService

### Community 13 - "Community 13"
Cohesion: 0.17
Nodes (6): useFlashcard(), useProgressiveMask(), useRandomMask(), useRecallWriting(), useSmartMask(), useMemoryCapabilityHook()

### Community 14 - "Community 14"
Cohesion: 0.38
Nodes (9): buildNavRow(), getPageFolders(), main(), parseArgs(), printUsage(), processScenario(), slugToLabel(), toSlug() (+1 more)

### Community 15 - "Community 15"
Cohesion: 0.42
Nodes (8): buildObjectBlock(), deriveObjectId(), insertUnderSection(), main(), pageSlugFromPath(), parseArgs(), printUsage(), toSlug()

### Community 16 - "Community 16"
Cohesion: 0.29
Nodes (1): MainApplication

### Community 17 - "Community 17"
Cohesion: 0.33
Nodes (1): MainActivity

### Community 18 - "Community 18"
Cohesion: 0.6
Nodes (5): getVCC(), HealthMonitorWorkflow(), ReleaseWorkflow(), SprintWorkflow(), TaskWorkflow()

### Community 19 - "Community 19"
Cohesion: 0.6
Nodes (5): canInviteMember(), canManageFamily(), canManageLocalProfile(), canRemoveMember(), hasPermission()

### Community 20 - "Community 20"
Cohesion: 0.4
Nodes (2): calculateMasteryLevel(), isMastered()

### Community 23 - "Community 23"
Cohesion: 0.7
Nodes (4): fillTemplate(), generateBookData(), generateVerseText(), randomChoice()

### Community 24 - "Community 24"
Cohesion: 0.5
Nodes (2): extractTokenFromQR(), parseQRPayload()

### Community 28 - "Community 28"
Cohesion: 0.67
Nodes (2): initFsrsEngine(), initializeService()

### Community 38 - "Community 38"
Cohesion: 1.0
Nodes (2): fixDoubleColon(), scanDir()

### Community 39 - "Community 39"
Cohesion: 1.0
Nodes (2): fixFile(), scanDir()

### Community 40 - "Community 40"
Cohesion: 1.0
Nodes (2): scanDirectory(), scanFile()

### Community 41 - "Community 41"
Cohesion: 1.0
Nodes (2): processFile(), scanDir()

### Community 42 - "Community 42"
Cohesion: 1.0
Nodes (2): processFile(), scanDir()

### Community 43 - "Community 43"
Cohesion: 0.67
Nodes (1): AuthError

### Community 182 - "Community 182"
Cohesion: 1.0
Nodes (1): Return 'code' or 'id' if every table item carries that *same* field.      All it

### Community 183 - "Community 183"
Cohesion: 1.0
Nodes (1): Shape-aware array merge. Base + override combined tables may opt into     keyed

### Community 184 - "Community 184"
Cohesion: 1.0
Nodes (1): Recursively merge override into base using structural rules.     - Table + table

### Community 185 - "Community 185"
Cohesion: 1.0
Nodes (1): Write JSON as UTF-8 so Windows cp1252 stdout can carry emoji icons.

## Knowledge Gaps
- **16 isolated node(s):** `FsrsState`, `FsrsReview`, `Shared strict TOML loading and structural merge support.`, `Raised when a present configuration layer cannot be used safely.`, `Load a TOML table, allowing absence only for optional layers.` (+11 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 12`** (19 nodes): `telemetry-service.ts`, `TelemetryService`, `.constructor()`, `.enqueue()`, `.flush()`, `.generateSessionId()`, `.generateSummary()`, `.getQueue()`, `.record()`, `.recordError()`, `.recordExerciseAbandoned()`, `.recordExerciseCompleted()`, `.recordFeatureAccessed()`, `.recordMemorySessionCompleted()`, `.recordPassageSegmentCompleted()`, `.recordPassageStarted()`, `.recordReviewCompleted()`, `.saveQueue()`, `.setUserId()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 16`** (7 nodes): `MainApplication.kt`, `getJSMainModuleName()`, `getPackages()`, `getUseDeveloperSupport()`, `MainApplication`, `.onConfigurationChanged()`, `.onCreate()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 17`** (6 nodes): `MainActivity.kt`, `MainActivity`, `.createReactActivityDelegate()`, `.getMainComponentName()`, `.invokeDefaultOnBackPressed()`, `.onCreate()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 20`** (6 nodes): `calculateMasteryLevel()`, `canTransition()`, `getMaskingConfigForStability()`, `isMastered()`, `entities.ts`, `entities.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 24`** (5 nodes): `extractTokenFromQR()`, `formatTokenDisplay()`, `generateQRPayload()`, `parseQRPayload()`, `qr-generator.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 28`** (4 nodes): `useMemorizationSession.ts`, `initFsrsEngine()`, `initializeService()`, `useMemorizationSession()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 38`** (3 nodes): `fixDoubleColon()`, `scanDir()`, `fix-double-colon.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 39`** (3 nodes): `fixFile()`, `scanDir()`, `fix-theme-strings.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 40`** (3 nodes): `scanDirectory()`, `scanFile()`, `migrate-colors.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 41`** (3 nodes): `processFile()`, `scanDir()`, `migrate-theme-v2.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 42`** (3 nodes): `processFile()`, `scanDir()`, `migrate-theme.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 43`** (3 nodes): `types.ts`, `AuthError`, `.constructor()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 182`** (1 nodes): `Return 'code' or 'id' if every table item carries that *same* field.      All it`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 183`** (1 nodes): `Shape-aware array merge. Base + override combined tables may opt into     keyed`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 184`** (1 nodes): `Recursively merge override into base using structural rules.     - Table + table`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 185`** (1 nodes): `Write JSON as UTF-8 so Windows cp1252 stdout can carry emoji icons.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `now()` connect `Community 1` to `Community 0`, `Community 2`, `Community 3`, `Community 6`, `Community 7`, `Community 9`, `Community 10`, `Community 12`?**
  _High betweenness centrality (0.164) - this node is a cross-community bridge._
- **Why does `split()` connect `Community 2` to `Community 0`, `Community 3`, `Community 5`, `Community 14`, `Community 15`?**
  _High betweenness centrality (0.097) - this node is a cross-community bridge._
- **Why does `loadBooks()` connect `Community 8` to `Community 0`, `Community 4`?**
  _High betweenness centrality (0.038) - this node is a cross-community bridge._
- **Are the 47 inferred relationships involving `now()` (e.g. with `.create()` and `.addMember()`) actually correct?**
  _`now()` has 47 INFERRED edges - model-reasoned connections that need verification._
- **Are the 22 inferred relationships involving `split()` (e.g. with `.tokenize()` and `.updateRecordAfterReview()`) actually correct?**
  _`split()` has 22 INFERRED edges - model-reasoned connections that need verification._
- **What connects `FsrsState`, `FsrsReview`, `Shared strict TOML loading and structural merge support.` to the rest of the system?**
  _16 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.05 - nodes in this community are weakly interconnected._