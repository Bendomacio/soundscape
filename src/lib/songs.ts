import { supabase } from './supabase';
import type { SongLocation, SongStatus } from '../types';
import { londonSongs } from '../data/londonSongs';

// Convert database row to SongLocation type
function dbToSong(row: any): SongLocation {
  return {
    id: row.id,
    title: row.title,
    artist: row.artist,
    album: row.album,
    albumArt: row.album_art,
    spotifyUri: row.spotify_uri,
    latitude: row.latitude,
    longitude: row.longitude,
    locationName: row.location_name,
    locationDescription: row.location_description,
    locationImage: row.location_image,
    upvotes: row.upvotes || 0,
    verified: row.verified || false,
    tags: row.tags || [],
    userId: row.user_id,
    submittedBy: row.submitted_by,
    submittedAt: row.created_at ? new Date(row.created_at) : undefined,
    status: row.status || 'live',
    adminNotes: row.admin_notes
  };
}

// Convert SongLocation to database format
function songToDb(song: Partial<SongLocation> & { id?: string }) {
  const db: any = {};
  if (song.id !== undefined) db.id = song.id;
  if (song.title !== undefined) db.title = song.title;
  if (song.artist !== undefined) db.artist = song.artist;
  if (song.album !== undefined) db.album = song.album;
  if (song.albumArt !== undefined) db.album_art = song.albumArt;
  if (song.spotifyUri !== undefined) db.spotify_uri = song.spotifyUri;
  if (song.latitude !== undefined) db.latitude = song.latitude;
  if (song.longitude !== undefined) db.longitude = song.longitude;
  if (song.locationName !== undefined) db.location_name = song.locationName;
  if (song.locationDescription !== undefined) db.location_description = song.locationDescription;
  if (song.locationImage !== undefined) db.location_image = song.locationImage;
  if (song.upvotes !== undefined) db.upvotes = song.upvotes;
  if (song.verified !== undefined) db.verified = song.verified;
  if (song.tags !== undefined) db.tags = song.tags;
  if (song.userId !== undefined) db.user_id = song.userId;
  if (song.submittedBy !== undefined) db.submitted_by = song.submittedBy;
  if (song.status !== undefined) db.status = song.status;
  if (song.adminNotes !== undefined) db.admin_notes = song.adminNotes;
  db.updated_at = new Date().toISOString();
  return db;
}

// Check if Supabase is configured
function isSupabaseConfigured(): boolean {
  const url = import.meta.env.VITE_SUPABASE_URL;
  return Boolean(url && !url.includes('your-project'));
}

// Fetch all songs with timeout
export async function fetchSongs(): Promise<SongLocation[]> {
  if (!isSupabaseConfigured()) {
    console.log('Supabase not configured, using mock data');
    return londonSongs;
  }

  try {
    // Add timeout to prevent hanging
    const timeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('Fetch songs timeout')), 10000)
    );

    const fetchPromise = supabase
      .from('songs')
      .select('*')
      .order('created_at', { ascending: true });

    const { data, error } = await Promise.race([fetchPromise, timeoutPromise]);

    if (error) {
      console.error('Error fetching songs:', error);
      return londonSongs;
    }

    if (!data || data.length === 0) {
      console.log('No songs in database, using mock data');
      return londonSongs;
    }

    return data.map(dbToSong);
  } catch (err) {
    console.error('Failed to fetch songs:', err);
    return londonSongs;
  }
}

// Update a song
export async function updateSong(songId: string, updates: Partial<SongLocation>): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    console.warn('Supabase not configured, update not persisted');
    return false;
  }

  try {
    const { error } = await supabase
      .from('songs')
      .update(songToDb(updates))
      .eq('id', songId);

    if (error) {
      console.error('Error updating song:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Failed to update song:', err);
    return false;
  }
}

// Add a new song
export async function addSong(song: SongLocation): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    console.warn('Supabase not configured, song not persisted');
    return false;
  }

  try {
    const { error } = await supabase
      .from('songs')
      .insert(songToDb(song));

    if (error) {
      console.error('Error adding song:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Failed to add song:', err);
    return false;
  }
}

