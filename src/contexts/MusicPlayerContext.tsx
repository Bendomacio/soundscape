import { createContext, useContext, useState, useCallback, useMemo, useRef, useEffect } from 'react';
import type { SongLocation, MusicProvider } from '../types';
import type {
  SpotifyWebPlayer,
  SpotifyPlaybackState,
  SpotifyEmbedController,
  SpotifyIFrameAPI,
  SpotifyEmbedPlaybackUpdate
} from '../types/spotify-sdk';
import {
  getSpotifyUserAuth,
  isSpotifyConnected,
  initiateSpotifyLogin,
  clearSpotifyAuth,
  getSpotifyUserProfile,
  type SpotifyUserAuth
} from '../lib/spotify';
import { logger } from '../lib/logger';
import { getBestProvider, getAdapter, providers } from '../lib/providers';
import { getPreferenceFromCookie, setPreferenceCookie } from '../lib/preferences';
// Provider auth imports
import {
  type ProviderConnection,
  type ProviderConnections,
  defaultConnection,
  // YouTube
  initiateYouTubeLogin,
  isYouTubeConnected,
  clearYouTubeAuth,
  getCachedYouTubeProfile,
  // Apple Music
  initiateAppleMusicLogin,
  isAppleMusicConnected,
  clearAppleMusicAuth,
  getCachedAppleMusicProfile,
  isAppleMusicConfigured,
  // SoundCloud
  initiateSoundCloudLogin,
  confirmSoundCloudConnection,
  isSoundCloudConnected,
  clearSoundCloudAuth,
  getSoundCloudUserProfile,
  isSoundCloudConnectionPending,
  setSoundCloudPremium
} from '../lib/providers/auth';

export type PlaybackMode = 'sample' | 'default';

interface MusicPlayerState {
  currentSong: SongLocation | null;
  isPlaying: boolean;
  isLoading: boolean;
  error: string | null;
  position: number;
  duration: number;
  volume: number;
  playbackMode: PlaybackMode;
  // Multi-provider support
  currentProvider: MusicProvider | null;
  userPreference: MusicProvider;
}

interface SpotifyConnection {
  isConnected: boolean;
  isPremium: boolean;
  userName: string | null;
  isConnecting: boolean;
}

interface MusicPlayerContextType extends MusicPlayerState {
  connection: SpotifyConnection;
  // All provider connections
  providerConnections: ProviderConnections;
  play: (song: SongLocation) => void;
  pause: () => void;
  resume: () => void;
  togglePlayPause: () => void;
  stop: () => void;
  seek: (position: number) => void;
  setVolume: (volume: number) => void;
  setPlaybackMode: (mode: PlaybackMode) => void;
  connectSpotify: () => void;
  disconnectSpotify: () => void;
  // Multi-provider connection support
  connectProvider: (provider: MusicProvider) => void;
  disconnectProvider: (provider: MusicProvider) => void;
  confirmSoundCloud: (isPremium: boolean, displayName?: string) => void;
  setSoundCloudPremiumStatus: (isPremium: boolean) => void;
  // Multi-provider support
  setProviderPreference: (provider: MusicProvider) => void;
  // Song end callback registration
  registerOnSongEnd: (callback: (() => void) | null) => void;
}

const MusicPlayerContext = createContext<MusicPlayerContextType | null>(null);

export function useMusicPlayer() {
  const context = useContext(MusicPlayerContext);
  if (!context) {
    throw new Error('useMusicPlayer must be used within MusicPlayerProvider');
  }
  return context;
}

// Keep the old hook name for backwards compatibility
export const useSpotifyPlayer = useMusicPlayer;

