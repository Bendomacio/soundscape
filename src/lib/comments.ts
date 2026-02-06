import { supabase } from './supabase';
import type { SongComment, SongPhoto } from '../types';
import { logger } from './logger';

// ============================================
// COMMENTS
// ============================================

export async function getComments(songId: string): Promise<SongComment[]> {
  // Get comments
  const { data: comments, error } = await supabase
    .from('song_comments')
    .select('id, song_id, user_id, content, created_at')
    .eq('song_id', songId)
    .order('created_at', { ascending: false });

  if (error) {
    logger.error('Error fetching comments:', error);
    return [];
  }

  if (!comments || comments.length === 0) return [];

  // Get unique user IDs and fetch their profiles
  const userIds = [...new Set(comments.map(c => c.user_id))];
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, display_name, avatar_url')
    .in('id', userIds);

  const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

  return comments.map(row => {
    const profile = profileMap.get(row.user_id);
    return {
      id: row.id,
      songId: row.song_id,
      userId: row.user_id,
      content: row.content,
      createdAt: new Date(row.created_at),
      userDisplayName: profile?.display_name || 'Anonymous',
      userAvatarUrl: profile?.avatar_url
    };
  });
}

export async function addComment(songId: string, userId: string, content: string): Promise<SongComment | null> {
  const trimmed = content.trim();

  // Validate max length
  if (trimmed.length > 2000) {
    logger.error('Comment exceeds max length of 2000 characters');
    return null;
  }

  const { data, error } = await supabase
    .from('song_comments')
    .insert({
      song_id: songId,
      user_id: userId,
      content: trimmed
    })
    .select('id, song_id, user_id, content, created_at')
    .single();

  if (error) {
    logger.error('Error adding comment:', error);
    return null;
  }

  return {
    id: data.id,
    songId: data.song_id,
    userId: data.user_id,
    content: data.content,
    createdAt: new Date(data.created_at)
    // Profile info will be added by the caller
  };
}

export async function deleteComment(commentId: string): Promise<boolean> {
  const { error } = await supabase
    .from('song_comments')
    .delete()
    .eq('id', commentId);

  if (error) {
    logger.error('Error deleting comment:', error);
    return false;
  }
  return true;
}

// ============================================
// PHOTOS
// ============================================

export async function getPhotos(songId: string, includeUnapproved = false): Promise<SongPhoto[]> {
  let query = supabase
    .from('song_photos')
    .select('id, song_id, user_id, photo_url, caption, approved, rejected, created_at')
    .eq('song_id', songId)
    .eq('rejected', false)
    .order('created_at', { ascending: false });

  if (!includeUnapproved) {
    query = query.eq('approved', true);
  }

  const { data: photos, error } = await query;

  if (error) {
    logger.error('Error fetching photos:', error);
    return [];
  }

  if (!photos || photos.length === 0) return [];

  // Get unique user IDs and fetch their profiles
  const userIds = [...new Set(photos.map(p => p.user_id))];
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, display_name')
    .in('id', userIds);

  const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

  return photos.map(row => {
    const profile = profileMap.get(row.user_id);
    return {
      id: row.id,
      songId: row.song_id,
      userId: row.user_id,
      photoUrl: row.photo_url,
      caption: row.caption,
      approved: row.approved,
      rejected: row.rejected,
      createdAt: new Date(row.created_at),
      userDisplayName: profile?.display_name || 'Anonymous'
    };
  });
}

