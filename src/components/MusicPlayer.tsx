import { useState } from 'react';
import { MapPin, ChevronUp, Shuffle, Music, Play, Pause, Loader2 } from 'lucide-react';
import type { SongLocation } from '../types';
import { useSpotifyPlayer } from '../contexts/SpotifyPlayerContext';

interface MusicPlayerProps {
  currentSong: SongLocation | null;
  onSongClick: () => void;
  onShuffle: () => void;
}

function formatTime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function MusicPlayer({
  currentSong,
  onSongClick,
  onShuffle,
}: MusicPlayerProps) {
  const [imgError, setImgError] = useState(false);
  const { 
    currentSong: playingSong, 
    isPlaying, 
    isLoading, 
    position,
    duration,
    connection,
    play, 
    togglePlayPause,
    seek 
  } = useSpotifyPlayer();
  
  // Check if the currently displayed song is the one playing
  const isThisSongPlaying = playingSong?.id === currentSong?.id && isPlaying;
  const isThisSongLoading = playingSong?.id === currentSong?.id && isLoading;
  
  const handlePlayPause = () => {
    if (!currentSong) return;
    
    if (playingSong?.id === currentSong.id) {
      togglePlayPause();
    } else {
      play(currentSong);
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!duration || !connection.isPremium) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const newPosition = Math.floor(percent * duration);
    seek(newPosition);
  };

  const progress = duration > 0 ? (position / duration) * 100 : 0;

  if (!currentSong) {
    return (
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'var(--color-dark)',
        borderTop: '1px solid var(--color-dark-card)',
        padding: '16px',
        zIndex: 50
      }}>
        <div style={{
          maxWidth: '512px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          color: 'var(--color-text-muted)'
        }}>
          <MapPin size={20} />
          <span style={{ fontSize: '14px' }}>Select a song on the map to start listening</span>
        </div>
      </div>
    );
  }

  const hasSpotifyTrack = !!currentSong.spotifyUri;

  const showProgressBar = connection.isPremium && playingSong?.id === currentSong?.id && duration > 0;

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      background: 'var(--color-dark)',
      borderTop: '1px solid var(--color-dark-card)',
      zIndex: 50
    }}>
      {/* Progress bar for Spotify Premium users */}
      {showProgressBar && (
        <div 
          onClick={handleSeek}
          style={{
            width: '100%',
            height: '4px',
            background: 'var(--color-dark-lighter)',
            cursor: 'pointer',
            position: 'relative'
          }}
        >
          <div style={{
            width: `${progress}%`,
            height: '100%',
            background: 'var(--color-primary)',
            transition: 'width 0.1s linear'
          }} />
        </div>
      )}
      
      <div className="music-player-container" style={{
        maxWidth: '896px',
        margin: '0 auto',
        padding: '12px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        {/* Song info - clickable to open detail panel */}
        <button 
          onClick={onSongClick}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            flex: 1,
            minWidth: 0,
            textAlign: 'left',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0
          }}
        >
          {/* Album art */}
          <div style={{
            position: 'relative',
            width: '56px',
            height: '56px',
            borderRadius: '8px',
            overflow: 'hidden',
            flexShrink: 0,
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            background: 'var(--color-dark-card)'
          }}>
            {imgError ? (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Music size={24} color="var(--color-text-muted)" />
              </div>
            ) : (
              <img 
                src={currentSong.albumArt} 
                alt={currentSong.album || currentSong.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={() => setImgError(true)}
              />
            )}
            
            {/* Playing indicator */}
            {isThisSongPlaying && (
              <div style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(0,0,0,0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <div className="playing-bars">
                  <span /><span /><span /><span />
                </div>
              </div>
            )}
          </div>
          
          {/* Song details */}
          <div style={{ minWidth: 0, flex: 1 }}>
            <h3 style={{ 
              fontWeight: 600, 
              color: 'var(--color-text)', 
              fontSize: '15px',
              margin: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {currentSong.title}
            </h3>
            <p style={{ 
              fontSize: '14px', 
              color: 'var(--color-text-muted)', 
              margin: '2px 0 0 0',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {currentSong.artist}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <MapPin size={12} color="var(--color-primary)" />
                <span style={{ 
                  fontSize: '12px', 
                  color: 'var(--color-primary)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: '150px'
                }}>
                  {currentSong.locationName}
                </span>
              </div>
              
              {/* Time display for premium users */}
              {showProgressBar && (
                <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', flexShrink: 0 }}>
                  {formatTime(position)} / {formatTime(duration)}
                </span>
              )}
              
              {/* Premium indicator */}
              {connection.isPremium && playingSong?.id === currentSong?.id && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px',
                  padding: '2px 6px',
                  background: 'rgba(29, 185, 84, 0.2)',
                  borderRadius: '4px',
                  flexShrink: 0
                }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="#1DB954">
                    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                  </svg>
                  <span style={{ fontSize: '9px', color: '#1DB954', fontWeight: 600 }}>FULL</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Expand indicator */}
          <ChevronUp size={20} color="var(--color-text-muted)" style={{ flexShrink: 0 }} />
        </button>

        {/* Shuffle button */}
        <button
          className="music-player-shuffle"
          onClick={onShuffle}
          aria-label="Shuffle"
          title="Play random song"
          style={{
            padding: '12px',
            color: 'var(--color-text-muted)',
            background: 'none',
            border: 'none',
            borderRadius: '50%',
            cursor: 'pointer',
            flexShrink: 0,
            transition: 'color 0.2s',
            minWidth: '44px',
            minHeight: '44px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--color-text)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--color-text-muted)'}
        >
          <Shuffle size={20} />
        </button>

        {/* Play/Pause button */}
        <button
          onClick={handlePlayPause}
          disabled={!hasSpotifyTrack || isThisSongLoading}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '56px',
            height: '56px',
            background: hasSpotifyTrack 
              ? (isThisSongPlaying 
                  ? 'var(--color-dark-lighter)' 
                  : 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))')
              : 'var(--color-dark-lighter)',
            borderRadius: '50%',
            color: hasSpotifyTrack ? 'white' : 'var(--color-text-muted)',
            border: isThisSongPlaying ? '2px solid var(--color-primary)' : 'none',
            cursor: hasSpotifyTrack ? 'pointer' : 'not-allowed',
            boxShadow: hasSpotifyTrack && !isThisSongPlaying ? '0 4px 12px rgba(16, 185, 129, 0.3)' : 'none',
            flexShrink: 0,
            transition: 'transform 0.1s, box-shadow 0.2s, background 0.2s'
          }}
          onMouseDown={e => hasSpotifyTrack && (e.currentTarget.style.transform = 'scale(0.95)')}
          onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          title={!hasSpotifyTrack ? 'No Spotify track available' : isThisSongPlaying ? 'Pause' : 'Play'}
        >
          {isThisSongLoading ? (
            <Loader2 size={24} className="animate-spin" />
          ) : isThisSongPlaying ? (
            <Pause size={24} fill="currentColor" />
          ) : (
            <Play size={24} fill="currentColor" style={{ marginLeft: '2px' }} />
          )}
        </button>
      </div>
    </div>
  );
}
