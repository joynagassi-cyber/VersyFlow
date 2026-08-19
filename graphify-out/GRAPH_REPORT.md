# Graph Report - VersyFlow  (2026-08-11)

## Corpus Check
- 242 files · ~404,928 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 822 nodes · 1106 edges · 31 communities detected
- Extraction: 71% EXTRACTED · 29% INFERRED · 0% AMBIGUOUS · INFERRED: 320 edges (avg confidence: 0.8)
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
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 42|Community 42]]

## God Nodes (most connected - your core abstractions)
1. `now()` - 49 edges
2. `SessionEngine` - 27 edges
3. `split()` - 25 edges
4. `CloudSyncService` - 23 edges
5. `TelemetryService` - 20 edges
6. `BibleRepository` - 19 edges
7. `ProgressService` - 18 edges
8. `BibleService` - 15 edges
9. `MemorizationService` - 14 edges
10. `CloudMemorizationService` - 14 edges

## Surprising Connections (you probably didn't know these)
- `NotFoundScreen()` --calls--> `useAppTheme()`  [INFERRED]
  app\+not-found.tsx → src\theme\useTheme.ts
- `BootScreen()` --calls--> `useAppTheme()`  [INFERRED]
  app\boot.tsx → src\theme\useTheme.ts
- `FamilyJoinScreen()` --calls--> `useAppTheme()`  [INFERRED]
  app\family\join.tsx → src\theme\useTheme.ts
- `FSRSIntroductionScreen()` --calls--> `useAppTheme()`  [INFERRED]
  app\onboarding\fsrs-introduction.tsx → src\theme\useTheme.ts
- `LanguagePickerScreen()` --calls--> `useAppTheme()`  [INFERRED]
  app\onboarding\language-select.tsx → src\theme\useTheme.ts

## Communities

### Community 0 - "Community 0"
Cohesion: 0.05
Nodes (20): AsyncStorageAdapter, CloudMemorizationService, loadData(), EventBus, loadData(), migrate(), MmkvStorage, createDefaultProfile() (+12 more)

### Community 1 - "Community 1"
Cohesion: 0.04
Nodes (15): createTestRecord(), getMemorizationService(), loadStats(), validateTimestamp(), now(), calculateStreak(), calculateTrend(), getMemorizationService() (+7 more)

### Community 2 - "Community 2"
Cohesion: 0.04
Nodes (13): BibleNotFoundError, BibleService, ChapterNotFoundError, VerseNotFoundError, loadBook(), loadChapter(), loadBooks(), buildReference() (+5 more)

### Community 3 - "Community 3"
Cohesion: 0.07
Nodes (46): Sm2FallbackEngine, ack(), add_target(), cmd_append(), cmd_init(), cmd_set(), entry_count(), main() (+38 more)

### Community 4 - "Community 4"
Cohesion: 0.05
Nodes (6): ComparisonEngine, SessionEngine, handleNextVerse(), handlePrevVerse(), handleRating(), WordFailureTracker

### Community 5 - "Community 5"
Cohesion: 0.07
Nodes (13): I18nService, TranslationRegistry, handleSignOut(), deep_merge(), _detect_keyed_merge_field(), extract_key(), load_toml(), main() (+5 more)

### Community 6 - "Community 6"
Cohesion: 0.08
Nodes (6): FatigueDetector, getFsrsEngine(), getMemorizationService(), loadReviews(), ReviewQueueService, StrategyRecommendor

### Community 7 - "Community 7"
Cohesion: 0.17
Nodes (2): CloudSyncService, ConsoleLogger

### Community 8 - "Community 8"
Cohesion: 0.08
Nodes (14): BackupScreen(), BootScreen(), FSRSIntroductionScreen(), ReviewHistoryScreen(), Card(), ScreenWrapper(), SectionTitle(), FamilyJoinScreen() (+6 more)

### Community 9 - "Community 9"
Cohesion: 0.12
Nodes (4): FsrsReview, FsrsState, WasmFsrsEngine, WasmFsrsEngine

### Community 10 - "Community 10"
Cohesion: 0.17
Nodes (1): TelemetryService

### Community 11 - "Community 11"
Cohesion: 0.12
Nodes (4): ButtonPrimary(), EmptyState(), MockLearnerProfileService, VerseCard()

### Community 12 - "Community 12"
Cohesion: 0.18
Nodes (3): InsForgeAuthService, handleLogin(), handleSignup()

### Community 13 - "Community 13"
Cohesion: 0.17
Nodes (6): useFlashcard(), useProgressiveMask(), useRandomMask(), useRecallWriting(), useSmartMask(), useMemoryCapabilityHook()

### Community 14 - "Community 14"
Cohesion: 0.32
Nodes (11): checkObjectContent(), countNavRows(), extractObjectIds(), extractSpacingIds(), formatResult(), getPageFiles(), main(), parseArgs() (+3 more)

### Community 15 - "Community 15"
Cohesion: 0.38
Nodes (9): buildNavRow(), getPageFolders(), main(), parseArgs(), printUsage(), processScenario(), slugToLabel(), toSlug() (+1 more)

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
Cohesion: 0.4
Nodes (2): calculateMasteryLevel(), isMastered()

### Community 20 - "Community 20"
Cohesion: 0.6
Nodes (5): buildTemplate(), main(), parseArgs(), printUsage(), toSlug()

### Community 21 - "Community 21"
Cohesion: 0.6
Nodes (5): buildReadme(), main(), parseArgs(), printUsage(), toSlug()

