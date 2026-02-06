import { useState } from 'react';
import { MapPin, Shuffle, Music, Play, Pause, Loader2, Volume2 } from 'lucide-react';
import type { SongLocation } from '../types';
import { hasPlayableLink } from '../types';
import { useSpotifyPlayer } from '../contexts/SpotifyPlayerContext';

interface MusicPlayerProps {
  currentSong: SongLocation | null;
  onSongClick: () => void;
  onShuffle: () => void;
  songCount?: number;
  discoveryMode?: 'nearby' | 'explore' | 'trip';
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
  songCount = 0,
  discoveryMode = 'explore',
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
    const hasSongs = songCount > 0;

    // Dynamic messaging based on state
    let message: string;
    let hint: string;
    if (hasSongs) {
      message = `${songCount} song${songCount !== 1 ? 's' : ''} in your radius`;
      hint = 'Press shuffle or tap a song to start playing';
    } else if (discoveryMode === 'explore') {
      message = 'No songs in range';
      hint = 'Move around or expand your radius to discover songs';
    } else if (discoveryMode === 'trip') {
      message = 'No songs along your route';
      hint = 'Try a different destination or switch to explore mode';
    } else {
      message = 'No songs nearby';
      hint = 'Try switching to explore mode or expanding your radius';
    }

    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 animate-slide-up">
        <div className="glass-dark" style={{
          borderTop: '1px solid var(--glass-border-light)',
          padding: '14px 16px',
        }}>
          <div style={{
            maxWidth: '512px',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}>
            {/* Icon / shuffle button */}
            {hasSongs ? (
              <button
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
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--color-primary)',
                  flexShrink: 0,
                  transition: 'opacity 0.2s ease',
                }}
              >
                <Shuffle size={20} />
              </button>
            ) : (
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.03)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <MapPin size={20} style={{ color: 'var(--color-text-muted)', opacity: 0.5 }} />
              </div>
            )}

            {/* Message text */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{
                fontSize: '14px',
                fontWeight: 500,
                color: 'var(--color-text)',
                margin: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {message}
              </p>
              <p style={{
                fontSize: '12px',
                color: 'var(--color-text-muted)',
                margin: '2px 0 0 0',
                opacity: 0.7,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {hint}
              </p>
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
          padding: '12px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          position: 'relative'
        }}>
          {/* Song info - clickable to open detail panel */}
          <button
            onClick={onSongClick}
            aria-label={`View details for ${currentSong?.title || 'song'} by ${currentSong?.artist || 'unknown artist'}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
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
            <div className="album-art-container" style={{
              position: 'relative',
              width: '52px',
              height: '52px',
              borderRadius: '12px',
              overflow: 'hidden',
              flexShrink: 0,
              boxShadow: isThisSongPlaying
                ? '0 4px 16px rgba(16, 185, 129, 0.4), 0 0 0 2px rgba(16, 185, 129, 0.3)'
                : '0 2px 12px rgba(0,0,0,0.4)',
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
                  <Music size={22} color="var(--color-text-muted)" />
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
                  paddingBottom: '6px'
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
                fontSize: '14px',
                margin: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                letterSpacing: '-0.01em'
              }}>
                {currentSong.title}
              </h3>
              <p style={{
                fontSize: '12px',
                color: 'var(--color-text-muted)',
                margin: '2px 0 0 0',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {currentSong.artist}
              </p>

              {/* Meta info row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                {/* Location pill */}
                <div className="badge badge-primary" style={{ padding: '2px 10px' }}>
                  <MapPin size={9} />
                  <span style={{
                    maxWidth: '80px',
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
                    fontSize: '10px',
                    color: 'var(--color-text-muted)',
                    fontFamily: 'monospace',
                    letterSpacing: '0.02em',
                    whiteSpace: 'nowrap',
                  }}>
                    {formatTime(position)} / {formatTime(duration)}
                  </span>
                )}

                {/* Premium/Full indicator */}
                {connection.isPremium && playingSong?.id === currentSong?.id && (
                  <div className="badge badge-spotify" style={{ padding: '2px 10px' }}>
                    <Volume2 size={9} />
                    <span style={{ fontSize: '10px' }}>FULL</span>
                  </div>
                )}
              </div>
            </div>
          </button>

          {/* Control buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
            {/* Shuffle button */}
            <button
              className="music-player-shuffle btn-glass"
              onClick={onShuffle}
              aria-label="Shuffle"
              title="Play random song"
              style={{
                width: '40px',
                height: '40px',
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <Shuffle size={16} />
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
                width: '48px',
                height: '48px',
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
                  ? '0 4px 16px rgba(16, 185, 129, 0.4)'
                  : 'none',
                flexShrink: 0,
                transition: 'transform 0.15s ease, box-shadow 0.2s ease, background 0.2s ease'
              }}
              onMouseDown={e => hasTrack && (e.currentTarget.style.transform = 'scale(0.92)')}
              onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
              title={!hasTrack ? 'No playable track' : isThisSongPlaying ? 'Pause' : 'Play'}
              aria-label={!hasTrack ? 'No playable track' : isThisSongPlaying ? 'Pause' : 'Play'}
            >
              {isThisSongLoading ? (
                <Loader2 size={22} className="animate-spin" />
              ) : isThisSongPlaying ? (
                <Pause size={22} fill="currentColor" />
              ) : (
                <Play size={22} fill="currentColor" style={{ marginLeft: '2px' }} />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
