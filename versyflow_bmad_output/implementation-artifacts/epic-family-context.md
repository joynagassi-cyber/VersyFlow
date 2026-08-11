# Epic Context — Family & Learner Profile

> Generated: 2026-08-10
> Status: Phase 1 (Audit) Complete | Phase 2 Ready to Start
> Source: docs/12-capabilities/FAMILY_ARCHITECTURE_TASKBOARD.md, docs/12-capabilities/FAMILY_ARCHITECTURE_AUDIT.md, docs/29-architecture-rulebook.md, docs/30-domain-rulebook.md

---

## 1. Epic Vision

The Family & Learner Profile feature transforms VersyFlow from a single-user memorization app into a **multi-profile, family-capable** platform. The core vision:

- **LearnerProfile** sits between the InsForge `Account` and all learning data, giving each user the ability to maintain multiple independent learning personas (e.g. "my profile" + "my child's profile").
- **Family** is an optional social layer: profiles group into families, share aggregated progress visibility, and exchange invitation-based join codes (QR + manual).
- **Learning data isolation** is the hard requirement: Profile A must never see Profile B's memorization records, review logs, FSRS state, streaks, or analytics.

The pattern shift is:

```
Before:  Account → (all data directly)
After:   Account → LearnerProfile → (data scoped to that profile)
         LearnerProfile ∈ Family (optional)
```

---

## 2. Architecture Constraints

### Dependency Direction (Architecture Rulebook)

```
app/          ←── src/components/
    ↑
src/hooks/    ←── src/services/
    ↑
src/domains/  ←── src/infrastructure/
    ↑
data/         static files
```

**All dependencies must flow upward.** The Family and LearnerProfile domains live at the bottom of this stack.

### Domain Rulebook Constraints (docs/30-domain-rulebook.md)

- **No I/O in domains**: `src/domains/learner-profile/` and `src/domains/family/` must be pure TypeScript — no filesystem, no network, no storage calls.
- **Pure data structures**: entities are interfaces/types, not classes with mutating methods.
- **Immutable after creation**: updates produce new objects (`{ ...entity, ...updates }`), never mutate in place.
- **Constructor injection only**: services must accept ports (interfaces), never instantiate concrete dependencies directly.
- **Port pattern**: domain services interact through `IStorage`, `ILearnerProfileRepository`, `IFamilyRepository` — never through concrete implementations.
- **File size limits**: domains ≤ 300 lines, services ≤ 200 lines, components ≤ 150 lines, hooks ≤ 100 lines.

### Governance Rules (from Audit)

| Rule | Status |
|------|--------|
| Do not duplicate the FSRS engine | Enforced — FSRS stays in `src/domains/fsrs/` |
| Do not duplicate the memorization engine | Enforced — `src/domains/memorization/` stays intact |
| Do not duplicate ProgressService | Enforced — signature enriched, not copied |
| Do not move existing files | Enforced — additive changes only |
| Respect dependency direction | Enforced — Domain ← Infrastructure, Service ← Domain |
| Use port interfaces | Enforced — `IStorage` and new repository interfaces |
| Single EventBus | Enforced — 13 new events added to existing registry |
| Design System tokens | Enforced — all new screens use existing tokens |

---

## 3. Current State

### Data Model

```
Account (via InsForge auth)
   ├── UserSettings (singleton)
   ├── MemorizationRecord[] (no userId field — identity implicit via auth session)
   ├── ReviewLog[] (same implicit identity)
   └── Progress / Streaks / Achievements
```

### Storage Keys (current)

```
versyflow:settings
versyflow:bible:{translationId}
versyflow:record:{bookId}:{chapter}:{verse}:{translation}
versyflow:reviewlog:{recordId}:{timestamp}
versyflow:reviewlogs:{recordId}
versyflow:auth-storage
versyflow-settings-storage
versyflow:onboarding:completed
```

