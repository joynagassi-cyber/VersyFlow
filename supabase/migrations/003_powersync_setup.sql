-- Supabase Migration 003: PowerSync Setup
-- Creates role for replication and publication
-- Created: 2026-09-09

-- Create role for PowerSync replication
do $$
begin
  if not exists (select from pg_roles where rolname = 'powersync_role') then
    create role powersync_role with replication bypassrls login password 'powersync_secret_change_me';
  end if;
end
$$;

-- Grant select on all synced tables
grant select on all tables in schema public to powersync_role;
alter default privileges in schema public grant select on tables to powersync_role;

-- Create publication for PowerSync
-- Only include tables that need syncing (not Bible data)
create publication if not exists powersync for table
  public.memorization_records,
  public.review_logs,
  public.word_performance,
  public.streaks,
  public.collections,
  public.collection_verses,
  public.user_achievements,
  public.settings,
  public.learner_profiles,
  public.families,
  public.family_memberships,
  public.family_invitations;

-- NOTE: Update password in Supabase Dashboard > Settings > Database
-- Or run: alter role powersync_role with password 'your_secure_password';
