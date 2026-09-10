-- =====================================================
-- SUPABASE MIGRATION 006: FAMILY OWNER MEMBERSHIP GUARANTEE
-- I4 — server-side fix for orphan families
-- Date: 2026-09-10
--
-- Problem (audit I4):
--   A family could be created via a direct Supabase REST call
--   (postgrest insert on public.families) WITHOUT a matching
--   family_memberships row. The client's createFamily() *does*
--   insert the owner membership, but a raw REST/data-API call
--   bypasses the app and would leave the family "orphan" —
--   i.e. present in public.families but absent from
--   public.family_memberships, breaking the RLS membership
--   policies and every PowerSync family stream that filters on
--   family_memberships.
--
-- Fix:
--   An AFTER INSERT trigger on public.families atomically inserts
--   the owner's family_memberships row in the SAME transaction as
--   the family row. ON CONFLICT DO NOTHING makes it idempotent with
--   respect to the app's own addMember(owner) call (domain service
--   still issues it) and to re-runs.
--
-- Security:
--   The trigger function is SECURITY INVOKER (the default): the
--   membership INSERT is executed by the calling role and is fully
--   subject to family_memberships RLS ("Owners can insert members"
--   = EXISTS(families.owner_id = auth.uid())). Combined with the
--   families insert policy ("Owners can insert families"
--   = auth.uid() = owner_id), only the true owner can ever spawn a
--   membership row. NO RLS bypass, no service-role in the client.
-- =====================================================

-- Trigger function: guarantee an owner membership row exists.
create or replace function public.ensure_family_owner_membership()
returns trigger
language plpgsql
security invoker
as $
begin
  insert into public.family_memberships (family_id, user_id, role, status, joined_at)
  values (new.id, new.owner_id, 'owner', 'active', now())
  on conflict (family_id, user_id) do nothing;
  return new;
end;
$;

-- Wire it as an AFTER INSERT trigger on families.
drop trigger if exists on_family_insert_owner_membership on public.families;
create trigger on_family_insert_owner_membership
  after insert on public.families
  for each row
  execute function public.ensure_family_owner_membership();

-- One-time backfill: seed the owner membership for any family that
-- already exists without one (families created before this trigger).
-- Idempotent: only inserts where the (family_id, owner_id) row is
-- missing. Runs as the provisioning role (bypasses RLS) — acceptable
-- for a one-shot admin repair, not for the per-client path.
insert into public.family_memberships (family_id, user_id, role, status, joined_at)
select f.id, f.owner_id, 'owner', 'active', now()
from public.families f
where not exists (
  select 1 from public.family_memberships fm
  where fm.family_id = f.id and fm.user_id = f.owner_id
)
on conflict (family_id, user_id) do nothing;
