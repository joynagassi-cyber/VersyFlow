-- Supabase Migration 002: Family & Learner Profiles
-- Created: 2026-09-09
-- Adds family management and multi-profile support

-- Learner profiles
create table if not exists public.learner_profiles (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  display_name varchar(100) not null,
  avatar_url text,
  status varchar(20) default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (user_id, display_name)
);

-- Families
create table if not exists public.families (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid not null references public.users(id) on delete cascade,
  name varchar(100) not null,
  color varchar(7) default '#E91E8C',
  icon varchar(50) default 'people',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Family memberships
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

-- Family invitations
create table if not exists public.family_invitations (
  id uuid primary key default uuid_generate_v4(),
  family_id uuid not null references public.families(id) on delete cascade,
  token varchar(100) unique not null,
  invited_by uuid not null references public.users(id) on delete cascade,
  invited_at timestamptz default now(),
  expires_at timestamptz not null,
  status varchar(20) not null default 'pending' check (status in ('pending', 'accepted', 'expired', 'revoked'))
);

-- Indexes
create index if not exists idx_learner_profiles_user_id on public.learner_profiles(user_id);
create index if not exists idx_families_owner_id on public.families(owner_id);
create index if not exists idx_family_memberships_family_id on public.family_memberships(family_id);
create index if not exists idx_family_memberships_user_id on public.family_memberships(user_id);
create index if not exists idx_family_invitations_token on public.family_invitations(token);
create index if not exists idx_family_invitations_family_id on public.family_invitations(family_id);

-- Update trigger
create trigger update_learner_profiles_updated_at before update on public.learner_profiles
  for each row execute function public.update_updated_at_column();

create trigger update_families_updated_at before update on public.families
  for each row execute function public.update_updated_at_column();

-- RLS Policies
alter table public.learner_profiles enable row level security;
create policy "Users can view their own profiles" on public.learner_profiles
  for select using (auth.uid() = user_id);
create policy "Users can insert their own profiles" on public.learner_profiles
  for insert with check (auth.uid() = user_id);
create policy "Users can update their own profiles" on public.learner_profiles
  for update using (auth.uid() = user_id);

alter table public.families enable row level security;
create policy "Users can view their families" on public.families
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
