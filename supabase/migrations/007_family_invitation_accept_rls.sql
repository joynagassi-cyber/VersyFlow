-- =====================================================
-- SUPABASE MIGRATION 007: FAMILY INVITATION ACCEPT (O-2)
-- Allows the INVITED user (not just the owner) to insert their own
-- family_memberships row when accepting an invitation.
--
-- Problem (audit O-2):
--   `FamilyService.acceptInvitation` calls `familyRepository.addMember`
--   which INSERTs into `public.family_memberships`. The existing RLS
--   policy "Owners can insert members" only allows the OWNER
--   (`f.owner_id = auth.uid()`) to insert. An invited user (the one
--   accepting the link) is NOT the owner, so the insert is blocked
--   server-side and the invite flow fails.
--
-- Fix:
--   Add a second insert policy that lets a user who holds a VALID,
--   PENDING invitation to the target family insert a `member`-role
--   row for themselves (user_id = auth.uid(), role = 'member',
--   status = 'active'). The invitation must:
--     - belong to the same family,
--     - be in the `pending` state (un-consumed),
--     - not be expired (`expires_at > now()`),
--     - not have been consumed by anyone yet (`accepted_by IS NULL`).
--
--   The owner-policy stays intact; this policy is strictly additive
--   and only widens INSERT for the specific
--   (family_id, user_id = auth.uid(), role = 'member') tuple.
--
-- Status vocabulary:
--   The backend `family_invitations.status` is
--   ('pending', 'accepted', 'expired', 'revoked'). A PENDING invitation
--   is the one the user is about to accept; once the accepting user
--   inserts their membership and the client marks the invitation
--   `used`/`accepted`, the invitation leaves the `pending` state and
--   can no longer drive a second membership insert.
--
-- Security:
--   - Only the invited user can self-insert (user_id = auth.uid()).
--   - Only the `member` role can be self-inserted via this policy
--     (owner/admin still require the owner path).
--   - The invitation must exist in `family_invitations` with
--     status = 'pending', a non-past `expires_at`, and `accepted_by`
--     still NULL.
--   - RLS remains on for all other operations. No service-role
--     involvement; the trigger/edge-function alternative was rejected
--     in favour of a narrow RLS policy because it is reviewable and
--     runs in the same transaction as the client write.
-- =====================================================

-- Drop any stale policy with the same name so re-runs are idempotent.
drop policy if exists "Invited members can accept invitations" on public.family_memberships;

create policy "Invited members can accept invitations"
  on public.family_memberships
  for insert
  with check (
    -- Self-insert only.
    user_id = auth.uid()
    and role = 'member'
    and status = 'active'
    and exists (
      select 1
      from public.family_invitations fi
      where fi.family_id = family_memberships.family_id
        and fi.status = 'pending'           -- un-consumed invitation
        and (fi.expires_at is null or fi.expires_at > now())
        and fi.accepted_by is null          -- not yet consumed
    )
  );
