# Graph Report - versy-flow-3  (2026-09-11)

## Corpus Check
- 408 files · ~824,137 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2934 nodes · 7281 edges · 35 communities detected
- Extraction: 75% EXTRACTED · 25% INFERRED · 0% AMBIGUOUS · INFERRED: 1843 edges (avg confidence: 0.8)
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
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 220|Community 220]]
- [[_COMMUNITY_Community 221|Community 221]]
- [[_COMMUNITY_Community 222|Community 222]]
- [[_COMMUNITY_Community 223|Community 223]]

## God Nodes (most connected - your core abstractions)
1. `now()` - 111 edges
2. `join()` - 100 edges
3. `map()` - 99 edges
4. `pe()` - 94 edges
5. `filter()` - 91 edges
6. `v()` - 79 edges
7. `c()` - 74 edges
8. `split()` - 70 edges
9. `Jm()` - 65 edges
10. `Ms` - 51 edges

## Surprising Connections (you probably didn't know these)
- `detectLapse()` --calls--> `map()`  [INFERRED]
  C:\Users\joyda\ZCodeProject\VersyFlow\tests\api\progress-service-api.test.ts → www\assets\SupabaseAuthService-ZUJflQrW.js
- `getMostForgottenWords()` --calls--> `map()`  [INFERRED]
  C:\Users\joyda\ZCodeProject\VersyFlow\tests\api\progress-service-api.test.ts → www\assets\SupabaseAuthService-ZUJflQrW.js
- `mapDomainEventToTelemetry()` --calls--> `now()`  [INFERRED]
  src\services\telemetry-listener.ts → C:\Users\joyda\ZCodeProject\VersyFlow\_bmad\scripts\memlog.py
- `calculateStreak()` --calls--> `now()`  [INFERRED]
  C:\Users\joyda\ZCodeProject\VersyFlow\tests\api\progress-service-api.test.ts → C:\Users\joyda\ZCodeProject\VersyFlow\_bmad\scripts\memlog.py
- `V()` --calls--> `A`  [INFERRED]
  www\assets\auth-store-88gzQI9Y.js → www\assets\repository-CzI88KRG.js

## Communities

### Community 0 - "Community 0"
Cohesion: 0.01
Nodes (342): parseReference(), memorize(), generateVerseId(), e(), abortSignal(), ae(), ai(), ajax() (+334 more)

### Community 1 - "Community 1"
Cohesion: 0.02
Nodes (219): B(), U(), y(), makeBibleRepo(), makeMockFsrsEngine(), makeMockDb(), contains(), remove() (+211 more)

### Community 2 - "Community 2"
Cohesion: 0.01
Nodes (77): goToNext(), goToPrevious(), makeCurrent(), toggleClass(), ChapterScreen(), ComparisonEngine, resetContextStore(), handleSwitch() (+69 more)

### Community 3 - "Community 3"
Cohesion: 0.01
Nodes (50): AsyncStorageAdapter, L(), Pd(), Td, V(), getMemorizationService(), load(), CapacitorStorage (+42 more)

### Community 4 - "Community 4"
Cohesion: 0.02
Nodes (57): BibleJsonFileSource, ButtonPrimary(), changeMonth(), isRTL(), EmptyState(), AuthGate(), The memlog file, from either addressing mode: {workspace}/.memlog.md or an expli, resolve() (+49 more)

### Community 5 - "Community 5"
Cohesion: 0.02
Nodes (14): LearnerProfileRepositoryPowerSync, rowToEntity(), closePowerSyncDatabase(), getPowerSyncDatabase(), peekPowerSyncDatabase(), buildPowerSyncSchema(), PowerSyncSyncService, cs() (+6 more)

### Community 6 - "Community 6"
Cohesion: 0.04
Nodes (21): InsForgeAuthService, handleLogin(), handleSignup(), SupabasePowerSyncConnector, Be(), D(), _e(), Ft() (+13 more)

### Community 7 - "Community 7"
Cohesion: 0.03
Nodes (88): CloudMemorizationService, renderSection(), readFile(), runImport(), coerceStatus(), fnv1a64(), formatUuid(), isoToMs() (+80 more)

### Community 8 - "Community 8"
Cohesion: 0.03
Nodes (99): handleCreate(), resolveBookId(), fixDoubleColon(), scanDir(), fixFile(), scanDir(), L(), M() (+91 more)

