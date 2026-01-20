import { useState } from 'react';
import { 
  X, 
  Search, 
  Edit2, 
  Trash2, 
  CheckCircle, 
  MapPin,
  Music,
  ExternalLink,
  AlertCircle,
  Loader
} from 'lucide-react';
import { SpotifySearch } from './SpotifySearch';
import type { SongLocation } from '../types';
import type { SpotifyTrack } from '../lib/spotify';
import { getTrackInfo } from '../lib/spotify';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  songs: SongLocation[];
  onUpdateSong: (songId: string, updates: Partial<SongLocation>) => void;
  onDeleteSong: (songId: string) => void;
}

export function AdminPanel({ isOpen, onClose, songs, onUpdateSong, onDeleteSong }: AdminPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingSong, setEditingSong] = useState<SongLocation | null>(null);
  const [showSpotifySearch, setShowSpotifySearch] = useState(false);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  if (!isOpen) return null;

  const filteredSongs = songs.filter(song => 
    song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    song.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
    song.locationName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSpotifySelect = async (track: SpotifyTrack) => {
    if (editingSong) {
      setIsUpdating(editingSong.id);
      setShowSpotifySearch(false);
      
      const trackInfo = await getTrackInfo(track.id);
      
      if (trackInfo) {
        onUpdateSong(editingSong.id, {
          title: trackInfo.title,
          artist: trackInfo.artist,
          albumArt: trackInfo.albumArt,
          spotifyUri: `spotify:track:${track.id}`
        });
      } else {
        onUpdateSong(editingSong.id, {
          spotifyUri: `spotify:track:${track.id}`
        });
      }
      
      setEditingSong(null);
      setIsUpdating(null);
    }
  };

  const getSpotifyStatus = (song: SongLocation) => {
    if (!song.spotifyUri) return 'missing';
    return 'valid';
  };

  const linkedCount = songs.filter(s => s.spotifyUri).length;

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
      
      {/* Panel */}
      <div 
        onClick={e => e.stopPropagation()}
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '800px',
          maxHeight: '90vh',
          background: 'var(--color-dark-card)',
          borderRadius: '20px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '24px',
          borderBottom: '1px solid var(--color-dark-lighter)',
          flexShrink: 0
        }}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, margin: 0 }}>Admin Panel</h2>
            <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', margin: '4px 0 0 0' }}>
              Manage songs and fix Spotify links
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              padding: '10px',
              background: 'none',
              border: 'none',
              borderRadius: '50%',
              cursor: 'pointer',
              color: 'var(--color-text-muted)'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Search */}
        <div style={{
          padding: '16px 24px',
          borderBottom: '1px solid var(--color-dark-lighter)',
          flexShrink: 0
        }}>
          <div style={{ position: 'relative' }}>
            <Search 
              size={20} 
              style={{
                position: 'absolute',
                left: '16px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--color-text-muted)',
                pointerEvents: 'none'
              }}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search songs by title, artist, or location..."
              style={{
                width: '100%',
                height: '48px',
                paddingLeft: '52px',
                paddingRight: '16px',
                fontSize: '15px',
                background: 'var(--color-dark-lighter)',
                border: '1px solid transparent',
                borderRadius: '12px',
                color: 'var(--color-text)',
                outline: 'none'
              }}
            />
          </div>
        </div>

        {/* Songs list */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px 24px'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filteredSongs.map(song => {
              const status = getSpotifyStatus(song);
              const trackId = song.spotifyUri?.replace('spotify:track:', '');
              
              return (
                <div 
                  key={song.id}
                  style={{
                    padding: '16px',
                    background: 'var(--color-dark-lighter)',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px'
                  }}
                >
                  {/* Album art */}
                  <div style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    flexShrink: 0,
                    background: 'var(--color-dark-card)'
                  }}>
                    <img 
                      src={song.albumArt} 
                      alt={song.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=200';
                      }}
                    />
                  </div>

                  {/* Song info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <h3 style={{ 
                        fontWeight: 500, 
                        fontSize: '15px',
                        margin: 0,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {song.title}
                      </h3>
                      {song.verified && (
                        <CheckCircle size={16} color="var(--color-primary)" style={{ flexShrink: 0 }} />
                      )}
                    </div>
                    <p style={{ 
                      fontSize: '13px', 
                      color: 'var(--color-text-muted)', 
                      margin: '2px 0 0 0',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {song.artist}
                    </p>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '4px', 
                      fontSize: '12px', 
                      color: 'var(--color-text-muted)', 
                      marginTop: '4px' 
                    }}>
                      <MapPin size={12} />
                      <span style={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {song.locationName}
                      </span>
                    </div>
                  </div>

                  {/* Spotify status */}
                  <div style={{ flexShrink: 0 }}>
                    {status === 'valid' ? (
                      <a
                        href={`https://open.spotify.com/track/${trackId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '8px 14px',
                          background: 'rgba(29, 185, 84, 0.2)',
                          color: '#1DB954',
                          borderRadius: '9999px',
                          fontSize: '13px',
                          textDecoration: 'none',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        <Music size={14} />
                        <span>Linked</span>
                        <ExternalLink size={14} />
                      </a>
                    ) : (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 14px',
                        background: 'rgba(239, 68, 68, 0.2)',
                        color: '#f87171',
                        borderRadius: '9999px',
                        fontSize: '13px',
                        whiteSpace: 'nowrap'
                      }}>
                        <AlertCircle size={14} />
                        <span>No Link</span>
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                    {isUpdating === song.id ? (
                      <div style={{ padding: '10px' }}>
                        <Loader size={18} className="animate-spin" color="var(--color-primary)" />
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setEditingSong(song);
                          setShowSpotifySearch(true);
                        }}
                        title="Fix Spotify link"
                        style={{
                          padding: '10px',
                          background: 'none',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          color: 'var(--color-primary)'
                        }}
                      >
                        <Edit2 size={18} />
                      </button>
                    )}
                    <button
                      onClick={() => {
                        if (confirm(`Delete "${song.title}"?`)) {
                          onDeleteSong(song.id);
                        }
                      }}
                      title="Delete song"
                      style={{
                        padding: '10px',
                        background: 'none',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        color: '#f87171'
                      }}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              );
            })}

            {filteredSongs.length === 0 && (
              <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--color-text-muted)' }}>
                No songs found matching your search.
              </div>
            )}
          </div>
        </div>

        {/* Stats footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid var(--color-dark-lighter)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '14px',
          color: 'var(--color-text-muted)',
          flexShrink: 0
        }}>
          <span style={{ whiteSpace: 'nowrap' }}>{songs.length} total songs</span>
          <span style={{ whiteSpace: 'nowrap' }}>{linkedCount} linked to Spotify</span>
        </div>
      </div>

      {/* Spotify Search Modal */}
      <SpotifySearch
        isOpen={showSpotifySearch}
        onClose={() => {
          setShowSpotifySearch(false);
          setEditingSong(null);
        }}
        onSelect={handleSpotifySelect}
        initialQuery={editingSong ? `${editingSong.title} ${editingSong.artist}` : ''}
      />
    </div>
  );
}
