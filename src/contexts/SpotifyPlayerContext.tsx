import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import type { SongLocation } from '../types';

interface SpotifyPlayerState {
  currentSong: SongLocation | null;
  isPlaying: boolean;
  isLoading: boolean;
  error: string | null;
}

interface SpotifyPlayerContextType extends SpotifyPlayerState {
  play: (song: SongLocation) => void;
  pause: () => void;
  resume: () => void;
  togglePlayPause: () => void;
  stop: () => void;
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
    error: null
  });

  const embedControllerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load Spotify IFrame API on mount
  useEffect(() => {
    if ((window as any).SpotifyIFrameAPI) return;

    const script = document.createElement('script');
    script.src = 'https://open.spotify.com/embed/iframe-api/v1';
    script.async = true;

    window.onSpotifyIframeApiReady = (IFrameAPI: any) => {
      (window as any).SpotifyIFrameAPI = IFrameAPI;
    };

    document.body.appendChild(script);
  }, []);

  const play = useCallback((song: SongLocation) => {
    const trackId = song.spotifyUri?.replace('spotify:track:', '');
    const uri = `spotify:track:${trackId}`;
    
    if (!trackId) {
      setState({
        currentSong: song,
        isPlaying: false,
        isLoading: false,
        error: 'No Spotify track ID'
      });
      return;
    }

    setState({
      currentSong: song,
      isPlaying: false,
      isLoading: true,
      error: null
    });

    // Reuse existing controller if available
    if (embedControllerRef.current) {
      try {
        embedControllerRef.current.loadUri(uri);
        setTimeout(() => {
          try {
            embedControllerRef.current?.play();
            setState(prev => ({ ...prev, isPlaying: true, isLoading: false }));
          } catch (e) {
            console.error('Play failed:', e);
          }
        }, 300);
        return;
      } catch (e) {
        // loadUri failed, destroy and create new
        try { embedControllerRef.current.destroy(); } catch {}
        embedControllerRef.current = null;
      }
    }

    const container = containerRef.current;
    if (!container) {
      setTimeout(() => play(song), 100);
      return;
    }
    
    container.innerHTML = '';

    setTimeout(() => {
      const IFrameAPI = (window as any).SpotifyIFrameAPI;
      
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
        (controller: any) => {
          embedControllerRef.current = controller;
          
          controller.addListener('playback_update', (e: any) => {
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
            
            setTimeout(() => {
              try {
                controller.play();
                setState(prev => {
                  if (prev.currentSong?.id === songId) {
                    return { ...prev, isPlaying: true, isLoading: false };
                  }
                  return prev;
                });
              } catch (e) {
                console.error('Auto-play failed:', e);
              }
            }, 100);
          });
        }
      );
    }, 150);
  }, []);

  const pause = useCallback(() => {
    if (embedControllerRef.current) {
      try { embedControllerRef.current.pause(); } catch {}
    }
    setState(prev => ({ ...prev, isPlaying: false }));
  }, []);

  const resume = useCallback(() => {
    if (embedControllerRef.current) {
      try { embedControllerRef.current.resume(); } catch {}
    }
    setState(prev => ({ ...prev, isPlaying: true }));
  }, []);

  const togglePlayPause = useCallback(() => {
    if (embedControllerRef.current) {
      try {
        embedControllerRef.current.togglePlay();
      } catch {
        state.isPlaying ? pause() : resume();
      }
    } else if (state.currentSong) {
      play(state.currentSong);
    }
  }, [state.isPlaying, state.currentSong, pause, resume, play]);

  const stop = useCallback(() => {
    if (embedControllerRef.current) {
      try { embedControllerRef.current.destroy(); } catch {}
      embedControllerRef.current = null;
    }
    if (containerRef.current) {
      containerRef.current.innerHTML = '';
    }
    setState({ currentSong: null, isPlaying: false, isLoading: false, error: null });
  }, []);

  return (
    <SpotifyPlayerContext.Provider value={{ ...state, play, pause, resume, togglePlayPause, stop }}>
      {children}
      <div 
        ref={containerRef}
        style={{
          position: 'fixed',
          bottom: state.currentSong ? '88px' : '-100px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 'calc(100% - 32px)',
          maxWidth: '400px',
          zIndex: 60,
          transition: 'bottom 0.3s ease',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: state.currentSong ? '0 -4px 20px rgba(0,0,0,0.4)' : 'none'
        }}
      />
    </SpotifyPlayerContext.Provider>
  );
}

declare global {
  interface Window {
    onSpotifyIframeApiReady: (IFrameAPI: any) => void;
    SpotifyIFrameAPI: any;
  }
}
