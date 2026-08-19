---
title: 'Active Learner — Hook & Profile Selection'
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

**Problem:** L'application doit savoir quel profil apprend actuellement. Sans cela, les opérations de mémorisation ne savent pas à quel profil elles appartiennent.

**Approach:** Créer un hook `useActiveProfile` qui fournit le profil actif et ses actions. Créer un écran `ProfileSelectionScreen` pour le premier lancement ou le changement de profil. Si un seul profil existe, auto-sélectionner.

## Boundaries & Constraints

**Always:**
- Hook retourne `{ profile, isLoading, selectProfile, createProfile }`
- Un seul profil → auto-sélection (pas d'écran supplémentaire)
- Ecran de sélection uniquement si 0 ou >1 profils
- Design System existant utilisé

**Block If:**
- Aucune décision humaine requise

**Never:**
- Pas de logique métier dans l'écran
- Pas d'accès direct au storage depuis l'UI

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| HAPPY_PATH — Single profile | 1 profile exists | Auto-select, no selector screen | N/A |
| HAPPY_PATH — Multiple profiles | 2+ profiles exist | Show selector screen | N/A |
| EDGE_CASE — No profiles | 0 profiles | Show create profile screen | N/A |
| EDGE_CASE — Profile deleted | Active profile deleted | Auto-select another or show selector | N/A |

</intent-contract>

## Code Map

- `src/hooks/useActiveProfile.ts` — NEW: hook for active profile management
- `app/profile/select.tsx` — NEW: Profile selection screen
- `app/boot.tsx` — MODIFIED: integrate profile selection flow
- `tests/unit/hooks/use-active-profile.test.ts` — NEW: hook tests

## Tasks & Acceptance

**Execution:**
- [ ] `src/hooks/useActiveProfile.ts` -- Create hook with getActive, select, create logic
- [ ] `app/profile/select.tsx` -- Create ProfileSelectionScreen component
- [ ] `app/boot.tsx` -- Integrate profile check into app boot flow
- [ ] `tests/unit/hooks/use-active-profile.test.ts` -- Test hook behavior

**Acceptance Criteria:**
- Given 1 profile exists, when app boots, then profile is auto-selected
- Given 0 profiles exist, when app boots, then ProfileSelectionScreen is shown
- Given 2+ profiles exist, when app boots, then ProfileSelectionScreen is shown
- Given user selects a profile, then activeProfileId is updated in store
- Given user creates a profile, then new profile is added and selected
- All tests pass

## Verification

**Commands:**
- `npm test -- tests/unit/hooks/use-active-profile.test.ts` -- expected: pass
- `npm test -- tests/e2e/ tests/api/` -- expected: no regression
