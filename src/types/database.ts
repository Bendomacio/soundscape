import type { SongStatus } from './index';

/**
 * Database row types for Supabase tables.
 * These use snake_case to match the database schema.
 */

export interface DbSongRow {
  id: string;
  title: string;
  artist: string;
  album: string | null;
  album_art: string | null;
  spotify_uri: string | null;
  // Multi-provider support
  youtube_id: string | null;
  apple_music_id: string | null;
  soundcloud_url: string | null;
  latitude: number;
  longitude: number;
  location_name: string;
  location_description: string | null;
  location_image: string | null;
  upvotes: number;
  verified: boolean;
  tags: string[] | null;
  user_id: string | null;
  submitted_by: string | null;
  status: SongStatus;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbCommentRow {
  id: string;
  song_id: string;
  user_id: string;
  content: string;
  created_at: string;
}

export interface DbPhotoRow {
  id: string;
  song_id: string;
  user_id: string;
  photo_url: string;
  caption: string | null;
  approved: boolean;
  rejected: boolean;
  created_at: string;
}

export interface DbProfileRow {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  is_admin: boolean;
}

export interface DbSongLikeRow {
  id: string;
  song_id: string;
  user_id: string;
  created_at: string;
}

/**
 * Partial database row type for updates.
 * All fields are optional except the ones being updated.
 */
export type DbSongRowUpdate = Partial<Omit<DbSongRow, 'id' | 'created_at'>> & {
  updated_at?: string;
};
