import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Target,
  MapPin,
  Globe,
  Search,
  X,
  ChevronDown,
  ChevronUp,
  Navigation,
  Compass,
  Loader2,
  Route,
  Music,
  Sparkles
} from 'lucide-react';

interface DiscoveryPanelProps {
  radius: number;
  onRadiusChange: (value: number) => void;
  songCount: number;
  totalSongCount: number;
  mode: 'nearby' | 'explore' | 'trip';
  onModeChange: (mode: 'nearby' | 'explore' | 'trip') => void;
  onLocationSearch: (lat: number, lng: number, name: string) => void;
  onUseMyLocation: () => void;
  // Trip mode props
  onTripDestinationSet?: (destination: { lat: number; lng: number; name: string }) => void;
  tripSongsCount?: number;
  tripDestination?: string | null;
  onClearTrip?: () => void;
}

interface SearchResult {
  id: string;
  place_name: string;
  center: [number, number];
}

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

const RADIUS_PRESETS = [
  { value: 1, label: '1km', icon: '🚶' },
  { value: 5, label: '5km', icon: '🏘️' },
  { value: 10, label: '10km', icon: '🌆' },
  { value: 0, label: 'All', icon: '🌍' }
];

const getModeConfig = (mode: 'nearby' | 'explore' | 'trip') => {
  switch (mode) {
    case 'nearby':
      return {
        gradient: 'var(--gradient-primary)',
        color: 'var(--color-primary)',
        bgHover: 'rgba(16, 185, 129, 0.15)',
        border: 'rgba(16, 185, 129, 0.3)',
        icon: Target,
        label: 'Near Me'
      };
    case 'explore':
      return {
        gradient: 'var(--gradient-purple)',
        color: '#8b5cf6',
        bgHover: 'rgba(139, 92, 246, 0.15)',
        border: 'rgba(139, 92, 246, 0.3)',
        icon: Globe,
        label: 'Exploring'
      };
    case 'trip':
      return {
        gradient: 'var(--gradient-sunset)',
        color: '#f59e0b',
        bgHover: 'rgba(245, 158, 11, 0.15)',
        border: 'rgba(245, 158, 11, 0.3)',
        icon: Route,
        label: 'Trip Mode'
      };
  }
};

