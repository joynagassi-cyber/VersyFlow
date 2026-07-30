-- ================================================
-- Migration: 001-create-memorization-records.sql
-- Description: Create memorization_records table with RLS policies
-- ================================================

-- Create the memorization_records table
CREATE TABLE IF NOT EXISTS memorization_records (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    bookId VARCHAR(50) NOT NULL,
    chapterNumber INTEGER NOT NULL,
    verseNumber INTEGER NOT NULL,
    translationId VARCHAR(50) NOT NULL,
    bibleVerseReference TEXT NOT NULL,
    bibleVerseText TEXT NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('new', 'in-progress', 'mastered')),
    fsrsState JSONB NOT NULL,
    favorite BOOLEAN NOT NULL DEFAULT FALSE,
    tags TEXT[],
    createdAt BIGINT NOT NULL,
    lastReviewedAt BIGINT,
    nextReviewAt BIGINT,
    reviewCount INTEGER NOT NULL DEFAULT 0,
    totalReviewMinutes NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    wordPerformance JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_memorization_records_bookId ON memorization_records (bookId);
CREATE INDEX IF NOT EXISTS idx_memorization_records_chapterNumber ON memorization_records (chapterNumber);
CREATE INDEX IF NOT EXISTS idx_memorization_records_verseNumber ON memorization_records (verseNumber);
CREATE INDEX IF NOT EXISTS idx_memorization_records_translationId ON memorization_records (translationId);
CREATE INDEX IF NOT EXISTS idx_memorization_records_status ON memorization_records (status);
CREATE INDEX IF NOT EXISTS idx_memorization_records_nextReviewAt ON memorization_records (nextReviewAt);
CREATE INDEX IF NOT EXISTS idx_memorization_records_createdAt ON memorization_records (createdAt);
CREATE INDEX IF NOT EXISTS idx_memorization_records_favorite ON memorization_records (favorite);

-- Enable Row Level Security
ALTER TABLE memorization_records ENABLE ROW LEVEL SECURITY;

-- RLS Policy: user_access - users can only access their own records
CREATE POLICY user_access ON memorization_records
    FOR SELECT USING (user_id = current_user);

-- RLS Policy: update - users can only update their own records
CREATE POLICY update ON memorization_records
    FOR UPDATE USING (user_id = current_user)
    WITH CHECK (user_id = current_user);

-- RLS Policy: insert - users can only insert their own records
CREATE POLICY insert ON memorization_records
    FOR INSERT WITH CHECK (user_id = current_user AND created_at = CURRENT_TIMESTAMP);
