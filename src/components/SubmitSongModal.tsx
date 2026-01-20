import { useState, useCallback } from 'react';
import { X, Music, MapPin, Link, Loader2, Check, AlertCircle } from 'lucide-react';
import { getTrackInfo } from '../lib/spotify';
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

  // Auto-fetch when URL is pasted
  const handleSpotifyUrlChange = (url: string) => {
    setFormData(prev => ({ ...prev, spotifyUrl: url }));
    setSpotifySuccess(false);
    setSpotifyError(null);
    
    // Auto-fetch if it looks like a valid Spotify URL
    if (url.includes('spotify.com/track/') || url.startsWith('spotify:track:')) {
      handleSpotifyFetch(url);
    }
  };

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
              {/* Spotify URL input with auto-fetch */}
              <div className="form-group">
                <label className="label" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>
                  <Link size={14} />
                  Spotify URL
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    value={formData.spotifyUrl}
                    onChange={(e) => handleSpotifyUrlChange(e.target.value)}
                    placeholder="Paste Spotify link here..."
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
                    alignItems: 'center'
                  }}>
                    {isSearching && <Loader2 size={18} className="animate-spin" style={{ color: '#1DB954' }} />}
                    {spotifySuccess && <Check size={18} style={{ color: '#1DB954' }} />}
                    {spotifyError && <AlertCircle size={18} style={{ color: '#ef4444' }} />}
                  </div>
                </div>
                {spotifyError && (
                  <p style={{ fontSize: 'var(--text-xs)', color: '#ef4444', marginTop: 'var(--space-xs)' }}>
                    {spotifyError}
                  </p>
                )}
              </div>

              {/* Album art preview when fetched */}
              {formData.albumArt && (
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
                      {formData.title || 'Track loaded'}
                    </p>
                    <p style={{ 
                      fontSize: 'var(--text-sm)', 
                      color: '#f59e0b',
                      marginTop: '2px'
                    }}>
                      ⚠️ Please enter artist below
                    </p>
                  </div>
                  <div style={{
                    background: '#1DB954',
                    color: 'white',
                    padding: '4px 8px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: 'var(--text-xs)',
                    fontWeight: 'var(--font-medium)',
                    whiteSpace: 'nowrap'
                  }}>
                    Linked ✓
                  </div>
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
