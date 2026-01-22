-- Migration: Add comments and photos to songs
-- Run this in Supabase SQL Editor

-- ============================================
-- 1. SONG COMMENTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS song_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  song_id TEXT NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) > 0 AND char_length(content) <= 500),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_song_comments_song_id ON song_comments(song_id);
CREATE INDEX IF NOT EXISTS idx_song_comments_user_id ON song_comments(user_id);

-- RLS for comments
ALTER TABLE song_comments ENABLE ROW LEVEL SECURITY;

-- Anyone can read comments
CREATE POLICY "Anyone can read comments"
  ON song_comments FOR SELECT
  USING (true);

-- Authenticated users can create comments
CREATE POLICY "Authenticated users can create comments"
  ON song_comments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own comments
CREATE POLICY "Users can delete own comments"
  ON song_comments FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Admins can delete any comment
CREATE POLICY "Admins can delete any comment"
  ON song_comments FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- ============================================
-- 2. SONG PHOTOS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS song_photos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  song_id TEXT NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  caption TEXT CHECK (char_length(caption) <= 200),
  approved BOOLEAN DEFAULT false,
  rejected BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_song_photos_song_id ON song_photos(song_id);
CREATE INDEX IF NOT EXISTS idx_song_photos_user_id ON song_photos(user_id);
CREATE INDEX IF NOT EXISTS idx_song_photos_pending ON song_photos(approved, rejected) WHERE approved = false AND rejected = false;

-- RLS for photos
ALTER TABLE song_photos ENABLE ROW LEVEL SECURITY;

-- Anyone can read approved photos
CREATE POLICY "Anyone can read approved photos"
  ON song_photos FOR SELECT
  USING (approved = true OR auth.uid() = user_id);

-- Authenticated users can upload photos
CREATE POLICY "Authenticated users can upload photos"
  ON song_photos FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own photos
CREATE POLICY "Users can delete own photos"
  ON song_photos FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Admins can update photos (approve/reject)
CREATE POLICY "Admins can update any photo"
  ON song_photos FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Admins can delete any photo
CREATE POLICY "Admins can delete any photo"
  ON song_photos FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- ============================================
-- 3. STORAGE BUCKET FOR PHOTOS
-- ============================================

-- First create the bucket in Supabase Dashboard > Storage > New Bucket
-- Name: song-photos, Public: ON

-- Then run these storage policies:

-- Allow authenticated users to upload to song-photos bucket
CREATE POLICY "Authenticated users can upload photos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'song-photos');

-- Allow public read access to song-photos
CREATE POLICY "Public read access for song photos"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'song-photos');

-- Allow users to delete their own photos
CREATE POLICY "Users can delete own photos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'song-photos' AND auth.uid()::text = (storage.foldername(name))[2]);
