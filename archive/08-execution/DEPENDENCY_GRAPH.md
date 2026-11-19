# VersyFlow — Dépendances entre Tâches (Dependency Graph)

> Document généré par le CEO Multi-Agent
> Chaque tâche dépend de Zéro, Une ou Plusieurs autres tâches. Construire le graphe pour maximiser le parallelisme.

---

## Legend

- **ZERO** = peut démarrer immédiatement (aucune dépendance)
- **A -> B** = B dépend de A (B ne commence que quand A est termine)
- **PARALLEL** = ces tâches peuvent se faire en même temps (pas de dépendance entre elles)

---

## Sprint 0 — Dépendances (Chemin Critique: Forge)

```
[S0-Forge-1: Expo init] --> [S0-Forge-2: ESLint/Prettier] --> [S0-Forge-3: Folder structure]
                                                                              |
                                                              +---------------+---------------+
                                                              |               |               |
                                                    [S0-Forge-4: Tab shell]  [S0-Forge-5: Zustand skeleton]  [S0-Forge-6: Design tokens]
                                                              |                                      |                          |
                                                              |                              [S0-Anvil-3: IFsrsEngine]    [S0-Herald-1: 3 primitives]
                                                              |                                      |                          |
                                                    [S0-Anvil-1: Types TS] <--+                                 |
                                                              |                                              |
                                                    [S0-Anvil-2: MMKV adapter]                             |
                                                              |                                              |
                                                    [S0-Anvil-4: Mock storage]                             |
                                                              |                                              |
                                                    [S0-Forge-7: Rust/Cargo] --> [S0-Forge-8: CI pipeline]
```

### Tableau des dépendances Sprint 0

| Tâche | Dépend de | Débloque | Parallélisable avec |
|-------|-----------|----------|-------------------|
| S0-Forge-1: Expo init | ZERO | S0-Forge-2 | S0-Anvil-1 |
| S0-Forge-2: ESLint/Prettier | S0-Forge-1 | S0-Forge-3, S0-Forge-8 | S0-Anvil-1 |
| S0-Forge-3: Folder structure | S0-Forge-2 | S0-Forge-4/5/6, S0-Anvil-1/2/3/4, S0-Forge-7 | Aucune |
| S0-Forge-4: Tab navigation | S0-Forge-3 | S1-Herald (ecrans onboarding) | S0-Anvil-2, S0-Forge-6 |
| S0-Forge-5: Zustand skeleton | S0-Forge-3 | S1-Anvil (stores complets) | S0-Forge-6 |
| S0-Forge-6: Design tokens | S0-Forge-3 | S0-Herald-1 (primitives utilisent tokens) | S0-Anvil-1/2/3/4 |
| S0-Forge-7: Rust/Cargo | S0-Forge-3 | S2-Forge-WASM | S0-Forge-4/5/6 |
| S0-Forge-8: CI pipeline | S0-Forge-2, S0-Forge-3 | Sprint 4 validation | S0-Anvil-2 |
| S0-Anvil-1: Types TS | S0-Forge-3 | S0-Anvil-2/3 | S0-Forge-4/5/6 |
| S0-Anvil-2: MMKV adapter | S0-Anvil-1 | Sprint 1 settings persistence | S0-Anvil-3/4 |
| S0-Anvil-3: IFsrsEngine | S0-Anvil-1 | S2-Forge-WASM bridge | S0-Anvil-2/4 |
| S0-Anvil-4: Mock storage | S0-Anvil-2 | Tests Sprint 4 | S0-Anvil-3 |

---

## Sprint 1 — Dépendances

```
[Translator-01: I18nService] --> [Translator-02: useI18n hook]
                                                         |
                +----------------------------------------+----------------------------------------+
                |                                        |                                        |
        [Translator-03: fr.json]              [Translator-04: en.json]              [Translator-05: ar.json + de.json + zh.json]
                |                                        |                                        |
                +----------------------------------------+----------------------------------------+
                                                         |
                                                 [Herald-01: WelcomeScreen]
                                                         |
                                    +--------------------+--------------------+
                                    |                                       |
                            [Herald-02: LanguagePicker]              [Herald-03: TranslationPicker]
                                    |                                       |
                            [Herald-09: RTL wiring]              [Guardian-01: Settings persist]
                                    |
                            [Herald-04: BookListScreen]
                                    |
                            [Herald-05: ChapterListScreen]
                                    |
                            [Herald-06: VerseListScreen]
                                    |
                            [Herald-07: ReferenceSearchInput]
```