### Community 9 - "Community 9"
Cohesion: 0.03
Nodes (45): BackupScreen(), BootScreen(), Sm2FallbackEngine, FatigueDetector, fillTemplate(), generateBookData(), generateVerseText(), randomChoice() (+37 more)

### Community 10 - "Community 10"
Cohesion: 0.03
Nodes (15): BibleNotFoundError, BibleService, ChapterNotFoundError, VerseNotFoundError, I18nService, TranslationRegistry, buildReference(), getEnglishName() (+7 more)

### Community 11 - "Community 11"
Cohesion: 0.04
Nodes (29): FamilyInvitationRepositoryPowerSync, familyInvitationRowToEntity(), familyInvitationToRow(), familyMembershipRowToEntity(), familyMembershipToRow(), familyRowToEntity(), familyToRow(), isoToMs() (+21 more)

### Community 12 - "Community 12"
Cohesion: 0.05
Nodes (55): ConfigError, _detect_keyed_merge_field(), load_central_config(), load_customization(), load_toml(), _merge_arrays(), merge_layers(), Shared strict TOML loading and structural merge support. (+47 more)

### Community 13 - "Community 13"
Cohesion: 0.04
Nodes (33): M(), getFsrsEngine(), handleBack(), daysAgo(), selectFamily(), I18nService, isRTL(), handleSignOut() (+25 more)

### Community 14 - "Community 14"
Cohesion: 0.16
Nodes (17): be(), _e(), ee(), Fe(), Ie(), ke(), Me(), re() (+9 more)

### Community 15 - "Community 15"
Cohesion: 0.27
Nodes (12): addSortIndicators(), enableUI(), getNthColumn(), getTable(), getTableBody(), getTableHeader(), loadColumns(), loadData() (+4 more)

### Community 16 - "Community 16"
Cohesion: 0.22
Nodes (2): InMemoryBibleTextSource, LocalBibleRepository

### Community 17 - "Community 17"
Cohesion: 0.17
Nodes (6): useFlashcard(), useProgressiveMask(), useRandomMask(), useRecallWriting(), useSmartMask(), useMemoryCapabilityHook()

### Community 18 - "Community 18"
Cohesion: 0.24
Nodes (1): e1

### Community 19 - "Community 19"
Cohesion: 0.28
Nodes (3): FsrsReview, FsrsState, WasmFsrsEngine

### Community 20 - "Community 20"
Cohesion: 0.29
Nodes (1): MainApplication

### Community 21 - "Community 21"
Cohesion: 0.33
Nodes (3): calculateMasteryLevel(), fsrsRatingToString(), isMastered()

### Community 22 - "Community 22"
Cohesion: 0.33
Nodes (1): MainActivity

### Community 23 - "Community 23"
Cohesion: 0.33
Nodes (1): NoOpAiCoachAdapter

### Community 24 - "Community 24"
Cohesion: 0.6
Nodes (5): canInviteMember(), canManageFamily(), canManageLocalProfile(), canRemoveMember(), hasPermission()

### Community 27 - "Community 27"
Cohesion: 0.4
Nodes (2): ThemeProvider(), useColorScheme()

### Community 28 - "Community 28"
Cohesion: 0.83
Nodes (2): f(), v()

### Community 32 - "Community 32"
Cohesion: 0.67
Nodes (1): m()

### Community 34 - "Community 34"
Cohesion: 0.67
Nodes (1): AuthError

### Community 36 - "Community 36"
Cohesion: 0.67
Nodes (1): NoOpTelemetryUploadAdapter

### Community 37 - "Community 37"
Cohesion: 1.0
Nodes (2): makeDataset(), makeRepo()

### Community 220 - "Community 220"
Cohesion: 1.0
Nodes (1): Return 'code' or 'id' if every table item carries that *same* field.      All it

### Community 221 - "Community 221"
Cohesion: 1.0
Nodes (1): Shape-aware array merge. Base + override combined tables may opt into     keyed

### Community 222 - "Community 222"
Cohesion: 1.0
Nodes (1): Recursively merge override into base using structural rules.     - Table + table

### Community 223 - "Community 223"
Cohesion: 1.0
Nodes (1): Write JSON as UTF-8 so Windows cp1252 stdout can carry emoji icons.

