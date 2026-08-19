---
title: 'LearnerProfile Service & Store'
type: 'feature'
created: '2026-08-10'
status: 'done'
review_loop_iteration: 0
baseline_revision: '614f275'
context:
  - 'docs/12-capabilities/FAMILY_ARCHITECTURE_TASKBOARD.md'
  - 'docs/12-capabilities/FAMILY_ARCHITECTURE_AUDIT.md'
  - 'docs/30-domain-rulebook.md'
  - 'versyflow_bmad_output/implementation-artifacts/epic-family-context.md'
  - 'versyflow_bmad_output/implementation-artifacts/spec-family-domain-model.md'
warnings: []
---

<intent-contract>

## Intent

**Problem:** Le Domain Model (Phase 2) est en place, mais il n'existe aucun service pour gérer les profils (création, sélection, suppression) ni aucun store Zustand pour maintenir l'état du profil actif dans l'application.

**Approach:** Implémenter le LearnerProfileService (logique métier) et le ProfileStore (état global Zustand) pour gérer les profils d'apprenants. Le service utilise les interfaces de repository définies en Phase 2. Le store expose l'état et les actions via Zustand.

## Boundaries & Constraints

**Always:**
- Service injecte IStorage via constructeur (pattern port/adapter)
- Store utilise pattern Zustand persist avec clé MMKV
- Active profile ID persisté: `versyflow:profile:active`
- Un seul profil → auto-sélection (pas d'écran de sélection nécessaire)
- Migration: si aucun profile existant, créer default depuis auth store

**Block If:**
- Aucune décision humaine requise

**Never:**
- Pas de logique UI dans le service
- Pas d'appels directs à InsForge SDK dans le service (via repository)
- Pas de mutation directe du store (actions Zustand uniquement)

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| HAPPY_PATH — Create profile | accountId + displayName | New profile returned with id, timestamps | N/A |
| HAPPY_PATH — Select profile | profileId | activeProfileId updated | N/A |
| EDGE_CASE — Only one profile | No active + 1 profile | Auto-selects on init | N/A |
| EDGE_CASE — No profiles | No profiles exist | Returns null, UI shows selector | N/A |
| EDGE_CASE — Update profile | profileId + updates | Updated profile returned | Returns null if not found |

</intent-contract>

## Code Map

- `src/domains/learner-profile/service.ts` — NEW: LearnerProfileService with CRUD + select logic
- `src/domains/learner-profile/service.ts` — exports LearnerProfileService
- `src/store/profile-store.ts` — NEW: Zustand store for profiles + active profile
- `src/store/index.ts` — MODIFIED: export profile-store
- `src/store/auth-store.ts` — MODIFIED: add activeProfileId field
- `tests/unit/services/learner-profile-service.test.ts` — NEW: unit tests for service

## Tasks & Acceptance

**Execution:**
- [ ] `src/domains/learner-profile/service.ts` -- Create LearnerProfileService with create, findById, findByAccountId, update, delete, select methods using ILearnerProfileRepository
- [ ] `src/domains/learner-profile/index.ts` -- Add service export
- [ ] `src/store/profile-store.ts` -- Create Zustand store with profiles list + activeProfileId + actions
- [ ] `src/store/index.ts` -- Export profile-store
- [ ] `src/store/auth-store.ts` -- Add activeProfileId field to AuthState
- [ ] `tests/unit/services/learner-profile-service.test.ts` -- Unit tests for service

**Acceptance Criteria:**
- Given a valid accountId and displayName, when createProfile is called, then a LearnerProfile is returned with generated id and timestamps
- Given an existing profileId, when selectProfile is called, then activeProfileId is updated
- Given only one profile exists, when store initializes, then that profile is auto-selected as active
- Given no profiles exist, when getActiveProfile is called, then null is returned
- Given a profileId and updates, when updateProfile is called, then the profile is updated and returned
- Given a profileId, when deleteProfile is called, then the profile is removed and false/true reflects success
- activeProfileId persists across rehydration via MMKV key `versyflow:profile:active`
- All 8 tests pass

## Spec Change Log

- **2026-08-10**: Implementation completed. Service created with CRUD + active profile management. Store created with Zustand persist. Auth store extended with activeProfileId. 8 unit tests passing.

## Review Triage Log

- **2026-08-10**: First review pass. All acceptance criteria met. 0 findings.

## Design Notes

### Service Pattern
Le service utilise injection de dépendance via le repository port. Il ne connaît pas l'implémentation de storage.

```typescript
class LearnerProfileService {
  constructor(private repository: ILearnerProfileRepository) {}
}
```

### Store Pattern
Zustand avec persist middleware. L'état est sérialisé dans MMKV.

```typescript
export const useProfileStore = create<ProfileState>()(
  persist(
    (set, get) => ({ ...actions ...}),
    { name: 'versyflow-profile-storage', ... }
  )
);
```

### Auto-Select Logic
Si un seul profile existe au moment de l'initialisation, il est auto-sélectionné. C'est un comportement UX important pour éviter l'écran de sélection inutile.

## Verification

**Commands:**
- `npm test -- tests/unit/services/learner-profile-service.test.ts` -- expected: 8 tests pass
- `npm test -- tests/unit/domains/` -- expected: all domain tests pass
- `npm test -- tests/e2e/ tests/api/` -- expected: 215 tests pass (no regression)
