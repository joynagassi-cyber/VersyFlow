/**
 * P1C-0 — createFamily orchestrator + PowerSync write (single sync path).
 *
 * Invariant: family creation goes through `FamilyService` (permission logic,
 * domain events) and lands on the PowerSync `families` + `family_memberships`
 * tables via the shared repositories — never an ad-hoc network call, never
 * MMKV as the source of truth for SYNCED family data.
 *
 * This is a test-first lot: the service method must
 *   1. reject when the caller is not a member of the family they claim to
 *      own (permission),
 *   2. write the family row AND the owner membership (role 'owner', status
 *      'active') through the repositories,
 *   3. emit FAMILY_CREATED with the new family id.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { FamilyService } from '@/services/family-service';
import type { IFamilyRepository } from '@/domains/family/repository';
import type { IFamilyInvitationRepository } from '@/domains/family-invitation/repository';
import type { ILearnerProfileRepository } from '@/domains/learner-profile/repository';
import type { Family, FamilyMembership } from '@/domains/family';

function makeFamilyRepo() {
  const calls: string[] = [];
  return {
    calls,
    create: (family: Omit<Family, 'id' | 'createdAt'>) => {
      calls.push('create');
      return Promise.resolve({ ...family, id: 'fam-1', createdAt: 0 } as Family);
    },
    addMember: (
      familyId: string,
      m: Omit<FamilyMembership, 'id' | 'createdAt' | 'joinedAt' | 'familyId'>,
    ) => {
      calls.push('addMember');
      return Promise.resolve({
        ...m,
        familyId,
        id: 'mem-1',
        createdAt: 0,
        joinedAt: 0,
      } as FamilyMembership);
    },
  } as unknown as IFamilyRepository;
}

function makeInvRepo() {
  return {
    create: () => Promise.resolve({}),
  } as unknown as IFamilyInvitationRepository;
}

function makeProfileRepo() {
  return {
    findByAccountId: () => Promise.resolve([]),
    create: () => Promise.resolve({ id: 'p-1' }),
  } as unknown as ILearnerProfileRepository;
}

describe('P1C-0 FamilyService.createFamily', () => {
  let familyRepo: ReturnType<typeof makeFamilyRepo>;
  let service: FamilyService;

  beforeEach(() => {
    familyRepo = makeFamilyRepo();
    service = new FamilyService(
      familyRepo,
      makeInvRepo(),
      makeProfileRepo(),
    );
  });

  it('writes the family + owner membership via the repositories', async () => {
    const family = await service.createFamily('acc-1', 'Ma Famille');
    expect(family.id).toBe('fam-1');
    expect(family.name).toBe('Ma Famille');
    expect(family.ownerId).toBe('acc-1');
    expect(familyRepo.calls).toEqual(['create', 'addMember']);
  });
});
