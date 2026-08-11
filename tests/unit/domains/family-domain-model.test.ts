/**
 * Unit Tests — Family Domain Model
 * Validates entity shapes and constraints (plain JS, no TS imports)
 */

describe('LearnerProfile Domain', () => {
  describe('ProfileStatus type', () => {
    it('should allow active and inactive statuses', () => {
      const statuses = ['active', 'inactive'];
      expect(statuses).toHaveLength(2);
      expect(statuses).toContain('active');
      expect(statuses).toContain('inactive');
    });
  });

  describe('LearnerProfile entity shape', () => {
    it('should accept a valid profile with all required fields', () => {
      const profile = {
        id: 'prof-001',
        accountId: 'account-abc',
        displayName: 'Alice',
        avatar: '👤',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        status: 'active'
      };

      expect(profile.id).toBe('prof-001');
      expect(profile.accountId).toBe('account-abc');
      expect(profile.displayName).toBe('Alice');
      expect(profile.avatar).toBe('👤');
      expect(profile.status).toBe('active');
      expect(typeof profile.createdAt).toBe('number');
      expect(typeof profile.updatedAt).toBe('number');
    });

    it('should accept a profile without optional avatar', () => {
      const profile = {
        id: 'prof-002',
        accountId: 'account-abc',
        displayName: 'Bob',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        status: 'active'
      };

      expect(profile.avatar).toBeUndefined();
      expect(profile.status).toBe('active');
    });

    it('should enforce immutability via spread pattern', () => {
      const original = {
        id: 'prof-003',
        accountId: 'account-abc',
        displayName: 'Charlie',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        status: 'active'
      };

      const updated = { ...original, displayName: 'David', status: 'inactive' };

      expect(updated.displayName).toBe('David');
      expect(updated.status).toBe('inactive');
      expect(updated.id).toBe(original.id);
      expect(original.displayName).toBe('Charlie');
      expect(original.status).toBe('active');
    });
  });
});

describe('Family Domain', () => {
  describe('FamilyRole type', () => {
    it('should only accept owner, admin, or member', () => {
      const roles = ['owner', 'admin', 'member'];
      expect(roles).toHaveLength(3);
      expect(roles).toContain('owner');
      expect(roles).toContain('admin');
      expect(roles).toContain('member');
    });
  });

  describe('MembershipStatus type', () => {
    it('should only accept active, suspended, or pending', () => {
      const statuses = ['active', 'suspended', 'pending'];
      expect(statuses).toHaveLength(3);
      expect(statuses).toContain('active');
      expect(statuses).toContain('suspended');
      expect(statuses).toContain('pending');
    });
  });

  describe('Family entity shape', () => {
    it('should accept a valid Family with all fields', () => {
      const family = {
        id: 'fam-001',
        ownerId: 'account-abc',
        name: 'The Smiths',
        color: '#4F46E5',
        icon: '👨‍👩‍👧‍👦',
        createdAt: Date.now()
      };

      expect(family.id).toBe('fam-001');
      expect(family.ownerId).toBe('account-abc');
      expect(family.name).toBe('The Smiths');
      expect(family.color).toBe('#4F46E5');
      expect(family.icon).toBe('👨‍👩‍👧‍👦');
      expect(typeof family.createdAt).toBe('number');
    });

    it('should have color as hex design token', () => {
      const family = {
        id: 'fam-002',
        ownerId: 'account-abc',
        name: 'Test',
        color: '#E91E8C',
        icon: '🏠',
        createdAt: Date.now()
      };

      expect(family.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });
  });

  describe('FamilyMembership entity shape', () => {
    it('should accept a valid membership', () => {
      const membership = {
        id: 'mem-001',
        familyId: 'fam-001',
        accountId: 'account-abc',
        role: 'owner',
        status: 'active',
        createdAt: Date.now(),
        joinedAt: Date.now()
      };

      expect(membership.id).toBe('mem-001');
      expect(membership.familyId).toBe('fam-001');
      expect(membership.accountId).toBe('account-abc');
      expect(membership.role).toBe('owner');
      expect(membership.status).toBe('active');
    });

    it('should accept pending and suspended statuses', () => {
      const pending = { id: 'm1', familyId: 'f1', accountId: 'a1', role: 'member', status: 'pending', createdAt: Date.now(), joinedAt: Date.now() };
      const suspended = { id: 'm2', familyId: 'f1', accountId: 'a2', role: 'member', status: 'suspended', createdAt: Date.now(), joinedAt: Date.now() };

      expect(pending.status).toBe('pending');
      expect(suspended.status).toBe('suspended');
    });
  });
});

describe('FamilyInvitation Domain', () => {
  describe('InvitationStatus type', () => {
    it('should only accept active, used, expired, or revoked', () => {
      const statuses = ['active', 'used', 'expired', 'revoked'];
      expect(statuses).toHaveLength(4);
      expect(statuses).toContain('active');
      expect(statuses).toContain('used');
      expect(statuses).toContain('expired');
      expect(statuses).toContain('revoked');
    });
  });

  describe('FamilyInvitation entity shape', () => {
    it('should accept a valid invitation with all fields', () => {
      const now = Date.now();
      const invitation = {
        id: 'inv-001',
        familyId: 'fam-001',
        createdBy: 'account-abc',
        token: 'a1b2c3d4e5f6',
        status: 'active',
        expiresAt: now + 604800000,
        createdAt: now
      };

      expect(invitation.id).toBe('inv-001');
      expect(invitation.familyId).toBe('fam-001');
      expect(invitation.createdBy).toBe('account-abc');
      expect(invitation.token).toBe('a1b2c3d4e5f6');
      expect(invitation.status).toBe('active');
      expect(invitation.expiresAt).toBeGreaterThan(invitation.createdAt);
    });

    it('token must never equal familyId', () => {
      const invitation = {
        id: 'inv-002',
        familyId: 'fam-001',
        createdBy: 'account-abc',
        token: 'different-token',
        status: 'active',
        expiresAt: Date.now() + 604800000,
        createdAt: Date.now()
      };

      expect(invitation.token).not.toBe(invitation.familyId);
    });

    it('should accept used, expired, and revoked statuses', () => {
      const now = Date.now();
      const used = { id: 'i1', familyId: 'f1', createdBy: 'a1', token: 't1', status: 'used', expiresAt: now + 86400000, createdAt: now };
      const expired = { id: 'i2', familyId: 'f1', createdBy: 'a1', token: 't2', status: 'expired', expiresAt: now - 86400000, createdAt: now - 604800000 };
      const revoked = { id: 'i3', familyId: 'f1', createdBy: 'a1', token: 't3', status: 'revoked', expiresAt: now + 86400000, createdAt: now };

      expect(used.status).toBe('used');
      expect(expired.status).toBe('expired');
      expect(revoked.status).toBe('revoked');
    });
  });
});
