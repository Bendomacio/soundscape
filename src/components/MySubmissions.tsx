import { useState, useEffect } from 'react';
import { 
  X, 
  Music, 
  MapPin, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Loader,
  Edit2,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { fetchUserSongs, updateSong } from '../lib/songs';
import type { SongLocation } from '../types';

interface MySubmissionsProps {
  isOpen: boolean;
  onClose: () => void;
  onEditSong?: (song: SongLocation) => void;
}

export function MySubmissions({ isOpen, onClose, onEditSong }: MySubmissionsProps) {
  const { user } = useAuth();
  const [songs, setSongs] = useState<SongLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [updatedDescription, setUpdatedDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      setIsLoading(true);
      fetchUserSongs(user.id).then(data => {
        setSongs(data);
        setIsLoading(false);
      });
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const handleUpdateDescription = async (songId: string) => {
    setIsSaving(true);
    const success = await updateSong(songId, { 
      locationDescription: updatedDescription 
    });
    if (success) {
      setSongs(songs.map(s => 
        s.id === songId 
          ? { ...s, locationDescription: updatedDescription, status: 'live', adminNotes: undefined }
          : s
      ));
      setEditingNotes(null);
      setUpdatedDescription('');
    }
    setIsSaving(false);
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'needs_edit':
        return <AlertTriangle size={16} color="#f59e0b" />;
      case 'removed':
        return <XCircle size={16} color="#ef4444" />;
      default:
        return <CheckCircle size={16} color="#10b981" />;
    }
  };

  const getStatusText = (status?: string) => {
    switch (status) {
      case 'needs_edit':
        return 'Needs Edit';
      case 'removed':
        return 'Removed';
      default:
        return 'Live';
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'needs_edit':
        return '#f59e0b';
      case 'removed':
        return '#ef4444';
      default:
        return '#10b981';
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
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
          maxWidth: '600px',
          maxHeight: '80vh',
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
            <h2 style={{ fontSize: '20px', fontWeight: 700, margin: 0 }}>My Submissions</h2>
            <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', margin: '4px 0 0 0' }}>
              Songs you've added to SoundScape
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

        {/* Content */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px 24px'
        }}>
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '48px 0' }}>
              <Loader size={24} className="animate-spin" style={{ color: 'var(--color-text-muted)' }} />
            </div>
          ) : songs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--color-text-muted)' }}>
              <Music size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
              <p>You haven't submitted any songs yet.</p>
              <p style={{ fontSize: '14px' }}>Click "Add Song" to share your first music memory!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {songs.map(song => (
                <div 
                  key={song.id}
                  style={{
                    padding: '16px',
                    background: 'var(--color-dark-lighter)',
                    borderRadius: '12px',
                    borderLeft: `4px solid ${getStatusColor(song.status)}`
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
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
                        <h3 style={{ fontWeight: 500, fontSize: '15px', margin: 0 }}>
                          {song.title}
                        </h3>
                        <span style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '11px',
                          fontWeight: 600,
                          padding: '2px 8px',
                          borderRadius: '4px',
                          background: `${getStatusColor(song.status)}30`,
                          color: getStatusColor(song.status)
                        }}>
                          {getStatusIcon(song.status)}
                          {getStatusText(song.status)}
                        </span>
                      </div>
                      <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', margin: '2px 0' }}>
                        {song.artist}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                        <MapPin size={12} />
                        {song.locationName}
                      </div>
                    </div>
                  </div>

                  {/* Admin notes / edit request */}
                  {song.status === 'needs_edit' && song.adminNotes && (
                    <div style={{
                      marginTop: '12px',
                      padding: '12px',
                      background: 'rgba(245, 158, 11, 0.1)',
                      borderRadius: '8px',
                      border: '1px solid rgba(245, 158, 11, 0.3)'
                    }}>
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '8px', 
                        marginBottom: '8px',
                        color: '#f59e0b',
                        fontSize: '13px',
                        fontWeight: 600
                      }}>
                        <AlertTriangle size={16} />
                        Edit Requested
                      </div>
                      <p style={{ fontSize: '14px', margin: '0 0 12px 0', color: 'var(--color-text)' }}>
                        {song.adminNotes}
                      </p>
                      
                      {editingNotes === song.id ? (
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <input
                            type="text"
                            value={updatedDescription}
                            onChange={(e) => setUpdatedDescription(e.target.value)}
                            placeholder="Update your description..."
                            style={{
                              flex: 1,
                              padding: '10px 14px',
                              background: 'var(--color-dark-card)',
                              border: '1px solid var(--color-dark-lighter)',
                              borderRadius: '8px',
                              color: 'var(--color-text)',
                              fontSize: '14px'
                            }}
                          />
                          <button
                            onClick={() => handleUpdateDescription(song.id)}
                            disabled={isSaving}
                            style={{
                              padding: '10px 16px',
                              background: 'var(--color-primary)',
                              color: 'var(--color-dark)',
                              border: 'none',
                              borderRadius: '8px',
                              fontSize: '14px',
                              fontWeight: 500,
                              cursor: 'pointer',
                              opacity: isSaving ? 0.7 : 1
                            }}
                          >
                            {isSaving ? 'Saving...' : 'Save'}
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingNotes(song.id);
                            setUpdatedDescription(song.locationDescription || '');
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '8px 16px',
                            background: '#f59e0b',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '13px',
                            fontWeight: 500,
                            cursor: 'pointer'
                          }}
                        >
                          <Edit2 size={14} />
                          Edit & Resubmit
                        </button>
                      )}
                    </div>
                  )}

                  {/* Quick link to Spotify */}
                  {song.spotifyUri && (
                    <div style={{ marginTop: '12px' }}>
                      <a
                        href={`https://open.spotify.com/track/${song.spotifyUri.replace('spotify:track:', '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '12px',
                          color: 'var(--color-text-muted)',
                          textDecoration: 'none'
                        }}
                      >
                        <ExternalLink size={12} />
                        Open in Spotify
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid var(--color-dark-lighter)',
          fontSize: '14px',
          color: 'var(--color-text-muted)',
          textAlign: 'center'
        }}>
          {songs.length} submission{songs.length !== 1 ? 's' : ''}
        </div>
      </div>
    </div>
  );
}
