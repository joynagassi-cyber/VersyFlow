---
title: 'Family Capability — Service & Store'
type: 'feature'
created: '2026-08-10'
status: 'draft'
review_loop_iteration: 0
baseline_revision: '614f275'
context:
  - 'docs/12-capabilities/FAMILY_ARCHITECTURE_TASKBOARD.md'
  - 'versyflow_bmad_output/implementation-artifacts/epic-family-context.md'
warnings: []
---

<intent-contract>

## Intent

**Problem:** Le modèle Family existe mais aucun service ni store ne gère les familles, membres et permissions.

**Approach:** Implémenter FamilyService (CRUD + membres) et FamilyStore (état global). Le service utilise les repository interfaces. Le store gère la famille active et les membres.

## Boundaries & Constraints

**Always:**
- Service injecte IFamilyRepository via constructeur
- Store utilise Zustand persist
- Permissions vérifiées avant actions sensibles
- Famille = optionnel (profil existe sans famille)

**Block If:**
- Aucune décision humaine requise

**Never:**
- Pas de logique UI dans le service
- Pas d'appels InsForge SDK directe (via repository)

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| HAPPY_PATH — Create family | ownerId + name | New family with owner membership | N/A |
| HAPPY_PATH — Add member | familyId + accountId + role | Membership created | Returns false if already member |
| EDGE_CASE — Remove owner | familyId + ownerId | Returns false (owner can't be removed) | N/A |
| EDGE_CASE — Delete family | familyId + ownerId | Family deleted | Returns false if not owner |

</intent-contract>

## Code Map

- `src/domains/family/service.ts` — NEW: FamilyService with CRUD + members
- `src/domains/family/index.ts` — MODIFIED: +service export
- `src/store/family-store.ts` — NEW: Zustand store for families
- `src/capabilities/index.ts` — MODIFIED: +Family capability exports
- `tests/unit/services/family-service.test.ts` — NEW: service tests

## Tasks & Acceptance

**Execution:**
- [ ] `src/domains/family/service.ts` -- Create FamilyService with create, findById, getMembers, addMember, removeMember, delete methods
- [ ] `src/domains/family/index.ts` -- Add service export
- [ ] `src/store/family-store.ts` -- Create Zustand store with families list + activeFamilyId
- [ ] `src/capabilities/index.ts` -- Export family capability
- [ ] `tests/unit/services/family-service.test.ts` -- Unit tests for service

**Acceptance Criteria:**
- Given ownerId and name, when createFamily is called, then Family is returned with owner membership
- Given familyId and accountId, when addMember is called, then FamilyMembership is created
- Given familyId and ownerId, when deleteFamily is called, then returns true
- Given familyId and non-owner accountId, when deleteFamily is called, then returns false
- All 8 tests pass
- No regression in existing tests

## Verification

**Commands:**
- `npm test -- tests/unit/services/family-service.test.ts` -- expected: 8 tests pass
- `npm test -- tests/e2e/ tests/api/` -- expected: 201 tests pass