### Tableau des dépendances Sprint 1

| Tâche | Dépend de | Débloque | Parallels |
|-------|-----------|----------|-----------|
| Translator-01: I18nService | S0 | Translator-02, Herald-01 | Scribe-01, Guardian-01 |
| Translator-02: useI18n hook | Translator-01 | Herald hooks | Aucune autre |
| Translator-03 à 05: locales | S0, Translator-02 | Herald (tous ecrans utilisent t()) | Chaque locale est en PARALLEL |
| Scribe-01: LSG.json skeleton | S0-Forge-3, S0-Anvil-1 | Scribe-02, Scribe-03 | Herald-04 |
| Scribe-02: OT verses (23K) | Scribe-01 | Scribe-03, Herald-06 | Aucune |
| Scribe-03: NT verses (8K) | Scribe-02 | Scribe-04 (validation) | Herald-05, Herald-06 |
| Scribe-04: Validate LSG.json | Scribe-03 | Anvil tests bible domain | Herald-06 |
| Herald-01: WelcomeScreen | S0-Forge-4 | S1 onboarding flow complete | Scribe-01 |
| Herald-02: LanguagePicker | Herald-01, Translator-03, 04, 05 | Herald-03 | Aucune |
| Herald-03: TranslationPicker | Herald-02 | Accueil screen (lien vers) | Herald-04 |
| Herald-04: BookListScreen | S0-Forge-4, Scribe-01 | Herald-05 | Scribe-02 |
| Herald-05: ChapterListScreen | Herald-04 | Herald-06 | Aucune |
| Herald-06: VerseListScreen | Herald-05, Scribe-04 | Herald-07, MemorizationSession (Sprint 2) | Herald-07 |
| Herald-07: ReferenceSearchInput | Herald-06 | Sprint 1 validation | Aucune |
| Herald-09: RTL wiring | Herald-02 (LanguagePicker) | Sprint 1 validation | Herald-05, Herald-06 |
| Guardian-01: Settings persist | S0-Anvil-2 | Herald-02 skip logic | Herald-01, Herald-03 |

---

## Sprint 2 — Dépendances

```
[Forge-01: Build WASM] ------> [Forge-02: WASM loader]
                                          |
                          +-------------+-------------+
                          |                           |
                  [Scribe-01: FsrsService]      [Scribe-02: FallbackEngine]
                          |                           |
                          +-------------+-------------+
                                        |
                                [Anvil-01: MemorizationDomain]
                                        |
                        +---------------+---------------+
                        |               |               |
                [Anvil-02: Memo Screen]  [Anvil-03: WordChip]  [Anvil-05: Persist record]
                        |               |               |
                        +-------+-------+               |
                                |                       |
                        [Anvil-04: Confirm Screen] ----+
                                |
                        [Guardian-01: Event bus]
                                |
                +---------------+---------------+
                |               |               |
         [Guardian-02: MEM-001] [Guardian-03: MEM-002] [Guardian-04: MEM-003]
```

### Tableau des dépendances Sprint 2

| Tâche | Dependent de | Deblocque | Parallelisable avec |
|-------|-------------|-----------|-------------------|
| Forge-01: Build WASM | S0-Forge-7 (Rust setup) | Forge-02, S2-A-Anvil-06 | Scribe-02 |
| Forge-02: WASM loader | Forge-01 | Scribe-01 | Scribe-02 |
| Scribe-02: FallbackEngine | S0-Anvil-3 (IFsrsEngine) | Scribe-01 (injection) | Forge-01 |
| Scribe-01: FsrsService | S0-Anvil-3, Forge-02, Scribe-02 | Anvil-06, Sprint 3 review | Forge-01 |
| Anvil-01: MemorizationDomain | S0-Anvil-1, S0-Anvil-3 | Anvil-02/03/05 | Scribe-01 |
| Anvil-02: Memo Screen | S1-Herald-06, Anvil-01 | Anvil-04 | Anvil-03, Anvil-05 |
| Anvil-03: WordChip | Anvil-01 | Anvil-02 | Anvil-02, Anvil-05 |
| Anvil-04: Confirm Screen | Anvil-02, Anvil-03 | Sprint 2 validation | Anvil-05 |
| Anvil-05: Persist record | Anvil-01 | Anvil-02, Scribe-01 | Anvil-02, Anvil-03, Anvil-04 |
| Anvil-06: Wire session+store | Anvil-02, Anvil-05 | Sprint 2 validation | Aucune |
| Guardian-01: Event bus | S0-Anvil-3 | Guardian-02/03/04/05 | Aucune |
| Guardian-02: MEM-001 Started | Guardian-01, Anvil-02 | Suite flow memorization | Guardian-03/04/05 |
| Guardian-03: MEM-002 Memorized | Guardian-01, Anvil-04, Scribe-01 | Sprint 2 validation | Guardian-02/04/05 |
| Guardian-04: MEM-003 Abandoned | Guardian-01, Anvil-02 | Suite flow | Guardian-02/03/05 |
| Guardian-05: MEM-004 Favorite | Guardian-01, Anvil-02/06 | Suite flow | Guardian-02/03/04 |

