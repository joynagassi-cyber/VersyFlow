/**
 * FamilyMapper — domain ↔ PowerSync row translation for family-related tables.
 *
 * The PowerSync schema stores `families`, `family_memberships` and
 * `family_invitations` with `created_at`/`updated_at` as TEXT ISO-8601
 * (SQLite cannot hold epoch-ms values in a column). The domain uses
 * `number` (Unix ms). This mapper is pure so it is trivially testable.
 *
 * `id` derivation:
 *   - family: a random UUIDv4 assigned by the caller (the repository
 *     generates one on `create`).
 *   - familyMembership: a deterministic composite
 *     `recordUuid(user: familyId|accountId)` so that the upsert path is
 *     stable across saves.
 *
 * The invitation vocabulary in the domain (`pending`/`active`/`used`) is
 * mapped to the backend vocabulary (`pending`/`accepted`/`used`); the
 * mapper absorbs the difference.
 */

import { recordUuid } from './memorization-mapper';
import type { Family, FamilyMembership } from '@/domains/family';
import type { FamilyInvitation } from '@/domains/family-invitation';

// ---------------------------------------------------------------------------
// Row shapes
// ---------------------------------------------------------------------------

export interface FamilyRow {
  id: string;
  owner_id: string;
  name: string;
  color: string;
  icon: string;
  created_at: string;
  updated_at: string;
}

export interface FamilyMembershipRow {
  id: string;
  family_id: string;
  user_id: string;
  role: string;
  status: string;
  invited_at: string | null;
  joined_at: string | null;
}

export interface FamilyInvitationRow {
  id: string;
  family_id: string;
  token: string;
  invited_by: string;
  invited_at: string | null;
  expires_at: string | null;
  status: string;
  accepted_by: string | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function msToIso(ms: number | null | undefined): string | null {
  if (ms == null || Number.isNaN(ms)) return null;
  return new Date(ms).toISOString();
}

function isoToMs(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  return Number.isNaN(t) ? null : t;
}

// ---------------------------------------------------------------------------
// Family
// ---------------------------------------------------------------------------

export function familyToRow(family: Family): FamilyRow {
  return {
    id: family.id,
    owner_id: family.ownerId,
    name: family.name,
    color: family.color,
    icon: family.icon,
    created_at: msToIso(family.createdAt) ?? new Date().toISOString(),
    // `updated_at` is not on the domain `Family` (it is server-owned);
    // default to `created_at` so the row is valid on first write.
    updated_at: msToIso(family.createdAt) ?? new Date().toISOString(),
  };
}

export function familyRowToEntity(row: FamilyRow): Family {
  return {
    id: row.id,
    ownerId: row.owner_id,
    name: row.name,
    color: row.color,
    icon: row.icon,
    createdAt: isoToMs(row.created_at) ?? 0,
  };
}

// ---------------------------------------------------------------------------
// FamilyMembership
// ---------------------------------------------------------------------------

/**
 * Deterministic composite key for a membership:
 * `(accountId, familyId)`. The upsert is idempotent per
 * `(user, family)` pair, which matches the domain invariant "an account
 * belongs to a given family at most once."
 */
export function membershipUuid(accountId: string, familyId: string): string {
  return recordUuid(accountId, {
    bookId: familyId,
    chapterNumber: 0,
    verseNumber: 0,
    endVerse: undefined,
    translationId: 'membership',
  });
}

export function familyMembershipToRow(m: FamilyMembership): FamilyMembershipRow {
  return {
    id: membershipUuid(m.accountId, m.familyId),
    family_id: m.familyId,
    user_id: m.accountId,
    role: m.role,
    status: m.status,
    invited_at: null,
    joined_at: msToIso(m.joinedAt),
  };
}

export function familyMembershipRowToEntity(row: FamilyMembershipRow): FamilyMembership {
  return {
    id: row.id,
    familyId: row.family_id,
    accountId: row.user_id,
    role: row.role as FamilyMembership['role'],
    status: row.status as FamilyMembership['status'],
    createdAt: isoToMs(row.invited_at) ?? 0,
    joinedAt: isoToMs(row.joined_at) ?? 0,
  };
}

// ---------------------------------------------------------------------------
// FamilyInvitation
// ---------------------------------------------------------------------------

/**
 * Backend status vocabulary (sync stream + Postgres): `pending` /
 * `accepted` / `used`. The domain {@link InvitationStatus} is
 * `active` / `used` / `expired` / `revoked`. The two maps below keep the
 * translation in both directions explicit.
 */
const INVITATION_BACKEND_TO_DOMAIN: Record<
  string,
  import('@/domains/family-invitation').InvitationStatus
> = {
  pending: 'active',
  accepted: 'active',
  active: 'active',
  used: 'used',
  expired: 'expired',
  revoked: 'revoked',
};

const INVITATION_DOMAIN_TO_BACKEND: Record<
  import('@/domains/family-invitation').InvitationStatus,
  string
> = {
  active: 'accepted',
  used: 'used',
  expired: 'expired',
  revoked: 'revoked',
};

export function familyInvitationToRow(inv: FamilyInvitation): FamilyInvitationRow {
  return {
    id: inv.id,
    family_id: inv.familyId,
    token: inv.token,
    invited_by: inv.createdBy,
    invited_at: msToIso(inv.createdAt),
    expires_at: msToIso(inv.expiresAt),
    status: INVITATION_DOMAIN_TO_BACKEND[inv.status],
    accepted_by: null,
  };
}

export function familyInvitationRowToEntity(row: FamilyInvitationRow): FamilyInvitation {
  return {
    id: row.id,
    familyId: row.family_id,
    token: row.token,
    createdBy: row.invited_by,
    createdAt: isoToMs(row.invited_at) ?? 0,
    expiresAt: isoToMs(row.expires_at) ?? 0,
    status: INVITATION_BACKEND_TO_DOMAIN[row.status] ?? 'active',
  };
}
