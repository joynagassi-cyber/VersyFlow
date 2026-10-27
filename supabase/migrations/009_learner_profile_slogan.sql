-- =====================================================
-- SUPABASE MIGRATION 009: LEARNER PROFILE SLOGAN
-- Adds an optional personal slogan to learner_profiles
-- (max 60 chars, shown under the display name on the
-- profile screen).
--
-- Additive change: existing rows keep a NULL slogan; the
-- column is nullable and never backfilled.
-- =====================================================

alter table public.learner_profiles
  add column if not exists slogan varchar(60);

comment on column public.learner_profiles.slogan is
  'Optional personal slogan (max 60 chars) displayed under the display name';
