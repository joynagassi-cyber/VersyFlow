-- =====================================================
-- SUPABASE MIGRATION 008: TELEMETRY EVENTS (P2-1)
-- Remote, user-scoped telemetry sink.
--
-- Design (decision P2-1, option A):
--   Telemetry is a LOCAL_QUEUE → SYNCED flow. The client records events
--   into `public.telemetry_events` via a plain INSERT intercepted by
--   PowerSync (single sync write path, no ad-hoc network call from the
--   frontend). The table is append-only, user-scoped, and carries NO
--   verse text / PII — payloads are already redacted by
--   `src/domains/telemetry/entities.redact` before being recorded.
--
--   `id` is a client-generated UUIDv4 (deterministic per event) so the
--   PowerSync upsert path is idempotent: re-INSERTing the same event id
--   is a no-op, matching the insertOnly `streaks` convention.
--
--   Replica identity full (see 005) + publication membership (added
--   below) make the table SYNCED to the local PowerSync replica.
-- =====================================================

create table if not exists public.telemetry_events (
  id uuid primary key,                      -- client-generated UUIDv4
  user_id uuid not null references public.users(id) on delete cascade,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  session_id text,
  created_at timestamptz not null default now(),
  synced_at timestamptz default now()
);

comment on table public.telemetry_events is 'Redacted, user-scoped learning telemetry (no PII, no verse text)';

-- =====================================================
-- INDEXES
-- =====================================================
create index if not exists idx_telemetry_events_user_id on public.telemetry_events(user_id);
create index if not exists idx_telemetry_events_event_type on public.telemetry_events(event_type);
create index if not exists idx_telemetry_events_created_at on public.telemetry_events(created_at desc);

-- =====================================================
-- RLS
-- =====================================================
alter table public.telemetry_events enable row level security;

-- A user may only read their own events (analytics dashboards stay
-- owner-scoped; no cross-user read path exists in the client).
create policy "Users can view own telemetry" on public.telemetry_events
  for select using (auth.uid() = user_id);

-- A user may only insert their own events (event rows are stamped with
-- the auth uid by the client; the policy enforces server-side).
create policy "Users can insert own telemetry" on public.telemetry_events
  for insert with check (auth.uid() = user_id);

-- No UPDATE / DELETE policies: the table is append-only for the client.
-- Server-side retention (e.g. a cron that prunes old rows) runs as a
-- privileged role outside RLS.

-- =====================================================
-- REPLICATION + PUBLICATION
-- =====================================================
alter table public.telemetry_events replica identity full;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'powersync'
      and schemaname = 'public'
      and tablename = 'telemetry_events'
  ) then
    alter publication powersync add table public.telemetry_events;
  end if;
end $$;