// Delete a song
export async function deleteSong(songId: string): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    console.warn('Supabase not configured, delete not persisted');
    return false;
  }

  try {
    const { error } = await supabase
      .from('songs')
      .delete()
      .eq('id', songId);

    if (error) {
      console.error('Error deleting song:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Failed to delete song:', err);
    return false;
  }
}

// ============================================
// LIKE SYSTEM
// ============================================

// Check if user has liked a song
export async function hasUserLikedSong(songId: string, userId: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  try {
    const { data, error } = await supabase
      .from('song_likes')
      .select('id')
      .eq('song_id', songId)
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error checking like:', error);
      return false;
    }

    return !!data;
  } catch {
    return false;
  }
}

// Get like count for a song
export async function getSongLikeCount(songId: string): Promise<number> {
  if (!isSupabaseConfigured()) return 0;

  try {
    const { count, error } = await supabase
      .from('song_likes')
      .select('*', { count: 'exact', head: true })
      .eq('song_id', songId);

    if (error) {
      console.error('Error getting like count:', error);
      return 0;
    }

    return count || 0;
  } catch {
    return 0;
  }
}

// Like a song
export async function likeSong(songId: string, userId: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  try {
    const { error } = await supabase
      .from('song_likes')
      .insert({ song_id: songId, user_id: userId });

    if (error) {
      if (error.code === '23505') { // Unique constraint violation = already liked
        console.log('User already liked this song');
        return false;
      }
      console.error('Error liking song:', error);
      return false;
    }

    // Update the upvotes count in the songs table
    try {
      await supabase.rpc('increment_upvotes', { target_song_id: songId });
    } catch {
      // RPC might not exist, that's ok
    }

    return true;
  } catch (err) {
    console.error('Failed to like song:', err);
    return false;
  }
}

// Unlike a song
export async function unlikeSong(songId: string, userId: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  try {
    const { error } = await supabase
      .from('song_likes')
      .delete()
      .eq('song_id', songId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error unliking song:', error);
      return false;
    }

    // Decrement the upvotes count in the songs table
    try {
      await supabase.rpc('decrement_upvotes', { target_song_id: songId });
    } catch {
      // RPC might not exist, that's ok
    }

    return true;
  } catch (err) {
    console.error('Failed to unlike song:', err);
    return false;
  }
}

// Get user's liked song IDs (for bulk checking)
export async function getUserLikedSongIds(userId: string): Promise<string[]> {
  if (!isSupabaseConfigured()) return [];

  try {
    const { data, error } = await supabase
      .from('song_likes')
      .select('song_id')
      .eq('user_id', userId);

    if (error) {
      console.error('Error getting user likes:', error);
      return [];
    }

    return data?.map(row => row.song_id) || [];
  } catch {
    return [];
  }
}

// ============================================
// USER SUBMISSIONS
// ============================================

// Fetch songs submitted by a specific user
export async function fetchUserSongs(userId: string): Promise<SongLocation[]> {
  if (!isSupabaseConfigured()) return [];

  try {
    const { data, error } = await supabase
      .from('songs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user songs:', error);
      return [];
    }

    return data?.map(dbToSong) || [];
  } catch (err) {
    console.error('Failed to fetch user songs:', err);
    return [];
  }
}

// ============================================
// ADMIN REVIEW
// ============================================

// Update song status (admin only)
export async function setSongStatus(
  songId: string, 
  status: SongStatus, 
  adminNotes?: string
): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  try {
    const updates: any = { status };
    if (adminNotes !== undefined) {
      updates.admin_notes = adminNotes;
    }

    const { error } = await supabase
      .from('songs')
      .update(updates)
      .eq('id', songId);

    if (error) {
      console.error('Error updating song status:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Failed to update song status:', err);
    return false;
  }
}

// Fetch all songs for admin review (including non-live)
export async function fetchAllSongsAdmin(): Promise<SongLocation[]> {
  if (!isSupabaseConfigured()) return [];

  try {
    const { data, error } = await supabase
      .from('songs')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching songs for admin:', error);
      return [];
    }

    return data?.map(dbToSong) || [];
  } catch (err) {
    console.error('Failed to fetch songs for admin:', err);
    return [];
  }
}
