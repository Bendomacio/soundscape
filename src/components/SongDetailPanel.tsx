import { useState } from 'react';
import { 
  X, 
  MapPin, 
  ThumbsUp, 
  Share2, 
  ExternalLink, 
  CheckCircle,
  Music,
  Calendar,
  Tag,
  Play,
  Pause,
  Loader2
} from 'lucide-react';
import type { SongLocation } from '../types';
import { useSpotifyPlayer } from '../contexts/SpotifyPlayerContext';

interface SongDetailPanelProps {
  song: SongLocation;
  onClose: () => void;
}

// Fallback image for failed loads
const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop';

export function SongDetailPanel({ song, onClose }: SongDetailPanelProps) {
  const [headerImgError, setHeaderImgError] = useState(false);
  const [albumImgError, setAlbumImgError] = useState(false);
  
  const { currentSong, isPlaying, isLoading, play, togglePlayPause } = useSpotifyPlayer();

  const trackId = song.spotifyUri?.replace('spotify:track:', '');
  const isThisSongPlaying = currentSong?.id === song.id && isPlaying;
  const isThisSongLoading = currentSong?.id === song.id && isLoading;

  const handlePlayPause = () => {
    if (isThisSongPlaying || isThisSongLoading) {
      togglePlayPause();
    } else {
      play(song);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      zIndex: 9999
    }}>
      {/* Backdrop */}
      <div 
        onClick={onClose}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)'
        }} 
      />
      
      {/* Panel - Centered Modal */}
      <div 
        onClick={e => e.stopPropagation()}
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '480px',
          maxHeight: '85vh',
          background: 'var(--color-dark-card)',
          borderRadius: '20px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          overflow: 'hidden'
        }}
      >
        {/* Header image */}
        <div className="relative h-40 sm:h-48 bg-[var(--color-dark-lighter)]">
          <img 
            src={headerImgError ? FALLBACK_IMAGE : (song.locationImage || song.albumArt)}
            alt={song.locationName}
            className="w-full h-full object-cover"
            onError={() => setHeaderImgError(true)}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-dark-card)] via-transparent to-transparent" />
          
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-10 h-10 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(85vh-10rem)]">
          {/* Song info row - album art + details */}
          <div className="flex items-center gap-4">
            {/* Album art with error handling */}
            <div className="w-20 h-20 rounded-xl overflow-hidden shadow-lg flex-shrink-0 bg-[var(--color-dark-lighter)]">
              <img 
                src={albumImgError ? FALLBACK_IMAGE : song.albumArt}
                alt={song.album || song.title}
                className="w-full h-full object-cover"
                onError={() => setAlbumImgError(true)}
              />
            </div>
            
            {/* Song details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold truncate">{song.title}</h2>
                {song.verified && (
                  <CheckCircle className="w-4 h-4 text-[var(--color-primary)] flex-shrink-0" />
                )}
              </div>
              <p className="text-[var(--color-text-muted)] truncate">{song.artist}</p>
              {song.album && (
                <p className="text-sm text-[var(--color-text-muted)] mt-0.5 flex items-center gap-1 truncate">
                  <Music className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{song.album}</span>
                </p>
              )}
            </div>
          </div>

          {/* Location */}
          <div className="mt-5 p-4 bg-[var(--color-dark-lighter)] rounded-xl">
            <div className="flex items-center gap-2 text-[var(--color-primary)]">
              <MapPin className="w-4 h-4" />
              <span className="font-medium">{song.locationName}</span>
            </div>
            {song.locationDescription && (
              <p className="mt-2 text-sm text-[var(--color-text-muted)] leading-relaxed">
                {song.locationDescription}
              </p>
            )}
          </div>

          {/* Tags */}
          {song.tags && song.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {song.tags.map(tag => (
                <span 
                  key={tag}
                  className="px-3 py-1 bg-[var(--color-dark-lighter)] rounded-full text-xs text-[var(--color-text-muted)] flex items-center gap-1"
                >
                  <Tag className="w-3 h-3" />
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Play/Pause Button */}
          {trackId && (
            <div className="mt-5">
              <button
                onClick={handlePlayPause}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px',
                  width: '100%',
                  padding: '16px',
                  background: isThisSongPlaying 
                    ? 'var(--color-dark-lighter)'
                    : 'linear-gradient(135deg, #1DB954, #1aa34a)',
                  borderRadius: '12px',
                  border: isThisSongPlaying ? '1px solid var(--color-dark-card)' : 'none',
                  color: 'white',
                  fontSize: '16px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {isThisSongLoading ? (
                  <>
                    <Loader2 size={24} className="animate-spin" />
                    Loading...
                  </>
                ) : isThisSongPlaying ? (
                  <>
                    <Pause size={24} fill="currentColor" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play size={24} fill="currentColor" />
                    Play on Spotify
                  </>
                )}
              </button>
            </div>
          )}

          {/* No Spotify link fallback */}
          {!trackId && (
            <div className="mt-5 p-4 bg-[var(--color-dark-lighter)] rounded-xl flex items-center gap-3">
              <Music className="w-5 h-5 text-[var(--color-text-muted)]" />
              <p className="text-sm text-[var(--color-text-muted)]">No Spotify link available for this song</p>
            </div>
          )}

          {/* Stats */}
          <div style={{ marginTop: '20px', display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
            <button style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: 'var(--color-text-muted)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '8px 0',
              whiteSpace: 'nowrap'
            }}>
              <ThumbsUp size={20} />
              <span style={{ fontWeight: 500 }}>{song.upvotes.toLocaleString()}</span>
            </button>
            <button style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: 'var(--color-text-muted)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '8px 0',
              whiteSpace: 'nowrap'
            }}>
              <Share2 size={20} />
              <span>Share</span>
            </button>
            {trackId && (
              <a 
                href={`https://open.spotify.com/track/${trackId}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: 'var(--color-text-muted)',
                  textDecoration: 'none',
                  marginLeft: 'auto',
                  whiteSpace: 'nowrap'
                }}
              >
                <span>Open in Spotify</span>
                <ExternalLink size={16} />
              </a>
            )}
          </div>

          {/* Submitted info */}
          {song.submittedBy && (
            <div className="mt-5 pt-4 border-t border-[var(--color-dark-lighter)] flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
              <Calendar className="w-3 h-3" />
              <span>Submitted by {song.submittedBy}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