export async function uploadPhoto(
  songId: string,
  userId: string,
  file: File,
  caption?: string
): Promise<SongPhoto | null> {
  // Validate file type (only allow images)
  if (!file.type.startsWith('image/')) {
    logger.error('Invalid file type: only image files are allowed');
    return null;
  }

  // Validate file size (max 10MB)
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  if (file.size > MAX_FILE_SIZE) {
    logger.error('File too large: maximum size is 10MB');
    return null;
  }

  // Generate unique filename
  const fileExt = file.name.split('.').pop();
  const fileName = `${songId}/${userId}-${Date.now()}.${fileExt}`;

  // Upload to storage
  const { error: uploadError } = await supabase.storage
    .from('song-photos')
    .upload(fileName, file);

  if (uploadError) {
    logger.error('Error uploading photo:', uploadError);
    return null;
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from('song-photos')
    .getPublicUrl(fileName);

  // Create database record
  const { data, error } = await supabase
    .from('song_photos')
    .insert({
      song_id: songId,
      user_id: userId,
      photo_url: urlData.publicUrl,
      caption: caption?.trim() || null,
      approved: false // Requires admin approval
    })
    .select()
    .single();

  if (error) {
    logger.error('Error creating photo record:', error);
    // Clean up: delete the uploaded file from storage since DB insert failed
    await supabase.storage.from('song-photos').remove([fileName]);
    return null;
  }

  return {
    id: data.id,
    songId: data.song_id,
    userId: data.user_id,
    photoUrl: data.photo_url,
    caption: data.caption,
    approved: data.approved,
    rejected: data.rejected,
    createdAt: new Date(data.created_at)
  };
}

export async function deletePhoto(photoId: string): Promise<boolean> {
  // First, fetch the photo record to get the storage path
  const { data: photo, error: fetchError } = await supabase
    .from('song_photos')
    .select('photo_url')
    .eq('id', photoId)
    .single();

  if (fetchError) {
    logger.error('Error fetching photo for deletion:', fetchError);
    return false;
  }

  // Delete the database record
  const { error } = await supabase
    .from('song_photos')
    .delete()
    .eq('id', photoId);

  if (error) {
    logger.error('Error deleting photo:', error);
    return false;
  }

  // Delete the file from Supabase Storage
  // Extract the storage path from the public URL (path after the bucket name)
  if (photo?.photo_url) {
    try {
      const url = new URL(photo.photo_url);
      // Public URL format: .../storage/v1/object/public/song-photos/path/to/file
      const bucketPrefix = '/storage/v1/object/public/song-photos/';
      const pathIndex = url.pathname.indexOf(bucketPrefix);
      if (pathIndex !== -1) {
        const storagePath = url.pathname.slice(pathIndex + bucketPrefix.length);
        await supabase.storage.from('song-photos').remove([storagePath]);
      }
    } catch (e) {
      logger.error('Error deleting photo from storage:', e);
      // DB record is already deleted, so we still return true
    }
  }

  return true;
}

// Admin functions
export async function getPendingPhotos(): Promise<SongPhoto[]> {
  const { data: photos, error } = await supabase
    .from('song_photos')
    .select('id, song_id, user_id, photo_url, caption, approved, rejected, created_at')
    .eq('approved', false)
    .eq('rejected', false)
    .order('created_at', { ascending: true });

  if (error) {
    logger.error('Error fetching pending photos:', error);
    return [];
  }

  if (!photos || photos.length === 0) return [];

  // Get unique user IDs and fetch their profiles
  const userIds = [...new Set(photos.map(p => p.user_id))];
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, display_name')
    .in('id', userIds);

  const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

  return photos.map(row => {
    const profile = profileMap.get(row.user_id);
    return {
      id: row.id,
      songId: row.song_id,
      userId: row.user_id,
      photoUrl: row.photo_url,
      caption: row.caption,
      approved: row.approved,
      rejected: row.rejected,
      createdAt: new Date(row.created_at),
      userDisplayName: profile?.display_name || 'Anonymous'
    };
  });
}

export async function approvePhoto(photoId: string): Promise<boolean> {
  const { error } = await supabase
    .from('song_photos')
    .update({ approved: true })
    .eq('id', photoId);

  if (error) {
    logger.error('Error approving photo:', error);
    return false;
  }
  return true;
}

export async function rejectPhoto(photoId: string): Promise<boolean> {
  const { error } = await supabase
    .from('song_photos')
    .update({ rejected: true })
    .eq('id', photoId);

  if (error) {
    logger.error('Error rejecting photo:', error);
    return false;
  }
  return true;
}
