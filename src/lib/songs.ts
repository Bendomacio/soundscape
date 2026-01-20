import { supabase } from './supabase';
import type { SongLocation } from '../types';
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
    submittedBy: row.submitted_by,
    submittedAt: row.created_at ? new Date(row.created_at) : undefined
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
  if (song.submittedBy !== undefined) db.submitted_by = song.submittedBy;
  db.updated_at = new Date().toISOString();
  return db;
}

// Check if Supabase is configured
function isSupabaseConfigured(): boolean {
  const url = import.meta.env.VITE_SUPABASE_URL;
  return url && !url.includes('your-project');
}

// Fetch all songs
export async function fetchSongs(): Promise<SongLocation[]> {
  if (!isSupabaseConfigured()) {
    console.log('Supabase not configured, using mock data');
    return londonSongs;
  }

  try {
    const { data, error } = await supabase
      .from('songs')
      .select('*')
      .order('created_at', { ascending: true });

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