export function DiscoveryPanel({
  radius,
  onRadiusChange,
  songCount,
  totalSongCount,
  mode,
  onModeChange,
  onLocationSearch,
  onUseMyLocation,
  onTripDestinationSet,
  tripSongsCount = 0,
  tripDestination,
  onClearTrip
}: DiscoveryPanelProps) {
  const [tripSearchQuery, setTripSearchQuery] = useState('');
  const [tripSearchResults, setTripSearchResults] = useState<SearchResult[]>([]);
  const [isTripSearching, setIsTripSearching] = useState(false);
  const [showTripResults, setShowTripResults] = useState(false);
  const tripSearchRef = useRef<HTMLDivElement>(null);
  const tripDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Close trip dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (tripSearchRef.current && !tripSearchRef.current.contains(event.target as Node)) {
        setShowTripResults(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Trip destination search
  const handleTripSearch = useCallback((query: string) => {
    setTripSearchQuery(query);

    if (tripDebounceRef.current) {
      clearTimeout(tripDebounceRef.current);
    }

    if (!query.trim()) {
      setTripSearchResults([]);
      setShowTripResults(false);
      return;
    }

    tripDebounceRef.current = setTimeout(async () => {
      setIsTripSearching(true);
      try {
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&limit=5&types=place,locality,neighborhood,address,poi`
        );
        const data = await response.json();
        setTripSearchResults(data.features || []);
        setShowTripResults(true);
      } catch (err) {
        console.error('Trip search error:', err);
      }
      setIsTripSearching(false);
    }, 300);
  }, []);

  const handleSelectTripDestination = (result: SearchResult) => {
    const [lng, lat] = result.center;
    const name = result.place_name.split(',')[0];
    onTripDestinationSet?.({ lat, lng, name });
    setTripSearchQuery('');
    setShowTripResults(false);
    setTripSearchResults([]);
  };
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
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

  // Debounced search
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (!query.trim()) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&limit=5&types=place,locality,neighborhood,address,poi`
        );
        const data = await response.json();
        setSearchResults(data.features || []);
        setShowResults(true);
      } catch (err) {
        console.error('Search error:', err);
      }
      setIsSearching(false);
    }, 300);
  }, []);

  const handleSelectLocation = (result: SearchResult) => {
    const [lng, lat] = result.center;
    onLocationSearch(lat, lng, result.place_name.split(',')[0]);
    setSearchQuery('');
    setShowResults(false);
    setSearchResults([]);
  };

  const isShowingAll = radius === 0;
  const displayRadius = isShowingAll ? 'All' : `${radius}km`;
  const percentage = isShowingAll ? 100 : Math.min((radius / 20) * 100, 100);

  const modeConfig = getModeConfig(mode);
  const ModeIcon = modeConfig.icon;

  return (
    <div
      className="discovery-panel card-glass animate-slide-up"
      style={{
        position: 'absolute',
        top: '80px',
        left: '16px',
        right: 'auto',
        width: isExpanded ? '340px' : '300px',
        maxWidth: 'calc(100vw - 32px)',
        zIndex: 20,
        transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
        overflow: 'hidden'
      }}
    >
      {/* Header - Always visible */}
      <div
        style={{
          padding: '16px',
          cursor: 'pointer',
          position: 'relative',
          overflow: 'hidden'
        }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {/* Ambient glow based on mode */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '150px',
          height: '150px',
          background: modeConfig.gradient,
          filter: 'blur(60px)',
          opacity: 0.15,
          pointerEvents: 'none'
        }} />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Mode icon with gradient background */}
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '14px',
              background: modeConfig.gradient,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: `0 4px 16px ${modeConfig.color}40`
            }}>
              <ModeIcon size={20} color="white" />
            </div>
            <div style={{ minWidth: 0 }}>
              <h3 style={{
                fontSize: '15px',
                fontWeight: 600,
                margin: 0,
                whiteSpace: 'nowrap',
                letterSpacing: '-0.01em'
              }}>
                {modeConfig.label}
              </h3>
              <p style={{
                fontSize: '12px',
                color: 'var(--color-text-muted)',
                margin: '2px 0 0 0',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                {mode === 'trip'
                  ? tripDestination
                    ? <>
                        <Sparkles size={10} style={{ color: modeConfig.color }} />
                        {`${tripSongsCount} ${tripSongsCount === 1 ? 'song' : 'songs'} on route`}
                      </>
                    : 'Set a destination'
                  : isShowingAll
                    ? `${totalSongCount} songs total`
                    : `${songCount} ${songCount === 1 ? 'song' : 'songs'} in range`
                }
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Radius/status indicator */}
            <div style={{
              padding: '6px 12px',
              background: modeConfig.bgHover,
              borderRadius: '10px',
              border: `1px solid ${modeConfig.border}`
            }}>
              <span style={{
                fontSize: '16px',
                fontWeight: 700,
                color: modeConfig.color
              }}>
                {mode === 'trip' ? (tripDestination ? '🎵' : '📍') : displayRadius}
              </span>
            </div>
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.05)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {isExpanded ? <ChevronUp size={16} color="var(--color-text-muted)" /> : <ChevronDown size={16} color="var(--color-text-muted)" />}
            </div>
          </div>
        </div>

        {/* Quick Radius Presets - Compact (hidden in trip mode) */}
        {mode !== 'trip' && (
          <div className="toggle-group" style={{ marginTop: '14px', padding: '3px' }}>
            {RADIUS_PRESETS.map(preset => (
              <button
                key={preset.value}
                onClick={(e) => {
                  e.stopPropagation();
                  onRadiusChange(preset.value);
                }}
                className={`toggle-item ${radius === preset.value ? 'toggle-item-active' : ''}`}
                style={{
                  padding: '8px 6px',
                  fontSize: '12px',
                  gap: '4px',
                  ...(radius === preset.value && mode === 'explore' ? { background: 'var(--gradient-purple)' } : {})
                }}
              >
                <span style={{ fontSize: '11px' }}>{preset.icon}</span>
                {preset.label}
              </button>
            ))}
          </div>
        )}

        {/* Trip mode destination preview */}
        {mode === 'trip' && tripDestination && (
          <div className="badge badge-amber" style={{
            marginTop: '14px',
            padding: '10px 14px',
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderRadius: '12px',
            background: 'rgba(245, 158, 11, 0.1)',
            fontSize: '13px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
              <Route size={14} />
              <span style={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                color: 'var(--color-text)'
              }}>
                To: {tripDestination}
              </span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClearTrip?.();
              }}
              style={{
                padding: '4px',
                background: 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                color: 'var(--color-text-muted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <X size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="animate-slide-down" style={{
          borderTop: '1px solid var(--glass-border)',
          padding: '16px',
        }}>
          {/* Mode Toggle */}
          <div style={{ marginBottom: '20px' }}>
            <p style={{
              fontSize: '11px',
              color: 'var(--color-text-muted)',
              marginBottom: '10px',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              fontWeight: 500
            }}>
              Discovery Mode
            </p>
            <div className="toggle-group" style={{ padding: '4px' }}>
              <button
                onClick={() => onModeChange('nearby')}
                className={`toggle-item ${mode === 'nearby' ? 'toggle-item-active' : ''}`}
              >
                <Navigation size={14} />
                Nearby
              </button>
              <button
                onClick={() => onModeChange('explore')}
                className={`toggle-item ${mode === 'explore' ? 'toggle-item-active toggle-purple' : ''}`}
              >
                <Compass size={14} />
                Explore
              </button>
              <button
                onClick={() => onModeChange('trip')}
                className={`toggle-item ${mode === 'trip' ? 'toggle-item-active toggle-sunset' : ''}`}
              >
                <Route size={14} />
                Trip
              </button>
            </div>
          </div>

          {/* Custom Radius Slider */}
          {mode !== 'trip' && !isShowingAll && (
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <p style={{
                  fontSize: '11px',
                  color: 'var(--color-text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  fontWeight: 500
                }}>
                  Custom Radius
                </p>
                <span style={{
                  fontSize: '13px',
                  color: modeConfig.color,
                  fontWeight: 600
                }}>
                  {radius}km
                </span>
              </div>
              <div style={{ position: 'relative', height: '24px' }}>
                <div className="slider-track">
                  <div
                    className="slider-fill"
                    style={{
                      width: `${percentage}%`,
                      background: mode === 'nearby'
                        ? 'var(--gradient-primary)'
                        : 'var(--gradient-purple)'
                    }}
                  />
                </div>
                <input
                  type="range"
                  min={1}
                  max={20}
                  value={radius || 20}
                  onChange={(e) => onRadiusChange(parseInt(e.target.value))}
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    opacity: 0,
                    cursor: 'pointer',
                    margin: 0
                  }}
                />
                <div
                  className="slider-thumb"
                  style={{
                    left: `${percentage}%`,
                    top: '3px',
                    boxShadow: `0 2px 8px rgba(0, 0, 0, 0.3), 0 0 0 3px ${modeConfig.color}50`
                  }}
                />
              </div>
            </div>
          )}

          {/* Trip Destination Search (only in trip mode) */}
          {mode === 'trip' && (
            <div ref={tripSearchRef} style={{ position: 'relative', marginBottom: '16px' }}>
              <p style={{
                fontSize: '11px',
                color: 'var(--color-text-muted)',
                marginBottom: '10px',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                fontWeight: 500
              }}>
                Where are you going?
              </p>
              <div style={{ position: 'relative' }}>
                <Route
                  size={16}
                  style={{
                    position: 'absolute',
                    left: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#f59e0b'
                  }}
                />
                <input
                  type="text"
                  value={tripSearchQuery}
                  onChange={(e) => handleTripSearch(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  placeholder="Enter destination..."
                  className="input-glass"
                  style={{
                    width: '100%',
                    height: '48px',
                    paddingLeft: '42px',
                    paddingRight: tripSearchQuery ? '42px' : '14px',
                    fontSize: '14px',
                    borderRadius: '14px',
                    border: '2px solid #f59e0b',
                    background: 'rgba(245, 158, 11, 0.1)'
                  }}
                />
                {tripSearchQuery && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setTripSearchQuery('');
                      setTripSearchResults([]);
                    }}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      padding: '6px',
                      background: 'rgba(255, 255, 255, 0.1)',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      color: 'var(--color-text-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <X size={14} />
                  </button>
                )}
                {isTripSearching && (
                  <Loader2
                    size={16}
                    className="animate-spin"
                    style={{
                      position: 'absolute',
                      right: tripSearchQuery ? '44px' : '14px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#f59e0b'
                    }}
                  />
                )}
              </div>

              {/* Trip Search Results Dropdown */}
              {showTripResults && tripSearchResults.length > 0 && (
                <div className="dropdown-menu animate-slide-down" style={{
                  position: 'absolute',
                  top: 'calc(100% + 6px)',
                  left: 0,
                  right: 0,
                  maxHeight: '200px',
                  overflowY: 'auto',
                  borderColor: 'rgba(245, 158, 11, 0.3)'
                }}>
                  {tripSearchResults.map(result => (
                    <button
                      key={result.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectTripDestination(result);
                      }}
                      className="dropdown-item"
                      style={{ padding: '12px 14px' }}
                    >
                      <MapPin size={14} color="#f59e0b" style={{ flexShrink: 0 }} />
                      <span style={{
                        fontSize: '13px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {result.place_name}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* Trip info when destination is set */}
              {tripDestination && tripSongsCount > 0 && (
                <div style={{
                  marginTop: '14px',
                  padding: '14px',
                  background: 'rgba(245, 158, 11, 0.1)',
                  borderRadius: '14px',
                  border: '1px solid rgba(245, 158, 11, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '12px',
                    background: 'var(--gradient-sunset)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <Music size={18} color="white" />
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: 'var(--color-text)' }}>
                      {tripSongsCount} {tripSongsCount === 1 ? 'song' : 'songs'} on your route!
                    </p>
                    <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--color-text-muted)' }}>
                      Discover music along the way
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Location Search (hidden in trip mode) */}
          {mode !== 'trip' && (
          <div ref={searchRef} style={{ position: 'relative' }}>
            <p style={{
              fontSize: '11px',
              color: 'var(--color-text-muted)',
              marginBottom: '10px',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              fontWeight: 500
            }}>
              Jump to Location
            </p>
            <div style={{ position: 'relative' }}>
              <Search
                size={16}
                style={{
                  position: 'absolute',
                  left: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--color-text-muted)'
                }}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                placeholder="Search any place..."
                className="input-glass"
                style={{
                  width: '100%',
                  height: '44px',
                  paddingLeft: '42px',
                  paddingRight: searchQuery ? '42px' : '14px',
                  fontSize: '13px',
                  borderRadius: '12px'
                }}
              />
              {searchQuery && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSearchQuery('');
                    setSearchResults([]);
                  }}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    padding: '6px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    color: 'var(--color-text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <X size={14} />
                </button>
              )}
              {isSearching && (
                <Loader2
                  size={16}
                  className="animate-spin"
                  style={{
                    position: 'absolute',
                    right: searchQuery ? '44px' : '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--color-text-muted)'
                  }}
                />
              )}
            </div>

            {/* Search Results Dropdown */}
            {showResults && searchResults.length > 0 && (
              <div className="dropdown-menu animate-slide-down" style={{
                position: 'absolute',
                top: 'calc(100% + 6px)',
                left: 0,
                right: 0,
                maxHeight: '200px',
                overflowY: 'auto'
              }}>
                {searchResults.map(result => (
                  <button
                    key={result.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectLocation(result);
                    }}
                    className="dropdown-item"
                    style={{ padding: '12px 14px' }}
                  >
                    <MapPin size={14} color="var(--color-text-muted)" style={{ flexShrink: 0 }} />
                    <span style={{
                      fontSize: '13px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {result.place_name}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
          )}

          {/* Use My Location Button (hidden in trip mode) */}
          {mode !== 'trip' && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onUseMyLocation();
              onModeChange('nearby');
            }}
            className="btn-glass"
            style={{
              width: '100%',
              marginTop: '14px',
              padding: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              borderRadius: '12px',
              fontSize: '13px',
              fontWeight: 500
            }}
          >
            <Navigation size={16} />
            Use My Location
          </button>
          )}
        </div>
      )}
    </div>
  );
}
