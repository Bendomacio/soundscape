import { useState, useEffect } from 'react';
import {
  X,
  Search,
  Trash2,
  CheckCircle,
  MapPin,
  Music,
  ExternalLink,
  AlertCircle,
  Loader,
  Camera,
  Check,
  XCircle,
  Image as ImageIcon,
  Eye,
  EyeOff,
  MessageSquare,
  Send,
  RefreshCw,
  User,
  Link2
} from 'lucide-react';
import { SpotifySearch } from './SpotifySearch';
import type { SongLocation, SongPhoto, SongStatus, MusicProvider, ProviderLinks } from '../types';
import type { SpotifyTrack } from '../lib/spotify';
import { getTrackInfo } from '../lib/spotify';
import { getPendingPhotos, approvePhoto, rejectPhoto } from '../lib/comments';
import { setSongStatus, fetchAllSongsAdmin } from '../lib/songs';
import { detectProvider, extractProviderId } from '../lib/providers';

// Provider display config
const PROVIDER_CONFIG: Record<MusicProvider, { name: string; color: string; placeholder: string }> = {
  spotify: {
    name: 'Spotify',
    color: '#1DB954',
    placeholder: 'spotify:track:xxx or open.spotify.com/track/xxx'
  },
  youtube: {
    name: 'YouTube',
    color: '#FF0000',
    placeholder: 'youtube.com/watch?v=xxx or youtu.be/xxx'
  },
  apple_music: {
    name: 'Apple Music',
    color: '#FC3C44',
    placeholder: 'music.apple.com/.../song/xxx'
  },
  soundcloud: {
    name: 'SoundCloud',
    color: '#FF5500',
    placeholder: 'soundcloud.com/artist/track'
  }
};

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  songs: SongLocation[];
  onUpdateSong: (songId: string, updates: Partial<SongLocation>) => void;
  onDeleteSong: (songId: string) => void;
  onRefreshSongs?: () => void;
}

