-- =====================================================
-- SUPABASE MIGRATION 003: POWERSYNC SETUP
-- Creates replication role and publication
-- Date: 2026-09-09
-- =====================================================

-- =====================================================
-- CREATE POWERSYNC ROLE
-- =====================================================
do $$
begin
  if not exists (select from pg_roles where rolname = 'powersync_role') then
    create role powersync_role with replication bypassrls login password 'powersync_secret_CHANGE_THIS';
  end if;
end
$$;

-- Grant select on all synced tables
grant select on all tables in schema public to powersync_role;
alter default privileges in schema public grant select on tables to powersync_role;

-- =====================================================
-- CREATE PUBLICATION FOR POWERSYNC
-- Only sync specific tables (not Bible data)
-- =====================================================
drop publication if exists powersync;
create publication powersync for table
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

-- =====================================================
-- NOTE: Update password after first use
-- =====================================================
-- Run this in Supabase SQL Editor after first connection:
-- ALTER ROLE powersync_role WITH PASSWORD 'your_secure_password';
