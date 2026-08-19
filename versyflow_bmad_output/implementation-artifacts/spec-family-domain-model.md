---
title: 'Family Domain Model — Entités & Repository Interfaces'
type: 'feature'
created: '2026-08-10'
status: 'done'
review_loop_iteration: 0
baseline_revision: '614f275'
followup_review_recommended: false
context:
  - 'docs/12-capabilities/FAMILY_ARCHITECTURE_TASKBOARD.md'
  - 'docs/12-capabilities/FAMILY_ARCHITECTURE_AUDIT.md'
  - 'docs/29-architecture-rulebook.md'
  - 'docs/30-domain-rulebook.md'
  - 'versyflow_bmad_output/implementation-artifacts/epic-family-context.md'
warnings: []
---

<intent-contract>

## Intent

**Problem:** VersyFlow n'a actuellement aucun concept de "profil d'apprenant" — toutes les données de mémorisation sont implicitement liées au compte InsForge. Il est impossible d'avoir plusieurs profils sur un même compte (ex: parent + enfants) ni de rejoindre une famille via invitation.

**Approach:** Créer les entités domain pures et les interfaces de repository pour LearnerProfile, Family, FamilyMembership et FamilyInvitation. Ces types et contracts de persistence serviront de fondation à toutes les phases ultérieures (services, stores, UI). Aucune logique métier, aucun I/O — uniquement des types TypeScript purs et des interfaces.

## Boundaries & Constraints

**Always:**
- Entités = interfaces TypeScript pures, jamais de classes avec méthodes mutantes (règle D-ENT-1)
- Repository interfaces = ports d'abstraction, jamais d'implémentation concrète (règle D-ENT-2)
- Respecter la direction des dépendances: Domain ← Infrastructure (pas de imports de infrastructure dans domains)
- Fichiers ≤ 300 lignes par fichier domaine (règle de structure)
- Barrels exports via `index.ts` dans chaque sous-dossier
- Tous les IDs = string (compatible InsForge VARCHAR)

**Block If:**
- Aucune décision humaine requise — toutes les spécifications sont fournies dans l'epic context

**Never:**
- Pas d'implémentation de repository (Phase 4)
- Pas de code UI ou de hooks (Phases 5-10)
- Pas de modification des fichiers existants (additif uniquement)
- Pas d'appels I/O dans les entités
- Pas de duplication des entités existantes (MemorizationRecord, ReviewLogEntry restent inchangés)

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| HAPPY_PATH — Define entities | Create 4 entity interfaces | All interfaces compile, all fields match spec | N/A — pure types |
| HAPPY_PATH — Define repositories | Create 3 repository interfaces | All interfaces compile, return types match entities | N/A — pure interfaces |
| EDGE_CASE — Empty profile | Create profile with minimal fields | displayName required, avatar optional, status defaults to 'active' | Validation at service layer (Phase 3) |
| EDGE_CASE — Role constraints | FamilyMembership role field | Must be one of 'owner' | 'admin' | 'member' | Service layer validates |
| EDGE_CASE — Token security | FamilyInvitation token field | Token is random string, NOT familyId | Service layer generates secure token (Phase 7) |
| EDGE_CASE — Status transitions | FamilyInvitation status field | Must be one of 'active' | 'used' | 'expired' | 'revoked' | Service layer manages transitions |

</intent-contract>

## Code Map

- `src/domains/learner-profile/entities.ts` — NEW: LearnerProfile interface + status type
- `src/domains/learner-profile/index.ts` — NEW: Barrel exports
- `src/domains/family/entities.ts` — NEW: Family, FamilyMembership interfaces + roles/status types
- `src/domains/family/index.ts` — NEW: Barrel exports
- `src/domains/family-invitation/entities.ts` — NEW: FamilyInvitation interface + status type
- `src/domains/family-invitation/index.ts` — NEW: Barrel exports
- `src/domains/learner-profile/repository.ts` — NEW: ILearnerProfileRepository interface
- `src/domains/family/repository.ts` — NEW: IFamilyRepository interface
- `src/domains/family-invitation/repository.ts` — NEW: IFamilyInvitationRepository interface
- `tests/unit/domains/learner-profile.test.ts` — NEW: Unit tests for entity shapes
- `tests/unit/domains/family.test.ts` — NEW: Unit tests for entity shapes
- `tests/unit/domains/family-invitation.test.ts` — NEW: Unit tests for entity shapes

## Tasks & Acceptance

