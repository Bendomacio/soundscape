import { useState } from 'react';
import { MapPin, ChevronUp, Shuffle, Music, Play, Pause, Loader2 } from 'lucide-react';
import type { SongLocation } from '../types';
import { useSpotifyPlayer } from '../contexts/SpotifyPlayerContext';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=200&h=200&fit=crop';

interface MusicPlayerProps {
  currentSong: SongLocation | null;
  onSongClick: () => void;
  onShuffle: () => void;
}

export function MusicPlayer({
  currentSong,
  onSongClick,
  onShuffle,
}: MusicPlayerProps) {
  const [imgError, setImgError] = useState(false);
  const { currentSong: playingSong, isPlaying, isLoading, play, togglePlayPause } = useSpotifyPlayer();
  
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
      <div style={{
        maxWidth: '896px',
        margin: '0 auto',
        padding: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px'
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
              <MapPin size={12} color="var(--color-primary)" />
              <span style={{ 
                fontSize: '12px', 
                color: 'var(--color-primary)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {currentSong.locationName}
              </span>
            </div>
          </div>
          
          {/* Expand indicator */}
          <ChevronUp size={20} color="var(--color-text-muted)" style={{ flexShrink: 0 }} />
        </button>

        {/* Shuffle button */}
        <button
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
            transition: 'color 0.2s'
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
