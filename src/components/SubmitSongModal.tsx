import { useState } from 'react';
import { X, Music, MapPin, Link, Search, Loader2 } from 'lucide-react';

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
  }) => void;
  userLocation: { latitude: number; longitude: number } | null;
}

export function SubmitSongModal({ onClose, onSubmit, userLocation }: SubmitSongModalProps) {
  const [step, setStep] = useState(1);
  const [isSearching, setIsSearching] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    artist: '',
    spotifyUrl: '',
    locationName: '',
    latitude: userLocation?.latitude || 51.5074,
    longitude: userLocation?.longitude || -0.1278,
    locationDescription: ''
  });

  const handleSpotifySearch = async () => {
    setIsSearching(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSearching(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
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
              {/* Spotify URL search */}
              <div className="form-group">
                <label className="label" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>
                  <Link size={14} />
                  Spotify URL (optional)
                </label>
                <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                  <input
                    type="url"
                    value={formData.spotifyUrl}
                    onChange={(e) => setFormData({ ...formData, spotifyUrl: e.target.value })}
                    placeholder="https://open.spotify.com/track/..."
                    className="input"
                    style={{ flex: 1 }}
                  />
                  <button
                    type="button"
                    onClick={handleSpotifySearch}
                    disabled={!formData.spotifyUrl || isSearching}
                    className="btn"
                    style={{ 
                      background: '#1DB954', 
                      padding: '0 var(--space-lg)',
                      minWidth: '44px'
                    }}
                  >
                    {isSearching ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
                  </button>
                </div>
              </div>

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

              {/* Coordinates */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
                <div className="form-group">
                  <label className="label">Latitude</label>
                  <input
                    type="number"
                    step="any"
                    value={formData.latitude}
                    onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) })}
                    className="input"
                  />
                </div>
                <div className="form-group">
                  <label className="label">Longitude</label>
                  <input
                    type="number"
                    step="any"
                    value={formData.longitude}
                    onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) })}
                    className="input"
                  />
                </div>
              </div>

              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-lg)' }}>
                💡 Tip: Right-click on Google Maps to copy coordinates
              </p>

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
