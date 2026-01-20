import { useState, useCallback } from 'react';
import Map, { Marker, NavigationControl } from 'react-map-gl';
import { MapPin } from 'lucide-react';
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
    zoom: 14
  });

  const handleClick = useCallback((event: mapboxgl.MapLayerMouseEvent) => {
    const { lng, lat } = event.lngLat;
    onChange(lat, lng);
  }, [onChange]);

  return (
    <div style={{ position: 'relative' }}>
      {/* Map container */}
      <div style={{ 
        height: '200px', 
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
          
          {/* Selected location marker */}
          <Marker latitude={latitude} longitude={longitude} anchor="bottom">
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              animation: 'bounce 0.5s ease'
            }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '50% 50% 50% 0',
                background: 'linear-gradient(135deg, var(--color-accent), var(--color-accent-secondary))',
                transform: 'rotate(-45deg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(0,0,0,0.4)'
              }}>
                <MapPin 
                  size={18} 
                  color="var(--color-dark)" 
                  style={{ transform: 'rotate(45deg)' }}
                />
              </div>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: 'rgba(0,0,0,0.3)',
                marginTop: '4px'
              }} />
            </div>
          </Marker>
        </Map>
      </div>

      {/* Instructions */}
      <p style={{ 
        fontSize: 'var(--text-xs)', 
        color: 'var(--color-text-muted)', 
        marginTop: 'var(--space-sm)',
        textAlign: 'center'
      }}>
        👆 Click on the map to set location
      </p>

      {/* Coordinates display */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center',
        gap: 'var(--space-lg)',
        marginTop: 'var(--space-sm)',
        padding: 'var(--space-sm) var(--space-md)',
        background: 'var(--color-dark-lighter)',
        borderRadius: 'var(--radius-md)',
        fontSize: 'var(--text-xs)',
        fontFamily: 'monospace'
      }}>
        <span style={{ color: 'var(--color-text-muted)' }}>
          Lat: <span style={{ color: 'var(--color-text)' }}>{latitude.toFixed(6)}</span>
        </span>
        <span style={{ color: 'var(--color-text-muted)' }}>
          Lng: <span style={{ color: 'var(--color-text)' }}>{longitude.toFixed(6)}</span>
        </span>
      </div>
    </div>
  );
}
