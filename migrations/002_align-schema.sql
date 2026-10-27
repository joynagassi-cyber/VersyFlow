-- VersyFlow Database Migration v2
-- Aligns with InsForge actual schema (camelCase columns, bigint timestamps)
-- Run: npx @insforge/cli db migrate

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLE: users
-- =====================================================
CREATE TABLE IF NOT EXISTS public.users (
  id VARCHAR PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password TEXT,
  email_verified BOOLEAN DEFAULT FALSE,
  created_at BIGINT NOT NULL,
  updated_at BIGINT,
  display_name VARCHAR(100),
  avatar_url TEXT,
  default_translation VARCHAR(50) DEFAULT 'lsg',
  ui_language VARCHAR(10) DEFAULT 'fr',
  last_login_at BIGINT,
  profile JSONB,
  metadata JSONB,
  is_project_admin BOOLEAN DEFAULT FALSE,
  is_anonymous BOOLEAN DEFAULT FALSE
);

-- =====================================================
-- TABLE: memorization_records
-- =====================================================
CREATE TABLE IF NOT EXISTS public.memorization_records (
  id VARCHAR PRIMARY KEY,
  user_id VARCHAR NOT NULL,
  bookid VARCHAR(50) NOT NULL,
  chapternumber INTEGER NOT NULL,
  versenumber INTEGER NOT NULL,
  translationid VARCHAR(50) NOT NULL DEFAULT 'lsg',
  bibleversereference TEXT NOT NULL,
  bibleversetext TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'new',
  fsrsstate JSONB NOT NULL DEFAULT '{"stability":0,"difficulty":5,"recallProbability":0.9,"lastInterval":0,"nextInterval":1,"elapsedDays":0,"repetitions":0,"requestedRetention":0.9}',
  favorite BOOLEAN DEFAULT FALSE,
  tags TEXT[] DEFAULT '{}',
  createdat BIGINT NOT NULL,
  lastreviewedat BIGINT,
  nextreviewat BIGINT,
  reviewcount INTEGER DEFAULT 0,
  totalreviewminutes NUMERIC(10,2) DEFAULT 0,
  wordperformance JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABLE: review_logs
-- =====================================================
CREATE TABLE IF NOT EXISTS public.review_logs (
  id VARCHAR PRIMARY KEY,
  user_id VARCHAR NOT NULL,
  recordid VARCHAR NOT NULL,
  rating INTEGER NOT NULL,
  createdat BIGINT NOT NULL,
  reviewedat TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  nextreviewat BIGINT
);

-- =====================================================
-- TABLE: word_performance
-- =====================================================
CREATE TABLE IF NOT EXISTS public.word_performance (
  id VARCHAR PRIMARY KEY,
  memorization_record_id VARCHAR NOT NULL,
  word VARCHAR(100) NOT NULL,
  error_count INTEGER DEFAULT 0,
  total_attempts INTEGER DEFAULT 0,
  last_reviewed_at BIGINT,
  created_at BIGINT NOT NULL,
  UNIQUE(memorization_record_id, word)
);

-- =====================================================
-- TABLE: streaks
-- =====================================================
CREATE TABLE IF NOT EXISTS public.streaks (
  id VARCHAR PRIMARY KEY,
  user_id VARCHAR NOT NULL,
  streak_date DATE NOT NULL,
  verses_memorized INTEGER DEFAULT 0,
  reviews_completed INTEGER DEFAULT 0,
  session_duration_minutes INTEGER DEFAULT 0,
  created_at BIGINT NOT NULL,
  UNIQUE(user_id, streak_date)
);

-- =====================================================
-- TABLE: collections
-- =====================================================
CREATE TABLE IF NOT EXISTS public.collections (
  id VARCHAR PRIMARY KEY,
  user_id VARCHAR NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  color VARCHAR(7) DEFAULT '#E91E8C',
  icon VARCHAR(50) DEFAULT 'folder',
  created_at BIGINT NOT NULL,
  updated_at BIGINT
);

-- =====================================================
-- TABLE: collection_verses
-- =====================================================
CREATE TABLE IF NOT EXISTS public.collection_verses (
  id VARCHAR PRIMARY KEY,
  collection_id VARCHAR NOT NULL,
  memorization_record_id VARCHAR NOT NULL,
  added_at BIGINT,
  UNIQUE(collection_id, memorization_record_id)
);

-- =====================================================
-- TABLE: achievements
-- =====================================================
CREATE TABLE IF NOT EXISTS public.achievements (
  id VARCHAR PRIMARY KEY,
  key VARCHAR(100) UNIQUE NOT NULL,
  title VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  icon VARCHAR(50) NOT NULL,
  color VARCHAR(7) DEFAULT '#E91E8C',
  category VARCHAR(50) NOT NULL,
  requirement TEXT NOT NULL,
  created_at BIGINT NOT NULL
);

-- =====================================================
-- TABLE: user_achievements
-- =====================================================
CREATE TABLE IF NOT EXISTS public.user_achievements (
  id VARCHAR PRIMARY KEY,
  user_id VARCHAR NOT NULL,
  achievement_id VARCHAR NOT NULL,
  unlocked BOOLEAN DEFAULT FALSE,
  unlocked_at BIGINT,
  progress INTEGER DEFAULT 0,
  created_at BIGINT NOT NULL,
  UNIQUE(user_id, achievement_id)
);

-- =====================================================
-- TABLE: settings
-- =====================================================
CREATE TABLE IF NOT EXISTS public.settings (
  id VARCHAR PRIMARY KEY,
  user_id VARCHAR NOT NULL UNIQUE,
  theme VARCHAR(20) DEFAULT 'light',
  notification_enabled BOOLEAN DEFAULT TRUE,
  daily_reminder_time VARCHAR(10) DEFAULT '08:00:00',
  created_at BIGINT NOT NULL,
  updated_at BIGINT
);

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_memorization_records_user_id ON public.memorization_records(user_id);
CREATE INDEX IF NOT EXISTS idx_memorization_records_status ON public.memorization_records(status);
CREATE INDEX IF NOT EXISTS idx_memorization_records_nextreviewat ON public.memorization_records(nextreviewat);
CREATE INDEX IF NOT EXISTS idx_review_logs_user_id ON public.review_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_review_logs_record_id ON public.review_logs(recordid);
CREATE INDEX IF NOT EXISTS idx_word_performance_record_id ON public.word_performance(memorization_record_id);
CREATE INDEX IF NOT EXISTS idx_streaks_user_id ON public.streaks(user_id);
CREATE INDEX IF NOT EXISTS idx_streaks_date ON public.streaks(streak_date);
CREATE INDEX IF NOT EXISTS idx_collections_user_id ON public.collections(user_id);
CREATE INDEX IF NOT EXISTS idx_collection_verses_collection_id ON public.collection_verses(collection_id);
CREATE INDEX IF NOT EXISTS idx_collection_verses_record_id ON public.collection_verses(memorization_record_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON public.user_achievements(user_id);

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS users_select ON public.users FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS users_insert ON public.users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY IF NOT EXISTS users_update ON public.users FOR UPDATE USING (auth.uid() = id);

-- Memorization records
ALTER TABLE public.memorization_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS memrec_select ON public.memorization_records FOR SELECT USING ((user_id)::text = CURRENT_USER);
CREATE POLICY IF NOT EXISTS memrec_insert ON public.memorization_records FOR INSERT WITH CHECK ((user_id)::text = CURRENT_USER);
CREATE POLICY IF NOT EXISTS memrec_update ON public.memorization_records FOR UPDATE USING ((user_id)::text = CURRENT_USER);
CREATE POLICY IF NOT EXISTS memrec_delete ON public.memorization_records FOR DELETE USING ((user_id)::text = CURRENT_USER);

-- Review logs
ALTER TABLE public.review_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS revlog_select ON public.review_logs FOR SELECT USING ((user_id)::text = CURRENT_USER);
CREATE POLICY IF NOT EXISTS revlog_insert ON public.review_logs FOR INSERT WITH CHECK ((user_id)::text = CURRENT_USER);

-- Word performance
ALTER TABLE public.word_performance ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS wordperf_select ON public.word_performance FOR SELECT USING ((memorization_record_id)::text IN (SELECT id FROM public.memorization_records WHERE user_id = CURRENT_USER));
CREATE POLICY IF NOT EXISTS wordperf_insert ON public.word_performance FOR INSERT WITH CHECK ((memorization_record_id)::text IN (SELECT id FROM public.memorization_records WHERE user_id = CURRENT_USER));
CREATE POLICY IF NOT EXISTS wordperf_delete ON public.word_performance FOR DELETE USING ((memorization_record_id)::text IN (SELECT id FROM public.memorization_records WHERE user_id = CURRENT_USER));

-- Streaks
ALTER TABLE public.streaks ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS streaks_select ON public.streaks FOR SELECT USING ((user_id)::text = CURRENT_USER);
CREATE POLICY IF NOT EXISTS streaks_insert ON public.streaks FOR INSERT WITH CHECK ((user_id)::text = CURRENT_USER);
CREATE POLICY IF NOT EXISTS streaks_update ON public.streaks FOR UPDATE USING ((user_id)::text = CURRENT_USER);

-- Collections
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS coll_select ON public.collections FOR SELECT USING ((user_id)::text = CURRENT_USER);
CREATE POLICY IF NOT EXISTS coll_insert ON public.collections FOR INSERT WITH CHECK ((user_id)::text = CURRENT_USER);
CREATE POLICY IF NOT EXISTS coll_update ON public.collections FOR UPDATE USING ((user_id)::text = CURRENT_USER);
CREATE POLICY IF NOT EXISTS coll_delete ON public.collections FOR DELETE USING ((user_id)::text = CURRENT_USER);

-- Collection verses
ALTER TABLE public.collection_verses ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS collvers_select ON public.collection_verses FOR SELECT USING ((collection_id)::text IN (SELECT id FROM public.collections WHERE user_id = CURRENT_USER));
CREATE POLICY IF NOT EXISTS collvers_insert ON public.collection_verses FOR INSERT WITH CHECK ((collection_id)::text IN (SELECT id FROM public.collections WHERE user_id = CURRENT_USER));
CREATE POLICY IF NOT EXISTS collvers_delete ON public.collection_verses FOR DELETE USING ((collection_id)::text IN (SELECT id FROM public.collections WHERE user_id = CURRENT_USER));

-- Achievements
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS ach_select ON public.achievements FOR SELECT USING (true);

-- User achievements
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS uach_select ON public.user_achievements FOR SELECT USING ((user_id)::text = CURRENT_USER);
CREATE POLICY IF NOT EXISTS uach_update ON public.user_achievements FOR UPDATE USING ((user_id)::text = CURRENT_USER);

-- Settings
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS settings_select ON public.settings FOR SELECT USING ((user_id)::text = CURRENT_USER);
CREATE POLICY IF NOT EXISTS settings_insert ON public.settings FOR INSERT WITH CHECK ((user_id)::text = CURRENT_USER);
CREATE POLICY IF NOT EXISTS settings_update ON public.settings FOR UPDATE USING ((user_id)::text = CURRENT_USER);

-- =====================================================
-- SEED: Default achievements
-- =====================================================
INSERT INTO public.achievements (id, key, title, description, icon, color, category, requirement, created_at)
VALUES
  ('a1a1a1a1-0000-0000-0000-000000000001', 'first_verse', 'Premier pas', 'Mémorisez votre premier verset', 'book', '#E91E8C', 'memorization', '1 verset', 1723276800000),
  ('a1a1a1a1-0000-0000-0000-000000000002', 'ten_verses', 'Collectionneur', 'Mémorisez 10 versets', 'bookmarks', '#007AFF', 'memorization', '10 versets', 1723276800000),
  ('a1a1a1a1-0000-0000-0000-000000000003', 'fifty_verses', 'érudit', 'Mémorisez 50 versets', 'school', '#FF9500', 'memorization', '50 versets', 1723276800000),
  ('a1a1a1a1-0000-0000-0000-000000000004', 'hundred_verses', 'Maître bibliste', 'Mémorisez 100 versets', 'trophy', '#008733', 'memorization', '100 versets', 1723276800000),
  ('a1a1a1a1-0000-0000-0000-000000000005', 'streak_7', 'Hébdomadaire', '7 jours de suite', 'flame', '#FF6B6B', 'streak', '7 jours', 1723276800000),
  ('a1a1a1a1-0000-0000-0000-000000000006', 'streak_30', 'Mensuel', '30 jours de suite', 'fire', '#FF9500', 'streak', '30 jours', 1723276800000),
  ('a1a1a1a1-0000-0000-0000-000000000007', 'streak_100', 'Dédié', '100 jours de suite', 'star', '#E91E8C', 'streak', '100 jours', 1723276800000),
  ('a1a1a1a1-0000-0000-0000-000000000008', 'first_review', 'Révisionné', 'Révisez votre premier verset', 'refresh', '#7B1FA2', 'review', '1 révision', 1723276800000),
  ('a1a1a1a1-0000-0000-0000-000000000009', 'fifty_reviews', 'Assidu', '50 révisions complétées', 'checkmark-done', '#008733', 'review', '50 révisions', 1723276800000),
  ('a1a1a1a1-0000-0000-0000-000000000010', 'hundred_reviews', 'Perseérant', '100 révisions complétées', 'star', '#E91E8C', 'review', '100 révisions', 1723276800000),
  ('a1a1a1a1-0000-0000-0000-000000000011', 'first_collection', 'Organisateur', 'Créez votre première collection', 'folder', '#1976D2', 'collection', '1 collection', 1723276800000),
  ('a1a1a1a1-0000-0000-0000-000000000012', 'five_collections', 'Archiviste', 'Créez 5 collections', 'folders', '#3F51B5', 'collection', '5 collections', 1723276800000),
  ('a1a1a1a1-0000-0000-0000-000000000013', 'patriarch', 'Patriarche', 'Maîtrisez tous les Psaumes', 'medal', '#FFD700', 'special', '150 versets Psaumes', 1723276800000),
  ('a1a1a1a1-0000-0000-0000-000000000014', 'gospel', 'Évangéliste', 'Maîtrisez tous les Évangiles', 'globe', '#E91E8C', 'special', '91 versets Évangiles', 1723276800000)
ON CONFLICT (key) DO NOTHING;