**Execution:**
- [x] `src/domains/learner-profile/entities.ts` -- Create LearnerProfile interface with id, accountId, displayName, avatar (optional), createdAt, updatedAt, status fields -- Defines the core learning persona entity
- [x] `src/domains/learner-profile/index.ts` -- Barrel export all types from entities.ts
- [x] `src/domains/family/entities.ts` -- Create Family interface (id, ownerId, name, color, icon, createdAt) and FamilyMembership interface (id, familyId, accountId, role, status, createdAt, joinedAt) with Role and MembershipStatus types
- [x] `src/domains/family/index.ts` -- Barrel export all types from entities.ts
- [x] `src/domains/family-invitation/entities.ts` -- Create FamilyInvitation interface (id, familyId, createdBy, token, status, expiresAt, createdAt) with InvitationStatus type
- [x] `src/domains/family-invitation/index.ts` -- Barrel export all types from entities.ts
- [x] `src/domains/learner-profile/repository.ts` -- Create ILearnerProfileRepository interface with findById, findByAccountId, create, update, delete methods
- [x] `src/domains/family/repository.ts` -- Create IFamilyRepository interface with findById, findByOwnerId, create, update, delete, getMembers, addMember, removeMember methods
- [x] `src/domains/family-invitation/repository.ts` -- Create IFamilyInvitationRepository interface with findById, findByToken, create, markUsed, revoke, expirePastDue methods
- [x] `tests/unit/domains/family-domain-model.test.ts` -- Test all entity shapes, types, constraints, and immutability patterns

**Acceptance Criteria:**
- Given a new LearnerProfile entity definition, when all fields are present, then the interface matches the spec: id (string), accountId (string), displayName (string), avatar (string | undefined), createdAt (number), updatedAt (number), status ('active' | 'inactive')
- Given a Family entity, when created, then it has: id (string), ownerId (string), name (string), color (string), icon (string), createdAt (number)
- Given a FamilyMembership entity, when role is defined, then it must be one of: 'owner' | 'admin' | 'member'
- Given a FamilyMembership entity, when status is defined, then it must be one of: 'active' | 'suspended' | 'pending'
- Given a FamilyInvitation entity, when token is generated, then token is a string (not familyId) and status must be one of: 'active' | 'used' | 'expired' | 'revoked'
- Given ILearnerProfileRepository, when all methods are defined, then it returns Promise<LearnerProfile | null> for findById and Promise<LearnerProfile[]> for findByAccountId
- Given IFamilyRepository, when getMembers is called, then it returns Promise<FamilyMembership[]>
- Given IFamilyInvitationRepository, when findByToken is called, then it returns Promise<FamilyInvitation | null>
- Given all entity files, when TypeScript compiler runs, then zero type errors are produced
- Given all repository interfaces, when checked for I/O imports, then zero imports from infrastructure or external modules exist
- Given all test files, when npm test runs, then all 12 tests pass

## Spec Change Log

- **2026-08-10**: Phase 2 Domain Model implementation completed. All 9 source files created (3 entities, 3 repositories, 3 barrells). 14 unit tests passing. No TypeScript errors in new domain files. All governance rules verified: no I/O imports, no store/service imports, all files under 300 lines.

## Review Triage Log

- **2026-08-10**: First review pass. All acceptance criteria met. 0 findings.

## Design Notes

### Pattern: Domain-First Entity Definition

Les entités sont définies avant les repositories. Chaque entité suit le pattern:

```typescript
// ✅ CORRECT — Interface pure, pas de méthodes
interface LearnerProfile {
  id: string;
  accountId: string;
  displayName: string;
  avatar?: string;
  createdAt: number;
  updatedAt: number;
  status: 'active' | 'inactive';
}

// ✅ Value object pour les enums
type FamilyRole = 'owner' | 'admin' | 'member';
type MembershipStatus = 'active' | 'suspended' | 'pending';
```

### Pattern: Repository Port Interface

Les repositories sont des ports d'abstraction. Ils ne contiennent que des signatures de méthodes:

```typescript
// ✅ CORRECT — Interface seulement, pas d'implémentation
interface ILearnerProfileRepository {
  findById(id: string): Promise<LearnerProfile | null>;
  findByAccountId(accountId: string): Promise<LearnerProfile[]>;
  create(profile: Omit<LearnerProfile, 'id' | 'createdAt' | 'updatedAt'>): Promise<LearnerProfile>;
  update(id: string, updates: Partial<LearnerProfile>): Promise<LearnerProfile | null>;
  delete(id: string): Promise<boolean>;
}
```

### Naming Convention

- Entités: PascalCase (LearnerProfile, Family, FamilyMembership, FamilyInvitation)
- Repositories: PascalCase avec préfixe I (ILearnerProfileRepository, IFamilyRepository, IFamilyInvitationRepository)
- Types/Enums: PascalCase pour les unions de chaînes (FamilyRole, MembershipStatus, InvitationStatus)

## Verification

**Commands:**
- `npx tsc --noEmit` -- expected: 0 errors in new domain files
- `npm test -- tests/unit/domains/` -- expected: all tests pass
- `npx eslint src/domains/learner-profile/ src/domains/family/ src/domains/family-invitation/` -- expected: 0 lint errors

**Manual checks:**
- Verify no imports from `src/infrastructure/` in any domain file
- Verify no imports from `src/store/` or `src/services/` in any domain file
- Verify all barrel exports in index.ts files
- Verify entity fields match the epic context specification exactly
