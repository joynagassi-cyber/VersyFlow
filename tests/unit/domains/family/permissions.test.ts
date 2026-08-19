/**
 * Tests — Family Permissions (FAM-PERM-001)
 * Verify role-based access control
 */

import { FamilyRole, FamilyPermission, hasPermission, canManageFamily, canInviteMember, canRemoveMember, canManageLocalProfile } from '@/domains/family/permissions';

describe('Family Permissions', () => {
  describe('hasPermission', () => {
    it('should grant owner full access', () => {
      expect(hasPermission(FamilyRole.OWNER, FamilyPermission.MANAGE_FAMILY)).toBe(true);
      expect(hasPermission(FamilyRole.OWNER, FamilyPermission.INVITE_MEMBER)).toBe(true);
      expect(hasPermission(FamilyRole.OWNER, FamilyPermission.REMOVE_MEMBER)).toBe(true);
      expect(hasPermission(FamilyRole.OWNER, FamilyPermission.MANAGE_LOCAL_PROFILE)).toBe(true);
      expect(hasPermission(FamilyRole.OWNER, FamilyPermission.VIEW_FAMILY_PROGRESS)).toBe(true);
    });

    it('should grant admin limited access', () => {
      expect(hasPermission(FamilyRole.ADMIN, FamilyPermission.MANAGE_FAMILY)).toBe(false);
      expect(hasPermission(FamilyRole.ADMIN, FamilyPermission.INVITE_MEMBER)).toBe(true);
      expect(hasPermission(FamilyRole.ADMIN, FamilyPermission.REMOVE_MEMBER)).toBe(true);
      expect(hasPermission(FamilyRole.ADMIN, FamilyPermission.MANAGE_LOCAL_PROFILE)).toBe(true);
      expect(hasPermission(FamilyRole.ADMIN, FamilyPermission.VIEW_FAMILY_PROGRESS)).toBe(true);
    });

    it('should grant member only view access', () => {
      expect(hasPermission(FamilyRole.MEMBER, FamilyPermission.MANAGE_FAMILY)).toBe(false);
      expect(hasPermission(FamilyRole.MEMBER, FamilyPermission.INVITE_MEMBER)).toBe(false);
      expect(hasPermission(FamilyRole.MEMBER, FamilyPermission.REMOVE_MEMBER)).toBe(false);
      expect(hasPermission(FamilyRole.MEMBER, FamilyPermission.MANAGE_LOCAL_PROFILE)).toBe(false);
      expect(hasPermission(FamilyRole.MEMBER, FamilyPermission.VIEW_FAMILY_PROGRESS)).toBe(true);
    });
  });

  describe('Permission helpers', () => {
    it('should check manage family', () => {
      expect(canManageFamily(FamilyRole.OWNER)).toBe(true);
      expect(canManageFamily(FamilyRole.ADMIN)).toBe(false);
      expect(canManageFamily(FamilyRole.MEMBER)).toBe(false);
    });

    it('should check invite member', () => {
      expect(canInviteMember(FamilyRole.OWNER)).toBe(true);
      expect(canInviteMember(FamilyRole.ADMIN)).toBe(true);
      expect(canInviteMember(FamilyRole.MEMBER)).toBe(false);
    });

    it('should check remove member', () => {
      expect(canRemoveMember(FamilyRole.OWNER)).toBe(true);
      expect(canRemoveMember(FamilyRole.ADMIN)).toBe(true);
      expect(canRemoveMember(FamilyRole.MEMBER)).toBe(false);
    });

    it('should check manage local profile', () => {
      expect(canManageLocalProfile(FamilyRole.OWNER)).toBe(true);
      expect(canManageLocalProfile(FamilyRole.ADMIN)).toBe(true);
      expect(canManageLocalProfile(FamilyRole.MEMBER)).toBe(false);
    });
  });
});