### Community 24 - "Community 24"
Cohesion: 0.7
Nodes (4): fillTemplate(), generateBookData(), generateVerseText(), randomChoice()

### Community 25 - "Community 25"
Cohesion: 0.5
Nodes (2): extractTokenFromQR(), parseQRPayload()

### Community 28 - "Community 28"
Cohesion: 0.67
Nodes (2): initFsrsEngine(), initializeService()

### Community 37 - "Community 37"
Cohesion: 1.0
Nodes (2): fixDoubleColon(), scanDir()

### Community 38 - "Community 38"
Cohesion: 1.0
Nodes (2): fixFile(), scanDir()

### Community 39 - "Community 39"
Cohesion: 1.0
Nodes (2): scanDirectory(), scanFile()

### Community 40 - "Community 40"
Cohesion: 1.0
Nodes (2): processFile(), scanDir()

### Community 41 - "Community 41"
Cohesion: 1.0
Nodes (2): processFile(), scanDir()

### Community 42 - "Community 42"
Cohesion: 0.67
Nodes (1): AuthError

## Knowledge Gaps
- **12 isolated node(s):** `FsrsState`, `FsrsReview`, `The memlog file, from either addressing mode: {workspace}/.memlog.md or an expli`, `Return (frontmatter dict in source order, body str). Frontmatter is plain key: v`, `Stamp `updated` and keep it last so the field order stays predictable.` (+7 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 7`** (27 nodes): `.triggerSync()`, `CloudSyncService`, `.constructor()`, `.destroy()`, `.disableAutoSync()`, `.enableAutoSync()`, `.fetchAllCloudLogs()`, `.fetchAllCloudRecords()`, `.fetchFromCloud()`, `.getAllLocalMemorized()`, `.mergeCloudLogsToLocal()`, `.mergeCloudRecordsToLocal()`, `.processSyncQueue()`, `.setAutoSync()`, `.setupConnectivityListeners()`, `.sync()`, `.syncLogsToCloud()`, `.syncOnce()`, `.syncRecordsToCloud()`, `.upsertCloudLogs()`, `.upsertCloudRecords()`, `ConsoleLogger`, `.debug()`, `.info()`, `.warn()`, `logger.ts`, `CloudSyncService.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 10`** (20 nodes): `telemetry-service.ts`, `TelemetryService`, `.constructor()`, `.enqueue()`, `.flush()`, `.generateSessionId()`, `.generateSummary()`, `.getQueue()`, `.loadQueue()`, `.record()`, `.recordError()`, `.recordExerciseAbandoned()`, `.recordExerciseCompleted()`, `.recordFeatureAccessed()`, `.recordMemorySessionCompleted()`, `.recordPassageSegmentCompleted()`, `.recordPassageStarted()`, `.recordReviewCompleted()`, `.saveQueue()`, `.setUserId()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 16`** (7 nodes): `MainApplication.kt`, `getJSMainModuleName()`, `getPackages()`, `getUseDeveloperSupport()`, `MainApplication`, `.onConfigurationChanged()`, `.onCreate()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 17`** (6 nodes): `MainActivity.kt`, `MainActivity`, `.createReactActivityDelegate()`, `.getMainComponentName()`, `.invokeDefaultOnBackPressed()`, `.onCreate()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 19`** (6 nodes): `calculateMasteryLevel()`, `canTransition()`, `getMaskingConfigForStability()`, `isMastered()`, `entities.ts`, `entities.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 25`** (5 nodes): `extractTokenFromQR()`, `formatTokenDisplay()`, `generateQRPayload()`, `parseQRPayload()`, `qr-generator.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 28`** (4 nodes): `useMemorizationSession.ts`, `initFsrsEngine()`, `initializeService()`, `useMemorizationSession()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 37`** (3 nodes): `fixDoubleColon()`, `scanDir()`, `fix-double-colon.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 38`** (3 nodes): `fixFile()`, `scanDir()`, `fix-theme-strings.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 39`** (3 nodes): `scanDirectory()`, `scanFile()`, `migrate-colors.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 40`** (3 nodes): `processFile()`, `scanDir()`, `migrate-theme-v2.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 41`** (3 nodes): `processFile()`, `scanDir()`, `migrate-theme.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 42`** (3 nodes): `types.ts`, `AuthError`, `.constructor()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `now()` connect `Community 1` to `Community 0`, `Community 3`, `Community 4`, `Community 6`, `Community 7`, `Community 10`, `Community 11`?**
  _High betweenness centrality (0.142) - this node is a cross-community bridge._
- **Why does `split()` connect `Community 3` to `Community 0`, `Community 4`, `Community 5`, `Community 14`, `Community 15`, `Community 20`, `Community 21`?**
  _High betweenness centrality (0.090) - this node is a cross-community bridge._
- **Why does `loadBooks()` connect `Community 2` to `Community 0`, `Community 5`?**
  _High betweenness centrality (0.036) - this node is a cross-community bridge._
- **Are the 47 inferred relationships involving `now()` (e.g. with `.create()` and `.addMember()`) actually correct?**
  _`now()` has 47 INFERRED edges - model-reasoned connections that need verification._
- **Are the 20 inferred relationships involving `split()` (e.g. with `.tokenize()` and `.updateRecordAfterReview()`) actually correct?**
  _`split()` has 20 INFERRED edges - model-reasoned connections that need verification._
- **What connects `FsrsState`, `FsrsReview`, `The memlog file, from either addressing mode: {workspace}/.memlog.md or an expli` to the rest of the system?**
  _12 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.05 - nodes in this community are weakly interconnected._