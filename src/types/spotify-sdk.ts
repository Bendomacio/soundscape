/**
 * Types for Spotify Web Playback SDK and Embed API.
 * These provide proper typing for the dynamically loaded Spotify SDKs.
 */

// Web Playback SDK Types

export interface SpotifyTrackInfo {
  id: string;
  uri: string;
  name: string;
  duration_ms: number;
  artists: Array<{ name: string; uri: string }>;
  album: {
    name: string;
    uri: string;
    images: Array<{ url: string; height: number; width: number }>;
  };
}

export interface SpotifyPlaybackState {
  paused: boolean;
  position: number;
  duration: number;
  track_window: {
    current_track: SpotifyTrackInfo | null;
    previous_tracks: SpotifyTrackInfo[];
    next_tracks: SpotifyTrackInfo[];
  };
  repeat_mode: number;
  shuffle: boolean;
}

export interface SpotifyWebPlayer {
  connect: () => Promise<boolean>;
  disconnect: () => void;
  // Overloaded addListener for different event types
  addListener(event: 'ready' | 'not_ready', callback: (data: SpotifyReadyEventData) => void): void;
  addListener(event: 'player_state_changed', callback: (data: SpotifyPlaybackState | null) => void): void;
  addListener(event: 'initialization_error' | 'authentication_error' | 'account_error' | 'playback_error', callback: (data: SpotifyErrorEventData) => void): void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  addListener(event: string, callback: (data: any) => void): void;
  removeListener: (event: string) => void;
  getCurrentState: () => Promise<SpotifyPlaybackState | null>;
  setName: (name: string) => void;
  getVolume: () => Promise<number>;
  setVolume: (volume: number) => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  togglePlay: () => Promise<void>;
  seek: (positionMs: number) => Promise<void>;
  previousTrack: () => Promise<void>;
  nextTrack: () => Promise<void>;
  activateElement: () => Promise<void>;
}

export interface SpotifyPlayerOptions {
  name: string;
  getOAuthToken: (cb: (token: string) => void) => void;
  volume?: number;
}

// Player event data types
export interface SpotifyReadyEventData {
  device_id: string;
}

export interface SpotifyErrorEventData {
  message: string;
}

export type SpotifyPlayerEventData =
  | SpotifyReadyEventData
  | SpotifyErrorEventData
  | SpotifyPlaybackState
  | null;

// Embed/IFrame API Types

export interface SpotifyEmbedPlaybackUpdate {
  data: {
    isPaused: boolean;
    isBuffering: boolean;
    duration: number;
    position: number;
  };
}

export interface SpotifyEmbedController {
  loadUri: (uri: string) => void;
  play: () => void;
  pause: () => void;
  resume: () => void;
  togglePlay: () => void;
  seek: (seconds: number) => void;
  destroy: () => void;
  addListener: (event: string, callback: (data: SpotifyEmbedPlaybackUpdate) => void) => void;
  removeListener: (event: string, callback?: (data: SpotifyEmbedPlaybackUpdate) => void) => void;
}

export interface SpotifyEmbedOptions {
  uri: string;
  width?: string | number;
  height?: number;
}

export interface SpotifyIFrameAPI {
  createController: (
    element: HTMLElement,
    options: SpotifyEmbedOptions,
    callback: (controller: SpotifyEmbedController) => void
  ) => void;
}

// Global window extensions
declare global {
  interface Window {
    onSpotifyWebPlaybackSDKReady?: () => void;
    Spotify?: {
      Player: new (options: SpotifyPlayerOptions) => SpotifyWebPlayer;
    };
    onSpotifyIframeApiReady?: (IFrameAPI: SpotifyIFrameAPI) => void;
    SpotifyIFrameAPI?: SpotifyIFrameAPI;
  }
}
