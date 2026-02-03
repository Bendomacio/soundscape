import { useState, useCallback, useRef, useEffect } from 'react';
import { X, Music, MapPin, Search, Loader2, Check, AlertCircle } from 'lucide-react';
import { searchTracks } from '../lib/spotify';
import type { SpotifyTrack } from '../lib/spotify';
import { LocationPicker } from './LocationPicker';
import { detectProvider, getTrackInfoFromUrl } from '../lib/providers';
import type { MusicProvider, ProviderLinks } from '../types';

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
    providerLinks?: ProviderLinks;
  }) => void;
  userLocation: { latitude: number; longitude: number } | null;
}

// Provider display config
const PROVIDER_DISPLAY: Record<MusicProvider, { name: string; color: string }> = {
  spotify: { name: 'Spotify', color: '#1DB954' },
  youtube: { name: 'YouTube', color: '#FF0000' },
  apple_music: { name: 'Apple Music', color: '#FC3C44' },
  soundcloud: { name: 'SoundCloud', color: '#FF5500' }
};

export function SubmitSongModal({ onClose, onSubmit, userLocation }: SubmitSongModalProps) {
  const [step, setStep] = useState(1);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchSuccess, setSearchSuccess] = useState(false);
  const [detectedProvider, setDetectedProvider] = useState<MusicProvider | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    artist: '',
    albumArt: '',
    providerLinks: {} as ProviderLinks,
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

  const handleProviderUrlFetch = async (url: string) => {
    setSearchError(null);
    setSearchSuccess(false);
    setDetectedProvider(null);

    // Detect provider from URL
    const provider = detectProvider(url);
    if (!provider) {
      // Not a recognized provider URL - might be a search query
      return false;
    }

    setDetectedProvider(provider);
    setIsSearching(true);

    try {
      const result = await getTrackInfoFromUrl(url);

      if (result) {
        // Update provider links
        const newProviderLinks = { ...formData.providerLinks };
        if (result.provider === 'spotify') {
          newProviderLinks.spotify = result.id;
        } else if (result.provider === 'youtube') {
          newProviderLinks.youtube = result.id;
        } else if (result.provider === 'apple_music') {
          newProviderLinks.appleMusic = result.id;
        } else if (result.provider === 'soundcloud') {
          newProviderLinks.soundcloud = result.id;
        }

        setFormData(prev => ({
          ...prev,
          title: result.info.title || prev.title,
          artist: result.info.artist || prev.artist,
          albumArt: result.info.albumArt || prev.albumArt,
          providerLinks: newProviderLinks
        }));
        setSearchSuccess(true);
        return true;
      } else {
        setSearchError(`Could not fetch track info from ${PROVIDER_DISPLAY[provider].name}. Check the URL and try again.`);
        return true; // Still consumed the input (was a URL)
      }
    } catch {
      setSearchError(`Failed to connect to ${PROVIDER_DISPLAY[provider].name}`);
      return true;
    } finally {
      setIsSearching(false);
    }
  };

  // Handle search input - auto-detect URL vs search query
  const handleSearchInput = useCallback(async (input: string) => {
    setSearchQuery(input);
    setSearchError(null);

    // Clear previous debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Check if it's a provider URL
    const provider = detectProvider(input);
    if (provider) {
      setSearchResults([]);
      setShowResults(false);
      handleProviderUrlFetch(input);
      return;
    }

    // Reset detected provider when not a URL
    setDetectedProvider(null);

    // Reset if empty
    if (!input.trim()) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    // Otherwise, search Spotify by name (debounced)
    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await searchTracks(input, 6);
        setSearchResults(results);
        setShowResults(results.length > 0);
      } catch (error) {
        console.error('Search error:', error);
        setSearchError('Search failed. Try pasting a music URL instead.');
      } finally {
        setIsSearching(false);
      }
    }, 300);
  }, [formData.providerLinks]);

  // Handle selecting a track from search results
  const handleSelectTrack = useCallback((track: SpotifyTrack) => {
    const albumArt = track.album.images[0]?.url || '';
    const artistNames = track.artists.map(a => a.name).join(', ');

    setFormData(prev => ({
      ...prev,
      title: track.name,
      artist: artistNames,
      albumArt: albumArt,
      providerLinks: {
        ...prev.providerLinks,
        spotify: track.id
      }
    }));

    setSearchQuery(`${track.name} - ${artistNames}`);
    setSearchResults([]);
    setShowResults(false);
    setSearchSuccess(true);
    setDetectedProvider('spotify');
  }, []);

  // Clear selection
  const handleClearSelection = useCallback(() => {
    setSearchQuery('');
    setSearchResults([]);
    setShowResults(false);
    setSearchSuccess(false);
    setDetectedProvider(null);
    setFormData(prev => ({
      ...prev,
      title: '',
      artist: '',
      albumArt: '',
      providerLinks: {}
    }));
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Build spotifyUrl for backwards compatibility
    const spotifyId = formData.providerLinks.spotify;
    const spotifyUrl = spotifyId ? `spotify:track:${spotifyId.replace('spotify:track:', '')}` : undefined;

    onSubmit({
      title: formData.title,
      artist: formData.artist,
      locationName: formData.locationName,
      latitude: formData.latitude,
      longitude: formData.longitude,
      locationDescription: formData.locationDescription,
      spotifyUrl,
      albumArt: formData.albumArt || undefined,
      providerLinks: Object.keys(formData.providerLinks).length > 0 ? formData.providerLinks : undefined
    });
    onClose();
  };

  // Get the border color based on detected provider
  const getBorderColor = () => {
    if (searchError) return '#ef4444';
    if (searchSuccess && detectedProvider) {
      return PROVIDER_DISPLAY[detectedProvider].color;
    }
    return undefined;
  };

  // Get the status icon color
  const getStatusColor = () => {
    if (searchSuccess && detectedProvider) {
      return PROVIDER_DISPLAY[detectedProvider].color;
    }
    return '#1DB954'; // Default to Spotify green for search
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
              {/* Music search input - multi-provider */}
              <div className="form-group" ref={searchRef} style={{ position: 'relative' }}>
                <label className="label" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>
                  <Search size={14} />
                  Search or Paste URL
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleSearchInput(e.target.value)}
                    onFocus={() => searchResults.length > 0 && setShowResults(true)}
                    placeholder="Search by name or paste Spotify, YouTube, Apple Music, or SoundCloud URL..."
                    className="input"
                    style={{
                      paddingRight: '44px',
                      borderColor: getBorderColor()
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
                    {isSearching && <Loader2 size={18} className="animate-spin" style={{ color: getStatusColor() }} />}
                    {searchSuccess && !isSearching && <Check size={18} style={{ color: getStatusColor() }} />}
                    {searchError && !isSearching && <AlertCircle size={18} style={{ color: '#ef4444' }} />}
                  </div>
                </div>
                {searchError && (
                  <p style={{ fontSize: 'var(--text-xs)', color: '#ef4444', marginTop: 'var(--space-xs)' }}>
                    {searchError}
                  </p>
                )}
                {detectedProvider && searchSuccess && (
                  <p style={{ fontSize: 'var(--text-xs)', color: PROVIDER_DISPLAY[detectedProvider].color, marginTop: 'var(--space-xs)' }}>
                    {PROVIDER_DISPLAY[detectedProvider].name} link detected
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
              {searchSuccess && formData.albumArt && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-md)',
                  padding: 'var(--space-md)',
                  background: 'var(--color-dark-lighter)',
                  borderRadius: 'var(--radius-lg)',
                  marginBottom: 'var(--space-md)',
                  border: `1px solid ${detectedProvider ? PROVIDER_DISPLAY[detectedProvider].color : '#1DB954'}`
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
                    {detectedProvider && (
                      <p style={{
                        fontSize: 'var(--text-xs)',
                        color: PROVIDER_DISPLAY[detectedProvider].color,
                        marginTop: '4px'
                      }}>
                        via {PROVIDER_DISPLAY[detectedProvider].name}
                      </p>
                    )}
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
