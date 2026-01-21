export interface SongLocation {
  id: string;
  title: string;
  artist: string;
  album?: string;
  albumArt: string;
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
