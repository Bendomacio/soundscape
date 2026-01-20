import { useState } from 'react';
import { Music, CheckCircle } from 'lucide-react';
import type { SongLocation } from '../types';

interface MusicMarkerProps {
  song: SongLocation;
  isPlaying: boolean;
  isSelected: boolean;
  onClick: () => void;
}

export function MusicMarker({ song, isPlaying, isSelected, onClick }: MusicMarkerProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Marker size based on state
  const size = isPlaying ? 64 : isSelected ? 56 : 52;

  return (
    <button
      onClick={onClick}
      style={{
        position: 'relative',
        cursor: 'pointer',
        transition: 'transform 0.2s ease',
        zIndex: isPlaying ? 100 : isSelected ? 50 : 10,
        background: 'none',
        border: 'none',
        padding: 0
      }}
      aria-label={`${song.title} by ${song.artist} at ${song.locationName}`}
    >
      {/* Pulse ring when playing */}
      {isPlaying && (
        <>
          <div 
            className="pulse-ring"
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: size + 24,
              height: size + 24,
              borderRadius: '50%',
              background: '#1DB954',
              opacity: 0.3
            }}
          />
          <div 
            className="pulse-ring"
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: size + 16,
              height: size + 16,
              borderRadius: '50%',
              background: '#1DB954',
              opacity: 0.2,
              animationDelay: '0.5s'
            }}
          />
        </>
      )}
      
      {/* Outer ring / border */}
      <div 
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          padding: '3px',
          background: isPlaying 
            ? 'linear-gradient(135deg, #1DB954, #FF6B6B)' 
            : isSelected
              ? 'linear-gradient(135deg, #FF6B6B, #FFE66D)'
              : 'linear-gradient(135deg, #3b3b3b, #1a1a1a)',
          boxShadow: isPlaying 
            ? '0 0 24px rgba(29, 185, 84, 0.6)' 
            : '0 4px 16px rgba(0,0,0,0.4)',
          transition: 'all 0.3s ease'
        }}
      >
        {/* Inner content - Album Art */}
        <div 
          style={{
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            overflow: 'hidden',
            background: '#0D1117',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {/* Album art image */}
          {song.albumArt && !imageError && (
            <img 
              src={song.albumArt} 
              alt={`${song.album || song.title}`}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                opacity: imageLoaded ? 1 : 0,
                transition: 'opacity 0.2s ease'
              }}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
            />
          )}
          
          {/* Fallback music icon */}
          {(!song.albumArt || imageError || !imageLoaded) && (
            <div 
              style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #1DB954, #1aa34a)',
                position: imageLoaded ? 'absolute' : 'relative',
                opacity: imageLoaded ? 0 : 1
              }}
            >
              <Music size={size * 0.4} color="white" />
            </div>
          )}
        </div>
      </div>

      {/* Verified badge */}
      {song.verified && (
        <div 
          style={{
            position: 'absolute',
            bottom: '-2px',
            right: '-2px',
            width: '20px',
            height: '20px',
            background: '#1DB954',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
            border: '2px solid #0D1117'
          }}
        >
          <CheckCircle size={12} color="white" />
        </div>
      )}

      {/* Label tooltip on hover */}
      <div 
        className="marker-tooltip"
        style={{
          position: 'absolute',
          left: '50%',
          transform: 'translateX(-50%)',
          bottom: -44,
          opacity: 0,
          transition: 'opacity 0.2s ease',
          pointerEvents: 'none',
          whiteSpace: 'nowrap',
          zIndex: 50
        }}
      >
        <div 
          style={{
            background: '#21262D',
            padding: '8px 12px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
            border: '1px solid #30363D'
          }}
        >
          <div style={{ fontWeight: 600, fontSize: '13px', color: 'white' }}>{song.title}</div>
          <div style={{ fontSize: '12px', color: '#8B949E' }}>{song.artist}</div>
        </div>
      </div>

      <style>{`
        button:hover .marker-tooltip {
          opacity: 1 !important;
        }
      `}</style>
    </button>
  );
}
