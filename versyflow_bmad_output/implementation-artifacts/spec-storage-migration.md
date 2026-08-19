---
title: 'Storage Migration — Profile-Aware Keys'
type: 'feature'
created: '2026-08-10'
status: 'draft'
review_loop_iteration: 0
baseline_revision: '614f275'
context:
  - 'docs/12-capabilities/FAMILY_ARCHITECTURE_TASKBOARD.md'
  - 'docs/12-capabilities/FAMILY_ARCHITECTURE_AUDIT.md'
  - 'docs/30-domain-rulebook.md'
  - 'versyflow_bmad_output/implementation-artifacts/epic-family-context.md'
warnings: []
---

<intent-contract>

## Intent

**Problem:** Les clés MMKV existantes (`versyflow:record:...`, `versyflow:reviewlog:...`) n'incluent pas de `learnerProfileId`, ce qui empêche l'isolation des données entre profils.

**Approach:** Créer un système de clé préfixée par profileId avec rétrocompatibilité — lecture des deux formats pendant la migration, écriture uniquement avec le nouveau format. Migration idempotente des données existantes vers le default profile.

## Boundaries & Constraints

**Always:**
- Anciennes clés conservées en lecture (rétrocompatibilité)
- Migration idempotente (multi-exécution = pas de duplication)
- P0: Aucune donnée perdue

**Block If:**
- Aucune décision humaine requise

**Never:**
- Supprimer les anciennes clés avant migration complète
- Dupliquer les moteurs FSRS/Progress/Memorization

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| HAPPY_PATH — Key with profile | profileId + recordId | Key: `versyflow:{profileId}:record:...` | N/A |
| HAPPY_PATH — Migration | Legacy keys exist | Data re-indexed under default profile | N/A |
| EDGE_CASE — No active profile | No profile selected | Returns null, UI shows selector | N/A |
| EDGE_CASE — Dual-read | Old + new keys exist | Returns merged results | N/A |

</intent-contract>

## Code Map

- `src/infrastructure/storage/mmkv-storage.ts` — MODIFIED: add prefix method
- `src/infrastructure/migration/profile-migration.ts` — NEW: migration script
- `src/services/migration-service.ts` — NEW: orchestration service
- `tests/unit/services/profile-migration.test.ts` — NEW: migration tests

## Tasks & Acceptance

**Execution:**
- [ ] `src/infrastructure/storage/mmkv-storage.ts` -- Add `prefixedKey(profileId, key)` static method for key namespacing
- [ ] `src/infrastructure/migration/profile-migration.ts` -- Create migration logic: scan legacy keys, create default profile, re-index records
- [ ] `src/services/migration-service.ts` -- Orchestrate migration on app boot
- [ ] `tests/unit/services/profile-migration.test.ts` -- Unit tests for migration

**Acceptance Criteria:**
- Given legacy keys exist, when migrate is called, then a default profile is created and keys are re-indexed
- Given migration runs twice, when checked, then no duplicate data exists (idempotent)
- Given no active profile, when getStoragePrefix is called, then null is returned
- Given active profile "prof-1", when getStoragePrefix is called, then "versyflow:prof-1:" is returned
- All 6 tests pass
- Existing tests still pass (no regression)

## Verification

**Commands:**
- `npm test -- tests/unit/services/profile-migration.test.ts` -- expected: 6 tests pass
- `npm test -- tests/e2e/ tests/api/` -- expected: no regression
