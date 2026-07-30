-- ================================================
-- Migration: 002-create-review-logs.sql
-- Description: Create review_logs table with RLS policies
-- ================================================

-- Create the review_logs table
CREATE TABLE IF NOT EXISTS review_logs (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    recordId VARCHAR(255) NOT NULL,
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    createdAt BIGINT NOT NULL,
    reviewedAt TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    nextReviewAt BIGINT
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_review_logs_record ON review_logs (recordId);
CREATE INDEX IF NOT EXISTS idx_review_logs_user ON review_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_review_logs_user_record ON review_logs (user_id, recordId);

-- Enable Row Level Security
ALTER TABLE review_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policy: user_access - users can only access their own review logs
CREATE POLICY user_access ON review_logs
    FOR SELECT USING (user_id = current_user);

-- RLS Policy: insert - users can only insert their own review logs
CREATE POLICY insert ON review_logs
    FOR INSERT WITH CHECK (user_id = current_user);
