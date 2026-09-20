-- =====================================================
-- SUPABASE MIGRATION 001: CORE TABLES
-- Migration from InsForge to Supabase
-- Date: 2026-09-09
-- Tables: 10 core tables + RLS + Indexes + Triggers
-- =====================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- =====================================================
-- 1. USERS TABLE
-- =====================================================
create table if not exists public.users (
  id uuid primary key default uuid_generate_v4(),
  email varchar(255) unique not null,
  display_name varchar(100),
  avatar_url text,
  default_translation varchar(50) default 'lsg',
  ui_language varchar(10) default 'fr',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  last_login_at timestamptz
);

comment on table public.users is 'Extended user profile data linked to Supabase Auth';

-- =====================================================
-- 2. LEARNER PROFILES TABLE
-- =====================================================
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

comment on table public.learner_profiles is 'Multiple learning profiles per account (family mode)';

-- =====================================================
-- 3. MEMORIZATION RECORDS TABLE
-- =====================================================
create table if not exists public.memorization_records (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  book_id varchar(50) not null,
  chapter_number integer not null,
  verse_number integer not null,
  end_verse integer,
  translation_id varchar(50) not null default 'lsg',
  bible_verse_reference varchar(200) not null,
  bible_verse_text text not null,
  status varchar(20) not null default 'new' check (status in ('new', 'in-progress', 'mastered')),
  fsrs_state jsonb not null default '{"stability":0,"difficulty":5,"recallProbability":0.9,"lastInterval":0,"nextInterval":1,"elapsedDays":0,"repetitions":0,"requestedRetention":0.9}',
  stability double precision default 0,
  difficulty double precision default 5,
  next_review_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  last_reviewed_at timestamptz,
  review_count integer default 0,
  total_review_minutes numeric(10,2) default 0,
  favorite boolean default false,
  tags text[] default '{}',
  unique (user_id, book_id, chapter_number, verse_number, translation_id)
);

comment on table public.memorization_records is 'Core verse memorization data with FSRS state';

-- =====================================================
-- 4. REVIEW LOGS TABLE
-- =====================================================
create table if not exists public.review_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  memorization_record_id uuid not null references public.memorization_records(id) on delete cascade,
  answered_at timestamptz not null default now(),
  rating varchar(10) not null check (rating in ('again', 'hard', 'good', 'easy')),
  actual_interval integer,
  predicted_interval integer not null,
  stability_before double precision,
  stability_after double precision,
  difficulty_before double precision,
  difficulty_after double precision,
  elapsed_days integer,
  repetitions integer,
  word_performance jsonb default '[]',
  created_at timestamptz default now()
);

comment on table public.review_logs is 'Historical review data for analytics and FSRS calibration';

-- =====================================================
-- 5. WORD PERFORMANCE TABLE
-- =====================================================
create table if not exists public.word_performance (
  id uuid primary key default uuid_generate_v4(),
  memorization_record_id uuid not null references public.memorization_records(id) on delete cascade,
  word varchar(100) not null,
  error_count integer default 0,
  total_attempts integer default 0,
  last_reviewed_at timestamptz,
  created_at timestamptz default now(),
  unique (memorization_record_id, word)
);

comment on table public.word_performance is 'Per-word performance tracking for difficulty analysis';

-- =====================================================
-- 6. STREAKS TABLE
-- =====================================================
create table if not exists public.streaks (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  streak_date date not null,
  verses_memorized integer default 0,
  reviews_completed integer default 0,
  session_duration_minutes integer default 0,
  created_at timestamptz default now(),
  unique (user_id, streak_date)
);

comment on table public.streaks is 'Daily streak tracking for motivation';

