-- VersyFlow Database Schema Migration v1
-- Creates core tables for memorization, reviews, and user progress

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLE: users
-- Extended user profile data
-- =====================================================
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  display_name VARCHAR(100),
  avatar_url TEXT,
  default_translation VARCHAR(50) DEFAULT 'lsg',
  ui_language VARCHAR(10) DEFAULT 'fr',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ
);

-- =====================================================
-- TABLE: memorization_records
-- Core verse memorization data
-- =====================================================
CREATE TABLE IF NOT EXISTS public.memorization_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  book_id VARCHAR(50) NOT NULL,
  chapter_number INTEGER NOT NULL,
  verse_number INTEGER NOT NULL,
  translation_id VARCHAR(50) NOT NULL DEFAULT 'lsg',
  bible_verse_reference VARCHAR(200) NOT NULL,
  bible_verse_text TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'in-progress', 'mastered')),
  fsrs_state JSONB NOT NULL DEFAULT '{"stability": 0, "difficulty": 5, "recallProbability": 0.9, "lastInterval": 0, "nextInterval": 1, "elapsedDays": 0, "repetitions": 0, "requestedRetention": 0.9}',
  stability DOUBLE PRECISION DEFAULT 0,
  difficulty DOUBLE PRECISION DEFAULT 5,
  next_review_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_reviewed_at TIMESTAMPTZ,
  review_count INTEGER DEFAULT 0,
  total_review_minutes DECIMAL(10,2) DEFAULT 0,
  favorite BOOLEAN DEFAULT FALSE,
  tags TEXT[] DEFAULT '{}',
  UNIQUE(user_id, book_id, chapter_number, verse_number, translation_id)
);

-- =====================================================
-- TABLE: review_logs
-- Historical review data for analytics
-- =====================================================
CREATE TABLE IF NOT EXISTS public.review_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  memorization_record_id UUID NOT NULL REFERENCES public.memorization_records(id) ON DELETE CASCADE,
  answered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  rating VARCHAR(10) NOT NULL CHECK (rating IN ('again', 'hard', 'good', 'easy')),
  actual_interval INTEGER,
  predicted_interval INTEGER NOT NULL,
  stability_before DOUBLE PRECISION,
  stability_after DOUBLE PRECISION,
  difficulty_before DOUBLE PRECISION,
  difficulty_after DOUBLE PRECISION,
  elapsed_days INTEGER,
  repetitions INTEGER,
  word_performance JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABLE: word_performance
-- Per-word performance tracking
-- =====================================================
CREATE TABLE IF NOT EXISTS public.word_performance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  memorization_record_id UUID NOT NULL REFERENCES public.memorization_records(id) ON DELETE CASCADE,
  word VARCHAR(100) NOT NULL,
  error_count INTEGER DEFAULT 0,
  total_attempts INTEGER DEFAULT 0,
  last_reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(memorization_record_id, word)
);

-- =====================================================
-- TABLE: streaks
-- Daily streak tracking
-- =====================================================
CREATE TABLE IF NOT EXISTS public.streaks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  streak_date DATE NOT NULL,
  verses_memorized INTEGER DEFAULT 0,
  reviews_completed INTEGER DEFAULT 0,
  session_duration_minutes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, streak_date)
);

-- =====================================================
-- TABLE: collections
-- User verse collections
-- =====================================================
CREATE TABLE IF NOT EXISTS public.collections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  color VARCHAR(7) DEFAULT '#E91E8C',
  icon VARCHAR(50) DEFAULT 'folder',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABLE: collection_verses
-- Many-to-many between collections and verses
-- =====================================================
CREATE TABLE IF NOT EXISTS public.collection_verses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  collection_id UUID NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
  memorization_record_id UUID NOT NULL REFERENCES public.memorization_records(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(collection_id, memorization_record_id)
);

-- =====================================================
-- TABLE: achievements
-- Achievement definitions
-- =====================================================
CREATE TABLE IF NOT EXISTS public.achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key VARCHAR(100) UNIQUE NOT NULL,
  title VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  icon VARCHAR(50) NOT NULL,
  color VARCHAR(7) DEFAULT '#E91E8C',
  category VARCHAR(50) NOT NULL,
  requirement TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABLE: user_achievements
-- User achievement progress
-- =====================================================
CREATE TABLE IF NOT EXISTS public.user_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  unlocked BOOLEAN DEFAULT FALSE,
  unlocked_at TIMESTAMPTZ,
  progress INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

