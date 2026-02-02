import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import type { SongLocation } from '../types';
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

interface SpotifyPlayerState {
  currentSong: SongLocation | null;
  isPlaying: boolean;
  isLoading: boolean;
  error: string | null;
  position: number;
  duration: number;
}

interface SpotifyConnection {
  isConnected: boolean;
  isPremium: boolean;
  userName: string | null;
  isConnecting: boolean;
}

interface SpotifyPlayerContextType extends SpotifyPlayerState {
  connection: SpotifyConnection;
  play: (song: SongLocation) => void;
  pause: () => void;
  resume: () => void;
  togglePlayPause: () => void;
  stop: () => void;
  seek: (position: number) => void;
  connectSpotify: () => void;
  disconnectSpotify: () => void;
}

const SpotifyPlayerContext = createContext<SpotifyPlayerContextType | null>(null);

export function useSpotifyPlayer() {
  const context = useContext(SpotifyPlayerContext);
  if (!context) {
    throw new Error('useSpotifyPlayer must be used within SpotifyPlayerProvider');
  }
  return context;
}

export function SpotifyPlayerProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<SpotifyPlayerState>({
    currentSong: null,
    isPlaying: false,
    isLoading: false,
    error: null,
    position: 0,
    duration: 0
  });

  const [connection, setConnection] = useState<SpotifyConnection>({
    isConnected: false,
    isPremium: false,
    userName: null,
    isConnecting: false
  });

  const playerRef = useRef<SpotifyWebPlayer | null>(null);
  const deviceIdRef = useRef<string | null>(null);
  const embedControllerRef = useRef<SpotifyEmbedController | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const authRef = useRef<SpotifyUserAuth | null>(null);
  const positionIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Check connection status on mount
  useEffect(() => {
    checkConnection();
  }, []);

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
      setConnection({
        isConnected: true,
        isPremium: profile.product === 'premium',
        userName: profile.display_name,
        isConnecting: false
      });

      // Initialize Web Playback SDK if premium
      if (profile.product === 'premium') {
        initializeWebPlaybackSDK();
      }
    } else {
      setConnection({ isConnected: false, isPremium: false, userName: null, isConnecting: false });
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

    const player = new window.Spotify.Player({
      name: 'Soundscape Player',
      getOAuthToken: async (cb) => {
        const currentAuth = await getSpotifyUserAuth();
        if (currentAuth) {
          cb(currentAuth.accessToken);
        }
      },
      volume: 0.5
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

      setState(prev => ({
        ...prev,
        isPlaying: !paused,
        isLoading: false,
        position,
        duration
      }));
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

  const playWithEmbed = useCallback((song: SongLocation) => {
    const trackId = song.spotifyUri?.replace('spotify:track:', '');
    const uri = `spotify:track:${trackId}`;
    
    if (!trackId) {
      setState(prev => ({
        ...prev,
        currentSong: song,
        isPlaying: false,
        isLoading: false,
        error: 'No Spotify track ID'
      }));
      return;
    }

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
      setTimeout(() => playWithEmbed(song), 100);
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

  const play = useCallback(async (song: SongLocation) => {
    setState({
      currentSong: song,
      isPlaying: false,
      isLoading: true,
      error: null,
      position: 0,
      duration: 0
    });

    // Try Web Playback SDK first if connected and premium
    if (connection.isPremium && deviceIdRef.current) {
      const success = await playWithSDK(song);
      if (success) {
        setState(prev => ({ ...prev, isPlaying: true, isLoading: false }));
        return;
      }
    }

    // Fallback to embed
    playWithEmbed(song);
  }, [connection.isPremium, playWithSDK, playWithEmbed]);

  const pause = useCallback(async () => {
    if (playerRef.current && connection.isPremium) {
      await playerRef.current.pause();
    } else if (embedControllerRef.current) {
      try {
        embedControllerRef.current.pause();
      } catch (err) {
        logger.warn('Failed to pause embed controller', err);
      }
    }
    setState(prev => ({ ...prev, isPlaying: false }));
  }, [connection.isPremium]);

  const resume = useCallback(async () => {
    if (playerRef.current && connection.isPremium) {
      await playerRef.current.resume();
    } else if (embedControllerRef.current) {
      try {
        embedControllerRef.current.resume();
      } catch (err) {
        logger.warn('Failed to resume embed controller', err);
      }
    }
    setState(prev => ({ ...prev, isPlaying: true }));
  }, [connection.isPremium]);

  const togglePlayPause = useCallback(async () => {
    if (playerRef.current && connection.isPremium) {
      await playerRef.current.togglePlay();
    } else if (embedControllerRef.current) {
      try {
        embedControllerRef.current.togglePlay();
      } catch (err) {
        logger.warn('Failed to toggle play on embed controller', err);
        state.isPlaying ? pause() : resume();
      }
    } else if (state.currentSong) {
      play(state.currentSong);
    }
  }, [connection.isPremium, state.isPlaying, state.currentSong, pause, resume, play]);

  const seek = useCallback(async (position: number) => {
    if (playerRef.current && connection.isPremium) {
      await playerRef.current.seek(position);
      setState(prev => ({ ...prev, position }));
    }
  }, [connection.isPremium]);

  const stop = useCallback(() => {
    if (playerRef.current) {
      playerRef.current.pause();
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
    setState({ currentSong: null, isPlaying: false, isLoading: false, error: null, position: 0, duration: 0 });
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
    stop();
  }, [stop]);

  // Show/hide embed container based on whether we're using embed
  const showEmbed = state.currentSong && !connection.isPremium;

  return (
    <SpotifyPlayerContext.Provider value={{ 
      ...state, 
      connection,
      play, 
      pause, 
      resume, 
      togglePlayPause,
      seek,
      stop,
      connectSpotify,
      disconnectSpotify
    }}>
      {children}
      {/* Embed container (only shown when not using Web Playback SDK) */}
      <div 
        ref={containerRef}
        style={{
          position: 'fixed',
          bottom: showEmbed ? '88px' : '-100px',
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
    </SpotifyPlayerContext.Provider>
  );
}
