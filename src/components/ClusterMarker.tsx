import React, { useState } from 'react';
import { Music } from 'lucide-react';
import type { MarkerGroup } from '../hooks/useMarkerGroups';
import { useCachedImage } from '../hooks/useCachedImage';

interface ClusterMarkerProps {
  group: MarkerGroup;
  isAnyPlaying: boolean;
  isSelected: boolean;
  onClick: (e: React.MouseEvent) => void;
  onMouseEnter?: (e: React.MouseEvent) => void;
  onMouseLeave?: () => void;
}

// Mini album art thumbnail for the grid
function GridThumb({ src, alt }: { src?: string; alt: string }) {
  const [err, setErr] = useState(false);
  const { src: cached, isLoading } = useCachedImage(src);

  if (!src || err || isLoading) {
    return (
      <div style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#1a1a1a',
      }}>
        <Music size={10} color="#666" />
      </div>
    );
  }

  return (
    <img
      src={cached}
      alt={alt}
      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      onError={() => setErr(true)}
    />
  );
}

export const ClusterMarker = React.memo(function ClusterMarker({
  group,
  isAnyPlaying,
  isSelected,
  onClick,
  onMouseEnter,
  onMouseLeave,
}: ClusterMarkerProps) {
  const count = group.songs.length;
  const size = isAnyPlaying ? 64 : isSelected ? 58 : 52;
  const gridSongs = group.songs.slice(0, 4);
  const extraCount = count - 4;

  const ringColor = isAnyPlaying
    ? 'linear-gradient(135deg, #1DB954, #1ed760)'
    : isSelected
      ? 'linear-gradient(135deg, #FF6B6B, #FFE66D)'
      : 'linear-gradient(135deg, #1DB954, #0d9e3f)';

  const glowColor = isAnyPlaying
    ? 'rgba(29, 185, 84, 0.7)'
    : 'rgba(0,0,0,0.5)';

  return (
    <div
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClick(e as unknown as React.MouseEvent); }}
      style={{
        width: size,
        height: size,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        position: 'relative',
      }}
    >
      {/* Pulse animation for playing */}
      {isAnyPlaying && (
        <div
          className="marker-pulse"
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: size + 14,
            height: size + 14,
            borderRadius: '50%',
            background: '#1DB954',
          }}
        />
      )}

      {/* Outer ring */}
      <div style={{
        width: '100%',
        height: '100%',
        borderRadius: '50%',
        padding: '3px',
        background: ringColor,
        boxShadow: `0 ${isAnyPlaying ? '0' : '4px'} ${isAnyPlaying ? '25px' : '15px'} ${glowColor}`,
        position: 'relative',
      }}>
        {/* Album art grid — half-and-half for 2, 2x2 for 3+ */}
        <div style={{
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          overflow: 'hidden',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gridTemplateRows: count === 2 ? '1fr' : '1fr 1fr',
          gap: '1px',
          background: '#1a1a1a',
        }}>
          {gridSongs.map((song, i) => {
            const isLastCell = i === 3 && extraCount > 0;
            return (
              <div key={song.id} style={{ position: 'relative', overflow: 'hidden' }}>
                <GridThumb src={song.albumArt} alt={song.title} />
                {isLastCell && (
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(0,0,0,0.65)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '10px',
                    fontWeight: 700,
                    color: 'white',
                  }}>
                    +{extraCount}
                  </div>
                )}
              </div>
            );
          })}
          {/* Fill empty cell if 3 songs */}
          {gridSongs.length === 3 && (
            <div key="empty-0" style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#1a1a1a',
            }}>
              <Music size={10} color="#444" />
            </div>
          )}
        </div>

        {/* Count badge */}
        <div style={{
          position: 'absolute',
          top: '-4px',
          right: '-4px',
          minWidth: '18px',
          height: '18px',
          borderRadius: '9px',
          background: 'linear-gradient(135deg, #10B981, #059669)',
          color: 'white',
          fontSize: '10px',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 4px',
          boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
          border: '1.5px solid rgba(10, 12, 16, 0.8)',
        }}>
          {count}
        </div>
      </div>
    </div>
  );
});
