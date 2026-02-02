import { useRef, useCallback, useEffect, useState, useMemo } from 'react';
import Map, { Marker, NavigationControl, GeolocateControl, Source, Layer } from 'react-map-gl';
import type { MapRef } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import type { SongLocation, MapViewState } from '../types';
import { Music } from 'lucide-react';
import { useCachedImage } from '../hooks/useCachedImage';

// Get Mapbox token from environment variable
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || 'YOUR_MAPBOX_TOKEN_HERE';

interface MusicMapProps {
  songs: SongLocation[]; // Songs in range (filtered)
  allSongs?: SongLocation[]; // All songs (for dimmed display)
  currentSong: SongLocation | null;
  selectedSong: SongLocation | null;
  onSongSelect: (song: SongLocation) => void;
  userLocation: { latitude: number; longitude: number } | null;
  radius: number;
  viewState: MapViewState;
  onViewStateChange: (viewState: MapViewState) => void;
  discoveryMode?: 'nearby' | 'explore';
  discoveryCenter?: { latitude: number; longitude: number } | null;
}

// Generate circle GeoJSON for radius visualization
function createCircleGeoJSON(
  centerLat: number, 
  centerLng: number, 
  radiusKm: number,
  points: number = 64
): GeoJSON.Feature<GeoJSON.Polygon> {
  const coords: [number, number][] = [];
  const earthRadius = 6371; // km
  
  for (let i = 0; i <= points; i++) {
    const angle = (i / points) * 2 * Math.PI;
    const latOffset = (radiusKm / earthRadius) * (180 / Math.PI) * Math.cos(angle);
    const lngOffset = (radiusKm / earthRadius) * (180 / Math.PI) * Math.sin(angle) / Math.cos(centerLat * Math.PI / 180);
    coords.push([centerLng + lngOffset, centerLat + latOffset]);
  }
  
  return {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'Polygon',
      coordinates: [coords]
    }
  };
}