-- =====================================================
-- 7. COLLECTIONS TABLE
-- =====================================================
create table if not exists public.collections (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  name varchar(100) not null,
  description text,
  color varchar(7) default '#E91E8C',
  icon varchar(50) default 'folder',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

comment on table public.collections is 'User verse collections for organization';

-- =====================================================
-- 8. COLLECTION VERSES TABLE
-- =====================================================
create table if not exists public.collection_verses (
  id uuid primary key default uuid_generate_v4(),
  collection_id uuid not null references public.collections(id) on delete cascade,
  memorization_record_id uuid not null references public.memorization_records(id) on delete cascade,
  added_at timestamptz default now(),
  unique (collection_id, memorization_record_id)
);

comment on table public.collection_verses is 'Many-to-many between collections and verses';

-- =====================================================
-- 9. ACHIEVEMENTS TABLE
-- =====================================================
create table if not exists public.achievements (
  id uuid primary key default uuid_generate_v4(),
  key varchar(100) unique not null,
  title varchar(100) not null,
  description text not null,
  icon varchar(50) not null,
  color varchar(7) default '#E91E8C',
  category varchar(50) not null,
  requirement text not null,
  created_at timestamptz default now()
);

comment on table public.achievements is 'Achievement definitions (shared across all users)';

-- =====================================================
-- 10. USER ACHIEVEMENTS TABLE
-- =====================================================
create table if not exists public.user_achievements (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  achievement_id uuid not null references public.achievements(id) on delete cascade,
  unlocked boolean default false,
  unlocked_at timestamptz,
  progress integer default 0,
  created_at timestamptz default now(),
  unique (user_id, achievement_id)
);

comment on table public.user_achievements is 'User achievement progress tracking';

-- =====================================================
-- 11. SETTINGS TABLE
-- =====================================================
create table if not exists public.settings (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade unique,
  theme varchar(20) default 'light' check (theme in ('light', 'dark', 'system')),
  notification_enabled boolean default true,
  daily_reminder_time time default '08:00:00',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

comment on table public.settings is 'User preferences and settings';

-- =====================================================
-- INDEXES
-- =====================================================
create index if not exists idx_memorization_records_user_id on public.memorization_records(user_id);
create index if not exists idx_memorization_records_status on public.memorization_records(status);
create index if not exists idx_memorization_records_next_review on public.memorization_records(next_review_at) where next_review_at is not null;
create index if not exists idx_review_logs_user_id on public.review_logs(user_id);
create index if not exists idx_review_logs_record_id on public.review_logs(memorization_record_id);
create index if not exists idx_review_logs_answered_at on public.review_logs(answered_at);
create index if not exists idx_word_performance_record_id on public.word_performance(memorization_record_id);
create index if not exists idx_streaks_user_id on public.streaks(user_id);
create index if not exists idx_streaks_date on public.streaks(streak_date);
create index if not exists idx_collections_user_id on public.collections(user_id);
create index if not exists idx_collection_verses_collection_id on public.collection_verses(collection_id);
create index if not exists idx_collection_verses_record_id on public.collection_verses(memorization_record_id);
create index if not exists idx_user_achievements_user_id on public.user_achievements(user_id);
create index if not exists idx_user_achievements_unlocked on public.user_achievements(user_id, unlocked);
create index if not exists idx_learner_profiles_user_id on public.learner_profiles(user_id);

-- =====================================================
-- TRIGGERS
-- =====================================================
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language 'plpgsql';

create trigger update_users_updated_at before update on public.users
  for each row execute function public.update_updated_at_column();

create trigger update_memorization_records_updated_at before update on public.memorization_records
  for each row execute function public.update_updated_at_column();

create trigger update_collections_updated_at before update on public.collections
  for each row execute function public.update_updated_at_column();

create trigger update_settings_updated_at before update on public.settings
  for each row execute function public.update_updated_at_column();

create trigger update_learner_profiles_updated_at before update on public.learner_profiles
  for each row execute function public.update_updated_at_column();

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Users
alter table public.users enable row level security;
create policy "Users can view own profile" on public.users
  for select using (auth.uid() = id);
create policy "Users can update own profile" on public.users
  for update using (auth.uid() = id);

-- Learner Profiles
alter table public.learner_profiles enable row level security;
create policy "Users can view own profiles" on public.learner_profiles
  for select using (auth.uid() = user_id);
create policy "Users can insert own profiles" on public.learner_profiles
  for insert with check (auth.uid() = user_id);
create policy "Users can update own profiles" on public.learner_profiles
  for update using (auth.uid() = user_id);

-- Memorization Records
alter table public.memorization_records enable row level security;
create policy "Users can view own records" on public.memorization_records
  for select using (auth.uid() = user_id);
create policy "Users can insert own records" on public.memorization_records
  for insert with check (auth.uid() = user_id);
create policy "Users can update own records" on public.memorization_records
  for update using (auth.uid() = user_id);
create policy "Users can delete own records" on public.memorization_records
  for delete using (auth.uid() = user_id);

-- Review Logs
alter table public.review_logs enable row level security;
create policy "Users can view own reviews" on public.review_logs
  for select using (auth.uid() = user_id);
create policy "Users can insert own reviews" on public.review_logs
  for insert with check (auth.uid() = user_id);

-- Word Performance
alter table public.word_performance enable row level security;
create policy "Users can view own word performance" on public.word_performance
  for select using exists (
    select 1 from public.memorization_records mr
    where mr.id = word_performance.memorization_record_id
    and mr.user_id = auth.uid()
  );
create policy "Users can insert own word performance" on public.word_performance
  for insert with check exists (
    select 1 from public.memorization_records mr
    where mr.id = word_performance.memorization_record_id
    and mr.user_id = auth.uid()
  );

-- Streaks
alter table public.streaks enable row level security;
create policy "Users can view own streaks" on public.streaks
  for select using (auth.uid() = user_id);
create policy "Users can insert own streaks" on public.streaks
  for insert with check (auth.uid() = user_id);
create policy "Users can update own streaks" on public.streaks
  for update using (auth.uid() = user_id);

-- Collections
alter table public.collections enable row level security;
create policy "Users can view own collections" on public.collections
  for select using (auth.uid() = user_id);
create policy "Users can insert own collections" on public.collections
  for insert with check (auth.uid() = user_id);
create policy "Users can update own collections" on public.collections
  for update using (auth.uid() = user_id);
create policy "Users can delete own collections" on public.collections
  for delete using (auth.uid() = user_id);

-- Collection Verses
alter table public.collection_verses enable row level security;
create policy "Users can view own collection verses" on public.collection_verses
  for select using exists (
    select 1 from public.collections c
    where c.id = collection_verses.collection_id
    and c.user_id = auth.uid()
  );
create policy "Users can insert own collection verses" on public.collection_verses
  for insert with check exists (
    select 1 from public.collections c
    where c.id = collection_verses.collection_id
    and c.user_id = auth.uid()
  );
create policy "Users can delete own collection verses" on public.collection_verses
  for delete using exists (
    select 1 from public.collections c
    where c.id = collection_verses.collection_id
    and c.user_id = auth.uid()
  );

-- Achievements
alter table public.achievements enable row level security;
create policy "Anyone can view achievements" on public.achievements
  for select using (true);

-- User Achievements
alter table public.user_achievements enable row level security;
create policy "Users can view own achievements" on public.user_achievements
  for select using (auth.uid() = user_id);
create policy "Users can update own achievements" on public.user_achievements
  for update using (auth.uid() = user_id);

-- Settings
alter table public.settings enable row level security;
create policy "Users can view own settings" on public.settings
  for select using (auth.uid() = user_id);
create policy "Users can insert own settings" on public.settings
  for insert with check (auth.uid() = user_id);
create policy "Users can update own settings" on public.settings
  for update using (auth.uid() = user_id);

-- =====================================================
-- SEED: Default Achievements
-- =====================================================
insert into public.achievements (key, title, description, icon, color, category, requirement)
values
  ('first_verse', 'Premier pas', 'Mémorisez votre premier verset', 'book', '#E91E8C', 'memorization', '1 verset'),
  ('ten_verses', 'Collectionneur', 'Mémorisez 10 versets', 'bookmarks', '#007AFF', 'memorization', '10 versets'),
  ('fifty_verses', 'érudit', 'Mémorisez 50 versets', 'school', '#FF9500', 'memorization', '50 versets'),
  ('hundred_verses', 'Maître bibliste', 'Mémorisez 100 versets', 'trophy', '#008733', 'memorization', '100 versets'),
  ('streak_7', 'Hébdomadaire', '7 jours de suite', 'flame', '#FF6B6B', 'streak', '7 jours'),
  ('streak_30', 'Mensuel', '30 jours de suite', 'fire', '#FF9500', 'streak', '30 jours'),
  ('streak_100', 'Dédié', '100 jours de suite', 'star', '#E91E8C', 'streak', '100 jours'),
  ('first_review', 'Révisionné', 'Révisez votre premier verset', 'refresh', '#7B1FA2', 'review', '1 révision'),
  ('fifty_reviews', 'Assidu', '50 révisions complétées', 'checkmark-done', '#008733', 'review', '50 révisions'),
  ('hundred_reviews', 'Perseérant', '100 révisions complétées', 'star', '#E91E8C', 'review', '100 révisions'),
  ('first_collection', 'Organisateur', 'Créez votre première collection', 'folder', '#1976D2', 'collection', '1 collection'),
  ('five_collections', 'Archiviste', 'Créez 5 collections', 'folders', '#3F51B5', 'collection', '5 collections'),
  ('patriarch', 'Patriarche', 'Maîtrisez tous les Psaumes', 'medal', '#FFD700', 'special', '150 versets Psaumes'),
  ('gospel', 'Évangéliste', 'Maîtrisez tous les Évangiles', 'globe', '#E91E8C', 'special', '91 versets Évangiles')
on conflict (key) do nothing;
