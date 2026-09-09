-- Supabase Migration 001: Core Tables
-- Created: 2026-09-09
-- Based on: migrations/002_align-schema.sql (InsForge)

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Users table
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

-- Memorization records
create table if not exists public.memorization_records (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  book_id varchar(50) not null,
  chapter_number integer not null,
  verse_number integer not null,
  translation_id varchar(50) not null default 'lsg',
  bible_verse_reference text not null,
  bible_verse_text text not null,
  status varchar(20) not null default 'new' check (status in ('new', 'in-progress', 'mastered')),
  fsrs_state jsonb not null default '{"stability":0,"difficulty":5,"recallProbability":0.9,"lastInterval":0,"nextInterval":1,"elapsedDays":0,"repetitions":0,"requestedRetention":0.9}',
  favorite boolean default false,
  tags text[] default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  last_reviewed_at timestamptz,
  next_review_at timestamptz,
  review_count integer default 0,
  total_review_minutes numeric(10,2) default 0,
  word_performance jsonb default '[]'
);

-- Review logs
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

-- Word performance
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

-- Streaks
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

-- Collections
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

-- Collection verses
create table if not exists public.collection_verses (
  id uuid primary key default uuid_generate_v4(),
  collection_id uuid not null references public.collections(id) on delete cascade,
  memorization_record_id uuid not null references public.memorization_records(id) on delete cascade,
  added_at timestamptz default now(),
  unique (collection_id, memorization_record_id)
);

-- Achievements
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

-- User achievements
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

-- Settings
create table if not exists public.settings (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade unique,
  theme varchar(20) default 'light' check (theme in ('light', 'dark', 'system')),
  notification_enabled boolean default true,
  daily_reminder_time time default '08:00:00',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Indexes
create index if not exists idx_memorization_records_user_id on public.memorization_records(user_id);
create index if not exists idx_memorization_records_status on public.memorization_records(status);
create index if not exists idx_memorization_records_next_review on public.memorization_records(next_review_at) where next_review_at is not null;
create index if not exists idx_review_logs_user_id on public.review_logs(user_id);
create index if not exists idx_review_logs_record_id on public.review_logs(memorization_record_id);
create index if not exists idx_word_performance_record_id on public.word_performance(memorization_record_id);
create index if not exists idx_streaks_user_id on public.streaks(user_id);
create index if not exists idx_streaks_date on public.streaks(streak_date);
create index if not exists idx_collections_user_id on public.collections(user_id);
create index if not exists idx_collection_verses_collection_id on public.collection_verses(collection_id);
create index if not exists idx_collection_verses_record_id on public.collection_verses(memorization_record_id);
create index if not exists idx_user_achievements_user_id on public.user_achievements(user_id);
create index if not exists idx_user_achievements_unlocked on public.user_achievements(user_id, unlocked);

-- Update triggers
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

-- RLS Policies
alter table public.users enable row level security;
create policy "Users can view their own profile" on public.users
  for select using (auth.uid() = id);
create policy "Users can update their own profile" on public.users
  for update using (auth.uid() = id);

alter table public.memorization_records enable row level security;
create policy "Users can view their own records" on public.memorization_records
  for select using (auth.uid() = user_id);
create policy "Users can insert their own records" on public.memorization_records
  for insert with check (auth.uid() = user_id);
create policy "Users can update their own records" on public.memorization_records
  for update using (auth.uid() = user_id);
create policy "Users can delete their own records" on public.memorization_records
  for delete using (auth.uid() = user_id);

alter table public.review_logs enable row level security;
create policy "Users can view their own review logs" on public.review_logs
  for select using (auth.uid() = user_id);
create policy "Users can insert their own review logs" on public.review_logs
  for insert with check (auth.uid() = user_id);

alter table public.word_performance enable row level security;
create policy "Users can view their own word performance" on public.word_performance
  for select using exists (
    select 1 from public.memorization_records mr
    where mr.id = word_performance.memorization_record_id
    and mr.user_id = auth.uid()
  );
create policy "Users can insert their own word performance" on public.word_performance
  for insert with check exists (
    select 1 from public.memorization_records mr
    where mr.id = word_performance.memorization_record_id
    and mr.user_id = auth.uid()
  );

alter table public.streaks enable row level security;
create policy "Users can view their own streaks" on public.streaks
  for select using (auth.uid() = user_id);
create policy "Users can insert their own streaks" on public.streaks
  for insert with check (auth.uid() = user_id);

alter table public.collections enable row level security;
create policy "Users can view their own collections" on public.collections
  for select using (auth.uid() = user_id);
create policy "Users can insert their own collections" on public.collections
  for insert with check (auth.uid() = user_id);
create policy "Users can update their own collections" on public.collections
  for update using (auth.uid() = user_id);
create policy "Users can delete their own collections" on public.collections
  for delete using (auth.uid() = user_id);

alter table public.collection_verses enable row level security;
create policy "Users can view their own collection verses" on public.collection_verses
  for select using exists (
    select 1 from public.collections c
    where c.id = collection_verses.collection_id
    and c.user_id = auth.uid()
  );
create policy "Users can insert their own collection verses" on public.collection_verses
  for insert with check exists (
    select 1 from public.collections c
    where c.id = collection_verses.collection_id
    and c.user_id = auth.uid()
  );

alter table public.achievements enable row level security;
create policy "Anyone can view achievements" on public.achievements
  for select using (true);

alter table public.user_achievements enable row level security;
create policy "Users can view their own achievements" on public.user_achievements
  for select using (auth.uid() = user_id);
create policy "Users can update their own achievements" on public.user_achievements
  for update using (auth.uid() = user_id);

alter table public.settings enable row level security;
create policy "Users can view their own settings" on public.settings
  for select using (auth.uid() = user_id);
create policy "Users can insert their own settings" on public.settings
  for insert with check (auth.uid() = user_id);
create policy "Users can update their own settings" on public.settings
  for update using (auth.uid() = user_id);

-- Seed: Default achievements
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