---

## Sprint 3 — Dépendances

```
[Scribe-01: Review queue calc] <-- [S2-Scribe-01: FsrsService]
          |
  +-------+-------+
  |               |
[Herald-01: ReviewQueueScreen]    [Anvil-01: ReviewSessionScreen]
          |                               |
  +-------+-------------------------------+-------+
  |               |                               |
  v               v                               v
[Guardian-01: REV-001]          [Anvil-02: Rating system]       [Scribe-02: Review log persist]
                                                          |
                                                  [Guardian-02: REV-002]
                                                          |
                                                  [Scribe-03: ProgressService]
                                                          |
                                          +---------------+---------------+
                                          |               |               |
                                  [Anvil-03: StatsGrid]   [Anvil-04: Streak badge]  [Anvil-05: Weekly chart]
                                          |
                                  [Guardian-03: PRG-001] + [Guardian-04: PRG-002]
                                          |
                                  [Herald-02: Home badges]
```

---

## Sprint 4 — Dépendances (Toutes en PARALLEL)

Toutes les tâches Sprint 4 sont independantes les unes des autres car elles touchent des dossiers differents:

| Tâche | Propriétaire | Parallélise avec |
|-------|-------------|-----------------|
| S4-H-01: SettingsScreen | Herald | TOUS |
| S4-H-02: Language change live | Herald | TOUS |
| S4-H-03: Translation change live | Herald | TOUS |
| S4-H-04: Reset confirm modal | Herald | TOUS |
| S4-H-05: Animations polish | Herald | TOUS |
| S4-H-06: RTL polish Arabic | Herald | TOUS |
| S4-A-01: Unit tests domains | Anvil | TOUS |
| S4-A-02: Integration tests services | Anvil | TOUS |
| S4-A-03: E2E tests Detox | Anvil | TOUS |
| S4-S-01: Performance audit | Scribe | TOUS |
| S4-S-02: Optimize Bible list | Scribe | TOUS |
| S4-Tr-01: Review translations | Translator | TOUS |
| S4-G-01: Architecture audit | Guardian | TOUS |
| S4-G-02: Finalize CI pipeline | Guardian | TOUS |

**14 tâches en PARALLEL total. Aucun conflit possible.**

---

## Sprint 5 — Dépendances

```
[Sprint 4 COMPLETE] --> [Forge-01: Build APK] --> [Forge-03: Upload TestFlight]
                                 |
                         [Forge-02: Build IPA] --> [Forge-03: Upload TestFlight]
                                 |
                         [Herald: Screenshots] --> [Forge-03: Upload TestFlight]
```

---

## Résumé du Chemin Critique

```
S0-Forge-1/2/3 (Expo + config + structure)
  -> S0-Anvil-1 (Types TS)
    -> S0-Anvil-2 (MMKV) + S0-Anvil-3 (IFsrsEngine)
      -> S1-Scribe-01 (LSG.json skeleton)
        -> S1-Scribe-02 (OT verses) -> S1-Scribe-03 (NT verses) -> S1-Scribe-04 (validation)
          -> S2-Forge-01 (WASM build) -> S2-Scribe-01 (FsrsService)
            -> S2-Anvil-01 (MemorizationDomain)
              -> S2-Anvil-02 (Memo Screen) + S2-Anvil-05 (Persist)
                -> S3-Anvil-01 (Review Session) + S3-Scribe-03 (ProgressService)
                  -> S4 (14 tâches paralleles)
                    -> S5-Forge builds
```

**Temps minimum théorique (avec parallelisation maximale): ~45 jours ouvrés.**
**Temps estimé réaliste (avec communications humain-agent): ~66 jours ouvrés.**
