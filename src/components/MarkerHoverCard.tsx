import { useState, useRef, useEffect } from 'react';
import { MapPin, Play, Pause, Loader2, Music } from 'lucide-react';
import type { SongLocation } from '../types';
import { hasPlayableLink } from '../types';
import { useSpotifyPlayer } from '../contexts/SpotifyPlayerContext';

interface MarkerHoverCardProps {
  song: SongLocation;
  onOpenDetail: () => void;
}

// Constant scroll speed: 20px per second
const CRAWL_SPEED_PX_PER_SEC = 20;
// Container shows ~4 lines (line-height 1.4 * 10px = 14px, 4 lines = 56px)
const CONTAINER_HEIGHT = 52;

export function MarkerHoverCard({ song, onOpenDetail }: MarkerHoverCardProps) {
  const [imgError, setImgError] = useState(false);
  const textRef = useRef<HTMLDivElement>(null);

  const {
    currentSong: playingSong,
    isPlaying,
    isLoading,
    play,
    togglePlayPause,
  } = useSpotifyPlayer();

  const isThisSongPlaying = playingSong?.id === song.id && isPlaying;
  const isThisSongLoading = playingSong?.id === song.id && isLoading;
  const hasTrack = hasPlayableLink(song);

  const [crawlParams, setCrawlParams] = useState<{ duration: number; start: number; end: number } | null>(null);

  // Measure text height after render, calculate duration for constant speed
  useEffect(() => {
    // Delay measurement to ensure text is rendered
    const timer = setTimeout(() => {
      if (textRef.current) {
        const textHeight = textRef.current.scrollHeight;
        if (textHeight > CONTAINER_HEIGHT) {
          // Start: text top at container bottom (push down by container height)
          const start = CONTAINER_HEIGHT;
          // End: text bottom at container top (push up by text height)
          const end = -textHeight;
          const totalDistance = start - end; // = containerHeight + textHeight
          const duration = totalDistance / CRAWL_SPEED_PX_PER_SEC;
          setCrawlParams({ duration, start, end });
        } else {
          setCrawlParams(null);
        }
      }
    }, 50);
    return () => clearTimeout(timer);
  }, [song.locationDescription]);

  const handlePlayPause = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!hasTrack) return;

    if (playingSong?.id === song.id) {
      togglePlayPause();
    } else {
      play(song);
    }
  };

  const description = song.locationDescription || '';

  return (
    <div className="hover-card-inner" onClick={onOpenDetail} style={{ cursor: 'pointer' }}>
      {/* Album art row with play button */}
      <div style={{ position: 'relative' }}>
        <div style={{
          width: '100%',
          height: '100px',
          overflow: 'hidden',
          position: 'relative',
        }}>
          {song.albumArt && !imgError ? (
            <img
              src={song.albumArt}
              alt={song.album || song.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={() => setImgError(true)}
            />
          ) : (
            <div style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))',
            }}>
              <Music size={32} color="var(--color-text-muted)" />
            </div>
          )}

          {/* Gradient overlay for text readability */}
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '50px',
            background: 'linear-gradient(transparent, rgba(13, 17, 23, 0.9))',
            pointerEvents: 'none',
          }} />

          {/* Play button overlay */}
          {hasTrack && (
            <button
              onClick={handlePlayPause}
              disabled={isThisSongLoading}
              style={{
                position: 'absolute',
                bottom: '8px',
                right: '8px',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: isThisSongPlaying
                  ? 'rgba(255, 255, 255, 0.15)'
                  : 'var(--gradient-primary)',
                border: isThisSongPlaying ? '1.5px solid var(--color-primary)' : 'none',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: !isThisSongPlaying ? '0 2px 8px rgba(16, 185, 129, 0.4)' : 'none',
                transition: 'transform 0.15s ease',
                padding: 0,
              }}
              onMouseDown={e => { e.stopPropagation(); e.currentTarget.style.transform = 'scale(0.9)'; }}
              onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
              aria-label={isThisSongPlaying ? 'Pause' : 'Play'}
            >
              {isThisSongLoading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : isThisSongPlaying ? (
                <Pause size={14} fill="currentColor" />
              ) : (
                <Play size={14} fill="currentColor" style={{ marginLeft: '1px' }} />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Song info */}
      <div style={{ padding: '8px 10px 10px' }}>
        {/* Title */}
        <h4 style={{
          margin: 0,
          fontSize: '13px',
          fontWeight: 600,
          color: 'var(--color-text)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          letterSpacing: '-0.01em',
        }}>
          {song.title}
        </h4>

        {/* Artist */}
        <p style={{
          margin: '2px 0 0',
          fontSize: '11px',
          color: 'var(--color-text-muted)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {song.artist}
        </p>

        {/* Location pill */}
        <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <div className="badge badge-primary" style={{ padding: '2px 8px' }}>
            <MapPin size={8} />
            <span style={{
              maxWidth: '140px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              fontSize: '9px',
            }}>
              {song.locationName}
            </span>
          </div>
        </div>

        {/* Star Wars style crawl description */}
        {description && (
          <div
            className="crawl-container"
            style={{
              marginTop: '6px',
              fontSize: '10px',
              color: 'var(--color-text-muted)',
              opacity: 0.8,
              lineHeight: 1.4,
              maxHeight: `${CONTAINER_HEIGHT}px`,
            }}
          >
            <div
              ref={textRef}
              className={crawlParams ? 'crawl-text' : ''}
              style={crawlParams ? {
                '--crawl-duration': `${crawlParams.duration}s`,
                '--crawl-start': `${crawlParams.start}px`,
                '--crawl-end': `${crawlParams.end}px`,
              } as React.CSSProperties : undefined}
            >
              {description}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
