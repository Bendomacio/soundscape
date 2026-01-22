-- Migration: Song Review System and Proper Upvotes
-- Run this in Supabase SQL Editor

-- ============================================
-- 1. ADD STATUS AND ADMIN NOTES TO SONGS
-- ============================================

-- Add status column (live by default, can be 'needs_edit' or 'removed')
ALTER TABLE songs 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'live' CHECK (status IN ('live', 'needs_edit', 'removed'));

-- Add admin notes for feedback when requesting edits
ALTER TABLE songs 
ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- Reset upvotes to 0 for all songs (fresh start)
UPDATE songs SET upvotes = 0 WHERE upvotes IS NULL OR upvotes > 0;

-- ============================================
-- 2. SONG LIKES TABLE (One vote per user per song)
-- ============================================

CREATE TABLE IF NOT EXISTS song_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  song_id TEXT NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  -- Ensure one like per user per song
  UNIQUE(song_id, user_id)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_song_likes_song_id ON song_likes(song_id);
CREATE INDEX IF NOT EXISTS idx_song_likes_user_id ON song_likes(user_id);

-- RLS for likes
ALTER TABLE song_likes ENABLE ROW LEVEL SECURITY;

-- Anyone can read likes (to show count)
CREATE POLICY "Anyone can read likes"
  ON song_likes FOR SELECT
  USING (true);

-- Authenticated users can like songs
CREATE POLICY "Authenticated users can like songs"
  ON song_likes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can unlike (delete their own like)
CREATE POLICY "Users can unlike songs"
  ON song_likes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================
-- 3. UPDATE SONGS RLS FOR STATUS
-- ============================================

-- Drop old select policy if it exists
DROP POLICY IF EXISTS "Anyone can read songs" ON songs;

-- New policy: Anyone can read live songs, users can see their own songs in any status
CREATE POLICY "Anyone can read live songs"
  ON songs FOR SELECT
  USING (
    status = 'live' 
    OR auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- ============================================
-- 4. FUNCTION TO GET LIKE COUNT
-- ============================================

CREATE OR REPLACE FUNCTION get_song_like_count(target_song_id TEXT)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER FROM song_likes WHERE song_id = target_song_id;
$$ LANGUAGE SQL STABLE;

-- ============================================
-- 5. FUNCTION TO CHECK IF USER LIKED A SONG
-- ============================================

CREATE OR REPLACE FUNCTION has_user_liked_song(target_song_id TEXT, target_user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS(
    SELECT 1 FROM song_likes 
    WHERE song_id = target_song_id AND user_id = target_user_id
  );
$$ LANGUAGE SQL STABLE;

-- ============================================
-- 6. FUNCTIONS TO INCREMENT/DECREMENT UPVOTES
-- ============================================

CREATE OR REPLACE FUNCTION increment_upvotes(target_song_id TEXT)
RETURNS VOID AS $$
  UPDATE songs SET upvotes = COALESCE(upvotes, 0) + 1 WHERE id = target_song_id;
$$ LANGUAGE SQL;

CREATE OR REPLACE FUNCTION decrement_upvotes(target_song_id TEXT)
RETURNS VOID AS $$
  UPDATE songs SET upvotes = GREATEST(COALESCE(upvotes, 0) - 1, 0) WHERE id = target_song_id;
$$ LANGUAGE SQL;
