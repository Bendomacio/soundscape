-- =====================================================
-- SUPABASE AUTH MIGRATION
-- Run this in Supabase SQL Editor AFTER enabling auth providers
-- =====================================================

-- 1. Add user_id column to songs table (references Supabase auth.users)
ALTER TABLE songs 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- 2. Create index for faster user lookups
CREATE INDEX IF NOT EXISTS songs_user_id_idx ON songs(user_id);

-- 3. Drop existing permissive policies
DROP POLICY IF EXISTS "Anyone can read songs" ON songs;
DROP POLICY IF EXISTS "Anyone can insert songs" ON songs;
DROP POLICY IF EXISTS "Anyone can update songs" ON songs;
DROP POLICY IF EXISTS "Anyone can delete songs" ON songs;

-- 4. Create new RLS policies

-- Anyone can read all songs (public)
CREATE POLICY "Anyone can read songs" ON songs
  FOR SELECT USING (true);

-- Authenticated users can insert songs (with their user_id)
CREATE POLICY "Authenticated users can insert songs" ON songs
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own songs
CREATE POLICY "Users can update own songs" ON songs
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own songs
CREATE POLICY "Users can delete own songs" ON songs
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- 5. Create admin role and policies (optional - for admin users)
-- First, create a profiles table to track admin status
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT,
  avatar_url TEXT,
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Anyone can read profiles
CREATE POLICY "Anyone can read profiles" ON profiles
  FOR SELECT USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 6. Create function to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 8. Admin policies - admins can update/delete any song
CREATE POLICY "Admins can update any song" ON songs
  FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Admins can delete any song" ON songs
  FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- 9. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.songs TO authenticated;
GRANT ALL ON public.profiles TO authenticated;

-- =====================================================
-- TO MAKE A USER ADMIN, run:
-- UPDATE profiles SET is_admin = true WHERE email = 'your@email.com';
-- =====================================================
