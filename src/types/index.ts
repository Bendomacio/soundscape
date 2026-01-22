export type SongStatus = 'live' | 'needs_edit' | 'removed';

export interface SongLocation {
  id: string;
  title: string;
  artist: string;
  album?: string;
  albumArt?: string;
  spotifyUri?: string;
  spotifyPreviewUrl?: string;
  latitude: number;
  longitude: number;
  locationName: string;
  locationDescription?: string;
  locationImage?: string;
  userId?: string;
  submittedBy?: string;
  submittedAt?: Date;
  upvotes: number;
  verified: boolean;
  tags?: string[];
  // Review system
  status?: SongStatus;
  adminNotes?: string;
  // Client-side like state
  hasLiked?: boolean;
}

export interface SongLike {
  id: string;
  songId: string;
  userId: string;
  createdAt: Date;
}

export interface SongComment {
  id: string;
  songId: string;
  userId: string;
  content: string;
  createdAt: Date;
  // Joined from profiles
  userDisplayName?: string;
  userAvatarUrl?: string;
}

export interface SongPhoto {
  id: string;
  songId: string;
  userId: string;
  photoUrl: string;
  caption?: string;
  approved: boolean;
  rejected: boolean;
  createdAt: Date;
  // Joined from profiles
  userDisplayName?: string;
}

export interface UserLocation {
  latitude: number;
  longitude: number;
}

export interface RadiusSettings {
  value: number; // in kilometers
  min: number;
  max: number;
}

export interface PlayerState {
  isPlaying: boolean;
  currentSong: SongLocation | null;
  progress: number;
  duration: number;
  volume: number;
}

export interface MapViewState {
  longitude: number;
  latitude: number;
  zoom: number;
  pitch?: number;
  bearing?: number;
}