**Critical gap**: `MemorizationRecord` has no `learnerProfileId` field. Identity is implicit through the InsForge auth context. There is no concept of multiple profiles per account.

### Zustand Stores

| Store | Current Role | Family Impact |
|-------|-------------|---------------|
| `auth-store` | Session, userId | CRITICAL — must hold `activeProfileId` |
| `settings-store` | UI preferences | Low — singleton, no change |
| `memorization-store` | Current session | Medium — must filter by profile |
| `review-store` | Review queue | Medium — must filter by profile |
| `bible-store` | Bible navigation | None — unchanged |

### Identified Break Points

| File | Issue | Severity |
|------|-------|----------|
| `src/domains/memorization/service.ts:34` | Storage key without profileId | HIGH — collisions between profiles |
| `src/domains/memorization/service.ts:45` | Review logs without profileId | HIGH — mixed data |
| `src/domains/memorization/service.ts:114` | `getMemorizedRecord` returns all records | HIGH — no isolation |
| `src/services/progress-service.ts:113` | `getAllMemorized()` global | HIGH — streaks/analytics mixed |
| `src/services/progress-service.ts:392` | `getStats()` global | HIGH — no profile separation |
| `src/store/auth-store.ts` | No profile concept | CRITICAL — no active profile |

### Existing Domain Events

16 events in `src/domains/index.ts`. **13 new events** must be added for the Family feature (profile lifecycle + family lifecycle).

---

## 4. Target State

### New Data Model

```
Account (InsForge)
   ├── LearnerProfile[]
   │     ├── id, accountId, displayName, avatar
   │     ├── MemorizationRecord[] (scoped to profileId)
   │     ├── ReviewLog[] (scoped to profileId)
   │     ├── FSRS State, Streaks, Progress
   │     └── FamilyMembership[] (optional)
   └── Family[]
         ├── id, ownerId, name, color, icon
         ├── FamilyMembership[]
         └── FamilyInvitation[]
```

### New Storage Pattern

```
versyflow:{profileId}:record:{bookId}:{chapter}:{verse}:{translation}
versyflow:{profileId}:reviewlog:{recordId}:{timestamp}
versyflow:{profileId}:reviewlogs:{recordId}
```

Old keys persist during migration. The system reads both formats during the transition period.

### New Domains

```
src/domains/
├── learner-profile/
│   ├── entities.ts
│   ├── repository.ts
│   ├── service.ts
│   └── index.ts
├── family/
│   ├── entities.ts
│   ├── repository.ts
│   ├── service.ts
│   ├── permissions.ts
│   └── index.ts
└── family-invitation/
    ├── entities.ts
    ├── service.ts
    └── index.ts
```

---

## 5. Key Decisions

### Decision 1: Profile ID in Storage Keys
All MMKV keys are prefixed with `versyflow:{profileId}:`. This is the single most important architectural change — it enables data isolation without requiring a database schema change for the local store.

### Decision 2: Migration Creates a "Default" Profile
Existing users (pre-migration) receive an automatic default LearnerProfile on first login after the feature ships. Their existing data is re-indexed under this default profile. The migration is **idempotent** — running it multiple times produces no duplicates.

### Decision 3: FSRS Engine Remains Profile-Agnostic
The FSRS engine in `src/domains/fsrs/` does NOT change. Profile scoping happens at the service layer (`MemorizationService`, `ProgressService`), not inside the algorithm. This preserves the engine's testability and simplicity.

### Decision 4: Domain-First, Store-Second
Entities and repository interfaces are defined before any Zustand store or service code. The stores consume domain services, which consume repository ports. This follows the dependency rule: `hooks/ ← services/ ← domains/`.

### Decision 5: Family is Optional
A LearnerProfile exists independently of any Family. The `FamilyMembership` relationship is one-to-many and nullable. Users can operate fully without ever creating or joining a family.

### Decision 6: Learning Data Never Shared Implicitly
Profile A's memorization records, review logs, FSRS state, and analytics are never visible to Profile B — even within the same family. Family-level visibility is limited to aggregated progress metrics only (with explicit permission).

