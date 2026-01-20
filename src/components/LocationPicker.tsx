import { useState, useCallback } from 'react';
import Map, { Marker, NavigationControl, GeolocateControl } from 'react-map-gl';
import { MapPin, Locate } from 'lucide-react';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

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

  const handleClick = useCallback((event: mapboxgl.MapLayerMouseEvent) => {
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
      {/* Map container */}
      <div style={{ 
        height: '320px', 
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
        Click anywhere on the map to set the song's location
      </p>
    </div>
  );
}
