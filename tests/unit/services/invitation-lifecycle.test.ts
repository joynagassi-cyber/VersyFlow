/**
 * Unit Tests — Invitation Lifecycle
 *
 * Full create->validate->accept->markUsed chain, with revoke and expirePastDue variants.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { FamilyRepositoryLocal } from '@/infrastructure/repository/family-repository-local';
import { FamilyInvitationRepositoryLocal } from '@/infrastructure/repository/family-invitation-repository-local';
import { LearnerProfileRepositoryLocal } from '@/infrastructure/repository/learner-profile-repository-local';
import { FamilyService } from '@/services/family-service';
import type { FamilyInvitation } from '@/domains/family-invitation';

function createService() {
  const familyRepo = new FamilyRepositoryLocal();
  const invitationRepo = new FamilyInvitationRepositoryLocal();
  const profileRepo = new LearnerProfileRepositoryLocal();
  return {
    service: new FamilyService(familyRepo, invitationRepo, profileRepo),
    familyRepo,
    invitationRepo,
    profileRepo,
  };
}

async function createFamilyWithOwner(familyRepo: FamilyRepositoryLocal, ownerId: string, familyName = 'Test Family') {
  const family = await familyRepo.create({ ownerId, name: familyName, color: '#E91E8C', icon: '👨‍👩‍👧‍👦' });
  const now = Date.now();
  await familyRepo.addMember(family.id, { accountId: ownerId, role: 'owner', status: 'active' });
  await familyRepo.addMember(family.id, { accountId: ownerId, role: 'owner', status: 'active' });
  return family;
}

describe('Invitation Lifecycle — Full Chain', () => {
  let service: FamilyService;
  let familyRepo: FamilyRepositoryLocal;
  let invitationRepo: FamilyInvitationRepositoryLocal;
  let profileRepo: LearnerProfileRepositoryLocal;

  beforeEach(() => {
    const fresh = createService();
    service = fresh.service;
    familyRepo = fresh.familyRepo;
    invitationRepo = fresh.invitationRepo;
    profileRepo = fresh.profileRepo;
  });

  it('should create invitation, validate token, accept, and mark used', async () => {
    const owner = 'owner-1';
    const newMember = 'new-member-1';
    const family = await familyRepo.create({ ownerId: owner, name: 'Test Family', color: '#E91E8C', icon: '👨‍👩‍👧‍👦' });
    const now = Date.now();
    await familyRepo.addMember(family.id, { accountId: owner, role: 'owner', status: 'active' });
    await profileRepo.create({ accountId: owner, displayName: owner, status: 'active' });

    // Create invitation
    const invitation = await service.createInvitation(family.id, owner);
    expect(invitation).toBeDefined();
    expect(invitation.token).toMatch(/^FAM-/);
    expect(invitation.status).toBe('active');

    // Validate token via repo
    const validation = await invitationRepo.findByToken(invitation.token);
    expect(validation).not.toBeNull();
    expect(validation!.familyId).toBe(family.id);

    // Accept invitation
    const result = await service.acceptInvitation(invitation.token, newMember);
    expect(result.family.id).toBe(family.id);
    expect(result.membership.accountId).toBe(newMember);
    expect(result.membership.role).toBe('member');

    // Invitation should now be marked as used
    const updatedInv = await service.getInvitationById(invitation.id);
    expect(updatedInv!.status).toBe('used');
  });

  it('should reject invalid token', async () => {
    await expect(service.acceptInvitation('invalid-token', 'user-1')).rejects.toThrow('Invalid invitation token');
  });

  it('should reject already-used token', async () => {
    const owner = 'owner-1';
    const family = await familyRepo.create({ ownerId: owner, name: 'Test Family', color: '#E91E8C', icon: '👨‍👩‍👧‍👦' });
    const now = Date.now();
    await familyRepo.addMember(family.id, { accountId: owner, role: 'owner', status: 'active' });
    await profileRepo.create({ accountId: owner, displayName: owner, status: 'active' });

    const invitation = await service.createInvitation(family.id, owner);

    // Accept once
    await service.acceptInvitation(invitation.token, 'user-2');

    // Try to accept again
    await expect(service.acceptInvitation(invitation.token, 'user-3')).rejects.toThrow(/no longer active/i);
  });
});

describe('Invitation Lifecycle — Revoke', () => {
  let service: FamilyService;
  let familyRepo: FamilyRepositoryLocal;
  let invitationRepo: FamilyInvitationRepositoryLocal;
  let profileRepo: LearnerProfileRepositoryLocal;

  beforeEach(() => {
    const fresh = createService();
    service = fresh.service;
    familyRepo = fresh.familyRepo;
    invitationRepo = fresh.invitationRepo;
    profileRepo = fresh.profileRepo;
  });

  async function setup(ownerId: string) {
    const family = await familyRepo.create({ ownerId, name: 'Test Family', color: '#E91E8C', icon: '👨‍👩‍👧‍👦' });
    const now = Date.now();
    await familyRepo.addMember(family.id, { accountId: ownerId, role: 'owner', status: 'active' });
    await profileRepo.create({ accountId: ownerId, displayName: ownerId, status: 'active' });
    return family;
  }

  it('should revoke an active invitation', async () => {
    const owner = 'owner-1';
    const family = await setup(owner);
    const invitation = await service.createInvitation(family.id, owner);

    const revoked = await service.revokeInvitation(invitation.id, owner);
    expect(revoked).toBe(true);

    const updated = await service.getInvitationById(invitation.id);
    expect(updated!.status).toBe('revoked');
  });

  it('should reject non-member revoking invitation', async () => {
    const owner = 'owner-1';
    const family = await setup(owner);
    const invitation = await service.createInvitation(family.id, owner);

    await expect(service.revokeInvitation(invitation.id, 'unknown-user')).rejects.toThrow(/not a member/i);
  });

  it('should not allow accepting a revoked invitation', async () => {
    const owner = 'owner-1';
    const family = await setup(owner);
    const invitation = await service.createInvitation(family.id, owner);
    await service.revokeInvitation(invitation.id, owner);

    await expect(service.acceptInvitation(invitation.token, 'user-2')).rejects.toThrow(/no longer active/i);
  });
});

describe('Invitation Lifecycle — Expire Past Due', () => {
  let invitationRepo: FamilyInvitationRepositoryLocal;
  let service: FamilyService;

  beforeEach(() => {
    const fresh = createService();
    invitationRepo = fresh.invitationRepo;
    service = fresh.service;
  });

  it('should expire past-due invitations', async () => {
    // Create two invitations, then backdate their expiresAt so they are past due
    const inv1 = await invitationRepo.create({
      familyId: 'family-1',
      createdBy: 'user-1',
      token: 'FAM-EXPIRED1',
      status: 'active',
      expiresInDays: 7,
    });
    const inv2 = await invitationRepo.create({
      familyId: 'family-2',
      createdBy: 'user-1',
      token: 'FAM-EXPIRED2',
      status: 'active',
      expiresInDays: 7,
    });
    // One still valid
    await invitationRepo.create({
      familyId: 'family-3',
      createdBy: 'user-1',
      token: 'FAM-VALID',
      status: 'active',
      expiresInDays: 7,
    });

    // Backdate the two invitations' expiry to the past via the internal map
    const internalMap = (invitationRepo as any).invitations as Map<string, FamilyInvitation>;
    internalMap.set(inv1.id, { ...inv1, expiresAt: Date.now() - 1000 });
    internalMap.set(inv2.id, { ...inv2, expiresAt: Date.now() - 1000 });

    const expiredCount = await service.expirePastDue();
    expect(expiredCount).toBe(2);

    // Verify states
    const entries = Array.from(internalMap.values());
    const activeCount = entries.filter((i) => i.status === 'active').length;
    const expiredCountActual = entries.filter((i) => i.status === 'expired').length;
    expect(activeCount).toBe(1);
    expect(expiredCountActual).toBe(2);
  });

  it('should not expire still-valid invitations', async () => {
    const now = Date.now();
    await invitationRepo.create({
      familyId: 'family-1',
      createdBy: 'user-1',
      token: 'FAM-VALID',
      status: 'active',
      expiresInDays: 7,
    });

    const expiredCount = await service.expirePastDue();
    expect(expiredCount).toBe(0);
  });
});