---

## 6. Phase 2 Scope

Phase 2 is the **Domain Model** layer. It produces the pure TypeScript types and repository interfaces that every subsequent phase depends on.

### Task 2.1 — Entités LearnerProfile (FAM-DM-001)

**Objective**: Define the four core domain entities.

**Files to create**:
- `src/domains/learner-profile/entities.ts`
- `src/domains/family/entities.ts`
- `src/domains/family-invitation/entities.ts`

**Entity specifications**:

```typescript
// learner-profile/entities.ts
interface LearnerProfile {
  id: string;
  accountId: string;           // links to InsForge account
  displayName: string;
  avatar?: string;             // optional URL or emoji
  createdAt: number;
  updatedAt: number;
  status: 'active' | 'inactive';
}

// family/entities.ts
interface Family {
  id: string;
  ownerId: string;             // accountId of creator
  name: string;
  color: string;               // design token
  icon: string;                // emoji or icon name
  createdAt: number;
}

interface FamilyMembership {
  id: string;
  familyId: string;
  accountId: string;
  role: 'owner' | 'admin' | 'member';
  status: 'active' | 'suspended' | 'pending';
  createdAt: number;
  joinedAt: number;
}

// family-invitation/entities.ts
interface FamilyInvitation {
  id: string;
  familyId: string;
  createdBy: string;           // accountId
  token: string;               // random, not familyId
  status: 'active' | 'used' | 'expired' | 'revoked';
  expiresAt: number;           // Unix timestamp
  createdAt: number;
}
```

**Acceptance criteria**:
- All fields match the spec above
- All types exported via barrel `index.ts` in each domain folder
- No mutable methods on entity interfaces
- Units tests: `tests/unit/domains/learner-profile.test.ts`, `tests/unit/domains/family.test.ts`

### Task 2.2 — Repository Interfaces (FAM-DM-002)

**Objective**: Define the port interfaces for persistence. These are consumed by services; implemented by infrastructure.

**Files to create**:
- `src/domains/learner-profile/repository.ts`
- `src/domains/family/repository.ts`
- `src/domains/family-invitation/repository.ts`

**Interface specifications**:

```typescript
// learner-profile/repository.ts
interface ILearnerProfileRepository {
  findById(id: string): Promise<LearnerProfile | null>;
  findByAccountId(accountId: string): Promise<LearnerProfile[]>;
  create(profile: Omit<LearnerProfile, 'id' | 'createdAt' | 'updatedAt'>): Promise<LearnerProfile>;
  update(id: string, updates: Partial<LearnerProfile>): Promise<LearnerProfile | null>;
  delete(id: string): Promise<boolean>;
}

// family/repository.ts
interface IFamilyRepository {
  findById(id: string): Promise<Family | null>;
  findByOwnerId(ownerId: string): Promise<Family[]>;
  create(family: Omit<Family, 'id' | 'createdAt'>): Promise<Family>;
  update(id: string, updates: Partial<Family>): Promise<Family | null>;
  delete(id: string, ownerId: string): Promise<boolean>;
  getMembers(familyId: string): Promise<FamilyMembership[]>;
  addMember(familyId: string, membership: Omit<FamilyMembership, 'id' | 'createdAt' | 'joinedAt'>): Promise<FamilyMembership>;
  removeMember(familyId: string, accountId: string): Promise<boolean>;
}

// family-invitation/repository.ts
interface IFamilyInvitationRepository {
  findById(id: string): Promise<FamilyInvitation | null>;
  findByToken(token: string): Promise<FamilyInvitation | null>;
  create(invitation: Omit<FamilyInvitation, 'id' | 'createdAt' | 'expiresAt'>): Promise<FamilyInvitation>;
  markUsed(id: string): Promise<boolean>;
  revoke(id: string): Promise<boolean>;
  expirePastDue(): Promise<number>;   // returns count of expired
}
```