-- =====================================================
-- TABLE: settings
-- User settings
-- =====================================================
CREATE TABLE IF NOT EXISTS public.settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
  theme VARCHAR(20) DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'system')),
  notification_enabled BOOLEAN DEFAULT TRUE,
  daily_reminder_time TIME DEFAULT '08:00:00',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_memorization_records_user_id ON public.memorization_records(user_id);
CREATE INDEX IF NOT EXISTS idx_memorization_records_status ON public.memorization_records(status);
CREATE INDEX IF NOT EXISTS idx_memorization_records_next_review ON public.memorization_records(next_review_at) WHERE next_review_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_review_logs_user_id ON public.review_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_review_logs_record_id ON public.review_logs(memorization_record_id);
CREATE INDEX IF NOT EXISTS idx_review_logs_answered_at ON public.review_logs(answered_at);
CREATE INDEX IF NOT EXISTS idx_word_performance_record_id ON public.word_performance(memorization_record_id);
CREATE INDEX IF NOT EXISTS idx_streaks_user_id ON public.streaks(user_id);
CREATE INDEX IF NOT EXISTS idx_streaks_date ON public.streaks(streak_date);
CREATE INDEX IF NOT EXISTS idx_collections_user_id ON public.collections(user_id);
CREATE INDEX IF NOT EXISTS idx_collection_verses_collection_id ON public.collection_verses(collection_id);
CREATE INDEX IF NOT EXISTS idx_collection_verses_record_id ON public.collection_verses(memorization_record_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON public.user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_unlocked ON public.user_achievements(user_id, unlocked);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_memorization_records_updated_at BEFORE UPDATE ON public.memorization_records
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_collections_updated_at BEFORE UPDATE ON public.collections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON public.settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Memorization records
ALTER TABLE public.memorization_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own records" ON public.memorization_records
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own records" ON public.memorization_records
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own records" ON public.memorization_records
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own records" ON public.memorization_records
  FOR DELETE USING (auth.uid() = user_id);

-- Review logs
ALTER TABLE public.review_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own review logs" ON public.review_logs
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own review logs" ON public.review_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Word performance
ALTER TABLE public.word_performance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own word performance" ON public.word_performance
  FOR SELECT USING EXISTS (
    SELECT 1 FROM public.memorization_records mr
    WHERE mr.id = word_performance.memorization_record_id
    AND mr.user_id = auth.uid()
  );
CREATE POLICY "Users can insert their own word performance" ON public.word_performance
  FOR INSERT WITH CHECK EXISTS (
    SELECT 1 FROM public.memorization_records mr
    WHERE mr.id = word_performance.memorization_record_id
    AND mr.user_id = auth.uid()
  );

-- Streaks
ALTER TABLE public.streaks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own streaks" ON public.streaks
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own streaks" ON public.streaks
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own streaks" ON public.streaks
  FOR UPDATE USING (auth.uid() = user_id);

-- Collections
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own collections" ON public.collections
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own collections" ON public.collections
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own collections" ON public.collections
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own collections" ON public.collections
  FOR DELETE USING (auth.uid() = user_id);

-- Collection verses
ALTER TABLE public.collection_verses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own collection verses" ON public.collection_verses
  FOR SELECT USING EXISTS (
    SELECT 1 FROM public.collections c
    WHERE c.id = collection_verses.collection_id
    AND c.user_id = auth.uid()
  );
CREATE POLICY "Users can insert their own collection verses" ON public.collection_verses
  FOR INSERT WITH CHECK EXISTS (
    SELECT 1 FROM public.collections c
    WHERE c.id = collection_verses.collection_id
    AND c.user_id = auth.uid()
  );
CREATE POLICY "Users can delete their own collection verses" ON public.collection_verses
  FOR DELETE USING EXISTS (
    SELECT 1 FROM public.collections c
    WHERE c.id = collection_verses.collection_id
    AND c.user_id = auth.uid()
  );

-- Achievements
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view achievements" ON public.achievements
  FOR SELECT USING (true);

ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own achievements" ON public.user_achievements
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own achievements" ON public.user_achievements
  FOR UPDATE USING (auth.uid() = user_id);

-- Settings
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own settings" ON public.settings
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own settings" ON public.settings
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own settings" ON public.settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- SEED: Default achievements
-- =====================================================
INSERT INTO public.achievements (key, title, description, icon, color, category, requirement) VALUES
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
ON CONFLICT (key) DO NOTHING;

-- =====================================================
-- SEED: Sample user (for testing)
-- =====================================================
-- Note: This is a sample user. In production, users are created via auth.signUp()
INSERT INTO public.users (email, display_name, default_translation, ui_language)
VALUES ('test@versyflow.app', 'Test User', 'lsg', 'fr')
ON CONFLICT (email) DO NOTHING;
