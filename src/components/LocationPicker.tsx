import { useState, useCallback, useRef, useEffect } from 'react';
import Map, { Marker, NavigationControl, GeolocateControl } from 'react-map-gl';
import { MapPin, Locate, Search, X, Loader2 } from 'lucide-react';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

interface SearchResult {
  id: string;
  place_name: string;
  center: [number, number]; // [lng, lat]
}

interface LocationPickerProps {
  latitude: number;
  longitude: number;
  onChange: (lat: number, lng: number) => void;
}

export function LocationPicker({ latitude, longitude, onChange }: LocationPickerProps) {
  const [viewState, setViewState] = useState({
    latitude,
    longitude,
    zoom: 15
  });

  // Search state
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
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&limit=5`
        );
        const data = await response.json();
        
        if (data.features) {
          setSearchResults(data.features.map((f: { id: string; place_name: string; center: [number, number] }) => ({
            id: f.id,
            place_name: f.place_name,
            center: f.center
          })));
          setShowResults(true);
        }
      } catch (error) {
        console.error('Geocoding error:', error);
      } finally {
        setIsSearching(false);
      }
    }, 300);
  }, []);

  const handleSelectResult = useCallback((result: SearchResult) => {
    const [lng, lat] = result.center;
    onChange(lat, lng);
    setViewState(prev => ({
      ...prev,
      latitude: lat,
      longitude: lng,
      zoom: 16
    }));
    setSearchQuery(result.place_name.split(',')[0]); // Just the main name
    setShowResults(false);
  }, [onChange]);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setSearchResults([]);
    setShowResults(false);
  }, []);

  const handleClick = useCallback((event: { lngLat: { lng: number; lat: number } }) => {
    const { lng, lat } = event.lngLat;
    onChange(lat, lng);
  }, [onChange]);

  const handleUseMyLocation = useCallback(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude: lat, longitude: lng } = position.coords;
          onChange(lat, lng);
          setViewState(prev => ({
            ...prev,
            latitude: lat,
            longitude: lng,
            zoom: 16
          }));
        },
        (error) => {
          console.log('Geolocation error:', error.message);
        }
      );
    }
  }, [onChange]);

  return (
    <div style={{ position: 'relative' }}>
      {/* Search box */}
      <div ref={searchRef} style={{ position: 'relative', marginBottom: 'var(--space-sm)' }}>
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
            onFocus={() => searchResults.length > 0 && setShowResults(true)}
            placeholder="Search for a place or address..."
            style={{
              width: '100%',
              padding: 'var(--space-sm) var(--space-lg)',
              paddingLeft: '40px',
              paddingRight: searchQuery ? '70px' : '12px',
              background: 'var(--color-dark-lighter)',
              border: '1px solid var(--color-dark-card)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--color-text)',
              fontSize: 'var(--text-sm)',
              outline: 'none',
              transition: 'border-color var(--transition-fast)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--color-primary)';
            }}
            onMouseLeave={(e) => {
              if (document.activeElement !== e.currentTarget) {
                e.currentTarget.style.borderColor = 'var(--color-dark-card)';
              }
            }}
          />
          {/* Loading/Clear buttons */}
          <div style={{ 
            position: 'absolute', 
            right: '12px', 
            top: '50%', 
            transform: 'translateY(-50%)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-xs)'
          }}>
            {isSearching && (
              <Loader2 size={16} className="animate-spin" style={{ color: 'var(--color-text-muted)' }} />
            )}
            {searchQuery && !isSearching && (
              <button
                type="button"
                onClick={clearSearch}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: '4px',
                  cursor: 'pointer',
                  color: 'var(--color-text-muted)',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

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
            zIndex: 10,
            maxHeight: '200px',
            overflowY: 'auto'
          }}>
            {searchResults.map((result) => (
              <button
                key={result.id}
                type="button"
                onClick={() => handleSelectResult(result)}
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
                  transition: 'background var(--transition-fast)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--color-dark-lighter)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'none';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-sm)' }}>
                  <MapPin size={14} style={{ color: 'var(--color-primary)', marginTop: '2px', flexShrink: 0 }} />
                  <span style={{ 
                    overflow: 'hidden', 
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical'
                  }}>
                    {result.place_name}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Map container */}
      <div style={{ 
        height: '280px', 
        borderRadius: 'var(--radius-lg)', 
        overflow: 'hidden',
        border: '2px solid var(--color-dark-lighter)'
      }}>
        <Map
          {...viewState}
          onMove={evt => setViewState(evt.viewState)}
          onClick={handleClick}
          mapboxAccessToken={MAPBOX_TOKEN}
          mapStyle="mapbox://styles/mapbox/dark-v11"
          style={{ width: '100%', height: '100%' }}
          cursor="crosshair"
        >
          <NavigationControl position="top-right" showCompass={false} />
          <GeolocateControl 
            position="top-right" 
            trackUserLocation={false}
            showUserLocation={false}
          />
          
          {/* Selected location marker */}
          <Marker latitude={latitude} longitude={longitude} anchor="bottom">
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              animation: 'bounce 0.5s ease'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50% 50% 50% 0',
                background: 'linear-gradient(135deg, var(--color-accent), var(--color-accent-secondary))',
                transform: 'rotate(-45deg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(0,0,0,0.4)'
              }}>
                <MapPin 
                  size={20} 
                  color="var(--color-dark)" 
                  style={{ transform: 'rotate(45deg)' }}
                />
              </div>
              <div style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: 'rgba(0,0,0,0.3)',
                marginTop: '4px'
              }} />
            </div>
          </Marker>
        </Map>
      </div>

      {/* Controls row */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 'var(--space-sm)',
        gap: 'var(--space-md)'
      }}>
        {/* Use my location button */}
        <button
          type="button"
          onClick={handleUseMyLocation}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-xs)',
            padding: 'var(--space-sm) var(--space-md)',
            background: 'var(--color-dark-lighter)',
            border: '1px solid var(--color-dark-card)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--color-text)',
            fontSize: 'var(--text-xs)',
            cursor: 'pointer',
            transition: 'all var(--transition-fast)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--color-dark-card)';
            e.currentTarget.style.borderColor = 'var(--color-primary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'var(--color-dark-lighter)';
            e.currentTarget.style.borderColor = 'var(--color-dark-card)';
          }}
        >
          <Locate size={14} />
          Use my location
        </button>

        {/* Coordinates display */}
        <div style={{ 
          display: 'flex', 
          gap: 'var(--space-md)',
          padding: 'var(--space-sm) var(--space-md)',
          background: 'var(--color-dark-lighter)',
          borderRadius: 'var(--radius-md)',
          fontSize: 'var(--text-xs)',
          fontFamily: 'monospace'
        }}>
          <span style={{ color: 'var(--color-text-muted)' }}>
            <span style={{ color: 'var(--color-text)' }}>{latitude.toFixed(5)}</span>
          </span>
          <span style={{ color: 'var(--color-text-muted)' }}>
            <span style={{ color: 'var(--color-text)' }}>{longitude.toFixed(5)}</span>
          </span>
        </div>
      </div>

      {/* Instructions */}
      <p style={{ 
        fontSize: 'var(--text-xs)', 
        color: 'var(--color-text-muted)', 
        marginTop: 'var(--space-sm)',
        textAlign: 'center'
      }}>
        Search for a place above, or click on the map to set location
      </p>
    </div>
  );
}