export function MusicPlayerProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<MusicPlayerState>({
    currentSong: null,
    isPlaying: false,
    isLoading: false,
    error: null,
    position: 0,
    duration: 0,
    volume: parseFloat(localStorage.getItem('soundscape_volume') || '0.5'),
    playbackMode: (localStorage.getItem('soundscape_playback_mode') as PlaybackMode) || 'sample',
    currentProvider: null,
    userPreference: getPreferenceFromCookie() || 'spotify'
  });

  const [connection, setConnection] = useState<SpotifyConnection>({
    isConnected: false,
    isPremium: false,
    userName: null,
    isConnecting: false
  });

  // All provider connections
  const [providerConnections, setProviderConnections] = useState<ProviderConnections>({
    spotify: { ...defaultConnection },
    youtube: { ...defaultConnection },
    apple_music: { ...defaultConnection },
    soundcloud: { ...defaultConnection }
  });

  const playerRef = useRef<SpotifyWebPlayer | null>(null);
  const deviceIdRef = useRef<string | null>(null);
  const embedControllerRef = useRef<SpotifyEmbedController | null>(null);
  const genericEmbedRef = useRef<HTMLIFrameElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const authRef = useRef<SpotifyUserAuth | null>(null);
  const positionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const onSongEndRef = useRef<(() => void) | null>(null);

  // Check connection status on mount
  useEffect(() => {
    checkConnection();
    checkAllProviderConnections();
  }, []);

  // Check all provider connections
  async function checkAllProviderConnections() {
    // Spotify - handled by existing checkConnection()

    // YouTube
    if (isYouTubeConnected()) {
      const profile = getCachedYouTubeProfile();
      setProviderConnections(prev => ({
        ...prev,
        youtube: {
          isConnected: true,
          isPremium: profile?.isPremium || false,
          userName: profile?.name || null,
          avatarUrl: profile?.avatarUrl || null,
          isConnecting: false,
          error: null
        }
      }));
    }

    // Apple Music
    if (isAppleMusicConnected()) {
      const profile = getCachedAppleMusicProfile();
      setProviderConnections(prev => ({
        ...prev,
        apple_music: {
          isConnected: true,
          isPremium: profile?.isPremium || false,
          userName: profile?.name || null,
          avatarUrl: null,
          isConnecting: false,
          error: null
        }
      }));
    }

    // SoundCloud
    if (isSoundCloudConnected()) {
      const profile = getSoundCloudUserProfile();
      setProviderConnections(prev => ({
        ...prev,
        soundcloud: {
          isConnected: true,
          isPremium: profile?.isPremium || false,
          userName: profile?.name || null,
          avatarUrl: profile?.avatarUrl || null,
          isConnecting: false,
          error: null
        }
      }));
    }
  }

  async function checkConnection() {
    if (!isSpotifyConnected()) {
      setConnection({ isConnected: false, isPremium: false, userName: null, isConnecting: false });
      return;
    }

    setConnection(prev => ({ ...prev, isConnecting: true }));

    const auth = await getSpotifyUserAuth();
    if (!auth) {
      setConnection({ isConnected: false, isPremium: false, userName: null, isConnecting: false });
      return;
    }

    authRef.current = auth;

    // Get user profile to check premium status
    const profile = await getSpotifyUserProfile();
    if (profile) {
      const isPremium = profile.product === 'premium';
      setConnection({
        isConnected: true,
        isPremium,
        userName: profile.display_name,
        isConnecting: false
      });
      // Also update provider connections
      setProviderConnections(prev => ({
        ...prev,
        spotify: {
          isConnected: true,
          isPremium,
          userName: profile.display_name,
          avatarUrl: profile.images?.[0]?.url || null,
          isConnecting: false,
          error: null
        }
      }));

      // Initialize Web Playback SDK if premium
      if (isPremium) {
        initializeWebPlaybackSDK();
      }
    } else {
      setConnection({ isConnected: false, isPremium: false, userName: null, isConnecting: false });
      setProviderConnections(prev => ({
        ...prev,
        spotify: { ...defaultConnection }
      }));
    }
  }

  // Initialize Web Playback SDK
  function initializeWebPlaybackSDK() {
    if (playerRef.current) return;

    // Load SDK script if not present
    if (!window.Spotify) {
      const script = document.createElement('script');
      script.src = 'https://sdk.scdn.co/spotify-player.js';
      script.async = true;
      document.body.appendChild(script);

      window.onSpotifyWebPlaybackSDKReady = () => {
        createPlayer();
      };
    } else {
      createPlayer();
    }
  }

  async function createPlayer() {
    const auth = await getSpotifyUserAuth();
    if (!auth || !window.Spotify) return;

    const storedVolume = parseFloat(localStorage.getItem('soundscape_volume') || '0.5');
    const player = new window.Spotify.Player({
      name: 'Soundscape Player',
      getOAuthToken: async (cb) => {
        const currentAuth = await getSpotifyUserAuth();
        if (currentAuth) {
          cb(currentAuth.accessToken);
        }
      },
      volume: storedVolume
    });

    player.addListener('ready', ({ device_id }: { device_id: string }) => {
      logger.debug('Spotify Player ready with device ID:', device_id);
      deviceIdRef.current = device_id;
    });

    player.addListener('not_ready', ({ device_id }: { device_id: string }) => {
      logger.debug('Device has gone offline:', device_id);
      deviceIdRef.current = null;
    });

    player.addListener('player_state_changed', (playerState: SpotifyPlaybackState | null) => {
      if (!playerState) return;

      const { paused, position, duration } = playerState;

      setState(prev => {
        // Detect song end: was playing, now paused, and position is near end
        const wasPlaying = prev.isPlaying;
        const isNearEnd = duration > 0 && position === 0 && paused;
        if (wasPlaying && isNearEnd && prev.duration > 0) {
          // Song ended — fire callback asynchronously
          setTimeout(() => onSongEndRef.current?.(), 0);
        }
        return {
          ...prev,
          isPlaying: !paused,
          isLoading: false,
          position,
          duration
        };
      });
    });

    player.addListener('initialization_error', ({ message }: { message: string }) => {
      logger.error('Spotify initialization error:', message);
      setState(prev => ({ ...prev, error: message }));
    });

    player.addListener('authentication_error', ({ message }: { message: string }) => {
      logger.error('Spotify auth error:', message);
      clearSpotifyAuth();
      setConnection({ isConnected: false, isPremium: false, userName: null, isConnecting: false });
    });

    player.addListener('playback_error', ({ message }: { message: string }) => {
      logger.error('Spotify playback error:', message);
      setState(prev => ({ ...prev, error: message, isLoading: false }));
    });

    const connected = await player.connect();
    if (connected) {
      playerRef.current = player;
      logger.debug('Spotify Player connected successfully');
    }
  }

  // Load IFrame API as fallback
  useEffect(() => {
    if (window.SpotifyIFrameAPI) return;

    const script = document.createElement('script');
    script.src = 'https://open.spotify.com/embed/iframe-api/v1';
    script.async = true;

    window.onSpotifyIframeApiReady = (IFrameAPI: SpotifyIFrameAPI) => {
      window.SpotifyIFrameAPI = IFrameAPI;
    };

    document.body.appendChild(script);

    return () => {
      // Disconnect the Web Playback SDK player on unmount
      playerRef.current?.disconnect();
    };
  }, []);

  // Position tracking interval
  useEffect(() => {
    if (state.isPlaying && playerRef.current) {
      positionIntervalRef.current = setInterval(async () => {
        const playerState = await playerRef.current?.getCurrentState();
        if (playerState) {
          setState(prev => ({ ...prev, position: playerState.position }));
        }
      }, 1000);
    } else {
      if (positionIntervalRef.current) {
        clearInterval(positionIntervalRef.current);
      }
    }

    return () => {
      if (positionIntervalRef.current) {
        clearInterval(positionIntervalRef.current);
      }
    };
  }, [state.isPlaying]);

  const playWithSDK = useCallback(async (song: SongLocation) => {
    const trackId = song.spotifyUri?.replace('spotify:track:', '');
    if (!trackId || !deviceIdRef.current) {
      logger.error('No track ID or device ID');
      return false;
    }

    const auth = await getSpotifyUserAuth();
    if (!auth) return false;

    try {
      const response = await fetch(
        `https://api.spotify.com/v1/me/player/play?device_id=${deviceIdRef.current}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${auth.accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            uris: [`spotify:track:${trackId}`]
          })
        }
      );

      if (response.status === 204 || response.ok) {
        return true;
      }

      logger.error('Play failed:', response.status);
      return false;
    } catch (error) {
      logger.error('Failed to play track:', error);
      return false;
    }
  }, []);

  const playWithSpotifyEmbed = useCallback((song: SongLocation, trackId: string, retryCount = 0) => {
    const uri = `spotify:track:${trackId}`;

    // Reuse existing controller if available
    if (embedControllerRef.current) {
      try {
        embedControllerRef.current.loadUri(uri);
        embedControllerRef.current.play();
        setState(prev => ({ ...prev, isPlaying: true, isLoading: false }));
        return;
      } catch (e) {
        logger.warn('Failed to reuse embed controller, recreating', e);
        try {
          embedControllerRef.current?.destroy();
        } catch (destroyErr) {
          logger.warn('Failed to destroy embed controller', destroyErr);
        }
        embedControllerRef.current = null;
      }
    }

    const container = containerRef.current;
    if (!container) {
      if (retryCount < 20) {
        setTimeout(() => playWithSpotifyEmbed(song, trackId, retryCount + 1), 100);
      } else {
        logger.error('Spotify embed container not ready after 20 retries');
        setState(prev => ({ ...prev, isLoading: false, error: 'Player container not available' }));
      }
      return;
    }

    container.innerHTML = '';

    const IFrameAPI = window.SpotifyIFrameAPI;

    if (!IFrameAPI) {
      // Fallback: regular iframe
      const iframe = document.createElement('iframe');
      iframe.src = `https://open.spotify.com/embed/track/${trackId}?utm_source=generator&theme=0`;
      iframe.width = '100%';
      iframe.height = '80';
      iframe.frameBorder = '0';
      iframe.allow = 'autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture';
      iframe.style.borderRadius = '12px';
      container.appendChild(iframe);
      iframe.onload = () => setState(prev => ({ ...prev, isLoading: false, isPlaying: true }));
      return;
    }

    const songId = song.id;

    IFrameAPI.createController(
      container,
      { uri, width: '100%', height: 80 },
      (controller: SpotifyEmbedController) => {
        embedControllerRef.current = controller;

        controller.addListener('playback_update', (e: SpotifyEmbedPlaybackUpdate) => {
          if (!e?.data || typeof e.data.isPaused !== 'boolean') return;
          setState(prev => {
            if (prev.currentSong?.id === songId) {
              // Detect song end for embed: was playing, now paused, position at 0 or near duration
              const wasPlaying = prev.isPlaying;
              const dur = e.data.duration || 0;
              const pos = e.data.position || 0;
              const isEnded = wasPlaying && e.data.isPaused && dur > 0 && (pos === 0 || pos >= dur - 1000);
              if (isEnded) {
                setTimeout(() => onSongEndRef.current?.(), 0);
              }
              return { ...prev, isPlaying: !e.data.isPaused, isLoading: false };
            }
            return prev;
          });
        });

        controller.addListener('ready', () => {
          setState(prev => {
            if (prev.currentSong?.id === songId) {
              return { ...prev, isLoading: false };
            }
            return prev;
          });

          try {
            controller.play();
            setState(prev => {
              if (prev.currentSong?.id === songId) {
                return { ...prev, isPlaying: true, isLoading: false };
              }
              return prev;
            });
          } catch (e) {
            logger.warn('Auto-play failed:', e);
          }
        });
      }
    );
  }, []);

  // Fetch preview URL from Deezer (free, no auth) and play via native <audio> element
  const playWithPreview = useCallback(async (song: SongLocation): Promise<boolean> => {
    try {
      // Search Deezer for a matching track preview
      const response = await fetch(
        `/api/deezer-preview?title=${encodeURIComponent(song.title)}&artist=${encodeURIComponent(song.artist)}`
      );
      if (!response.ok) return false;

      const data = await response.json();
      const previewUrl = data.data?.[0]?.preview;
      if (!previewUrl) return false;

      // Clean up any existing embed
      if (embedControllerRef.current) {
        try { embedControllerRef.current.destroy(); } catch {}
        embedControllerRef.current = null;
      }
      if (containerRef.current) containerRef.current.innerHTML = '';

      // Create or reuse audio element
      if (!audioRef.current) {
        audioRef.current = new Audio();
      }
      const audio = audioRef.current;
      const currentVolume = parseFloat(localStorage.getItem('soundscape_volume') || '0.5');
      audio.volume = currentVolume;
      audio.src = previewUrl;

      const songId = song.id;

      audio.onplay = () => {
        setState(prev => prev.currentSong?.id === songId ? { ...prev, isPlaying: true, isLoading: false } : prev);
      };
      audio.onpause = () => {
        setState(prev => prev.currentSong?.id === songId ? { ...prev, isPlaying: false } : prev);
      };
      audio.ontimeupdate = () => {
        setState(prev => prev.currentSong?.id === songId
          ? { ...prev, position: Math.floor(audio.currentTime * 1000), duration: Math.floor((audio.duration || 0) * 1000) }
          : prev);
      };
      audio.onended = () => {
        setState(prev => prev.currentSong?.id === songId ? { ...prev, isPlaying: false, position: 0 } : prev);
        onSongEndRef.current?.();
      };

      await audio.play();
      return true;
    } catch (error) {
      logger.warn('Preview playback failed:', error);
      return false;
    }
  }, []);

  const playWithGenericEmbed = useCallback((song: SongLocation, provider: MusicProvider, id: string, retryCount = 0) => {
    const container = containerRef.current;
    if (!container) {
      if (retryCount < 20) {
        setTimeout(() => playWithGenericEmbed(song, provider, id, retryCount + 1), 100);
      } else {
        logger.error('Generic embed container not ready after 20 retries');
        setState(prev => ({ ...prev, isLoading: false, error: 'Player container not available' }));
      }
      return;
    }

    // Clean up Spotify embed controller if switching providers
    if (embedControllerRef.current) {
      try {
        embedControllerRef.current.destroy();
      } catch (e) {
        logger.warn('Failed to destroy Spotify embed controller', e);
      }
      embedControllerRef.current = null;
    }

    container.innerHTML = '';

    const adapter = getAdapter(provider);
    const config = adapter.getEmbedConfig(id);

    const iframe = document.createElement('iframe');
    iframe.src = config.url;
    iframe.width = String(config.width);
    iframe.height = String(config.height);
    iframe.frameBorder = config.frameBorder || '0';
    if (config.allow) {
      iframe.allow = config.allow;
    }
    iframe.style.borderRadius = '12px';

    genericEmbedRef.current = iframe;
    container.appendChild(iframe);

    iframe.onload = () => {
      setState(prev => ({ ...prev, isLoading: false, isPlaying: true }));
    };
  }, []);

  const play = useCallback(async (song: SongLocation) => {
    // Find the best provider based on user preference
    const best = getBestProvider(song, state.userPreference);

    if (!best) {
      setState(prev => ({
        currentSong: song,
        isPlaying: false,
        isLoading: false,
        error: 'No playable link available',
        position: 0,
        duration: 0,
        volume: prev.volume,
        playbackMode: prev.playbackMode,
        currentProvider: null,
        userPreference: state.userPreference
      }));
      return;
    }

    setState(prev => ({
      currentSong: song,
      isPlaying: false,
      isLoading: true,
      error: null,
      position: 0,
      duration: 0,
      volume: prev.volume,
      playbackMode: prev.playbackMode,
      currentProvider: best.provider,
      userPreference: state.userPreference
    }));

    // For Spotify, try Web Playback SDK first if premium
    if (best.provider === 'spotify') {
      if (connection.isPremium && deviceIdRef.current) {
        // Fire-and-forget: don't await the API call — player_state_changed will update state
        playWithSDK(song).then(success => {
          if (!success) {
            // SDK failed, fall back to embed
            playWithSpotifyEmbed(song, best.id);
          }
        });
        return;
      }
      if (state.playbackMode === 'sample') {
        // Sample mode: try Deezer preview first (gives us volume control), fall back to embed
        playWithPreview(song).then(success => {
          if (!success) {
            playWithSpotifyEmbed(song, best.id);
          }
        });
      } else {
        // Default mode: use embed directly
        playWithSpotifyEmbed(song, best.id);
      }
    } else {
      // Use generic embed for other providers
      playWithGenericEmbed(song, best.provider, best.id);
    }
  }, [state.userPreference, state.playbackMode, connection.isPremium, playWithSDK, playWithSpotifyEmbed, playWithPreview, playWithGenericEmbed]);

  const pause = useCallback(async () => {
    if (state.currentProvider === 'spotify') {
      if (playerRef.current && connection.isPremium) {
        await playerRef.current.pause();
      } else if (audioRef.current && !audioRef.current.paused) {
        audioRef.current.pause();
      } else if (embedControllerRef.current) {
        try {
          embedControllerRef.current.pause();
        } catch (err) {
          logger.warn('Failed to pause embed controller', err);
        }
      }
    }
    setState(prev => ({ ...prev, isPlaying: false }));
  }, [state.currentProvider, connection.isPremium]);

  const resume = useCallback(async () => {
    if (state.currentProvider === 'spotify') {
      if (playerRef.current && connection.isPremium) {
        await playerRef.current.resume();
      } else if (audioRef.current && audioRef.current.src) {
        try { await audioRef.current.play(); } catch {}
      } else if (embedControllerRef.current) {
        try {
          embedControllerRef.current.resume();
        } catch (err) {
          logger.warn('Failed to resume embed controller', err);
        }
      }
    }
    setState(prev => ({ ...prev, isPlaying: true }));
  }, [state.currentProvider, connection.isPremium]);

  const togglePlayPause = useCallback(async () => {
    if (state.currentProvider === 'spotify') {
      if (playerRef.current && connection.isPremium) {
        // Optimistically toggle UI state — SDK player_state_changed will correct if needed
        setState(prev => ({ ...prev, isPlaying: !prev.isPlaying }));
        try {
          await playerRef.current.togglePlay();
        } catch (err) {
          logger.warn('SDK togglePlay failed, reverting state', err);
          setState(prev => ({ ...prev, isPlaying: !prev.isPlaying }));
        }
      } else if (audioRef.current && audioRef.current.src) {
        // Native audio element (preview playback)
        if (audioRef.current.paused) {
          try { await audioRef.current.play(); } catch {}
        } else {
          audioRef.current.pause();
        }
      } else if (embedControllerRef.current) {
        // Optimistically toggle UI state — embed playback_update will correct if needed
        setState(prev => ({ ...prev, isPlaying: !prev.isPlaying }));
        try {
          embedControllerRef.current.togglePlay();
        } catch (err) {
          logger.warn('Failed to toggle play on embed controller', err);
          setState(prev => ({ ...prev, isPlaying: !prev.isPlaying }));
          state.isPlaying ? pause() : resume();
        }
      } else if (state.currentSong) {
        play(state.currentSong);
      }
    } else if (state.currentSong) {
      // For other providers, replay the song
      play(state.currentSong);
    }
  }, [state.currentProvider, state.isPlaying, state.currentSong, connection.isPremium, pause, resume, play]);

  const seek = useCallback(async (position: number) => {
    if (state.currentProvider === 'spotify' && playerRef.current && connection.isPremium) {
      await playerRef.current.seek(position);
      setState(prev => ({ ...prev, position }));
    }
  }, [state.currentProvider, connection.isPremium]);

  const volumeApiTimerRef = useRef<NodeJS.Timeout | null>(null);

  const setVolume = useCallback((volume: number) => {
    const clamped = Math.max(0, Math.min(1, volume));
    setState(prev => ({ ...prev, volume: clamped }));
    localStorage.setItem('soundscape_volume', String(clamped));

    // Native audio element (preview playback)
    if (audioRef.current) {
      audioRef.current.volume = clamped;
    }

    // SDK local volume (immediate)
    if (playerRef.current) {
      playerRef.current.setVolume(clamped);
    }

    // Spotify Web API volume as backup (debounced to avoid excessive calls)
    if (connection.isPremium && deviceIdRef.current) {
      if (volumeApiTimerRef.current) clearTimeout(volumeApiTimerRef.current);
      volumeApiTimerRef.current = setTimeout(async () => {
        const auth = await getSpotifyUserAuth();
        if (auth) {
          fetch(`https://api.spotify.com/v1/me/player/volume?volume_percent=${Math.round(clamped * 100)}&device_id=${deviceIdRef.current}`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${auth.accessToken}` }
          }).catch(() => {});
        }
      }, 150);
    }
  }, [connection.isPremium]);

  const setPlaybackMode = useCallback((mode: PlaybackMode) => {
    setState(prev => ({ ...prev, playbackMode: mode }));
    localStorage.setItem('soundscape_playback_mode', mode);
  }, []);

  const stop = useCallback(() => {
    if (playerRef.current) {
      playerRef.current.pause();
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }
    if (embedControllerRef.current) {
      try {
        embedControllerRef.current.destroy();
      } catch (err) {
        logger.warn('Failed to destroy embed controller on stop', err);
      }
      embedControllerRef.current = null;
    }
    if (containerRef.current) {
      containerRef.current.innerHTML = '';
    }
    genericEmbedRef.current = null;
    setState(prev => ({
      currentSong: null,
      isPlaying: false,
      isLoading: false,
      error: null,
      position: 0,
      duration: 0,
      volume: prev.volume,
      playbackMode: prev.playbackMode,
      currentProvider: null,
      userPreference: prev.userPreference
    }));
  }, []);

  const connectSpotify = useCallback(() => {
    initiateSpotifyLogin();
  }, []);

  const disconnectSpotify = useCallback(() => {
    if (playerRef.current) {
      playerRef.current.disconnect();
      playerRef.current = null;
    }
    deviceIdRef.current = null;
    clearSpotifyAuth();
    setConnection({ isConnected: false, isPremium: false, userName: null, isConnecting: false });
    setProviderConnections(prev => ({
      ...prev,
      spotify: { ...defaultConnection }
    }));
    stop();
  }, [stop]);

  // Generic provider connect/disconnect
  const connectProvider = useCallback(async (provider: MusicProvider) => {
    setProviderConnections(prev => ({
      ...prev,
      [provider]: { ...prev[provider], isConnecting: true, error: null }
    }));

    try {
      switch (provider) {
        case 'spotify':
          initiateSpotifyLogin();
          break;
        case 'youtube':
          await initiateYouTubeLogin();
          break;
        case 'apple_music': {
          const appleSuccess = await initiateAppleMusicLogin();
          if (appleSuccess) {
            const profile = getCachedAppleMusicProfile();
            setProviderConnections(prev => ({
              ...prev,
              apple_music: {
                isConnected: true,
                isPremium: profile?.isPremium || false,
                userName: profile?.name || null,
                avatarUrl: null,
                isConnecting: false,
                error: null
              }
            }));
          } else {
            setProviderConnections(prev => ({
              ...prev,
              apple_music: {
                ...prev.apple_music,
                isConnecting: false,
                error: isAppleMusicConfigured() ? 'Authorization failed' : 'Not configured'
              }
            }));
          }
          break;
        }
        case 'soundcloud':
          initiateSoundCloudLogin();
          // SoundCloud uses a confirmation flow, so we just mark as pending
          setProviderConnections(prev => ({
            ...prev,
            soundcloud: { ...prev.soundcloud, isConnecting: false }
          }));
          break;
      }
    } catch (error) {
      logger.error(`Failed to connect ${provider}:`, error);
      setProviderConnections(prev => ({
        ...prev,
        [provider]: {
          ...prev[provider],
          isConnecting: false,
          error: 'Connection failed'
        }
      }));
    }
  }, []);

  const disconnectProvider = useCallback((provider: MusicProvider) => {
    switch (provider) {
      case 'spotify':
        disconnectSpotify();
        break;
      case 'youtube':
        clearYouTubeAuth();
        setProviderConnections(prev => ({
          ...prev,
          youtube: { ...defaultConnection }
        }));
        break;
      case 'apple_music':
        clearAppleMusicAuth();
        setProviderConnections(prev => ({
          ...prev,
          apple_music: { ...defaultConnection }
        }));
        break;
      case 'soundcloud':
        clearSoundCloudAuth();
        setProviderConnections(prev => ({
          ...prev,
          soundcloud: { ...defaultConnection }
        }));
        break;
    }
  }, [disconnectSpotify]);

  // SoundCloud confirmation (since it doesn't have real OAuth)
  const confirmSoundCloud = useCallback((isPremium: boolean, displayName?: string) => {
    confirmSoundCloudConnection(isPremium, displayName);
    setProviderConnections(prev => ({
      ...prev,
      soundcloud: {
        isConnected: true,
        isPremium,
        userName: displayName || 'SoundCloud User',
        avatarUrl: null,
        isConnecting: false,
        error: null
      }
    }));
  }, []);

  const setSoundCloudPremiumStatus = useCallback((isPremium: boolean) => {
    setSoundCloudPremium(isPremium);
    setProviderConnections(prev => ({
      ...prev,
      soundcloud: {
        ...prev.soundcloud,
        isPremium
      }
    }));
  }, []);

  const setProviderPreference = useCallback((provider: MusicProvider) => {
    setPreferenceCookie(provider);
    setState(prev => ({ ...prev, userPreference: provider }));
    logger.debug('Provider preference set to:', provider);
  }, []);

  const registerOnSongEnd = useCallback((callback: (() => void) | null) => {
    onSongEndRef.current = callback;
  }, []);

  // Show/hide embed container based on whether we're playing
  // Don't show embed container when using native audio (preview playback)
  const usingNativeAudio = audioRef.current && audioRef.current.src;
  const showEmbed = state.currentSong && !usingNativeAudio && (
    // Show for Spotify embed (non-premium, no preview available)
    (state.currentProvider === 'spotify' && !connection.isPremium) ||
    // Show for other providers (always use embed)
    (state.currentProvider && state.currentProvider !== 'spotify')
  );

  const value = useMemo(() => ({
    ...state,
    connection,
    providerConnections,
    play,
    pause,
    resume,
    togglePlayPause,
    seek,
    setVolume,
    setPlaybackMode,
    stop,
    connectSpotify,
    disconnectSpotify,
    connectProvider,
    disconnectProvider,
    confirmSoundCloud,
    setSoundCloudPremiumStatus,
    setProviderPreference,
    registerOnSongEnd
  }), [state, connection, providerConnections, play, pause, resume, togglePlayPause, seek, setVolume, setPlaybackMode, stop, connectSpotify, disconnectSpotify, connectProvider, disconnectProvider, confirmSoundCloud, setSoundCloudPremiumStatus, setProviderPreference, registerOnSongEnd]);

  return (
    <MusicPlayerContext.Provider value={value}>
      {children}
      {/* Embed container (shown when using embed players) */}
      <div
        ref={containerRef}
        style={{
          position: 'fixed',
          bottom: showEmbed ? '88px' : '-200px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 'calc(100% - 32px)',
          maxWidth: '400px',
          zIndex: 60,
          transition: 'bottom 0.3s ease',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: showEmbed ? '0 -4px 20px rgba(0,0,0,0.4)' : 'none'
        }}
      />
    </MusicPlayerContext.Provider>
  );
}

// Keep old provider name for backwards compatibility
export { MusicPlayerProvider as SpotifyPlayerProvider };
