import { createClient } from '@supabase/supabase-js';

// You'll need to create a Supabase project and add these values
// Go to: https://supabase.com → Create Project → Settings → API
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types for our database
export interface DbSongLocation {
  id: string;
  title: string;
  artist: string;
  album?: string;
  album_art: string;
  spotify_track_id?: string;
  latitude: number;
  longitude: number;
  location_name: string;
  location_description?: string;
  upvotes: number;
  verified: boolean;
  tags?: string[];
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface DbUser {
  id: string;
  email: string;
  is_admin: boolean;
  created_at: string;
}
