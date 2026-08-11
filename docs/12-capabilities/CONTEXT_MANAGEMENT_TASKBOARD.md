# Taskboard — Context Management & Family Mode

**Projet**: VersyFlow
**Date**: 2026-08-11
**Priorité**: P0 (Fondation réutilisable)
**Statut global**: 🟡 En cours — Phase 0 (Audit) complétée

---

## Légende

| Statut | Signification |
|--------|---------------|
| ⏳ TODO | Non commencé |
| 🔨 IN_PROGRESS | En cours |
| 🚧 BLOCKED | Bloqué (dépendance ou conflit détecté) |
| ✅ DONE | Terminé et vérifié |

---

## Phase 0: Audit (COMPLÉTÉ)

| ID | Tâche | Statut |
|----|-------|--------|
| FAM-CM-001 | Audit navigation, Design System, stores, données | ✅ DONE |

---

## Phase 1: Event Registry (FAIT PARTIEL)

| ID | Tâche | Dépendances | Statut |
|----|-------|-------------|--------|
| FAM-EVT-001 | 13 événements Family au registry | FAM-DM-001 | ✅ DONE |
| FAM-EVT-002 | EVENTS: CONTEXT_CHANGED, ACTIVE_LEARNER_CHANGED | FAM-EVT-001 | ⏳ TODO |

---

## Phase 2: Context Store

| ID | Tâche | Dépendances | Statut |
|----|-------|-------------|--------|
| FAM-CTX-001 | Créer context-store.ts (AppContext, PersonalContext, FamilyContext) | FAM-EVT-002 | ✅ DONE |
| FAM-CTX-002 | Persist lastActiveContext, lastActiveFamilyId | FAM-CTX-001 | ✅ DONE |
| FAM-CTX-003 | Adapter boot.tsx pour activation contexte | FAM-CTX-002 | ✅ DONE |

---

## Phase 3: Context Switcher UI

| ID | Tâche | Dépendances | Statut |
|----|-------|-------------|--------|
| FAM-CS-001 | Context Switcher component (header ou Plus menu) | FAM-CTX-003 | ✅ DONE |
| FAM-CS-002 | Afficher contexte actif: "PERSONNEL" ou "FAMILLE — Nom" | FAM-CS-001 | ✅ DONE |

---

## Phase 4: Family Navigation

| ID | Tâche | Dépendances | Statut |
|----|-------|-------------|--------|
| FAM-NAV-001 | Ajouter routes family/* au Stack root | FAM-CS-002 | ✅ DONE |
| FAM-NAV-002 | Écran Family Members | FAM-NAV-001 | ✅ DONE |
| FAM-NAV-003 | Écran Family Invite (QR + code) | FAM-NAV-001 | ✅ DONE |
| FAM-NAV-004 | Écran Family Join (saisie code) | FAM-NAV-001 | ✅ DONE |
| FAM-NAV-005 | Écran Profile Edit | FAM-NAV-001 | ✅ DONE |

---

## Phase 5: Learner Switcher (Family Mode)

| ID | Tâche | Dépendances | Statut |
|----|-------|-------------|--------|
| FAM-LR-001 | Learner switcher dans header Family | FAM-NAV-005 | ✅ DONE |
| FAM-LR-002 | Isolation learning data par learner | FAM-LR-001 | ✅ DONE |

---

## Phase 6: Session Safety

| ID | Tâche | Dépendances | Statut |
|----|-------|-------------|--------|
| FAM-SS-001 | Vérifier session active avant context switch | FAM-CTX-001 | ✅ DONE |
| FAM-SS-002 | Confirmation dialog si session en cours | FAM-SS-001 | ✅ DONE |

---

## Phase 7: Tests

| ID | Tâche | Dépendances | Statut |
|----|-------|-------------|--------|
| FAM-TEST-001 | Tests unitaires Context Store | FAM-CTX-003 | ✅ DONE |
| FAM-TEST-002 | Tests isolation données (Personal vs Family) | FAM-LR-002 | ✅ DONE |
| FAM-TEST-003 | Tests E2E context switch + navigation | FAM-NAV-005 | ⏳ TODO |
| FAM-TEST-004 | Tests régression Personal Mode | Toutes | ✅ DONE |

---

## Phase 8: Documentation & Audit Final

| ID | Tâche | Dépendances | Statut |
|----|-------|-------------|--------|
| FAM-DOC-001 | CONTEXT_MANAGEMENT_IMPLEMENTATION_REPORT.md | Toutes phases | ⏳ TODO |
| FAM-AUDIT-002 | Audit architectural final | Toutes phases | ⏳ TODO |

---

## Récapitulatif

| Phase | Tâches | Done | TODO |
|-------|--------|------|------|
| 0: Audit | 1 | 1 | 0 |
| 1: Event Registry | 2 | 1 | 1 |
| 2: Context Store | 3 | 0 | 3 |
| 3: Context Switcher UI | 2 | 0 | 2 |
| 4: Family Navigation | 5 | 0 | 5 |
| 5: Learner Switcher | 2 | 0 | 2 |
| 6: Session Safety | 2 | 0 | 2 |
| 7: Tests | 4 | 0 | 4 |
| 8: Documentation | 2 | 0 | 2 |
| **Total** | **23** | **3** | **20** |
