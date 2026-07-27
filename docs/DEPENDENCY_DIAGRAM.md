# VersyFlow — Dependency Diagram

> Graphique de dépendances actualisé depuis MASTER_BACKLOG.md
> Généré automatiquement par Cellule 2: Architecture Control — VCC

---

## Vue d'ensemble

```
Sprint 0 (Jours 1-10) → Sprint 1 (Jours 11-20) → Sprint 2 → Sprint 3 → Sprint 4 → Sprint 5
   [DONE: 82%]              [BLOCKED: LSG.json]      [Blocked]    [Blocked]     [Blocked]     [Blocked]

Chemin Critique:
  S0-01 → S0-03 → S0-07 → S0-08 → S0-09 → [LSG.json S1-XX] → Sprint 1 → Sprint 2 WASM → ...
```

---

## Dépendances Sprint 0 Complètes

### Infrastructure Base (Forge)
```
S0-01: Expo Init
    ↓
S0-02: ESLint/Prettier/Husky ←┐
    ↓                          │
S0-03: Folder Structure ───────┼→ S0-15: CI Pipeline
    ↓                          │
S0-04: Design Tokens ──────────┼→ S0-05: UI Primitives
    ↓                          │
S0-07: TS Types ───────────────┘
```

### Domain Layer (Anvil)
```
S0-03 → S0-07 → S0-08: IFsrsEngine
                    ↓
               S0-09: Fallback SM-2
                    ↓
               [Bloqué pour Sprint 2: WASM]
```

### Storage & Infrastructure
```
S0-03 → S0-06: Storage Skeleton
                  ↓
          [À faire: MMKV Runtime Wiring — Bloque Sprint 1]
```

### State Management
```
S0-03 → S0-10: Zustand Stores
                  ↓
          [Fonctionnel mais stubs — besoin connexion S1]
```

### Navigation & UI Shell (Herald)
```
S0-03 → S0-11: Expo Router Shell
    ↓
S0-12: Root Layout + i18n Init
    ↓
S0-13: i18n Service
    ↓
[Traductions FR/EN prêtes, AR/DE/ZH en attente]
```

---

## Dépendances Blocking pour Sprint 1

### Blocker P0: LSG.json Data File
```
Scribe agent
    → data/bible/lsg.json (~2-5MB JSON, ~31K versets)
        ↓ ZOD validation (Anvil)
        ↓ BibleDomain parser (Anvil)
            ↓ BookListScreen (Herald)
                ↓ ChapterListScreen (Herald)
                    ↓ VerseListScreen (Herald)
                        ↓ Memorization flow (Anvil/Scribe)
                            ↓ Sprint 2 FSRS integration
```

### Blocker P1: MMKV Runtime
```
Storage skeleton (Anvil, S0-06 DONE)
    ↓ Need: Real MMKV client wired in app
        ↓ Settings persistence (Anvil)
            ↓ User onboarding save/load
```

### Blocker P2: i18n Complet
```
FR locale (150+ keys) ✓
EN locale (150+ keys) ✓
AR locale (150+ keys) ⚠️ PARTIAL
DE locale (150+ keys) ⚠️ NOT STARTED
ZH locale (150+ keys) ⚠️ NOT STARTED
    ↓ RTL testing (Herald)
        ↓ Settings language change (Herald)
```

---

## Graphique Complet des Dépendances (Textuel)

```
[TOUS COMPOSANTS S0-XX]
         ↓
    [Sprint 0 COMPLETE]
         ↓
[LSG.json creation (Scribe)] + [MMKV wiring (Anvil)] + [i18n remaining (Translator)]
         ↓                                    ↓                           ↓
[Sprint 1 DEBUT possible]              [Sprint 1 peut commencer      [Sprint 1 peut commencer
                                     sans ces 2 blocages]        avec traduction FR/EN uniquement]

[Sprint 1: Onboarding + Bible Nav]
         ↓
[Sprint 2: Mémorisation + FSRS]
    ↓ WASM compilation (Forge) ou FallbackEngine ok (déjà implémenté)
    ↓ Session Engine (Anvil) + Comparison Engine (Anvil) + Memory Strategies (Scribe)
    ↓
[Sprint 3: Révisions + Stats]
    ↓ ReviewQueueScreen + ReviewSessionScreen (Herald)
    ↓ FsrsService orchestration + ProgressService (Scribe/Anvil)
    ↓
[Sprint 4: Polish + Tests]
    ↓ Settings Screen + animations polish (Herald)
    ↓ Unit tests >90% domains + Integration tests (Anvil)
    ↓ E2E Detox (Anvil) + Performance audit (Scribe)
    ↓
[Sprint 5: Beta Release]
    ↓ Build APK + IPA (Forge)
    ↓ Screenshots + App Store prep (Herald)
```

---

## Métriques Dépendances

| Métrique | Valeur |
|----------|--------|
| Dépendances totales | 23 |
| Bloquantes (P0) | 2 (LSG.json, MMKV runtime) |
| Non-bloquantes | 21 |
| Parallelisable entre Sprint 1-2 | 60% |
| Critique path length | 10 étapes |

---

*Ce diagramme est auto-généré et mis à jour à chaque sprint par Guardian.*
*Source: MASTER_BACKLOG.md + EXECUTION_ROADMAP.md + DEPENDENCY_GRAPH.md*
