# VersyFlow — Kanban Board (Autogénéré)

> Mis à jour automatiquement depuis MASTER_BACKLOG.md + Sprint Review
> Généré par Cellule 1: Program Control — VCC Command Center

---

## Vue d'ensemble Sprint 0

| Métrique | Valeur |
|----------|--------|
| Total tâches | 17 |
| Terminées (DONE) | 14 |
| Partielles | 2 |
| En retard/Bloquées | 1 |
| Sprint Completion | 82% |
| Agents actifs | 6 (Forge, Anvil, Herald, Scribe, Translator, Guardian) |

---

## Colonne: ✅ DONE — Prêt à passer au prochain sprint

| ID | Tâche | Agent | Fichiers créés/Modifiés |
|----|-------|-------|------------------------|
| S0-01 | Expo Project Initialized | Forge | package.json, app.json, tsconfig.json, babel.config.js, metro.config.js |
| S0-02 | ESLint + Prettier + Husky | Forge | .eslintrc.js, .prettierrc, .husky/pre-commit, lint-staged.config.js |
| S0-03 | Folder Structure Created | Forge | src/, app/, data/, tests/ directories |
| S0-04 | Design Tokens Exported | Forge | src/tokens/index.ts |
| S0-05 | Three UI Primitives Built | Forge | ButtonPrimary.tsx, ButtonSecondary.tsx, Text.tsx |
| S0-06 | Storage Layer Skeleton | Anvil | storage-types.ts, mmkv-storage.ts, async-storage.ts |
| S0-07 | TypeScript Types Defined | Anvil | globals.d.ts, navigation.d.ts |
| S0-08 | IFsrsEngine Interface | Anvil | engine.ts, entities.ts, index.ts (fsrs domain) |
| S0-09 | Fallback SM-2 Engine | Anvil | fallback-engine.ts |
| S0-10 | Zustand Stores Skeleton | Anvil | settings-store.ts, bible-store.ts, memorization-store.ts, review-store.ts |
| S0-11 | Expo Router Navigation Shell | Herald | _layout.tsx, +not-found.tsx, tabs/_layout.tsx |
| S0-12 | Root Layout with i18n Init | Herald | app/_layout.tsx |
| S0-14 | Logger Infrastructure | Anvil | logger.ts |
| S0-15 | CI Pipeline GitHub Actions | Forge | ci.yml |
| S0-16 | Jest Configuration | Anvil | jest.config.js |
| S0-17 | Git Hooks Pre-Commit | Forge | .husky/pre-commit |

**Sous-total Done: 14 tâches**

---

## Colonne: 🟡 PARTIAL — Besoin de complétion

| ID | Tâche | Agent | État actuel | Prochaine action | Blocant |
|----|-------|-------|-------------|------------------|---------|
| S0-13A | i18n Config + Service | Translator | FR locale complete (150+ keys), EN locale complete (150+ keys), config.ts créé, i18n-service.ts créé | Terminer AR/DE/ZH locales | Aucun — Priorité P1 pour Sprint 1 |

**Sous-total Partiel: 1 tâche avec 1 sous-tâche en attente**

---

## Colonne: 🔴 BLOCKED / À FAIRE

| ID | Tâche | Agent | Dépendances | Risque | Priorité |
|----|-------|-------|-------------|--------|----------|
| S0-13B | AR Locale Translation | Translator | S0-13A | RTL UI non testable jusqu'à completion | P1 |
| S0-13C | DE Locale Translation | Translator | S0-13A | Langue complète manquante | P2 |
| S0-13D | ZH Locale Translation | Translator | S0-13A | Langue complète manquante | P2 |
| S0-XX | MMKV Runtime Wiring | Anvil | Aucune — mais dépend de S0-06 | Storage persistant non testé en runtime | P0 Sprint 1 |

---

## Colonne: 📋 POUR SPRINT 1 (Déjà planifié)

Les tâches qui débloqueront le Sprint 1 doivent être priorisées dans l'ordre suivant:

1. **LSG.json Data File** (Blocker Critique) — Scribe agent
   - ~31K versets LSG en format JSON valide
   - Zod validation au load
   - Débloque toute la Bible navigation

2. **MMKV Runtime Integration** (Anvil)
   - Remplacer les stubs par vrai MMKV
   - Persistance settings + mémorization records

3. **Arabe/Allemand/Chinois Translations** (Translator)
   - 450 clés supplémentaires × 3 fichiers = 1350 lignes

4. **Bible Browser Screens** (Herald)
   - BookListScreen → ChapterListScreen → VerseListScreen
   - ReferenceSearchInput

5. **Onboarding Screens** (Herald + Translator)
   - LanguagePicker (5 langues)
   - TranslationPicker (LSG default)

6. **BibleDomain Parser Enhancements** (Anvil)
   - Index recherche en mémoire
   - Alias map complet pour 66 livres

---

## Métadonnées

**Génération automatique**: 2026-07-27
**Source**: MASTER_BACKLOG.md + Sprint 0 Review
**Prochaine mise à jour**: Fin du Sprint 1
**Agent responsable de la synchro**: Guardian (Cellule Knowledge Control)

---

*Ce tableau Kanban est auto-généré et doit rester synchronisé avec MASTER_BACKLOG.md.*
*Toute tâche déplacée d'une colonne à une autre doit avoir son statut mis à jour dans MASTER_BACKLOG.md.*
