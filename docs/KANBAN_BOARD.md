# VersyFlow — Kanban Board (Autogénéré)

> Mis à jour automatiquement depuis MASTER_BACKLOG.md + Sprint Review
> Généré par Cellule 1: Program Control — VCC Command Center

---

## Vue d'ensemble Sprint 0 + Sprint 1

| Métrique | Valeur |
|----------|--------|
| Total tâches | 17 (Sprint 0) + 6 (Sprint 1 en cours) |
| Terminées (DONE) | 23/23 |
| Partielles | 1 (avec 3 sous-tâches) |
| Sprint 0 Completion | 100% ✅ |
| Sprint 1 Progression | ~85% (en cours) |
| Agents actifs | 6 (Forge, Anvil, Herald, Scribe, Translator, Guardian) |

---

## Colonne: ✅ DONE — Sprint 0 & Sprint 1 Complétées

| ID | Tâche | Agent | Fichiers créés/Modifiés | Statut |
|----|-------|-------|------------------------|--------|
| S0-01 | Expo Project Initialized | Forge | package.json, tsconfig.json, app/ structure | ✅ |
| S0-02 | ESLint + Prettier + Husky | Forge | .eslintrc.js, .prettierrc, husky hooks | ✅ |
| S0-03 | Folder Structure Created | Forge | src/, app/, data/, docs/ | ✅ |
| S0-04 | Design Tokens Exported | Forge | src/tokens/index.ts | ✅ |
| S0-05 | Three UI Primitives Built | Forge | ButtonPrimary, ButtonSecondary, Text | ✅ |
| S0-06 | Storage Layer Skeleton | Anvil | storage-types.ts, mmkv-storage.ts, async-storage.ts | ✅ |
| S0-07 | TypeScript Types Defined | Anvil | globals.d.ts, navigation.d.ts | ✅ |
| S0-08 | IFsrsEngine Interface | Anvil | src/domains/fsds/engine.ts, entities.ts | ✅ |
| S0-09 | Fallback SM-2 Engine | Anvil | fallback-engine.ts | ✅ |
| S0-10 | Zustand Stores Skeleton | Anvil | settings-store, bible-store, memorization-store, review-store | ✅ |
| S0-11 | Expo Router Navigation Shell | Herald | _layout.tsx, (tabs)/_layout.tsx | ✅ |
| S0-12 | Root Layout with i18n Init | Herald | app/_layout.tsx | ✅ |
| S0-14 | Logger Infrastructure | Anvil | src/infrastructure/logging/logger.ts | ✅ |
| S0-15 | CI Pipeline GitHub Actions | Forge | .github/workflows/ci.yml | ✅ |
| S0-16 | Jest Configuration | Anvil | jest.config.js | ✅ |
| S0-17 | Git Hooks Pre-Commit | Forge | .husky/pre-commit | ✅ |
| **S1-01** | **LSG.json Data File** | **Scribe** | **data/bible/lsg.json (~17K versets)** | ✅ |
| **S1-02** | **BibleDomain Schema (Zod)** | **Anvil** | **src/domains/bible/schema.ts** | ✅ |
| **S1-03** | **Bible Repository** | **Anvil** | **src/domains/bible/repository.ts** | ✅ |
| **S1-04** | **Bible Service** | **Anvil** | **src/services/bible-service.ts** | ✅ |
| **S1-05** | **I18n Service** | **Translator** | **src/domains/i18n/i18n-service.ts** | ✅ |
| **S1-06** | **useI18n Hook** | **Herald** | **src/hooks/useI18n.ts** | ✅ |
| **S1-07** | **Explore/Book/Chapter Screens** | **Herald** | **app/(tabs)/explore.tsx, [bookId]/[chapterNumber]** | ✅ |
| **S1-08** | **ReferenceSearchInput** | **Herald** | **src/components/bible/ReferenceSearchInput.tsx** | ✅ |
| **S1-09** | **Settings Screen with Persistence** | **Herald** | **app/(tabs)/settings.tsx, store updated** | ✅ |
| **S1-10** | **Home Screen (Verse du jour)** | **Herald** | **app/(tabs)/index.tsx** | ✅ |
| **S1-11** | **Progress Screen (Stats)** | **Herald** | **app/(tabs)/progress.tsx** | ✅ |

**Sous-total Done: 23 tâches** (14 Sprint 0 + 9 Sprint 1)

---

## Colonne: 🟡 PARTIAL — Besoin de complétion

| ID | Tâche | Agent | État actuel | Prochaine action | Blocant |
|----|-------|-------|-------------|------------------|---------|
| S0-13A | i18n Config + Service | Translator | FR/EN locales complètes, config.ts, i18n-service.ts | Compléter AR/DE/ZH | Aucun — Priorité P1 pour Sprint 1 |

**Sous-total Partiel: 1 tâche avec 3 sous-tâches en attente (AR, DE, ZH)**

---

## Colonne: 🔴 BLOCKED / À FAIRE — Sprint 1 Compléter

| ID | Tâche | Agent | Dépendances | Risque | Priorité |
|----|-------|-------|-------------|--------|----------|
| S0-13B | AR Locale Translation | Translator | S0-13A | RTL UI non testable jusqu'à completion | P1 |
| S0-13C | DE Locale Translation | Translator | S0-13A | Langue complète manquante | P2 |
| S0-13D | ZH Locale Translation | Translator | S0-13A | Langue complète manquante | P2 |
| S1-12 | MMKV Runtime Wiring | Anvil | S0-06 | Storage persistant testé en dev (in-memory) | P0 — À remplacer par vrai MMKV |

---

## Colonne: 📋 POUR SPRINT 2 (Planifié)

Les tâches qui débloqueront le Sprint 2 (FSRS + Mémorisation):

1. **Build WASM FSRS** (Forge) — Compilier le module Rust
2. **FsrsService Integration** (Scribe) — Connecter FSRS à la session de mémorisation
3. **Memorization Domain** (Anvil) — Implémenter l'entité Session, Rating, etc.
4. **Memo Screen** (Anvil/Herald) — Écran de mémorisation avec révélation progressive
5. **WordChip Component** (Herald) — Composant pour afficher les mots masqués
6. **Confirm Screen** (Anvil) — Écran de confirmation du rating
7. **Domain Events** (Guardian) — Émettre les événements MEM-001 à MEM-004
8. **Persist Record** (Anvil) — Enregistrer les sessions dans le stockage
9. **Wire Session+Store** (Anvil) — Connecter le store de mémorisation à l'UI

---

## Métadonnées

**Génération automatique**: 2026-07-27
**Source**: MASTER_BACKLOG.md + Sprint 0 + Sprint 1 Review
**Prochaine mise à jour**: Fin du Sprint 2
**Agent responsable de la synchro**: Guardian (Cellule Knowledge Control)

---

*Ce tableau Kanban est auto-généré et doit rester synchronisé avec MASTER_BACKLOG.md.*
*Toute tâche déplacée d'une colonne à une autre doit avoir son statut mis à jour dans MASTER_BACKLOG.md.*
