/**
 * Family Service — Orchestrator Layer
 *
 * Thin orchestrator injecting all 3 repositories.
 * Enforces per-learner cognitive data scoping at the service layer.
 * Member B must NOT be able to read learner profile cognitive data of member C.
 */

import type { Family, FamilyMembership, FamilyRole } from '@/domains/family';
import type { IFamilyRepository } from '@/domains/family/repository';
import type { IFamilyInvitationRepository } from '@/domains/family-invitation/repository';
import type { FamilyInvitation } from '@/domains/family-invitation/entities';
import type { ILearnerProfileRepository } from '@/domains/learner-profile/repository';
import { eventBus, DomainEventTypes } from '@/domains/events';

export interface MemberWithProfile extends FamilyMembership {
  profile?: {
    id: string;
    displayName: string;
    avatar?: string;
  };
  /** Cognitive data — populated only for owner/admin readers (see getMembersScoped). */
  cognitiveData?: {
    fsrsState?: unknown;
    reviewCount?: number;
    streak?: number;
  };
}

/** Standalone scoped view of a learner's data (used when a single member's
 *  cognitive data is requested outside the member list). */
export interface ScopedLearnerData {
  profileId: string;
  displayName: string;
  /** Cognitive data — only visible to owner and admins */
  cognitiveData?: {
    fsrsState?: unknown;
    reviewCount?: number;
    streak?: number;
  };
}

export class FamilyService {
  constructor(
    private familyRepository: IFamilyRepository,
    private invitationRepository: IFamilyInvitationRepository,
    private profileRepository: ILearnerProfileRepository,
  ) {}

  async createFamily(
    ownerId: string,
    name: string,
    color?: string,
    icon?: string,
  ): Promise<Family> {
    const now = Date.now();
    // Write the family row first; the repository stamps id/createdAt when
    // absent, but we pass a deterministic createdAt so the event is faithful.
    const family = await this.familyRepository.create({
      ownerId,
      name,
      color: color ?? '#6633CC',
      icon: icon ?? '👨‍👩‍👧‍👦',
    });

    // The creator is always the owner with an active membership.
    await this.familyRepository.addMember(family.id, {
      accountId: ownerId,
      role: 'owner' as FamilyRole,
      status: 'active',
    });

    eventBus.emit({
      id: crypto.randomUUID(),
      type: DomainEventTypes.FAMILY_CREATED,
      timestamp: now,
      payload: { familyId: family.id, ownerId },
    });

    return family;
  }

  async acceptInvitation(
    token: string,
    accountId: string,
    defaultDisplayName?: string,
  ): Promise<{ family: Family; membership: FamilyMembership; invitation: FamilyInvitation }> {
    const validation = await this.invitationRepository.findByToken(token);
    if (!validation) {
      throw new Error('Invalid invitation token');
    }

    const inv = await this.getInvitationById(validation.id);
    if (!inv || inv.status !== 'active') {
      throw new Error('Invitation is no longer active');
    }

    if (inv.expiresAt < Date.now()) {
      throw new Error('Invitation has expired');
    }

    const family = await this.familyRepository.findById(inv.familyId);
    if (!family) {
      throw new Error('Family not found');
    }

    // Create profile if it doesn't exist
    const existingProfiles = await this.profileRepository.findByAccountId(accountId);
    let profileId = existingProfiles[0]?.id;
    if (!profileId) {
      const created = await this.profileRepository.create({
        accountId,
        displayName: defaultDisplayName || '',
        status: 'active',
      });
      profileId = created.id;
    }

    // Add membership (repository stamps id/createdAt/joinedAt + familyId).
    const membership = await this.familyRepository.addMember(inv.familyId, {
      accountId,
      role: 'member' as FamilyRole,
      status: 'active',
    });

    // Mark invitation as used
    await this.invitationRepository.markUsed(inv.id);

    // `now` is used below for eventBus timestamps.
    const now = Date.now();
    eventBus.emit({
      id: crypto.randomUUID(),
      type: DomainEventTypes.FAMILY_MEMBER_JOINED,
      timestamp: now,
      payload: { familyId: inv.familyId, accountId, profileId: membership.id },
    });

    eventBus.emit({
      id: crypto.randomUUID(),
      type: DomainEventTypes.FAMILY_INVITATION_ACCEPTED,
      timestamp: now,
      payload: { invitationId: inv.id, accountId },
    });

    return { family, membership, invitation: { ...inv, status: 'used' } };
  }

  async declineInvitation(token: string, _accountId: string): Promise<boolean> {
    const inv = await this.invitationRepository.findByToken(token);
    if (!inv) return false;
    // Decline just means we don't process it — mark as revoked by the inviter or leave as-is
    return false;
  }

