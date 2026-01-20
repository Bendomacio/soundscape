-- Run this in Supabase SQL Editor (https://supabase.com/dashboard → your project → SQL Editor)

-- Create the songs table
CREATE TABLE songs (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  artist TEXT NOT NULL,
  album TEXT,
  album_art TEXT NOT NULL,
  spotify_uri TEXT,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  location_name TEXT NOT NULL,
  location_description TEXT,
  location_image TEXT,
  upvotes INTEGER DEFAULT 0,
  verified BOOLEAN DEFAULT false,
  tags TEXT[],
  submitted_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE songs ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read songs
CREATE POLICY "Anyone can read songs" ON songs
  FOR SELECT USING (true);

-- Allow anyone to insert songs (for user submissions)
CREATE POLICY "Anyone can insert songs" ON songs
  FOR INSERT WITH CHECK (true);

-- Allow anyone to update songs (for admin - you can restrict this later)
CREATE POLICY "Anyone can update songs" ON songs
  FOR UPDATE USING (true);

-- Allow anyone to delete songs (for admin - you can restrict this later)
CREATE POLICY "Anyone can delete songs" ON songs
  FOR DELETE USING (true);

-- Insert initial songs data
INSERT INTO songs (id, title, artist, album, album_art, spotify_uri, latitude, longitude, location_name, location_description, upvotes, verified, tags) VALUES
  ('1', 'London Calling', 'The Clash', 'London Calling', 'https://i.scdn.co/image/ab67616d0000b2734c00f12a2aa4f0a606791bff', 'spotify:track:1Z4Y91PRCAz3q2OP0iCvcJ', 51.5074, -0.1278, 'Westminster', 'The iconic punk anthem that defined a generation, about social unrest in late 1970s Britain.', 2156, true, ARRAY['punk', 'political', 'iconic']),
  ('2', 'Wonderwall', 'Oasis', '(What''s the Story) Morning Glory?', 'https://i.scdn.co/image/ab67616d0000b27370380f3319047913364f9b2d', 'spotify:track:1qPbGZqppFwLwcBC1JQ6Vr', 51.5133, -0.1350, 'Berwick Street, Soho', 'The album cover was shot on this famous Soho street, known for its independent record shops.', 3201, true, ARRAY['britpop', 'album art', 'soho']),
  ('3', 'Come Together', 'The Beatles', 'Abbey Road', 'https://i.scdn.co/image/ab67616d0000b273dc30583ba717007b00cceb25', 'spotify:track:2EqlS6tkEnglzr7tkKAAYD', 51.5296, -0.1789, 'Abbey Road Studios', 'Where The Beatles recorded their groundbreaking music including the famous Abbey Road album.', 4521, true, ARRAY['beatles', 'abbey road', 'classic']),
  ('4', 'Waterloo Sunset', 'The Kinks', 'Something Else by The Kinks', 'https://i.scdn.co/image/ab67616d0000b273d77a4d8c7f7b2d5c5a7f3e8a', 'spotify:track:77GfPS4SIqFpfRqFyKMFrL', 51.5024, -0.1132, 'Waterloo Bridge', 'Ray Davies wrote this masterpiece about watching the sunset over the Thames from Waterloo Bridge.', 1923, true, ARRAY['60s', 'british invasion', 'thames']),
  ('5', 'Electric Avenue', 'Eddy Grant', 'Killer on the Rampage', 'https://i.scdn.co/image/ab67616d0000b273b5b5a8e7b3f2a4c8d1e9f0a2', 'spotify:track:4zLJLNpSvdzF0AY0l6apgM', 51.4613, -0.1147, 'Electric Avenue, Brixton', 'Named after the first street in Britain lit by electricity, this 1982 hit is about the Brixton riots.', 1432, true, ARRAY['reggae', 'brixton', 'social commentary']),
  ('6', 'Werewolves of London', 'Warren Zevon', 'Excitable Boy', 'https://i.scdn.co/image/ab67616d0000b273c5d2e8f9a1b3c7d4e6f0a2b4', 'spotify:track:2CWgvyPLuzKGc7PCndKAcf', 51.5081, -0.0759, 'Tower of London', 'This darkly humorous rock classic imagines werewolves roaming the streets of London.', 1287, true, ARRAY['rock', 'halloween', 'humor']),
  ('7', 'Our House', 'Madness', 'The Rise & Fall', 'https://i.scdn.co/image/ab67616d0000b273a7e8f1b2c3d4e5f6a7b8c9d0', 'spotify:track:0l2P0KTMZaJQwcJxYNJpWz', 51.5392, -0.1597, 'Camden Town', 'Madness celebrate their North London roots with this nostalgic ode to family life.', 876, true, ARRAY['ska', 'north london', 'camden']),
  ('8', 'Up the Junction', 'Squeeze', 'Cool for Cats', 'https://i.scdn.co/image/ab67616d0000b273b1c2d3e4f5a6b7c8d9e0f1a2', 'spotify:track:5mfGeCRw4kW3jhFNjhfC3Z', 51.4651, -0.1682, 'Clapham Junction', 'Britain''s busiest railway station inspired this bittersweet tale of love and loss.', 923, true, ARRAY['new wave', 'train station', 'storytelling']);
