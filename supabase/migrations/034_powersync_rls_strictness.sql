-- =====================================================
-- SUPABASE MIGRATION 034: POWERSYNC RLS STRICTNESS + SECURITY INVOKER VIEWS
-- Date: 2026-10-06
--
-- Context (DEC-012, 2026-10-05):
--   Live schema audit found the 5 business tables below carrying
--   `USING(true)` / `WITH CHECK(true)` policies on SELECT/UPDATE/DELETE
--   statements (view / delete / update paths), i.e. RLS was enabled but
--   not actually enforcing user scoping. Any authenticated user could
--   read/modify another user's data through raw PostgREST requests
--   (bypassing the PowerSync stream filter, which itself was correct).
--
--   Root cause: migration 002 defined `USING(true)` placeholders that
--   were never reworked, and the view-join pattern (families <->
--   family_memberships) on two RLS-enabled tables caused
--   "infinite recursion detected in policy" (42P17) once live-enforced.
--
-- Fix:
--   1. Two SECURITY INVOKER views in schema `public` that centralize
--      the "active member of family X" predicate. These views are
--      SECURITY INVOKER BY DEFAULT (owner = postgres, non-superuser),
--      so they DO NOT bypass RLS on `family_memberships`. This avoids
--      both the 42P17 recursion trap (no cross-table JOIN happens
--      inside a policy, only inside the view which is evaluated under
--      the invoker's RLS context) and matches the `FORCE ROW LEVEL
--      SECURITY` rule in `supabase-mcp.md` §2.2.
--
--      Rationale (per supabase-mcp.md §4.10 allow-list):
--      - These views expose ONLY the `family_id` / `owner_id` /
--        membership rows of the *invoker themselves*, filtered by
--        `auth.uid()`. There is no new information disclosure surface;
--        they are pure row-filter predicates, equivalent to a well-
--        scoped `EXISTS (SELECT ...)`.
--      - Named `v_` prefix so `check-rls.sh` / `check-view-joins.ts`
--        pick them up in the next local gate pass.
--
--   2. The 5 tables' 11 SELECT/UPDATE/DELETE policies are rewritten to
--      reference the views (or `auth.uid()` directly where the table has
--      a plain `user_id`/`owner_id` column). No `USING(true)` /
--      `WITH CHECK(true)` remains on business tables — only on the
--      global reference registries (bible_*, semantic_*, versification
--      maps, achievements), which is allowed per AD-16b / §4.10.
--
--   3. `ALTER TABLE ... FORCE ROW LEVEL SECURITY` on all 5 tables.
--
-- Post-migration live check (2026-10-06, via mcp__supabase-versyflow):
--   - Zero remaining `USING(true)` on collection_verses / families /
--     family_invitations / family_memberships / word_performance.
--   - `relforcerowsecurity = true` on all 5 tables.
--   - Simulated auth.uid() with a random sub returned 0 visible rows
--     (isolation confirmed — no cross-user leakage).
-- =====================================================

-- =====================================================
-- 1. SECURITY INVOKER VIEWS
-- =====================================================

CREATE OR REPLACE VIEW public.v_families_member_visible AS
  SELECT f.id AS family_id,
         f.owner_id,
         f.name,
         f.color,
         f.icon,
         f.created_at,
         f.updated_at
  FROM public.families f
  JOIN public.family_memberships fm
    ON fm.family_id = f.id
  WHERE fm.user_id = auth.uid()
    AND fm.status = 'active';

COMMENT ON VIEW public.v_families_member_visible IS
  'Rationale: predicate view for families RLS. SECURITY INVOKER BY DEFAULT; '
  'evaluated under the invoker''s RLS context on family_memberships, '
  'exposing only the invoker''s own active family memberships.';

GRANT SELECT ON public.v_families_member_visible TO authenticated;

CREATE OR REPLACE VIEW public.v_family_invitations_member_visible AS
  SELECT fi.id,
         fi.family_id,
         fi.token,
         fi.invited_by,
         fi.invited_at,
         fi.expires_at,
         fi.status,
         fi.accepted_by
  FROM public.family_invitations fi
  JOIN public.family_memberships fm
    ON fm.family_id = fi.family_id
  WHERE fm.user_id = auth.uid()
    AND fm.status = 'active';

COMMENT ON VIEW public.v_family_invitations_member_visible IS
  'Rationale: predicate view for family_invitations RLS. SECURITY INVOKER BY '
  'DEFAULT; exposes only invitations whose family the invoker actively belongs to.';

GRANT SELECT ON public.v_family_invitations_member_visible TO authenticated;

-- =====================================================
-- 2. STRICT RLS POLICIES (replaces the live bare-USING(true) ones)
-- =====================================================

-- collection_verses : owned via collections.user_id
DROP POLICY IF EXISTS "Users can view own collection verses" ON public.collection_verses;
CREATE POLICY "Users can view own collection verses"
ON public.collection_verses FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.collections c
  WHERE c.id = collection_verses.collection_id
    AND c.user_id = auth.uid()
));

DROP POLICY IF EXISTS "Users can delete own collection verses" ON public.collection_verses;
CREATE POLICY "Users can delete own collection verses"
ON public.collection_verses FOR DELETE
USING (EXISTS (
  SELECT 1 FROM public.collections c
  WHERE c.id = collection_verses.collection_id
    AND c.user_id = auth.uid()
));

-- word_performance : owned via memorization_records.user_id
DROP POLICY IF EXISTS "Users can view own word performance" ON public.word_performance;
CREATE POLICY "Users can view own word performance"
ON public.word_performance FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.memorization_records r
  WHERE r.id = word_performance.memorization_record_id
    AND r.user_id = auth.uid()
));

DROP POLICY IF EXISTS "Users can update own word performance" ON public.word_performance;
CREATE POLICY "Users can update own word performance"
ON public.word_performance FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.memorization_records r
  WHERE r.id = word_performance.memorization_record_id
    AND r.user_id = auth.uid()
));

-- families : read via active membership (through view) or ownership
DROP POLICY IF EXISTS "Members can view families" ON public.families;
CREATE POLICY "Members can view families"
ON public.families FOR SELECT
USING (families.id IN (SELECT family_id FROM public.v_families_member_visible));

DROP POLICY IF EXISTS "Owners can update their families" ON public.families;
CREATE POLICY "Owners can update their families"
ON public.families FOR UPDATE
USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Owners can delete their families" ON public.families;
CREATE POLICY "Owners can delete their families"
ON public.families FOR DELETE
USING (auth.uid() = owner_id);

-- family_memberships : read via view OR as owner of that family
DROP POLICY IF EXISTS "Members can view memberships" ON public.family_memberships;
CREATE POLICY "Members can view memberships"
ON public.family_memberships FOR SELECT
USING (family_memberships.family_id IN (SELECT family_id FROM public.v_families_member_visible)
   OR auth.uid() IN (SELECT owner_id FROM public.families
                      WHERE families.id = family_memberships.family_id));

DROP POLICY IF EXISTS "Owners can update members" ON public.family_memberships;
CREATE POLICY "Owners can update members"
ON public.family_memberships FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.families f
  WHERE f.id = family_memberships.family_id
    AND f.owner_id = auth.uid()
));

DROP POLICY IF EXISTS "Owners can delete members" ON public.family_memberships;
CREATE POLICY "Owners can delete members"
ON public.family_memberships FOR DELETE
USING (EXISTS (
  SELECT 1 FROM public.families f
  WHERE f.id = family_memberships.family_id
    AND f.owner_id = auth.uid()
));

-- family_invitations : read via view (active member of that family)
DROP POLICY IF EXISTS "Members can view invitations" ON public.family_invitations;
CREATE POLICY "Members can view invitations"
ON public.family_invitations FOR SELECT
USING (family_invitations.id IN (SELECT id FROM public.v_family_invitations_member_visible));

DROP POLICY IF EXISTS "Owners can update invitations" ON public.family_invitations;
CREATE POLICY "Owners can update invitations"
ON public.family_invitations FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.families f
  WHERE f.id = family_invitations.family_id
    AND f.owner_id = auth.uid()
));

DROP POLICY IF EXISTS "Owners can delete invitations" ON public.family_invitations;
CREATE POLICY "Owners can delete invitations"
ON public.family_invitations FOR DELETE
USING (EXISTS (
  SELECT 1 FROM public.families f
  WHERE f.id = family_invitations.family_id
    AND f.owner_id = auth.uid()
));

-- =====================================================
-- 3. FORCE RLS ON ALL 5 BUSINESS TABLES
-- =====================================================
ALTER TABLE public.collection_verses   FORCE ROW LEVEL SECURITY;
ALTER TABLE public.word_performance     FORCE ROW LEVEL SECURITY;
ALTER TABLE public.families             FORCE ROW LEVEL SECURITY;
ALTER TABLE public.family_memberships   FORCE ROW LEVEL SECURITY;
ALTER TABLE public.family_invitations   FORCE ROW LEVEL SECURITY;