// Album art marker component with image caching
function AlbumMarker({ 
  song, 
  isPlaying, 
  isSelected, 
  onClick 
}: { 
  song: SongLocation; 
  isPlaying: boolean; 
  isSelected: boolean;
  onClick: () => void;
}) {
  const [imgError, setImgError] = useState(false);
  const { src: cachedSrc, isLoading: imgLoading } = useCachedImage(song.albumArt);
  const size = isPlaying ? 64 : isSelected ? 56 : 48;

  return (
    <div
      onClick={onClick}
      style={{
        width: size,
        height: size,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        position: 'relative',
      }}
      title={`${song.title} by ${song.artist}`}
    >
      {/* Pulse animation for playing */}
      {isPlaying && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: size + 20,
          height: size + 20,
          borderRadius: '50%',
          background: '#1DB954',
          opacity: 0.3,
          animation: 'pulse 1.5s ease-in-out infinite',
        }} />
      )}
      
      {/* Outer ring */}
      <div style={{
        width: '100%',
        height: '100%',
        borderRadius: '50%',
        padding: '3px',
        background: isPlaying 
          ? 'linear-gradient(135deg, #1DB954, #1ed760)' 
          : isSelected 
            ? 'linear-gradient(135deg, #FF6B6B, #FFE66D)'
            : 'linear-gradient(135deg, #1DB954, #0d9e3f)',
        boxShadow: isPlaying 
          ? '0 0 25px rgba(29, 185, 84, 0.7)' 
          : '0 4px 15px rgba(0,0,0,0.5)',
        position: 'relative',
      }}>
        {/* Inner circle with album art */}
        <div style={{
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          overflow: 'hidden',
          background: '#1a1a1a',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          {song.albumArt && !imgError && !imgLoading ? (
            <img 
              src={cachedSrc}
              alt={song.title}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
              onError={() => setImgError(true)}
            />
          ) : (
            <Music size={size * 0.4} color="#1DB954" />
          )}
        </div>
      </div>

      {/* Verified badge */}
      {song.verified && (
        <div style={{
          position: 'absolute',
          bottom: -2,
          right: -2,
          width: 18,
          height: 18,
          background: '#1DB954',
          borderRadius: '50%',
          border: '2px solid #0d1117',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="white">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
          </svg>
        </div>
      )}
    </div>
  );
}

export function MusicMap({
  songs,
  allSongs,
  currentSong,
  selectedSong,
  onSongSelect,
  userLocation,
  radius,
  viewState,
  onViewStateChange,
  discoveryMode = 'nearby',
  discoveryCenter
}: MusicMapProps) {
  const mapRef = useRef<MapRef>(null);

  // Get song IDs that are in range for quick lookup
  const inRangeSongIds = useMemo(() => new Set(songs.map(s => s.id)), [songs]);

  // Songs outside range (dimmed)
  const songsOutOfRange = useMemo(() => {
    if (!allSongs || radius === 0) return [];
    return allSongs.filter(s => !inRangeSongIds.has(s.id));
  }, [allSongs, inRangeSongIds, radius]);

  // Generate radius circle GeoJSON
  const radiusCircle = useMemo(() => {
    if (radius === 0 || !discoveryCenter) return null;
    return createCircleGeoJSON(discoveryCenter.latitude, discoveryCenter.longitude, radius);
  }, [discoveryCenter, radius]);

  // Fly to song when selected
  useEffect(() => {
    if (selectedSong && mapRef.current) {
      mapRef.current.flyTo({
        center: [selectedSong.longitude, selectedSong.latitude],
        zoom: 15,
        duration: 1500
      });
    }
  }, [selectedSong]);

  const onMove = useCallback((evt: { viewState: MapViewState }) => {
    onViewStateChange(evt.viewState);
  }, [onViewStateChange]);

  // Colors based on discovery mode
  const circleColor = discoveryMode === 'nearby' ? '#10b981' : '#8b5cf6';

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <Map
        ref={mapRef}
        {...viewState}
        onMove={onMove}
        mapboxAccessToken={MAPBOX_TOKEN}
        mapStyle="mapbox://styles/mapbox/dark-v11"
        style={{ width: '100%', height: '100%' }}
      >
        <NavigationControl position="bottom-right" showCompass={false} />
        <GeolocateControl position="bottom-right" trackUserLocation />

        {/* Radius circle visualization - subtle and transparent */}
        {radiusCircle && (
          <Source id="radius-circle" type="geojson" data={radiusCircle}>
            {/* Fill */}
            <Layer
              id="radius-fill"
              type="fill"
              paint={{
                'fill-color': circleColor,
                'fill-opacity': 0.05
              }}
            />
            {/* Border */}
            <Layer
              id="radius-border"
              type="line"
              paint={{
                'line-color': circleColor,
                'line-width': 2,
                'line-opacity': 0.3,
                'line-dasharray': [4, 4]
              }}
            />
          </Source>
        )}

        {/* Discovery center marker (for explore mode) */}
        {discoveryMode === 'explore' && discoveryCenter && radius > 0 && (
          <Marker latitude={discoveryCenter.latitude} longitude={discoveryCenter.longitude}>
            <div style={{
              width: 16,
              height: 16,
              background: circleColor,
              borderRadius: '50%',
              border: '2px solid white',
              boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
              opacity: 0.8
            }} />
          </Marker>
        )}

        {/* User location marker */}
        {userLocation && (
          <Marker latitude={userLocation.latitude} longitude={userLocation.longitude}>
            <div style={{
              width: 24,
              height: 24,
              background: discoveryMode === 'nearby' 
                ? 'linear-gradient(135deg, #10b981, #34d399)' 
                : 'linear-gradient(135deg, #6b7280, #9ca3af)',
              borderRadius: '50%',
              border: '3px solid white',
              boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
            }} />
          </Marker>
        )}

        {/* Songs outside range (dimmed) */}
        {songsOutOfRange.map(song => (
          <Marker 
            key={`dim-${song.id}`} 
            latitude={song.latitude} 
            longitude={song.longitude}
            anchor="center"
          >
            <div
              onClick={() => onSongSelect(song)}
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: '#1a1a1a',
                border: '2px solid #333',
                opacity: 0.4,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease'
              }}
              title={`${song.title} by ${song.artist} (outside range)`}
            >
              <Music size={14} color="#666" />
            </div>
          </Marker>
        ))}

        {/* Songs in range (full visibility) */}
        {songs.map(song => {
          const isPlaying = currentSong?.id === song.id;
          const isSelected = selectedSong?.id === song.id;
          
          return (
            <Marker 
              key={song.id} 
              latitude={song.latitude} 
              longitude={song.longitude}
              anchor="center"
            >
              <AlbumMarker
                song={song}
                isPlaying={isPlaying}
                isSelected={isSelected}
                onClick={() => onSongSelect(song)}
              />
            </Marker>
          );
        })}
      </Map>

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.3; }
          50% { transform: translate(-50%, -50%) scale(1.3); opacity: 0.1; }
        }
        /* Offset map controls above the music player bar */
        .mapboxgl-ctrl-bottom-right {
          bottom: 100px !important;
        }
      `}</style>
    </div>
  );
}
