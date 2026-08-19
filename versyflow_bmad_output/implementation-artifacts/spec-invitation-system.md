---
title: 'Invitation System — Token Generation & QR Code'
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

**Problem:** Les familles ont besoin d'un système d'invitation pour permettre aux membres externes de rejoindre. Le token doit être aléatoire, expirable et révocable.

**Approach:** Implémenter FamilyInvitationService (génération, validation, expiration) et un utilitaire QR Code. Le token est généré avec crypto-secure random, jamais égal au familyId.

## Boundaries & Constraints

**Always:**
- Token = chaîne aléatoire crypto-sécurisée (min 16 caractères)
- Expiration par défaut = 7 jours
- Token ≠ familyId (sécurité)
- Statuts: active → used/expired/revoked

**Block If:**
- Aucune décision humaine requise

**Never:**
- Pas de données personnelles dans le QR
- Pas d'exposition du familyId dans le token

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output | Error Handling |
|----------|--------------|-----------------|----------------|
| HAPPY_PATH — Generate | familyId + createdBy | Token unique, expiry = now + 7d | N/A |
| HAPPY_PATH — Validate | valid token | Family + membership created | N/A |
| EDGE_CASE — Expired | past expiresAt | Returns null | N/A |
| EDGE_CASE — Already used | used token | Returns null | N/A |
| EDGE_CASE — Revoked | revoked token | Returns null | N/A |

</intent-contract>

## Code Map

- `src/domains/family-invitation/service.ts` — NEW: FamilyInvitationService
- `src/domains/family-invitation/index.ts` — MODIFIED: +service export
- `src/services/qr-generator.ts` — NEW: QR payload generator/parser
- `tests/unit/services/invitation-service.test.ts` — NEW: tests

## Verification

**Commands:**
- `npm test -- tests/unit/services/invitation-service.test.ts` -- expected: pass
- `npm test -- tests/e2e/ tests/api/` -- expected: no regression
