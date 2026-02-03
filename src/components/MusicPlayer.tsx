import { useState } from 'react';
import { MapPin, ChevronUp, Shuffle, Music, Play, Pause, Loader2, Volume2 } from 'lucide-react';
import type { SongLocation } from '../types';
import { hasPlayableLink } from '../types';
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
      <div className="fixed bottom-0 left-0 right-0 z-50 animate-slide-up">
        <div className="glass-dark" style={{
          borderTop: '1px solid var(--glass-border-light)',
          padding: '20px 16px',
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
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.05)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <MapPin size={20} style={{ opacity: 0.6 }} />
            </div>
            <div>
              <p style={{ fontSize: '14px', fontWeight: 500, marginBottom: '2px' }}>No song selected</p>
              <p style={{ fontSize: '12px', opacity: 0.7 }}>Tap a marker on the map to start listening</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const hasTrack = hasPlayableLink(currentSong);
  const showProgressBar = connection.isPremium && playingSong?.id === currentSong?.id && duration > 0;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 animate-slide-up">
      {/* Glass container */}
      <div className="glass-dark" style={{
        borderTop: '1px solid var(--glass-border-light)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Ambient glow from album art */}
        {currentSong.albumArt && !imgError && (
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: '200px',
            height: '200px',
            backgroundImage: `url(${currentSong.albumArt})`,
            backgroundSize: 'cover',
            filter: 'blur(60px) saturate(1.5)',
            opacity: 0.3,
            pointerEvents: 'none'
          }} />
        )}

        {/* Progress bar for Spotify Premium users */}
        {showProgressBar && (
          <div
            onClick={handleSeek}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '3px',
              background: 'rgba(255, 255, 255, 0.1)',
              cursor: 'pointer',
              overflow: 'hidden'
            }}
          >
            <div style={{
              width: `${progress}%`,
              height: '100%',
              background: 'var(--gradient-primary)',
              transition: 'width 0.1s linear',
              boxShadow: '0 0 10px rgba(16, 185, 129, 0.5)'
            }} />
          </div>
        )}

        <div className="music-player-container" style={{
          maxWidth: '896px',
          margin: '0 auto',
          padding: '14px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          position: 'relative'
        }}>
          {/* Song info - clickable to open detail panel */}
          <button
            onClick={onSongClick}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              flex: 1,
              minWidth: 0,
              textAlign: 'left',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0
            }}
          >
            {/* Album art with glow effect */}
            <div style={{
              position: 'relative',
              width: '60px',
              height: '60px',
              borderRadius: '14px',
              overflow: 'hidden',
              flexShrink: 0,
              boxShadow: isThisSongPlaying
                ? '0 4px 20px rgba(16, 185, 129, 0.4), 0 0 0 2px rgba(16, 185, 129, 0.3)'
                : '0 4px 16px rgba(0,0,0,0.4)',
              transition: 'box-shadow 0.3s ease'
            }}>
              {imgError ? (
                <div style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))'
                }}>
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

              {/* Playing indicator overlay */}
              {isThisSongPlaying && (
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.6) 100%)',
                  display: 'flex',
                  alignItems: 'flex-end',
                  justifyContent: 'center',
                  paddingBottom: '8px'
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
                whiteSpace: 'nowrap',
                letterSpacing: '-0.01em'
              }}>
                {currentSong.title}
              </h3>
              <p style={{
                fontSize: '13px',
                color: 'var(--color-text-muted)',
                margin: '3px 0 0 0',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {currentSong.artist}
              </p>

              {/* Meta info row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px', flexWrap: 'wrap' }}>
                {/* Location pill */}
                <div className="badge badge-primary" style={{ padding: '3px 8px' }}>
                  <MapPin size={10} />
                  <span style={{
                    maxWidth: '100px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    fontSize: '10px'
                  }}>
                    {currentSong.locationName}
                  </span>
                </div>

                {/* Time display for premium users */}
                {showProgressBar && (
                  <span style={{
                    fontSize: '11px',
                    color: 'var(--color-text-muted)',
                    fontFamily: 'monospace',
                    letterSpacing: '0.02em'
                  }}>
                    {formatTime(position)} / {formatTime(duration)}
                  </span>
                )}

                {/* Premium/Full indicator */}
                {connection.isPremium && playingSong?.id === currentSong?.id && (
                  <div className="badge badge-spotify" style={{ padding: '3px 8px' }}>
                    <Volume2 size={10} />
                    <span style={{ fontSize: '10px' }}>FULL</span>
                  </div>
                )}
              </div>
            </div>

            {/* Expand indicator */}
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.05)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              transition: 'background 0.2s ease'
            }}>
              <ChevronUp size={18} color="var(--color-text-muted)" />
            </div>
          </button>

          {/* Control buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Shuffle button */}
            <button
              className="music-player-shuffle btn-glass"
              onClick={onShuffle}
              aria-label="Shuffle"
              title="Play random song"
              style={{
                width: '44px',
                height: '44px',
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <Shuffle size={18} />
            </button>

            {/* Play/Pause button */}
            <button
              onClick={handlePlayPause}
              disabled={!hasTrack || isThisSongLoading}
              className={isThisSongPlaying ? '' : 'animate-pulse-glow'}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '56px',
                height: '56px',
                background: hasTrack
                  ? (isThisSongPlaying
                      ? 'rgba(255, 255, 255, 0.1)'
                      : 'var(--gradient-primary)')
                  : 'rgba(255, 255, 255, 0.05)',
                borderRadius: '50%',
                color: hasTrack ? 'white' : 'var(--color-text-muted)',
                border: isThisSongPlaying ? '2px solid var(--color-primary)' : 'none',
                cursor: hasTrack ? 'pointer' : 'not-allowed',
                boxShadow: hasTrack && !isThisSongPlaying
                  ? '0 4px 20px rgba(16, 185, 129, 0.4)'
                  : 'none',
                flexShrink: 0,
                transition: 'transform 0.15s ease, box-shadow 0.2s ease, background 0.2s ease'
              }}
              onMouseDown={e => hasTrack && (e.currentTarget.style.transform = 'scale(0.92)')}
              onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
              title={!hasTrack ? 'No playable track' : isThisSongPlaying ? 'Pause' : 'Play'}
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
      </div>
    </div>
  );
}
