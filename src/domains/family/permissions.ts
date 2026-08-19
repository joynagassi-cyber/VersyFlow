/**
 * Family Permissions Module
 * Defines access control policies for family operations
 * FAM-PERM-001
 */

export enum FamilyRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  MEMBER = 'member',
}

export enum FamilyPermission {
  MANAGE_FAMILY = 'manage_family',
  INVITE_MEMBER = 'invite_member',
  REMOVE_MEMBER = 'remove_member',
  MANAGE_LOCAL_PROFILE = 'manage_local_profile',
  VIEW_FAMILY_PROGRESS = 'view_family_progress',
}

export const ROLE_PERMISSIONS: Record<FamilyRole, FamilyPermission[]> = {
  [FamilyRole.OWNER]: [
    FamilyPermission.MANAGE_FAMILY,
    FamilyPermission.INVITE_MEMBER,
    FamilyPermission.REMOVE_MEMBER,
    FamilyPermission.MANAGE_LOCAL_PROFILE,
    FamilyPermission.VIEW_FAMILY_PROGRESS,
  ],
  [FamilyRole.ADMIN]: [
    FamilyPermission.INVITE_MEMBER,
    FamilyPermission.REMOVE_MEMBER,
    FamilyPermission.MANAGE_LOCAL_PROFILE,
    FamilyPermission.VIEW_FAMILY_PROGRESS,
  ],
  [FamilyRole.MEMBER]: [
    FamilyPermission.VIEW_FAMILY_PROGRESS,
  ],
};

export function hasPermission(role: FamilyRole, permission: FamilyPermission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function canManageFamily(role: FamilyRole): boolean {
  return hasPermission(role, FamilyPermission.MANAGE_FAMILY);
}

export function canInviteMember(role: FamilyRole): boolean {
  return hasPermission(role, FamilyPermission.INVITE_MEMBER);
}

export function canRemoveMember(role: FamilyRole): boolean {
  return hasPermission(role, FamilyPermission.REMOVE_MEMBER);
}

export function canManageLocalProfile(role: FamilyRole): boolean {
  return hasPermission(role, FamilyPermission.MANAGE_LOCAL_PROFILE);
}
