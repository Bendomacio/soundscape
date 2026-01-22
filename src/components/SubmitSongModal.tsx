import { useState, useCallback, useRef, useEffect } from 'react';
import { X, Music, MapPin, Search, Loader2, Check, AlertCircle } from 'lucide-react';
import { getTrackInfo, searchTracks } from '../lib/spotify';
import type { SpotifyTrack } from '../lib/spotify';
import { LocationPicker } from './LocationPicker';

interface SubmitSongModalProps {
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    artist: string;
    locationName: string;
    latitude: number;
    longitude: number;
    locationDescription: string;
    spotifyUrl?: string;
    albumArt?: string;
  }) => void;
  userLocation: { latitude: number; longitude: number } | null;
}

// Extract track ID from various Spotify URL formats
function extractSpotifyTrackId(input: string): string | null {
  // Handle spotify:track:xxx format
  if (input.startsWith('spotify:track:')) {
    return input.replace('spotify:track:', '');
  }
  
  // Handle https://open.spotify.com/track/xxx format
  const urlMatch = input.match(/open\.spotify\.com\/track\/([a-zA-Z0-9]+)/);
  if (urlMatch) {
    return urlMatch[1];
  }
  
  // Handle just the track ID (22 character alphanumeric)
  if (/^[a-zA-Z0-9]{22}$/.test(input.trim())) {
    return input.trim();
  }
  
  return null;
}

// Check if input looks like a Spotify URL
function isSpotifyUrl(input: string): boolean {
  return input.includes('spotify.com/track/') || input.startsWith('spotify:track:');
}

