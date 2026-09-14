-- =====================================================
-- SUPABASE MIGRATION 002: FAMILY & INVITATIONS
-- Migration to Supabase (backend primaire)
-- Date: 2026-09-09
-- Tables: 4 family tables + RLS + Indexes
-- =====================================================

-- =====================================================
-- 1. FAMILIES TABLE
-- =====================================================
create table if not exists public.families (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid not null references public.users(id) on delete cascade,
  name varchar(100) not null,
  color varchar(7) default '#E91E8C',
  icon varchar(50) default 'people',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

comment on table public.families is 'Family groups for shared learning visibility';

-- =====================================================
-- 2. FAMILY MEMBERSHIPS TABLE
-- =====================================================
create table if not exists public.family_memberships (
  id uuid primary key default uuid_generate_v4(),
  family_id uuid not null references public.families(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  role varchar(20) not null default 'member' check (role in ('owner', 'admin', 'member')),
  status varchar(20) not null default 'active' check (status in ('active', 'suspended', 'pending')),
  invited_at timestamptz default now(),
  joined_at timestamptz,
  unique (family_id, user_id)
);

comment on table public.family_memberships is 'Links users to families with roles';

-- =====================================================
-- 3. FAMILY INVITATIONS TABLE
-- =====================================================
create table if not exists public.family_invitations (
  id uuid primary key default uuid_generate_v4(),
  family_id uuid not null references public.families(id) on delete cascade,
  token varchar(100) unique not null,
  invited_by uuid not null references public.users(id),
  invited_at timestamptz default now(),
  expires_at timestamptz not null,
  status varchar(20) not null default 'pending' check (status in ('pending', 'accepted', 'expired', 'revoked')),
  accepted_by uuid references public.users(id)
);

comment on table public.family_invitations is 'Pending family join requests';

-- =====================================================
-- INDEXES
-- =====================================================
create index if not exists idx_families_owner_id on public.families(owner_id);
create index if not exists idx_family_memberships_family_id on public.family_memberships(family_id);
create index if not exists idx_family_memberships_user_id on public.family_memberships(user_id);
create index if not exists idx_family_invitations_token on public.family_invitations(token);
create index if not exists idx_family_invitations_family_id on public.family_invitations(family_id);

-- =====================================================
-- TRIGGERS
-- =====================================================
create trigger update_families_updated_at before update on public.families
  for each row execute function public.update_updated_at_column();

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Families
alter table public.families enable row level security;
create policy "Members can view families" on public.families
  for select using exists (
    select 1 from public.family_memberships fm
    where fm.family_id = families.id
    and fm.user_id = auth.uid()
    and fm.status = 'active'
  );
create policy "Owners can insert families" on public.families
  for insert with check (auth.uid() = owner_id);
create policy "Owners can update their families" on public.families
  for update using (auth.uid() = owner_id);
create policy "Owners can delete their families" on public.families
  for delete using (auth.uid() = owner_id);

-- Family Memberships
alter table public.family_memberships enable row level security;
create policy "Members can view memberships" on public.family_memberships
  for select using exists (
    select 1 from public.families f
    join public.family_memberships fm2 on fm2.family_id = f.id
    where fm.family_id = f.id
    and (fm2.user_id = auth.uid() or auth.uid() = f.owner_id)
  );
create policy "Owners can insert members" on public.family_memberships
  for insert with check exists (
    select 1 from public.families f
    where f.id = family_memberships.family_id
    and f.owner_id = auth.uid()
  );
create policy "Owners can update members" on public.family_memberships
  for update using exists (
    select 1 from public.families f
    where f.id = family_memberships.family_id
    and f.owner_id = auth.uid()
  );
create policy "Owners can delete members" on public.family_memberships
  for delete using exists (
    select 1 from public.families f
    where f.id = family_memberships.family_id
    and f.owner_id = auth.uid()
  );

-- Family Invitations
alter table public.family_invitations enable row level security;
create policy "Members can view invitations" on public.family_invitations
  for select using exists (
    select 1 from public.families f
    join public.family_memberships fm on fm.family_id = f.id
    where fi.family_id = f.id
    and fm.user_id = auth.uid()
    and fm.status = 'active'
  );
create policy "Owners can insert invitations" on public.family_invitations
  for insert with check exists (
    select 1 from public.families f
    where f.id = family_invitations.family_id
    and f.owner_id = auth.uid()
  );
create policy "Owners can update invitations" on public.family_invitations
  for update using exists (
    select 1 from public.families f
    where f.id = family_invitations.family_id
    and f.owner_id = auth.uid()
  );
create policy "Owners can delete invitations" on public.family_invitations
  for delete using exists (
    select 1 from public.families f
    where f.id = family_invitations.family_id
    and f.owner_id = auth.uid()
  );

-- =====================================================
-- SEED: Sample Family (for testing)
-- =====================================================
-- Note: Actual families are created by users, not seeded
-- This is just a template for the schema
