import { useState } from 'react';
import { MapPin, Play, Pause, Loader2, Music, ChevronRight } from 'lucide-react';
import type { SongLocation } from '../types';
import { hasPlayableLink } from '../types';
import type { MarkerGroup } from '../hooks/useMarkerGroups';
import { useSpotifyPlayer } from '../contexts/SpotifyPlayerContext';

interface ClusterHoverCardProps {
  group: MarkerGroup;
  isExpanded?: boolean;
  onOpenDetail: () => void;
  onSongSelect?: (song: SongLocation) => void;
  onSongOpenDetail?: (song: SongLocation) => void;
}

interface SongRowProps {
  song: SongLocation;
  onSongSelect?: (song: SongLocation) => void;
  onRowClick?: (song: SongLocation) => void;
}

function SongRow({ song, onSongSelect, onRowClick }: SongRowProps) {
  const [imgErr, setImgErr] = useState(false);
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

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!hasTrack) return;
    if (playingSong?.id === song.id) {
      togglePlayPause();
    } else {
      play(song);
      onSongSelect?.(song);
    }
  };

  const handleRowClick = () => {
    onRowClick?.(song);
  };

  return (
    <div
      onClick={handleRowClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '6px 10px',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        background: isThisSongPlaying ? 'rgba(16, 185, 129, 0.08)' : 'transparent',
        transition: 'background 0.15s ease',
        cursor: onRowClick ? 'pointer' : 'default',
      }}
    >
      {/* Mini album art */}
      <div style={{
        width: '32px',
        height: '32px',
        borderRadius: '4px',
        overflow: 'hidden',
        flexShrink: 0,
        background: '#1a1a1a',
      }}>
        {song.albumArt && !imgErr ? (
          <img
            src={song.albumArt}
            alt={song.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={() => setImgErr(true)}
          />
        ) : (
          <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Music size={14} color="#666" />
          </div>
        )}
      </div>

      {/* Song info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: '11px',
          fontWeight: 600,
          color: isThisSongPlaying ? 'var(--color-primary)' : 'var(--color-text)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {song.title}
        </div>
        <div style={{
          fontSize: '10px',
          color: 'var(--color-text-muted)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {song.artist}
        </div>
      </div>

      {/* Play button */}
      {hasTrack && (
        <button
          onClick={handlePlay}
          disabled={isThisSongLoading}
          style={{
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            background: isThisSongPlaying
              ? 'rgba(255,255,255,0.1)'
              : 'var(--gradient-primary)',
            border: isThisSongPlaying ? '1px solid var(--color-primary)' : 'none',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            flexShrink: 0,
            padding: 0,
          }}
          aria-label={isThisSongPlaying ? 'Pause' : 'Play'}
        >
          {isThisSongLoading ? (
            <Loader2 size={10} className="animate-spin" />
          ) : isThisSongPlaying ? (
            <Pause size={10} fill="currentColor" />
          ) : (
            <Play size={10} fill="currentColor" style={{ marginLeft: '1px' }} />
          )}
        </button>
      )}
    </div>
  );
}

export function ClusterHoverCard({ group, isExpanded, onOpenDetail, onSongSelect, onSongOpenDetail }: ClusterHoverCardProps) {
  const count = group.songs.length;
  // Use resolved geographic name (set by useMarkerGroups), fall back to first song's venue only for same-location groups
  const locationName = group.locationName
    || (group.type === 'location' ? group.songs[0]?.locationName : null)
    || `${count} songs`;

  return (
    <div className="hover-card-inner" onClick={isExpanded ? undefined : onOpenDetail} style={{ cursor: isExpanded ? 'default' : 'pointer' }}>
      {/* Header */}
      <div style={{
        padding: '10px 10px 8px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
      }}>
        <div className="badge badge-primary" style={{ padding: '2px 8px' }}>
          <MapPin size={8} />
          <span style={{
            maxWidth: '120px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            fontSize: '9px',
          }}>
            {locationName}
          </span>
        </div>
        <span style={{
          fontSize: '10px',
          color: 'var(--color-text-muted)',
          fontWeight: 600,
        }}>
          {count} songs
        </span>
      </div>

      {/* Song list */}
      <div style={{
        maxHeight: '200px',
        overflowY: 'auto',
      }}>
        {group.songs.map(song => (
          <SongRow
            key={song.id}
            song={song}
            onSongSelect={onSongSelect}
            onRowClick={isExpanded ? onSongOpenDetail : undefined}
          />
        ))}
      </div>

      {/* Footer hint */}
      {!isExpanded && (
        <div style={{
          padding: '6px 10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '4px',
          fontSize: '9px',
          color: 'var(--color-text-muted)',
          opacity: 0.7,
          borderTop: '1px solid rgba(255,255,255,0.06)',
        }}>
          Click to expand <ChevronRight size={8} />
        </div>
      )}
    </div>
  );
}