export function SubmitSongModal({ onClose, onSubmit, userLocation }: SubmitSongModalProps) {
  const [step, setStep] = useState(1);
  const [isSearching, setIsSearching] = useState(false);
  const [spotifyError, setSpotifyError] = useState<string | null>(null);
  const [spotifySuccess, setSpotifySuccess] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    artist: '',
    spotifyUrl: '',
    spotifyTrackId: '',
    albumArt: '',
    locationName: '',
    latitude: userLocation?.latitude || 51.5074,
    longitude: userLocation?.longitude || -0.1278,
    locationDescription: ''
  });

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SpotifyTrack[]>([]);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSpotifyFetch = async (url: string) => {
    setSpotifyError(null);
    setSpotifySuccess(false);
    
    const trackId = extractSpotifyTrackId(url);
    if (!trackId) {
      setSpotifyError('Invalid Spotify URL or track ID');
      return;
    }
    
    setIsSearching(true);
    
    try {
      const trackInfo = await getTrackInfo(trackId);
      
      if (trackInfo) {
        setFormData(prev => ({
          ...prev,
          title: trackInfo.title,
          artist: trackInfo.artist,
          albumArt: trackInfo.albumArt,
          spotifyTrackId: trackId
        }));
        setSpotifySuccess(true);
      } else {
        setSpotifyError('Could not fetch track info. Check the URL and try again.');
      }
    } catch {
      setSpotifyError('Failed to connect to Spotify');
    } finally {
      setIsSearching(false);
    }
  };

  // Handle search input - auto-detect URL vs search query
  const handleSearchInput = useCallback((input: string) => {
    setSearchQuery(input);
    setSpotifyError(null);
    
    // Clear previous debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // If it looks like a Spotify URL, fetch track info directly
    if (isSpotifyUrl(input)) {
      setSearchResults([]);
      setShowResults(false);
      handleSpotifyFetch(input);
      return;
    }

    // Reset if empty
    if (!input.trim()) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    // Otherwise, search by name (debounced)
    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await searchTracks(input, 6);
        setSearchResults(results);
        setShowResults(results.length > 0);
      } catch (error) {
        console.error('Search error:', error);
        setSpotifyError('Search failed. Try pasting a Spotify URL instead.');
      } finally {
        setIsSearching(false);
      }
    }, 300);
  }, []);

  // Handle selecting a track from search results
  const handleSelectTrack = useCallback((track: SpotifyTrack) => {
    const albumArt = track.album.images[0]?.url || '';
    const artistNames = track.artists.map(a => a.name).join(', ');
    
    setFormData(prev => ({
      ...prev,
      title: track.name,
      artist: artistNames,
      albumArt: albumArt,
      spotifyTrackId: track.id
    }));
    
    setSearchQuery(`${track.name} - ${artistNames}`);
    setSearchResults([]);
    setShowResults(false);
    setSpotifySuccess(true);
  }, []);

  // Clear selection
  const handleClearSelection = useCallback(() => {
    setSearchQuery('');
    setSearchResults([]);
    setShowResults(false);
    setSpotifySuccess(false);
    setFormData(prev => ({
      ...prev,
      title: '',
      artist: '',
      albumArt: '',
      spotifyTrackId: ''
    }));
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      title: formData.title,
      artist: formData.artist,
      locationName: formData.locationName,
      latitude: formData.latitude,
      longitude: formData.longitude,
      locationDescription: formData.locationDescription,
      spotifyUrl: formData.spotifyTrackId ? `spotify:track:${formData.spotifyTrackId}` : undefined,
      albumArt: formData.albumArt || undefined
    });
    onClose();
  };

  return (
    <div className="modal">
      {/* Backdrop */}
      <div className="modal-backdrop" onClick={onClose} />
      
      {/* Modal */}
      <div className="modal-content" style={{ maxWidth: '480px' }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
            <div style={{ 
              width: '44px', 
              height: '44px', 
              borderRadius: 'var(--radius-lg)',
              background: 'linear-gradient(135deg, var(--color-accent), var(--color-accent-secondary))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Music size={22} color="var(--color-dark)" />
            </div>
            <div>
              <h2 className="modal-title" style={{ fontSize: 'var(--text-lg)' }}>Submit a Song</h2>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                Share a song connected to a place
              </p>
            </div>
          </div>
          <button onClick={onClose} className="modal-close" aria-label="Close">
            <X size={20} />
          </button>
        </div>

        {/* Steps indicator */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 'var(--space-sm)',
          padding: 'var(--space-md) var(--space-xl)',
          background: 'var(--color-dark-lighter)',
          borderBottom: '1px solid var(--color-dark-card)'
        }}>
          {[1, 2].map(s => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: 'var(--radius-full)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 'var(--text-sm)',
                fontWeight: 'var(--font-medium)',
                background: step >= s ? 'var(--color-primary)' : 'var(--color-dark-card)',
                color: step >= s ? 'white' : 'var(--color-text-muted)',
                transition: 'all var(--transition-fast)'
              }}>
                {s}
              </div>
              <span style={{ 
                fontSize: 'var(--text-sm)', 
                color: step >= s ? 'var(--color-text)' : 'var(--color-text-muted)' 
              }}>
                {s === 1 ? 'Song' : 'Location'}
              </span>
              {s < 2 && (
                <div style={{ 
                  width: '40px', 
                  height: '2px', 
                  marginLeft: 'var(--space-sm)',
                  marginRight: 'var(--space-sm)',
                  background: step > s ? 'var(--color-primary)' : 'var(--color-dark-card)',
                  borderRadius: '1px',
                  transition: 'all var(--transition-fast)'
                }} />
              )}
            </div>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="modal-body">
          {step === 1 ? (
            <>
              {/* Spotify search input */}
              <div className="form-group" ref={searchRef} style={{ position: 'relative' }}>
                <label className="label" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>
                  <Search size={14} />
                  Search Spotify
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleSearchInput(e.target.value)}
                    onFocus={() => searchResults.length > 0 && setShowResults(true)}
                    placeholder="Search by song name or paste Spotify URL..."
                    className="input"
                    style={{ 
                      paddingRight: '44px',
                      borderColor: spotifySuccess ? '#1DB954' : spotifyError ? '#ef4444' : undefined
                    }}
                  />
                  <div style={{ 
                    position: 'absolute', 
                    right: '12px', 
                    top: '50%', 
                    transform: 'translateY(-50%)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-xs)'
                  }}>
                    {isSearching && <Loader2 size={18} className="animate-spin" style={{ color: '#1DB954' }} />}
                    {spotifySuccess && !isSearching && <Check size={18} style={{ color: '#1DB954' }} />}
                    {spotifyError && !isSearching && <AlertCircle size={18} style={{ color: '#ef4444' }} />}
                  </div>
                </div>
                {spotifyError && (
                  <p style={{ fontSize: 'var(--text-xs)', color: '#ef4444', marginTop: 'var(--space-xs)' }}>
                    {spotifyError}
                  </p>
                )}

                {/* Search results dropdown */}
                {showResults && searchResults.length > 0 && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    marginTop: '4px',
                    background: 'var(--color-dark-card)',
                    border: '1px solid var(--color-dark-lighter)',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
                    zIndex: 20,
                    maxHeight: '280px',
                    overflowY: 'auto'
                  }}>
                    {searchResults.map((track) => (
                      <button
                        key={track.id}
                        type="button"
                        onClick={() => handleSelectTrack(track)}
                        style={{
                          width: '100%',
                          padding: 'var(--space-sm) var(--space-md)',
                          background: 'none',
                          border: 'none',
                          borderBottom: '1px solid var(--color-dark-lighter)',
                          color: 'var(--color-text)',
                          fontSize: 'var(--text-sm)',
                          textAlign: 'left',
                          cursor: 'pointer',
                          transition: 'background var(--transition-fast)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 'var(--space-sm)'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'var(--color-dark-lighter)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'none';
                        }}
                      >
                        <img 
                          src={track.album.images[track.album.images.length - 1]?.url || track.album.images[0]?.url} 
                          alt=""
                          style={{ 
                            width: '40px', 
                            height: '40px', 
                            borderRadius: 'var(--radius-sm)',
                            objectFit: 'cover',
                            flexShrink: 0
                          }}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ 
                            fontWeight: 'var(--font-medium)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}>
                            {track.name}
                          </p>
                          <p style={{ 
                            fontSize: 'var(--text-xs)', 
                            color: 'var(--color-text-muted)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}>
                            {track.artists.map(a => a.name).join(', ')}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Selected track preview */}
              {spotifySuccess && formData.albumArt && (
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 'var(--space-md)',
                  padding: 'var(--space-md)',
                  background: 'var(--color-dark-lighter)',
                  borderRadius: 'var(--radius-lg)',
                  marginBottom: 'var(--space-md)',
                  border: '1px solid #1DB954'
                }}>
                  <img 
                    src={formData.albumArt} 
                    alt="Album art"
                    style={{ 
                      width: '64px', 
                      height: '64px', 
                      borderRadius: 'var(--radius-md)',
                      objectFit: 'cover'
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ 
                      fontWeight: 'var(--font-semibold)', 
                      color: 'var(--color-text)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {formData.title}
                    </p>
                    <p style={{ 
                      fontSize: 'var(--text-sm)', 
                      color: 'var(--color-text-muted)',
                      marginTop: '2px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {formData.artist}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleClearSelection}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: '4px',
                      cursor: 'pointer',
                      color: 'var(--color-text-muted)',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                    title="Clear selection"
                  >
                    <X size={18} />
                  </button>
                </div>
              )}

              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 'var(--space-lg)',
                margin: 'var(--space-lg) 0'
              }}>
                <div style={{ flex: 1, height: '1px', background: 'var(--color-dark-lighter)' }} />
                <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>or enter manually</span>
                <div style={{ flex: 1, height: '1px', background: 'var(--color-dark-lighter)' }} />
              </div>

              {/* Song title */}
              <div className="form-group">
                <label className="label">Song Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Baker Street"
                  required
                  className="input"
                />
              </div>

              {/* Artist */}
              <div className="form-group">
                <label className="label">Artist *</label>
                <input
                  type="text"
                  value={formData.artist}
                  onChange={(e) => setFormData({ ...formData, artist: e.target.value })}
                  placeholder="e.g., Gerry Rafferty"
                  required
                  className="input"
                />
              </div>

              <button
                type="button"
                onClick={() => setStep(2)}
                disabled={!formData.title || !formData.artist}
                className="btn btn-primary"
                style={{ width: '100%', marginTop: 'var(--space-lg)' }}
              >
                Next: Add Location
              </button>
            </>
          ) : (
            <>
              {/* Location name */}
              <div className="form-group">
                <label className="label" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>
                  <MapPin size={14} />
                  Location Name *
                </label>
                <input
                  type="text"
                  value={formData.locationName}
                  onChange={(e) => setFormData({ ...formData, locationName: e.target.value })}
                  placeholder="e.g., Baker Street Station"
                  required
                  className="input"
                />
              </div>

              {/* Map Picker */}
              <div className="form-group">
                <label className="label" style={{ marginBottom: 'var(--space-sm)' }}>
                  Select Location on Map *
                </label>
                <LocationPicker
                  latitude={formData.latitude}
                  longitude={formData.longitude}
                  onChange={(lat, lng) => setFormData(prev => ({ 
                    ...prev, 
                    latitude: lat, 
                    longitude: lng 
                  }))}
                />
              </div>

              {/* Description */}
              <div className="form-group">
                <label className="label">Why is this song connected to this place?</label>
                <textarea
                  value={formData.locationDescription}
                  onChange={(e) => setFormData({ ...formData, locationDescription: e.target.value })}
                  placeholder="Tell us the story..."
                  rows={3}
                  className="input"
                  style={{ height: 'auto', padding: 'var(--space-md) var(--space-lg)', resize: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', gap: 'var(--space-md)', marginTop: 'var(--space-lg)' }}>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={!formData.locationName}
                  className="btn"
                  style={{ 
                    flex: 1,
                    background: 'linear-gradient(135deg, var(--color-accent), var(--color-accent-secondary))',
                    color: 'var(--color-dark)'
                  }}
                >
                  Submit Song
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
