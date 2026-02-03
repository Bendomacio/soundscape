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
  Music
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
  { value: 1, label: '1km', description: 'Walking' },
  { value: 5, label: '5km', description: 'Neighbourhood' },
  { value: 10, label: '10km', description: 'District' },
  { value: 0, label: 'All', description: 'Global' }
];

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

  return (
    <div 
      className="discovery-panel"
      style={{
        position: 'absolute',
        top: '80px',
        left: '16px',
        right: 'auto',
        width: isExpanded ? '320px' : '280px',
        maxWidth: 'calc(100vw - 32px)',
        background: 'var(--color-dark-card)',
        borderRadius: '16px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        border: '1px solid var(--color-dark-lighter)',
        zIndex: 20,
        transition: 'width 200ms ease',
        overflow: 'hidden'
      }}
    >
      {/* Header - Always visible */}
      <div 
        style={{ 
          padding: '16px',
          cursor: 'pointer'
        }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: mode === 'nearby'
                ? 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))'
                : mode === 'trip'
                  ? 'linear-gradient(135deg, #f59e0b, #ef4444)'
                  : 'linear-gradient(135deg, #8b5cf6, #6366f1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              {mode === 'nearby' ? <Target size={18} color="white" /> : mode === 'trip' ? <Route size={18} color="white" /> : <Globe size={18} color="white" />}
            </div>
            <div style={{ minWidth: 0 }}>
              <h3 style={{ fontSize: '14px', fontWeight: 600, margin: 0, whiteSpace: 'nowrap' }}>
                {mode === 'nearby' ? 'Near Me' : mode === 'trip' ? 'Trip Mode' : 'Exploring'}
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', margin: 0, whiteSpace: 'nowrap' }}>
                {mode === 'trip'
                  ? tripDestination
                    ? `${tripSongsCount} ${tripSongsCount === 1 ? 'song' : 'songs'} on route`
                    : 'Set a destination'
                  : isShowingAll
                    ? `${totalSongCount} songs total`
                    : `${songCount} ${songCount === 1 ? 'song' : 'songs'} in range`
                }
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <span style={{
                fontSize: '20px',
                fontWeight: 700,
                color: mode === 'nearby' ? 'var(--color-primary)' : mode === 'trip' ? '#f59e0b' : '#8b5cf6'
              }}>
                {mode === 'trip' ? (tripDestination ? '🎵' : '📍') : displayRadius}
              </span>
            </div>
            {isExpanded ? <ChevronUp size={18} color="var(--color-text-muted)" /> : <ChevronDown size={18} color="var(--color-text-muted)" />}
          </div>
        </div>

        {/* Quick Radius Presets - Compact (hidden in trip mode) */}
        {mode !== 'trip' && (
          <div style={{
            display: 'flex',
            gap: '6px',
            marginTop: '12px'
          }}>
            {RADIUS_PRESETS.map(preset => (
              <button
                key={preset.value}
                onClick={(e) => {
                  e.stopPropagation();
                  onRadiusChange(preset.value);
                }}
                style={{
                  flex: 1,
                  padding: '6px 4px',
                  background: radius === preset.value
                    ? (mode === 'nearby' ? 'var(--color-primary)' : '#8b5cf6')
                    : 'var(--color-dark-lighter)',
                  border: 'none',
                  borderRadius: '8px',
                  color: radius === preset.value ? 'white' : 'var(--color-text-muted)',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 150ms ease'
                }}
              >
                {preset.label}
              </button>
            ))}
          </div>
        )}

        {/* Trip mode destination preview */}
        {mode === 'trip' && tripDestination && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginTop: '12px',
            padding: '8px 12px',
            background: 'rgba(245, 158, 11, 0.15)',
            borderRadius: '8px'
          }}>
            <Route size={14} color="#f59e0b" />
            <span style={{ flex: 1, fontSize: '12px', color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              To: {tripDestination}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClearTrip?.();
              }}
              style={{
                padding: '4px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--color-text-muted)'
              }}
            >
              <X size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div style={{ 
          borderTop: '1px solid var(--color-dark-lighter)',
          padding: '16px',
          animation: 'slideDown 200ms ease'
        }}>
          {/* Mode Toggle */}
          <div style={{ marginBottom: '16px' }}>
            <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Discovery Mode
            </p>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                onClick={() => onModeChange('nearby')}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  padding: '10px 6px',
                  background: mode === 'nearby' ? 'rgba(16, 185, 129, 0.15)' : 'var(--color-dark-lighter)',
                  border: mode === 'nearby' ? '1px solid var(--color-primary)' : '1px solid transparent',
                  borderRadius: '10px',
                  color: mode === 'nearby' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                  fontSize: '12px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 150ms ease'
                }}
              >
                <Navigation size={14} />
                Nearby
              </button>
              <button
                onClick={() => onModeChange('explore')}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  padding: '10px 6px',
                  background: mode === 'explore' ? 'rgba(139, 92, 246, 0.15)' : 'var(--color-dark-lighter)',
                  border: mode === 'explore' ? '1px solid #8b5cf6' : '1px solid transparent',
                  borderRadius: '10px',
                  color: mode === 'explore' ? '#8b5cf6' : 'var(--color-text-muted)',
                  fontSize: '12px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 150ms ease'
                }}
              >
                <Compass size={14} />
                Explore
              </button>
              <button
                onClick={() => onModeChange('trip')}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  padding: '10px 6px',
                  background: mode === 'trip' ? 'rgba(245, 158, 11, 0.15)' : 'var(--color-dark-lighter)',
                  border: mode === 'trip' ? '1px solid #f59e0b' : '1px solid transparent',
                  borderRadius: '10px',
                  color: mode === 'trip' ? '#f59e0b' : 'var(--color-text-muted)',
                  fontSize: '12px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 150ms ease'
                }}
              >
                <Route size={14} />
                Trip
              </button>
            </div>
          </div>

          {/* Custom Radius Slider */}
          {!isShowingAll && (
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Custom Radius
                </p>
                <span style={{ fontSize: '12px', color: 'var(--color-text)', fontWeight: 500 }}>{radius}km</span>
              </div>
              <div style={{ position: 'relative', height: '20px' }}>
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: 0,
                  right: 0,
                  height: '6px',
                  transform: 'translateY(-50%)',
                  background: 'var(--color-dark-lighter)',
                  borderRadius: '3px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    height: '100%',
                    width: `${percentage}%`,
                    background: mode === 'nearby' 
                      ? 'linear-gradient(90deg, var(--color-primary), var(--color-accent))'
                      : 'linear-gradient(90deg, #8b5cf6, #ec4899)',
                    borderRadius: '3px',
                    transition: 'width 150ms ease'
                  }} />
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
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: `${percentage}%`,
                  width: '16px',
                  height: '16px',
                  transform: 'translate(-50%, -50%)',
                  background: 'white',
                  borderRadius: '50%',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                  border: `3px solid ${mode === 'nearby' ? 'var(--color-primary)' : '#8b5cf6'}`,
                  pointerEvents: 'none',
                  transition: 'left 150ms ease'
                }} />
              </div>
            </div>
          )}

          {/* Trip Destination Search (only in trip mode) */}
          {mode === 'trip' && (
            <div ref={tripSearchRef} style={{ position: 'relative', marginBottom: '16px' }}>
              <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Where are you going?
              </p>
              <div style={{ position: 'relative' }}>
                <Route
                  size={16}
                  style={{
                    position: 'absolute',
                    left: '12px',
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
                  style={{
                    width: '100%',
                    height: '44px',
                    paddingLeft: '38px',
                    paddingRight: tripSearchQuery ? '38px' : '12px',
                    fontSize: '14px',
                    background: 'var(--color-dark-lighter)',
                    border: '2px solid #f59e0b',
                    borderRadius: '10px',
                    color: 'var(--color-text)',
                    outline: 'none'
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
                      right: '8px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      padding: '4px',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--color-text-muted)'
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
                      right: tripSearchQuery ? '32px' : '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#f59e0b'
                    }}
                  />
                )}
              </div>

              {/* Trip Search Results Dropdown */}
              {showTripResults && tripSearchResults.length > 0 && (
                <div style={{
                  position: 'absolute',
                  top: 'calc(100% + 4px)',
                  left: 0,
                  right: 0,
                  background: 'var(--color-dark-card)',
                  border: '1px solid #f59e0b',
                  borderRadius: '10px',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                  zIndex: 100,
                  maxHeight: '200px',
                  overflowY: 'auto'
                }}>
                  {tripSearchResults.map(result => (
                    <button
                      key={result.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectTripDestination(result);
                      }}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        background: 'transparent',
                        border: 'none',
                        borderBottom: '1px solid var(--color-dark-lighter)',
                        cursor: 'pointer',
                        textAlign: 'left',
                        color: 'var(--color-text)'
                      }}
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
                  marginTop: '12px',
                  padding: '12px',
                  background: 'rgba(245, 158, 11, 0.1)',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  <Music size={18} color="#f59e0b" />
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
            <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Jump to Location
            </p>
            <div style={{ position: 'relative' }}>
              <Search 
                size={16} 
                style={{
                  position: 'absolute',
                  left: '12px',
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
                style={{
                  width: '100%',
                  height: '40px',
                  paddingLeft: '38px',
                  paddingRight: searchQuery ? '38px' : '12px',
                  fontSize: '13px',
                  background: 'var(--color-dark-lighter)',
                  border: '1px solid transparent',
                  borderRadius: '10px',
                  color: 'var(--color-text)',
                  outline: 'none'
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
                    right: '8px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    padding: '4px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--color-text-muted)'
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
                    right: searchQuery ? '32px' : '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--color-text-muted)'
                  }}
                />
              )}
            </div>

            {/* Search Results Dropdown */}
            {showResults && searchResults.length > 0 && (
              <div style={{
                position: 'absolute',
                top: 'calc(100% + 4px)',
                left: 0,
                right: 0,
                background: 'var(--color-dark-card)',
                border: '1px solid var(--color-dark-lighter)',
                borderRadius: '10px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                zIndex: 100,
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
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      background: 'transparent',
                      border: 'none',
                      borderBottom: '1px solid var(--color-dark-lighter)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      color: 'var(--color-text)'
                    }}
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
            style={{
              width: '100%',
              marginTop: '12px',
              padding: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              background: 'var(--color-dark-lighter)',
              border: 'none',
              borderRadius: '10px',
              color: 'var(--color-text-muted)',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 150ms ease'
            }}
          >
            <Navigation size={14} />
            Use My Location
          </button>
          )}
        </div>
      )}
    </div>
  );
}