**Acceptance criteria**:
- All interfaces use entities from Task 2.1
- Dependency rule respected: domains define interfaces, infrastructure implements
- Unit tests for interface contracts (mocking)
- No concrete implementations in domain layer

---

## 7. Dependencies

### What Must Be True Before Phase 2 Starts

- [x] Phase 1 Audit complete (FAM-AUDIT-001) — **DONE**
- [x] Taskboard created with all phases mapped (FAM-TASK-001) — **IN PROGRESS**

### What Phase 2 Unlocks

| Phase | Unlocked By |
|-------|-------------|
| Phase 3 (LearnerProfile Service + Store) | 2.1, 2.2 |
| Phase 6 (Family Service + Store) | 2.1, 2.2 |
| Phase 9 (Domain Events) | 2.1 |

### Downstream Chain

```
2.1 + 2.2
  ├── 3.1 (LearnerProfile Service)
  │     ├── 3.2 (Profile Store)
  │     │     ├── 4.1 (Storage key migration)
  │     │     ├── 5.1 (useActiveProfile hook)
  │     │     │     └── 5.2 (Profile Selection Screen)
  │     │     │           └── 10.1 (Profile UI screens)
  │     │     │                 └── 10.3 (Navigation)
  │     │     └── 8.1 (FSRS Profile-Aware)
  │     │           └── 8.2 (Progress Profile-Aware)
  │     └── 9.2 (Telemetry anonymization)
  │
  └── 6.1 (Family Service)
        ├── 6.2 (Family Store)
        │     └── 10.2 (Family UI screens)
        └── 7.1 (Invitation Service)
              └── 7.2 (QR Code)
```

---

## 8. Risk Assessment

### High Risks

| Risk | Mitigation |
|------|-----------|
| **Migration data loss** — existing MemorizationRecords and ReviewLogs must survive the key-format change | Idempotent migration script; dual-read during transition; P0 requirement documented in taskboard |
| **Profile isolation breach** — a service accidentally returns records from another profile | Automated isolation test (`tests/e2e/profile-isolation.test.ts`); code review gate on all service changes |
| **Collision on storage keys** during transition period | Key pattern `versyflow:{profileId}:...` is structurally incompatible with old keys; no collision possible |

### Medium Risks

| Risk | Mitigation |
|------|-----------|
| **Zustand store complexity** — adding `activeProfileId` to auth-store may create circular references | Profile store is separate; auth-store only holds the ID reference, not the profile object |
| **Hook re-renders** — `useActiveProfile` could cause excessive re-renders if not memoized | Selective selector pattern in Zustand; document in hook implementation |
| **Family invitation token collision** — random tokens could theoretically collide | Use sufficient entropy (crypto-secure random); check uniqueness on create |

### Low Risks

| Risk | Mitigation |
|------|-----------|
| **QR code camera permissions** — some platforms require explicit permission prompts | Fallback to manual code entry is built into FAM-QR-001 acceptance criteria |
| **Domain event registry bloat** — 13 new events added to existing file | Event types are scoped with namespace prefix (`learner_profile.*`, `family.*`) for readability |

### Blockers (None Currently)

No tasks are currently BLOCKED. Phase 2 can start immediately upon completion of FAM-TASK-001.

---

## Summary

| Metric | Value |
|--------|-------|
| Total tasks | 28 |
| Done | 1 (FAM-AUDIT-001) |
| In progress | 1 (FAM-TASK-001) |
| Ready to start | 2 (Phase 2: FAM-DM-001, FAM-DM-002) |
| New files to create | ~25 |
| Existing files to modify | ~15 |
| New domain events | 13 |
| Estimated timeline | 2-3 sprints (8-12 days) |

**Phase 2 is the critical foundation.** It defines the data shapes and persistence contracts that every downstream phase builds on. Getting the entity models and repository interfaces right here prevents architectural debt in all 11 subsequent phases.