export function AdminPanel({ isOpen, onClose, songs, onUpdateSong, onDeleteSong, onRefreshSongs }: AdminPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingSong, setEditingSong] = useState<SongLocation | null>(null);
  const [showSpotifySearch, setShowSpotifySearch] = useState(false);
  const [showProviderEditor, setShowProviderEditor] = useState(false);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'songs' | 'review' | 'photos'>('songs');
  const [pendingPhotos, setPendingPhotos] = useState<SongPhoto[]>([]);
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  const [processingPhoto, setProcessingPhoto] = useState<string | null>(null);

  // Multi-provider editing state
  const [providerInputs, setProviderInputs] = useState<Record<MusicProvider, string>>({
    spotify: '',
    youtube: '',
    apple_music: '',
    soundcloud: ''
  });
  const [providerValidation, setProviderValidation] = useState<Record<MusicProvider, 'valid' | 'invalid' | 'empty'>>({
    spotify: 'empty',
    youtube: 'empty',
    apple_music: 'empty',
    soundcloud: 'empty'
  });

  // Review state
  const [allSongs, setAllSongs] = useState<SongLocation[]>([]);
  const [loadingAllSongs, setLoadingAllSongs] = useState(false);
  const [editNotesFor, setEditNotesFor] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [processingStatus, setProcessingStatus] = useState<string | null>(null);

  // Load all songs for review tab
  useEffect(() => {
    if (activeTab === 'review' && allSongs.length === 0) {
      setLoadingAllSongs(true);
      fetchAllSongsAdmin().then(songs => {
        setAllSongs(songs);
        setLoadingAllSongs(false);
      });
    }
  }, [activeTab, allSongs.length]);

  // Load pending photos when tab changes
  useEffect(() => {
    if (activeTab === 'photos' && pendingPhotos.length === 0) {
      setLoadingPhotos(true);
      getPendingPhotos().then(photos => {
        setPendingPhotos(photos);
        setLoadingPhotos(false);
      });
    }
  }, [activeTab, pendingPhotos.length]);

  // Handle status change
  const handleStatusChange = async (songId: string, status: SongStatus, notes?: string) => {
    setProcessingStatus(songId);
    const success = await setSongStatus(songId, status, notes);
    if (success) {
      setAllSongs(allSongs.map(s => 
        s.id === songId ? { ...s, status, adminNotes: notes || s.adminNotes } : s
      ));
      setEditNotesFor(null);
      setAdminNotes('');
      onRefreshSongs?.();
    }
    setProcessingStatus(null);
  };

  const refreshAllSongs = async () => {
    setLoadingAllSongs(true);
    const songs = await fetchAllSongsAdmin();
    setAllSongs(songs);
    setLoadingAllSongs(false);
  };

  const handleApprovePhoto = async (photoId: string) => {
    setProcessingPhoto(photoId);
    if (await approvePhoto(photoId)) {
      setPendingPhotos(pendingPhotos.filter(p => p.id !== photoId));
    }
    setProcessingPhoto(null);
  };

  const handleRejectPhoto = async (photoId: string) => {
    setProcessingPhoto(photoId);
    if (await rejectPhoto(photoId)) {
      setPendingPhotos(pendingPhotos.filter(p => p.id !== photoId));
    }
    setProcessingPhoto(null);
  };

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

  // Open provider editor for a song
  const openProviderEditor = (song: SongLocation) => {
    setEditingSong(song);
    // Populate inputs with existing links
    const spotifyId = song.spotifyUri?.replace('spotify:track:', '') ||
                      song.providerLinks?.spotify?.replace('spotify:track:', '') || '';
    setProviderInputs({
      spotify: spotifyId ? `spotify:track:${spotifyId}` : '',
      youtube: song.providerLinks?.youtube || '',
      apple_music: song.providerLinks?.appleMusic || '',
      soundcloud: song.providerLinks?.soundcloud || ''
    });
    // Validate existing inputs
    setProviderValidation({
      spotify: spotifyId ? 'valid' : 'empty',
      youtube: song.providerLinks?.youtube ? 'valid' : 'empty',
      apple_music: song.providerLinks?.appleMusic ? 'valid' : 'empty',
      soundcloud: song.providerLinks?.soundcloud ? 'valid' : 'empty'
    });
    setShowProviderEditor(true);
  };

  // Handle provider input change with validation
  const handleProviderInputChange = (provider: MusicProvider, value: string) => {
    setProviderInputs(prev => ({ ...prev, [provider]: value }));

    if (!value.trim()) {
      setProviderValidation(prev => ({ ...prev, [provider]: 'empty' }));
      return;
    }

    // Validate by trying to extract ID
    const detected = detectProvider(value);
    if (detected === provider) {
      const extracted = extractProviderId(value);
      if (extracted) {
        setProviderValidation(prev => ({ ...prev, [provider]: 'valid' }));
        return;
      }
    }

    setProviderValidation(prev => ({ ...prev, [provider]: 'invalid' }));
  };

  // Save provider links
  const saveProviderLinks = async () => {
    if (!editingSong) return;

    setIsUpdating(editingSong.id);

    // Build provider links from inputs
    const providerLinks: ProviderLinks = {};

    // Extract IDs from validated inputs
    if (providerValidation.spotify === 'valid' && providerInputs.spotify) {
      const extracted = extractProviderId(providerInputs.spotify);
      if (extracted) providerLinks.spotify = extracted.id;
    }
    if (providerValidation.youtube === 'valid' && providerInputs.youtube) {
      const extracted = extractProviderId(providerInputs.youtube);
      if (extracted) providerLinks.youtube = extracted.id;
    }
    if (providerValidation.apple_music === 'valid' && providerInputs.apple_music) {
      const extracted = extractProviderId(providerInputs.apple_music);
      if (extracted) providerLinks.appleMusic = extracted.id;
    }
    if (providerValidation.soundcloud === 'valid' && providerInputs.soundcloud) {
      const extracted = extractProviderId(providerInputs.soundcloud);
      if (extracted) providerLinks.soundcloud = extracted.id;
    }

    // Build spotifyUri for backwards compatibility
    const spotifyUri = providerLinks.spotify ? `spotify:track:${providerLinks.spotify}` : editingSong.spotifyUri;

    onUpdateSong(editingSong.id, {
      spotifyUri,
      providerLinks: Object.keys(providerLinks).length > 0 ? providerLinks : undefined
    });

    setShowProviderEditor(false);
    setEditingSong(null);
    setIsUpdating(null);
  };

  // Count songs with any provider link
  const linkedCount = songs.filter(s => s.spotifyUri || s.providerLinks?.youtube || s.providerLinks?.appleMusic || s.providerLinks?.soundcloud).length;

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
              Manage songs and approve photos
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

        {/* Tabs */}
        <div style={{
          display: 'flex',
          gap: '4px',
          padding: '16px 24px',
          borderBottom: '1px solid var(--color-dark-lighter)'
        }}>
          <button
            onClick={() => setActiveTab('songs')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              background: activeTab === 'songs' ? 'var(--color-dark-lighter)' : 'transparent',
              border: 'none',
              borderRadius: '8px',
              color: activeTab === 'songs' ? 'white' : 'var(--color-text-muted)',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            <Music size={16} />
            Songs
          </button>
          <button
            onClick={() => setActiveTab('review')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              background: activeTab === 'review' ? 'var(--color-dark-lighter)' : 'transparent',
              border: 'none',
              borderRadius: '8px',
              color: activeTab === 'review' ? 'white' : 'var(--color-text-muted)',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              position: 'relative'
            }}
          >
            <Eye size={16} />
            Review
            {allSongs.filter(s => s.status !== 'live').length > 0 && (
              <span style={{
                background: '#f59e0b',
                color: 'var(--color-dark)',
                fontSize: '11px',
                fontWeight: 700,
                padding: '2px 6px',
                borderRadius: '10px',
                marginLeft: '4px'
              }}>
                {allSongs.filter(s => s.status !== 'live').length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('photos')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              background: activeTab === 'photos' ? 'var(--color-dark-lighter)' : 'transparent',
              border: 'none',
              borderRadius: '8px',
              color: activeTab === 'photos' ? 'white' : 'var(--color-text-muted)',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              position: 'relative'
            }}
          >
            <Camera size={16} />
            Photos
            {pendingPhotos.length > 0 && (
              <span style={{
                background: 'var(--color-accent)',
                color: 'var(--color-dark)',
                fontSize: '11px',
                fontWeight: 700,
                padding: '2px 6px',
                borderRadius: '10px',
                marginLeft: '4px'
              }}>
                {pendingPhotos.length}
              </span>
            )}
          </button>
        </div>

        {/* Search - only for songs tab */}
        {activeTab === 'songs' && (
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
        )}

        {/* Songs list */}
        {activeTab === 'songs' && (
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
                      <>
                        <button
                          onClick={() => openProviderEditor(song)}
                          title="Edit music links"
                          style={{
                            padding: '10px',
                            background: 'none',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            color: 'var(--color-primary)'
                          }}
                        >
                          <Link2 size={18} />
                        </button>
                        <button
                          onClick={() => {
                            setEditingSong(song);
                            setShowSpotifySearch(true);
                          }}
                          title="Search Spotify"
                          style={{
                            padding: '10px',
                            background: 'none',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            color: '#1DB954'
                          }}
                        >
                          <Search size={18} />
                        </button>
                      </>
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
        )}

        {/* Review tab */}
        {activeTab === 'review' && (
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px 24px'
        }}>
          {/* Refresh button */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
            <button
              onClick={refreshAllSongs}
              disabled={loadingAllSongs}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                background: 'var(--color-dark-lighter)',
                border: 'none',
                borderRadius: '8px',
                color: 'var(--color-text-muted)',
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              <RefreshCw size={14} className={loadingAllSongs ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>

          {loadingAllSongs ? (
            <div style={{ textAlign: 'center', padding: '48px 0' }}>
              <Loader size={24} className="animate-spin" style={{ color: 'var(--color-text-muted)' }} />
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {allSongs.map(song => {
                const statusColor = song.status === 'live' ? '#10b981' : 
                                   song.status === 'needs_edit' ? '#f59e0b' : '#ef4444';
                const statusLabel = song.status === 'live' ? 'Live' : 
                                   song.status === 'needs_edit' ? 'Needs Edit' : 'Removed';
                
                return (
                  <div 
                    key={song.id}
                    style={{
                      padding: '16px',
                      background: 'var(--color-dark-lighter)',
                      borderRadius: '12px',
                      borderLeft: `4px solid ${statusColor}`
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
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <h3 style={{ fontWeight: 500, fontSize: '15px', margin: 0 }}>
                            {song.title}
                          </h3>
                          <span style={{
                            fontSize: '11px',
                            fontWeight: 600,
                            padding: '2px 8px',
                            borderRadius: '4px',
                            background: `${statusColor}30`,
                            color: statusColor
                          }}>
                            {statusLabel}
                          </span>
                        </div>
                        <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', margin: '2px 0' }}>
                          {song.artist}
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <MapPin size={12} />
                            {song.locationName}
                          </span>
                          {song.submittedBy && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <User size={12} />
                              {song.submittedBy}
                            </span>
                          )}
                        </div>
                        
                        {/* Admin notes display */}
                        {song.adminNotes && (
                          <div style={{
                            marginTop: '8px',
                            padding: '8px 12px',
                            background: 'rgba(245, 158, 11, 0.1)',
                            borderRadius: '6px',
                            fontSize: '13px',
                            color: '#f59e0b'
                          }}>
                            <strong>Note:</strong> {song.adminNotes}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flexShrink: 0 }}>
                        {processingStatus === song.id ? (
                          <Loader size={20} className="animate-spin" style={{ color: 'var(--color-text-muted)' }} />
                        ) : (
                          <>
                            {song.status !== 'live' && (
                              <button
                                onClick={() => handleStatusChange(song.id, 'live')}
                                title="Make Live"
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  padding: '6px 12px',
                                  background: 'rgba(16, 185, 129, 0.2)',
                                  color: '#10b981',
                                  border: 'none',
                                  borderRadius: '6px',
                                  fontSize: '12px',
                                  fontWeight: 500,
                                  cursor: 'pointer'
                                }}
                              >
                                <Eye size={14} />
                                Make Live
                              </button>
                            )}
                            <button
                              onClick={() => {
                                setEditNotesFor(song.id);
                                setAdminNotes(song.adminNotes || '');
                              }}
                              title="Request Edit"
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '6px 12px',
                                background: 'rgba(245, 158, 11, 0.2)',
                                color: '#f59e0b',
                                border: 'none',
                                borderRadius: '6px',
                                fontSize: '12px',
                                fontWeight: 500,
                                cursor: 'pointer'
                              }}
                            >
                              <MessageSquare size={14} />
                              Request Edit
                            </button>
                            {song.status !== 'removed' && (
                              <button
                                onClick={() => handleStatusChange(song.id, 'removed')}
                                title="Remove"
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  padding: '6px 12px',
                                  background: 'rgba(239, 68, 68, 0.2)',
                                  color: '#f87171',
                                  border: 'none',
                                  borderRadius: '6px',
                                  fontSize: '12px',
                                  fontWeight: 500,
                                  cursor: 'pointer'
                                }}
                              >
                                <EyeOff size={14} />
                                Remove
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    {/* Edit notes input */}
                    {editNotesFor === song.id && (
                      <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                        <input
                          type="text"
                          value={adminNotes}
                          onChange={(e) => setAdminNotes(e.target.value)}
                          placeholder="Add notes for the user (e.g., 'Please fix the location')"
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
                          onClick={() => handleStatusChange(song.id, 'needs_edit', adminNotes)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '10px 16px',
                            background: '#f59e0b',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '14px',
                            fontWeight: 500,
                            cursor: 'pointer'
                          }}
                        >
                          <Send size={14} />
                          Send
                        </button>
                        <button
                          onClick={() => {
                            setEditNotesFor(null);
                            setAdminNotes('');
                          }}
                          style={{
                            padding: '10px',
                            background: 'none',
                            border: 'none',
                            borderRadius: '8px',
                            color: 'var(--color-text-muted)',
                            cursor: 'pointer'
                          }}
                        >
                          <X size={18} />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}

              {allSongs.length === 0 && (
                <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--color-text-muted)' }}>
                  No songs to review.
                </div>
              )}
            </div>
          )}
        </div>
        )}

        {/* Photos list */}
        {activeTab === 'photos' && (
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px 24px'
        }}>
          {loadingPhotos ? (
            <div style={{ textAlign: 'center', padding: '48px 0' }}>
              <Loader size={24} className="animate-spin" style={{ color: 'var(--color-text-muted)' }} />
            </div>
          ) : pendingPhotos.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--color-text-muted)' }}>
              <ImageIcon size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
              <p>No photos pending approval</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {pendingPhotos.map(photo => (
                <div 
                  key={photo.id}
                  style={{
                    display: 'flex',
                    gap: '16px',
                    padding: '16px',
                    background: 'var(--color-dark-lighter)',
                    borderRadius: '12px'
                  }}
                >
                  {/* Photo preview */}
                  <div style={{
                    width: '120px',
                    height: '120px',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    flexShrink: 0,
                    background: 'var(--color-dark-card)'
                  }}>
                    <img 
                      src={photo.photoUrl}
                      alt="Pending photo"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>

                  {/* Photo info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 600, margin: '0 0 4px 0' }}>
                      Photo by {photo.userDisplayName || 'Unknown'}
                    </p>
                    {photo.caption && (
                      <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', margin: '0 0 8px 0' }}>
                        "{photo.caption}"
                      </p>
                    )}
                    <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', margin: 0 }}>
                      Submitted {photo.createdAt.toLocaleDateString()}
                    </p>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flexShrink: 0 }}>
                    {processingPhoto === photo.id ? (
                      <Loader size={20} className="animate-spin" style={{ color: 'var(--color-text-muted)' }} />
                    ) : (
                      <>
                        <button
                          onClick={() => handleApprovePhoto(photo.id)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '8px 16px',
                            background: 'rgba(16, 185, 129, 0.2)',
                            color: 'var(--color-primary)',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '13px',
                            fontWeight: 500,
                            cursor: 'pointer'
                          }}
                        >
                          <Check size={16} />
                          Approve
                        </button>
                        <button
                          onClick={() => handleRejectPhoto(photo.id)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '8px 16px',
                            background: 'rgba(239, 68, 68, 0.2)',
                            color: '#f87171',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '13px',
                            fontWeight: 500,
                            cursor: 'pointer'
                          }}
                        >
                          <XCircle size={16} />
                          Reject
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        )}

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
          <span style={{ whiteSpace: 'nowrap' }}>{linkedCount} with music links</span>
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

      {/* Provider Links Editor Modal */}
      {showProviderEditor && editingSong && (
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
          zIndex: 10000
        }}>
          {/* Backdrop */}
          <div
            onClick={() => {
              setShowProviderEditor(false);
              setEditingSong(null);
            }}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.8)'
            }}
          />

          {/* Modal */}
          <div
            onClick={e => e.stopPropagation()}
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '500px',
              background: 'var(--color-dark-card)',
              borderRadius: '16px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
              overflow: 'hidden'
            }}
          >
            {/* Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '20px 24px',
              borderBottom: '1px solid var(--color-dark-lighter)'
            }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>
                  Edit Music Links
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', margin: '4px 0 0 0' }}>
                  {editingSong.title} - {editingSong.artist}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowProviderEditor(false);
                  setEditingSong(null);
                }}
                style={{
                  padding: '8px',
                  background: 'none',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  color: 'var(--color-text-muted)'
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Provider inputs */}
            <div style={{ padding: '20px 24px' }}>
              {(Object.keys(PROVIDER_CONFIG) as MusicProvider[]).map(provider => {
                const config = PROVIDER_CONFIG[provider];
                const validation = providerValidation[provider];
                const hasInput = providerInputs[provider].trim() !== '';

                return (
                  <div key={provider} style={{ marginBottom: '16px' }}>
                    <label style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '13px',
                      fontWeight: 500,
                      color: 'var(--color-text)',
                      marginBottom: '6px'
                    }}>
                      <span style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: config.color
                      }} />
                      {config.name}
                      {validation === 'valid' && (
                        <Check size={14} style={{ color: config.color, marginLeft: 'auto' }} />
                      )}
                      {validation === 'invalid' && hasInput && (
                        <AlertCircle size={14} style={{ color: '#ef4444', marginLeft: 'auto' }} />
                      )}
                    </label>
                    <input
                      type="text"
                      value={providerInputs[provider]}
                      onChange={(e) => handleProviderInputChange(provider, e.target.value)}
                      placeholder={config.placeholder}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        background: 'var(--color-dark-lighter)',
                        border: `1px solid ${
                          validation === 'valid' ? config.color :
                          validation === 'invalid' && hasInput ? '#ef4444' :
                          'transparent'
                        }`,
                        borderRadius: '8px',
                        color: 'var(--color-text)',
                        fontSize: '14px',
                        outline: 'none'
                      }}
                    />
                    {validation === 'invalid' && hasInput && (
                      <p style={{ fontSize: '11px', color: '#ef4444', marginTop: '4px' }}>
                        Invalid {config.name} URL or ID
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div style={{
              display: 'flex',
              gap: '12px',
              padding: '16px 24px',
              borderTop: '1px solid var(--color-dark-lighter)'
            }}>
              <button
                onClick={() => {
                  setShowProviderEditor(false);
                  setEditingSong(null);
                }}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: 'var(--color-dark-lighter)',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'var(--color-text)',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={saveProviderLinks}
                disabled={isUpdating === editingSong.id}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: 'var(--color-primary)',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                {isUpdating === editingSong.id ? (
                  <Loader size={16} className="animate-spin" />
                ) : (
                  <>
                    <Check size={16} />
                    Save Links
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
