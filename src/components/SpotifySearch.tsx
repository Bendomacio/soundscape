import { useState, useEffect } from 'react';
import { Search, X, Music, Check, ExternalLink, Loader, Link, AlertCircle } from 'lucide-react';
import { searchTracks, type SpotifyTrack, getEmbedUrl } from '../lib/spotify';

interface SpotifySearchProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (track: SpotifyTrack) => void;
  initialQuery?: string;
}

export function SpotifySearch({ isOpen, onClose, onSelect, initialQuery = '' }: SpotifySearchProps) {
  const [mode, setMode] = useState<'search' | 'url'>('url');
  const [query, setQuery] = useState(initialQuery);
  const [spotifyUrl, setSpotifyUrl] = useState('');
  const [results, setResults] = useState<SpotifyTrack[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<SpotifyTrack | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [urlTrackId, setUrlTrackId] = useState<string | null>(null);

  function extractTrackId(input: string): string | null {
    const cleaned = input.trim();
    if (/^[a-zA-Z0-9]{22}$/.test(cleaned)) return cleaned;
    const uriMatch = cleaned.match(/spotify:track:([a-zA-Z0-9]{22})/);
    if (uriMatch) return uriMatch[1];
    const urlMatch = cleaned.match(/spotify\.com\/(?:embed\/)?track\/([a-zA-Z0-9]{22})/);
    if (urlMatch) return urlMatch[1];
    const iframeMatch = cleaned.match(/embed\/track\/([a-zA-Z0-9]{22})/);
    if (iframeMatch) return iframeMatch[1];
    return null;
  }

  useEffect(() => {
    if (mode !== 'url' || !spotifyUrl.trim()) {
      setUrlTrackId(null);
      setError(null);
      return;
    }
    const trackId = extractTrackId(spotifyUrl);
    if (trackId) {
      setUrlTrackId(trackId);
      setError(null);
      setSelectedTrack({
        id: trackId,
        name: 'Loading...',
        artists: [{ name: 'Verifying...' }],
        album: { name: '', images: [] },
        preview_url: null,
        external_urls: { spotify: `https://open.spotify.com/track/${trackId}` }
      });
    } else if (spotifyUrl.trim()) {
      setUrlTrackId(null);
      setError('Could not extract track ID');
    }
  }, [spotifyUrl, mode]);

  useEffect(() => {
    if (mode !== 'search' || !query.trim()) {
      setResults([]);
      return;
    }
    const timeoutId = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const tracks = await searchTracks(query);
        setResults(tracks);
        if (tracks.length === 0) setError('No results found');
      } catch {
        setError('Search failed');
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [query, mode]);

  const handleConfirm = () => {
    if (mode === 'url' && urlTrackId) {
      const track: SpotifyTrack = {
        id: urlTrackId,
        name: 'Track from URL',
        artists: [{ name: 'Artist' }],
        album: { name: '', images: [] },
        preview_url: null,
        external_urls: { spotify: `https://open.spotify.com/track/${urlTrackId}` }
      };
      onSelect(track);
      onClose();
    } else if (selectedTrack) {
      onSelect(selectedTrack);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal" role="dialog" aria-modal="true" style={{ zIndex: 10000 }}>
      <div className="modal-backdrop" onClick={onClose} />
      
      <div className="modal-content" style={{ maxWidth: '560px', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <h2 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
            <Music size={20} color="#1DB954" />
            Link Spotify Track
          </h2>
          <button onClick={onClose} className="modal-close">
            <X size={20} />
          </button>
        </div>

        {/* Mode tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--color-dark-lighter)' }}>
          <button
            onClick={() => setMode('url')}
            style={{
              flex: 1,
              padding: 'var(--space-md) var(--space-lg)',
              fontSize: 'var(--text-sm)',
              fontWeight: 'var(--font-medium)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 'var(--space-sm)',
              background: 'none',
              border: 'none',
              borderBottom: mode === 'url' ? '2px solid #1DB954' : '2px solid transparent',
              color: mode === 'url' ? '#1DB954' : 'var(--color-text-muted)',
              cursor: 'pointer',
              transition: 'all var(--transition-fast)'
            }}
          >
            <Link size={16} />
            Paste URL
          </button>
          <button
            onClick={() => setMode('search')}
            style={{
              flex: 1,
              padding: 'var(--space-md) var(--space-lg)',
              fontSize: 'var(--text-sm)',
              fontWeight: 'var(--font-medium)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 'var(--space-sm)',
              background: 'none',
              border: 'none',
              borderBottom: mode === 'search' ? '2px solid #1DB954' : '2px solid transparent',
              color: mode === 'search' ? '#1DB954' : 'var(--color-text-muted)',
              cursor: 'pointer',
              transition: 'all var(--transition-fast)'
            }}
          >
            <Search size={16} />
            Search
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: 'auto' }}>
          {mode === 'url' ? (
            <div className="modal-body">
              <div className="alert alert-info" style={{ marginBottom: 'var(--space-lg)' }}>
                <AlertCircle size={16} className="alert-icon" />
                <div style={{ fontSize: 'var(--text-xs)' }}>
                  <strong>How to get the link:</strong> Open Spotify → Find song → Share → Copy link
                </div>
              </div>

              <div className="form-group">
                <label className="label">Spotify URL or Track ID</label>
                <div className="input-wrapper">
                  <Link size={18} className="input-icon" />
                  <input
                    type="text"
                    value={spotifyUrl}
                    onChange={(e) => setSpotifyUrl(e.target.value)}
                    className="input input-with-icon"
                    placeholder="Paste Spotify link here..."
                    autoFocus
                  />
                </div>
              </div>

              {error && (
                <div className="alert alert-error" style={{ marginTop: 'var(--space-md)' }}>
                  <AlertCircle size={16} className="alert-icon" />
                  <span>{error}</span>
                </div>
              )}

              {urlTrackId && (
                <div style={{ marginTop: 'var(--space-lg)' }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 'var(--space-sm)',
                    color: '#1DB954',
                    fontSize: 'var(--text-sm)',
                    marginBottom: 'var(--space-md)'
                  }}>
                    <Check size={16} />
                    Track ID: <code style={{ background: 'var(--color-dark-lighter)', padding: '2px 10px', borderRadius: '4px' }}>{urlTrackId}</code>
                  </div>
                  
                  <div style={{ background: 'var(--color-dark)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', padding: 'var(--space-md)', paddingBottom: 0 }}>
                      Preview:
                    </p>
                    <iframe
                      src={getEmbedUrl(urlTrackId)}
                      width="100%"
                      height="152"
                      frameBorder="0"
                      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                      loading="lazy"
                      style={{ borderRadius: '0 0 var(--radius-lg) var(--radius-lg)' }}
                      title="Spotify preview"
                    />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              <div style={{ padding: 'var(--space-lg)', borderBottom: '1px solid var(--color-dark-lighter)' }}>
                <div className="alert alert-info" style={{ marginBottom: 'var(--space-md)', fontSize: 'var(--text-xs)' }}>
                  <AlertCircle size={14} className="alert-icon" />
                  Demo mode - limited results. Use "Paste URL" for accuracy.
                </div>
                <div className="input-wrapper">
                  <Search size={18} className="input-icon" />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="input input-with-icon"
                    placeholder="Search songs..."
                    autoFocus
                  />
                  {loading && (
                    <Loader size={18} style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)' }} className="animate-spin" />
                  )}
                </div>
              </div>

              <div style={{ maxHeight: '250px', overflow: 'auto', padding: 'var(--space-md)' }}>
                {results.map(track => (
                  <button
                    key={track.id}
                    onClick={() => setSelectedTrack(track)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--space-md)',
                      padding: 'var(--space-md)',
                      marginBottom: 'var(--space-sm)',
                      background: selectedTrack?.id === track.id ? 'rgba(29, 185, 84, 0.15)' : 'var(--color-dark-lighter)',
                      border: selectedTrack?.id === track.id ? '2px solid #1DB954' : '2px solid transparent',
                      borderRadius: 'var(--radius-lg)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all var(--transition-fast)'
                    }}
                  >
                    <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-md)', overflow: 'hidden', background: 'var(--color-dark)', flexShrink: 0 }}>
                      {track.album.images[0] ? (
                        <img src={track.album.images[0].url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Music size={20} color="var(--color-text-muted)" />
                        </div>
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 'var(--font-medium)', fontSize: 'var(--text-sm)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{track.name}</div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {track.artists.map(a => a.name).join(', ')}
                      </div>
                    </div>
                    {selectedTrack?.id === track.id && <Check size={18} color="#1DB954" />}
                  </button>
                ))}
                {results.length === 0 && query && !loading && (
                  <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)', padding: 'var(--space-xl)' }}>
                    No results. Try "Paste URL" instead.
                  </p>
                )}
              </div>

              {selectedTrack && (
                <div style={{ padding: 'var(--space-md)', borderTop: '1px solid var(--color-dark-lighter)', background: 'var(--color-dark)' }}>
                  <iframe
                    src={getEmbedUrl(selectedTrack.id)}
                    width="100%"
                    height="80"
                    frameBorder="0"
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                    loading="lazy"
                    style={{ borderRadius: 'var(--radius-md)' }}
                    title="Preview"
                  />
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          padding: 'var(--space-lg) var(--space-xl)',
          borderTop: '1px solid var(--color-dark-lighter)'
        }}>
          <a
            href="https://open.spotify.com/search"
            target="_blank"
            rel="noopener noreferrer"
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 'var(--space-xs)',
              fontSize: 'var(--text-sm)',
              color: 'var(--color-text-muted)',
              textDecoration: 'none'
            }}
          >
            Open Spotify <ExternalLink size={12} />
          </a>
          <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
            <button onClick={onClose} className="btn btn-ghost btn-sm">
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={mode === 'url' ? !urlTrackId : !selectedTrack}
              className="btn btn-sm"
              style={{ background: '#1DB954' }}
            >
              Use This Track
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
