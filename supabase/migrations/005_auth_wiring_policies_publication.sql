-- =====================================================
-- SUPABASE MIGRATION 005: AUTH WIRING + POLICY GAPS + PUBLICATION SCOPE
-- Date: 2026-09-10
-- Fixes audit findings: C1, C3/I3, C6, I5, I6
--   (C2 password rotation applied OUT-OF-BAND — secret is not committed)
-- References: docs/08-execution/DB_AUDIT_POWERSYNC_STREAMS.md
--
-- Design invariant (C3/I3):
--   public.users.id MUST equal auth.uid().
--   All RLS policies in this project filter on auth.uid() = user_id;
--   without this wiring every policy returns 0 rows for real users
--   and all PowerSync sync streams stay empty.
-- =====================================================

-- =====================================================
-- 1. C3/I3 — auth.users → public.users wiring
-- =====================================================

-- INSERT: Supabase Auth creates the identity; we mirror it into the app profile.
-- SECURITY DEFINER so the trigger (running as postgres, table owner) can write
-- public.users even though RLS is enabled on it.
-- email is NOT NULL in public.users but nullable in auth.users (OAuth /
-- anonymous): fall back to a deterministic 'anonymous-<id>' value.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, display_name, created_at, updated_at)
  values (
    new.id,  -- = auth.uid(), the whole point of this wiring
    coalesce(new.email, 'anonymous-' || new.id::text),
    left(new.raw_user_meta_data->>'display_name', 100),
    coalesce(new.created_at, now()),
    now()
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- UPDATE: mirror email / display name / last login so the synced profile row
-- stays current. display_name keeps its previous value when the update does
-- not carry one (no clobbering).
create or replace function public.handle_user_updated()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.users u
  set email = coalesce(new.email, 'anonymous-' || new.id::text),
      display_name = coalesce(new.raw_user_meta_data->>'display_name', u.display_name),
      last_login_at = coalesce(new.last_sign_in_at, u.last_login_at)
  where u.id = new.id;
  return new;
end;
$$;

drop trigger if exists on_auth_user_updated on auth.users;
create trigger on_auth_user_updated
  after update of email, raw_user_meta_data, last_sign_in_at on auth.users
  for each row execute function public.handle_user_updated();

-- Backfill: no-op on a fresh DB, idempotent safety net for any existing users.
insert into public.users (id, email, display_name, created_at, updated_at)
select u.id,
       coalesce(u.email, 'anonymous-' || u.id::text),
       left(u.raw_user_meta_data->>'display_name', 100),
       coalesce(u.created_at, now()),
       now()
from auth.users u
where not exists (select 1 from public.users p where p.id = u.id);

-- Note (audit C4, by design): public.users intentionally has NO user INSERT
-- RLS policy. The trigger above (running as table owner) is the only write
-- path that creates a profile row — users cannot mint profiles for other
-- accounts. Users may UPDATE their own row (existing policy).

-- =====================================================
-- 2. I5 — word_performance: add missing UPDATE policy
-- =====================================================
-- Existing policies on word_performance: SELECT + INSERT only (both scoped
-- via EXISTS on memorization_records.user_id). RLS UPDATE was silently
-- failing → client uploads of word-level stats would 42501.
create policy "Users can update own word performance" on public.word_performance
  for update using ( exists (
    select 1 from public.memorization_records mr
    where mr.id = word_performance.memorization_record_id
      and mr.user_id = auth.uid()
  ) ) with check ( exists (
    select 1 from public.memorization_records mr
    where mr.id = word_performance.memorization_record_id
      and mr.user_id = auth.uid()
  ) );

-- =====================================================
-- 3. I6 — user_achievements: add missing INSERT policy
-- =====================================================
-- Existing policies: SELECT + UPDATE only (auth.uid() = user_id).
-- Unlocking an achievement requires INSERT → it was silently failing.
create policy "Users can insert own achievements" on public.user_achievements
  for insert with check (auth.uid() = user_id);

-- =====================================================
-- 4. C1/I1 + C6 — publication: SYNCED tables only (13)
-- =====================================================
-- The live publication was FOR ALL TABLES (51 tables incl. auth.*,
-- storage.*, realtime.*, vault.secrets). Recreate it explicitly.
--
-- INCLUDED (13, SYNCED classification):
--   users, learner_profiles, memorization_records, review_logs,
--   word_performance, streaks, collections, collection_verses,
--   user_achievements, settings, families, family_memberships,
--   family_invitations
--
-- EXCLUDED (documented):
--   achievements        → I8: catalog shipped embedded in the app, not synced
--   bible_*, versification_maps → LOCAL_ONLY (Bible corpora never sync)
--   auth.*, storage.*, realtime.*, vault.* → Supabase infrastructure,
--   never part of the app data contract
drop publication if exists powersync;
create publication powersync for table
  public.users,
  public.learner_profiles,
  public.memorization_records,
  public.review_logs,
  public.word_performance,
  public.streaks,
  public.collections,
  public.collection_verses,
  public.user_achievements,
  public.settings,
  public.families,
  public.family_memberships,
  public.family_invitations;

-- powersync_role: narrow SELECT grants to the synced set (hygiene; the
-- publication already bounds replication, but the grants should match it).
revoke select on public.achievements from powersync_role;
revoke select on public.bible_books from powersync_role;
revoke select on public.bible_languages from powersync_role;
revoke select on public.bible_translations from powersync_role;
revoke select on public.bible_verses from powersync_role;
revoke select on public.versification_maps from powersync_role;

-- =====================================================
-- 5. REPLICA IDENTITY FULL on every synced table
-- =====================================================
-- Required by PowerSync: DELETE (and UPDATE) change events must carry the
-- full old row, not only the key. Default replica identity = key only.
alter table public.users replica identity full;
alter table public.learner_profiles replica identity full;
alter table public.memorization_records replica identity full;
alter table public.review_logs replica identity full;
alter table public.word_performance replica identity full;
alter table public.streaks replica identity full;
alter table public.collections replica identity full;
alter table public.collection_verses replica identity full;
alter table public.user_achievements replica identity full;
alter table public.settings replica identity full;
alter table public.families replica identity full;
alter table public.family_memberships replica identity full;
alter table public.family_invitations replica identity full;

-- =====================================================
-- 6. C2 — powersync_role password rotation (OUT OF BAND)
-- =====================================================
-- Executed separately via SQL editor / MCP, NEVER committed:
--   ALTER ROLE powersync_role WITH PASSWORD '<strong-random-password>';
-- The new value is stored in .env.local (git-ignored) and configured on the
-- PowerSync Cloud connection when the instance is provisioned.
-- Safe now: no PowerSync Cloud endpoint is provisioned yet
-- (VITE_POWERSYNC_URL empty in .env.local), so no live connection breaks.