## Knowledge Gaps
- **16 isolated node(s):** `FsrsState`, `FsrsReview`, `Shared strict TOML loading and structural merge support.`, `Raised when a present configuration layer cannot be used safely.`, `Load a TOML table, allowing absence only for optional layers.` (+11 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 16`** (14 nodes): `InMemoryBibleTextSource`, `.constructor()`, `.load()`, `LocalBibleRepository`, `.constructor()`, `.getBook()`, `.getBooks()`, `.getChapter()`, `.getChapterVerses()`, `.getVerse()`, `.getVerseCount()`, `.resolve()`, `normalizeBook()`, `repository-local.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 18`** (10 nodes): `e1`, `.componentDidMount()`, `.componentDidUpdate()`, `.constructor()`, `.contextType()`, `.getDerivedStateFromProps()`, `.onTabButtonClick()`, `.render()`, `.renderTabButton()`, `.selectTab()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 20`** (7 nodes): `MainApplication.kt`, `getJSMainModuleName()`, `getPackages()`, `getUseDeveloperSupport()`, `MainApplication`, `.onConfigurationChanged()`, `.onCreate()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 22`** (6 nodes): `MainActivity.kt`, `MainActivity`, `.createReactActivityDelegate()`, `.getMainComponentName()`, `.invokeDefaultOnBackPressed()`, `.onCreate()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 23`** (6 nodes): `types.ts`, `NoOpAiCoachAdapter`, `.getDailyPlan()`, `.getInsights()`, `.getRecommendations()`, `.getWeeklyReport()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 27`** (5 nodes): `ThemeProvider.tsx`, `useColorScheme.ts`, `ThemeProvider()`, `useTheme()`, `useColorScheme()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 28`** (4 nodes): `useTheme-Bsg9-zFb.js`, `f()`, `v()`, `useTheme-Bsg9-zFb.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 32`** (3 nodes): `status-tap-9e78mkNs.js`, `m()`, `status-tap-9e78mkNs.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 34`** (3 nodes): `types.ts`, `AuthError`, `.constructor()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 36`** (3 nodes): `upload-adapter.ts`, `NoOpTelemetryUploadAdapter`, `.upload()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 37`** (3 nodes): `makeDataset()`, `makeRepo()`, `bible-registry-repository.test.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 220`** (1 nodes): `Return 'code' or 'id' if every table item carries that *same* field.      All it`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 221`** (1 nodes): `Shape-aware array merge. Base + override combined tables may opt into     keyed`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 222`** (1 nodes): `Recursively merge override into base using structural rules.     - Table + table`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 223`** (1 nodes): `Write JSON as UTF-8 so Windows cp1252 stdout can carry emoji icons.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `now()` connect `Community 3` to `Community 0`, `Community 1`, `Community 2`, `Community 5`, `Community 6`, `Community 7`, `Community 8`, `Community 9`, `Community 11`, `Community 12`, `Community 13`?**
  _High betweenness centrality (0.075) - this node is a cross-community bridge._
- **Why does `map()` connect `Community 7` to `Community 0`, `Community 1`, `Community 2`, `Community 3`, `Community 4`, `Community 5`, `Community 6`, `Community 8`, `Community 9`, `Community 10`, `Community 11`, `Community 13`, `Community 14`, `Community 18`?**
  _High betweenness centrality (0.075) - this node is a cross-community bridge._
- **Why does `Jm()` connect `Community 0` to `Community 1`, `Community 2`, `Community 3`, `Community 4`, `Community 5`, `Community 6`, `Community 7`, `Community 8`, `Community 13`?**
  _High betweenness centrality (0.064) - this node is a cross-community bridge._
- **Are the 109 inferred relationships involving `now()` (e.g. with `.review()` and `.constructor()`) actually correct?**
  _`now()` has 109 INFERRED edges - model-reasoned connections that need verification._
- **Are the 64 inferred relationships involving `join()` (e.g. with `s()` and `qe()`) actually correct?**
  _`join()` has 64 INFERRED edges - model-reasoned connections that need verification._
- **Are the 77 inferred relationships involving `map()` (e.g. with `__vite__mapDeps()` and `We()`) actually correct?**
  _`map()` has 77 INFERRED edges - model-reasoned connections that need verification._
- **Are the 71 inferred relationships involving `filter()` (e.g. with `M()` and `.getDueItems()`) actually correct?**
  _`filter()` has 71 INFERRED edges - model-reasoned connections that need verification._