import { supabase } from './supabase';
import type { SongComment, SongPhoto } from '../types';

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
    console.error('Error fetching comments:', error);
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
  const { data, error } = await supabase
    .from('song_comments')
    .insert({
      song_id: songId,
      user_id: userId,
      content: content.trim()
    })
    .select('id, song_id, user_id, content, created_at')
    .single();

  if (error) {
    console.error('Error adding comment:', error);
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
    console.error('Error deleting comment:', error);
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
    console.error('Error fetching photos:', error);
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
  // Generate unique filename
  const fileExt = file.name.split('.').pop();
  const fileName = `${songId}/${userId}-${Date.now()}.${fileExt}`;

  // Upload to storage
  const { error: uploadError } = await supabase.storage
    .from('song-photos')
    .upload(fileName, file);

  if (uploadError) {
    console.error('Error uploading photo:', uploadError);
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
    console.error('Error creating photo record:', error);
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
  const { error } = await supabase
    .from('song_photos')
    .delete()
    .eq('id', photoId);

  if (error) {
    console.error('Error deleting photo:', error);
    return false;
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
    console.error('Error fetching pending photos:', error);
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
    console.error('Error approving photo:', error);
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
    console.error('Error rejecting photo:', error);
    return false;
  }
  return true;
}