  async getMembersScoped(familyId: string, currentAccountId: string): Promise<MemberWithProfile[]> {
    const members = await this.familyRepository.getMembers(familyId);
    const family = await this.familyRepository.findById(familyId);
    if (!family) return [];

    const currentMember = members.find(m => m.accountId === currentAccountId);
    if (!currentMember) return [];

    const isOwnerOrAdmin = currentMember.role === 'owner' || currentMember.role === 'admin';

    const scoped: MemberWithProfile[] = [];
    for (const member of members) {
      if (member.status !== 'active') continue;
      const profiles = await this.profileRepository.findByAccountId(member.accountId);
      const profile = profiles[0];
      if (!profile) continue;

      const entry: MemberWithProfile = {
        ...member,
        profile: {
          id: profile.id,
          displayName: profile.displayName,
          avatar: profile.avatar,
        },
      };

      // Cognitive data scoping: only owner/admin can see cognitive data
      if (isOwnerOrAdmin) {
        entry.cognitiveData = {
          fsrsState: undefined, // Would come from FSRS domain
          reviewCount: 0,
          streak: 0,
        };
      }

      scoped.push(entry);
    }

    return scoped;
  }

  async leaveFamily(familyId: string, accountId: string): Promise<boolean> {
    const family = await this.familyRepository.findById(familyId);
    if (!family) return false;

    // Owner cannot leave — must transfer ownership first or delete family
    const member = await this.getOwnMembership(familyId, accountId);
    if (!member) return false;
    if (member.role === 'owner') {
      throw new Error('Owner cannot leave family. Transfer ownership first.');
    }

    const removed = await this.familyRepository.removeMember(familyId, accountId);
    if (removed) {
      eventBus.emit({
        id: crypto.randomUUID(),
        type: DomainEventTypes.FAMILY_MEMBER_LEFT,
        timestamp: Date.now(),
        payload: { familyId, accountId },
      });
    }
    return removed;
  }

  async removeMember(familyId: string, targetAccountId: string, requesterAccountId: string): Promise<boolean> {
    const family = await this.familyRepository.findById(familyId);
    if (!family) return false;

    const requester = await this.getOwnMembership(familyId, requesterAccountId);
    if (!requester) return false;

    // Only owner/admin can remove
    if (requester.role !== 'owner' && requester.role !== 'admin') {
      throw new Error('Permission denied: only owner or admin can remove members');
    }

    const target = await this.getOwnMembership(familyId, targetAccountId);
    if (!target) return false;

    // Cannot remove owner
    if (target.role === 'owner') {
      throw new Error('Cannot remove the family owner');
    }

    const removed = await this.familyRepository.removeMember(familyId, targetAccountId);
    if (removed) {
      eventBus.emit({
        id: crypto.randomUUID(),
        type: DomainEventTypes.FAMILY_MEMBER_REMOVED,
        timestamp: Date.now(),
        payload: { familyId, accountId: targetAccountId, removedBy: requesterAccountId },
      });
    }
    return removed;
  }

  async createInvitation(
    familyId: string,
    createdBy: string,
    expiresInDays = 7,
  ): Promise<FamilyInvitation> {
    const family = await this.familyRepository.findById(familyId);
    if (!family) throw new Error('Family not found');

    const requester = await this.getOwnMembership(familyId, createdBy);
    if (!requester) throw new Error('User is not a member of this family');
    if (requester.role !== 'owner' && requester.role !== 'admin') {
      throw new Error('Permission denied: only owner or admin can create invitations');
    }

    // `now` is used below for eventBus timestamps and the expiry window.
    const now = Date.now();
    const token = this.generateToken();
    const invitation = await this.invitationRepository.create({
      familyId,
      createdBy,
      token,
      status: 'active',
      expiresInDays,
    });

    eventBus.emit({
      id: crypto.randomUUID(),
      type: DomainEventTypes.FAMILY_INVITATION_CREATED,
      timestamp: now,
      payload: { familyId, token: invitation.token, createdBy },
    });

    return invitation;
  }

  async revokeInvitation(invitationId: string, requesterAccountId: string): Promise<boolean> {
    const inv = await this.invitationRepository.findById(invitationId);
    if (!inv) return false;

    const requester = await this.getOwnMembership(inv.familyId, requesterAccountId);
    if (!requester) throw new Error('User is not a member of this family');
    if (requester.role !== 'owner' && requester.role !== 'admin') {
      throw new Error('Permission denied: only owner or admin can revoke invitations');
    }

    const revoked = await this.invitationRepository.revoke(invitationId);
    if (revoked) {
      eventBus.emit({
        id: crypto.randomUUID(),
        type: DomainEventTypes.FAMILY_INVITATION_REVOKED,
        timestamp: Date.now(),
        payload: { invitationId, revokedBy: requesterAccountId },
      });
    }
    return revoked;
  }

  async getInvitationById(id: string): Promise<FamilyInvitation | null> {
    return this.invitationRepository.findById(id);
  }

  async expirePastDue(): Promise<number> {
    return this.invitationRepository.expirePastDue();
  }

  private async getOwnMembership(familyId: string, accountId: string): Promise<FamilyMembership | null> {
    const members = await this.familyRepository.getMembers(familyId);
    return members.find(m => m.accountId === accountId && m.status === 'active') ?? null;
  }

  private generateToken(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let token = 'FAM-';
    for (let i = 0; i < 12; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
  }
}
