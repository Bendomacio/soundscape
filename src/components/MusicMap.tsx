import React, { useRef, useCallback, useEffect, useState, useMemo } from 'react';
import Map, { Marker, NavigationControl, GeolocateControl, Source, Layer } from 'react-map-gl';
import type { MapRef } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import type { SongLocation, MapViewState } from '../types';
import { hasPlayableLink } from '../types';
import { Music, X } from 'lucide-react';
import { useCachedImage } from '../hooks/useCachedImage';
import { MarkerHoverCard } from './MarkerHoverCard';
import { ClusterHoverCard } from './ClusterHoverCard';
import { ClusterMarker } from './ClusterMarker';
import { DevGroupingToggle } from './DevGroupingToggle';
import { useMarkerGroups, type GroupingMode, type MarkerGroup } from '../hooks/useMarkerGroups';

// Get Mapbox token from environment variable
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || 'YOUR_MAPBOX_TOKEN_HERE';

// Detect touch device (no hover support)
const isTouchDevice = () =>
  typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);

// Spider expansion radius in pixels
const SPIDER_RADIUS_PX = 50;

// Max songs for spider expansion — larger clusters zoom-to-fit instead
const SPIDER_MAX_SONGS = 10;

// localStorage key for grouping mode
const GROUPING_MODE_KEY = 'soundscape_grouping_mode';

function loadGroupingMode(): GroupingMode {
  try {
    const saved = localStorage.getItem(GROUPING_MODE_KEY);
    if (saved === 'off' || saved === 'location' || saved === 'location+proximity' || saved === 'cluster') {
      return saved;
    }
  } catch { /* ignore */ }
  return 'location';
}

interface MusicMapProps {
  songs: SongLocation[]; // Songs in range (filtered)
  allSongs?: SongLocation[]; // All songs (for dimmed display)
  currentSong: SongLocation | null;
  selectedSong: SongLocation | null;
  onSongSelect: (song: SongLocation) => void;
  onSongOpenDetail: (song: SongLocation) => void;
  userLocation: { latitude: number; longitude: number } | null;
  radius: number;
  viewState: MapViewState;
  onViewStateChange: (viewState: MapViewState) => void;
  discoveryMode?: 'nearby' | 'explore' | 'trip';
  discoveryCenter?: { latitude: number; longitude: number } | null;
  // Trip mode props
  tripRoute?: [number, number][] | null;
  tripDestination?: { lat: number; lng: number; name: string } | null;
  // Admin visibility
  isAdmin?: boolean;
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
interface AlbumMarkerProps {
  song: SongLocation;
  isPlaying: boolean;
  isSelected: boolean;
  onClick: () => void;
  onMouseEnter?: (e: React.MouseEvent) => void;
  onMouseLeave?: () => void;
}

const AlbumMarker = React.memo(function AlbumMarker({
  song,
  isPlaying,
  isSelected,
  onClick,
  onMouseEnter,
  onMouseLeave,
}: AlbumMarkerProps) {
  const [imgError, setImgError] = useState(false);
  const { src: cachedSrc, isLoading: imgLoading } = useCachedImage(song.albumArt);
  const size = isPlaying ? 64 : isSelected ? 56 : 48;

  // Check if song has any playable link
  const isValid = hasPlayableLink(song);

  // Color scheme based on validity
  const ringColor = isPlaying
    ? 'linear-gradient(135deg, #1DB954, #1ed760)'  // Green when playing
    : isSelected
      ? 'linear-gradient(135deg, #FF6B6B, #FFE66D)'  // Red/yellow when selected
      : isValid
        ? 'linear-gradient(135deg, #1DB954, #0d9e3f)'  // Green for valid songs
        : 'linear-gradient(135deg, #f59e0b, #eab308)';  // Yellow/amber for invalid

  const glowColor = isPlaying
    ? 'rgba(29, 185, 84, 0.7)'
    : !isValid
      ? 'rgba(245, 158, 11, 0.5)'
      : 'rgba(0,0,0,0.5)';

  return (
    <div
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClick() }}
      style={{
        width: size,
        height: size,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        position: 'relative',
      }}
    >
      {/* Pulse animation for playing */}
      {isPlaying && (
        <div
          className="marker-pulse"
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: size + 14,
            height: size + 14,
            borderRadius: '50%',
            background: '#1DB954',
          }}
        />
      )}

      {/* Outer ring - color coded by validity */}
      <div style={{
        width: '100%',
        height: '100%',
        borderRadius: '50%',
        padding: '3px',
        background: ringColor,
        boxShadow: `0 ${isPlaying ? '0' : '4px'} ${isPlaying ? '25px' : '15px'} ${glowColor}`,
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
            <Music size={size * 0.4} color={isValid ? '#1DB954' : '#f59e0b'} />
          )}
        </div>
      </div>
    </div>
  );
});

export function MusicMap({
  songs,
  allSongs,
  currentSong,
  selectedSong,
  onSongSelect,
  onSongOpenDetail,
  userLocation,
  radius,
  viewState,
  onViewStateChange,
  discoveryMode = 'nearby',
  discoveryCenter,
  tripRoute,
  tripDestination,
  isAdmin = false
}: MusicMapProps) {
  const mapRef = useRef<MapRef>(null);

  // Grouping mode
  const [groupingMode, setGroupingMode] = useState<GroupingMode>(loadGroupingMode);

  const handleGroupingModeChange = useCallback((mode: GroupingMode) => {
    setGroupingMode(mode);
    try { localStorage.setItem(GROUPING_MODE_KEY, mode); } catch { /* ignore */ }
  }, []);

  // Hover preview card state — can hover a single song OR a group
  const [hoveredSong, setHoveredSong] = useState<SongLocation | null>(null);
  const [hoveredGroup, setHoveredGroup] = useState<MarkerGroup | null>(null);
  const [hoverPosition, setHoverPosition] = useState<{ x: number; y: number } | null>(null);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTouch = useRef(isTouchDevice());
  // Track if a song's hover card has been shown on mobile (first tap = card, second = detail)
  const tappedSongRef = useRef<string | null>(null);

  // Spider expansion state
  const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null);
  const [spiderPositions, setSpiderPositions] = useState<Record<string, { latitude: number; longitude: number }>>({});
  // Pinned card for expanded cluster (separate from hover system)
  // Stored as lat/lng so it moves with the map
  const [expandedCardGroup, setExpandedCardGroup] = useState<MarkerGroup | null>(null);
  const [expandedCardAnchor, setExpandedCardAnchor] = useState<{ latitude: number; longitude: number } | null>(null);

  // Clear hover state helper
  const clearHover = useCallback(() => {
    setHoveredSong(null);
    setHoveredGroup(null);
    setHoverPosition(null);
  }, []);

  // --- Hover handlers for individual songs (AlbumMarker) ---
  const handleMarkerMouseEnter = useCallback((song: SongLocation, e: React.MouseEvent) => {
    if (isTouch.current) return;
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setHoverPosition({ x: rect.right + 8, y: rect.bottom - 8 });
    setHoveredGroup(null);
    setHoveredSong(song);
  }, []);

  // --- Hover handlers for clusters (ClusterMarker) ---
  const handleClusterMouseEnter = useCallback((group: MarkerGroup, e: React.MouseEvent) => {
    if (isTouch.current) return;
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setHoverPosition({ x: rect.right + 8, y: rect.bottom - 8 });
    setHoveredSong(null);
    setHoveredGroup(group);
  }, []);

  const handleMarkerMouseLeave = useCallback(() => {
    if (isTouch.current) return;
    hoverTimeoutRef.current = setTimeout(() => {
      clearHover();
    }, 150);
  }, [clearHover]);

  const handleCardMouseEnter = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
  }, []);

  const handleCardMouseLeave = useCallback(() => {
    hoverTimeoutRef.current = setTimeout(() => {
      clearHover();
    }, 150);
  }, [clearHover]);

  // --- Spider expansion (small clusters) or zoom-to-fit (large clusters) ---
  const expandCluster = useCallback((group: MarkerGroup) => {
    const map = mapRef.current;
    if (!map || group.songs.length <= 1) return;

    clearHover();

    // Large clusters: zoom into the bounding box so sub-groups form naturally
    if (group.songs.length > SPIDER_MAX_SONGS) {
      let minLat = Infinity, maxLat = -Infinity;
      let minLng = Infinity, maxLng = -Infinity;
      for (const song of group.songs) {
        if (song.latitude < minLat) minLat = song.latitude;
        if (song.latitude > maxLat) maxLat = song.latitude;
        if (song.longitude < minLng) minLng = song.longitude;
        if (song.longitude > maxLng) maxLng = song.longitude;
      }

      // If all songs are at nearly the same point, just zoom in a few levels
      const latSpan = maxLat - minLat;
      const lngSpan = maxLng - minLng;
      if (latSpan < 0.001 && lngSpan < 0.001) {
        map.flyTo({
          center: [group.longitude, group.latitude],
          zoom: Math.min(map.getZoom() + 3, 18),
          duration: 800,
        });
      } else {
        map.fitBounds(
          [[minLng, minLat], [maxLng, maxLat]],
          { padding: 80, duration: 800, maxZoom: 18 }
        );
      }
      return;
    }

    // Small clusters: spider expansion
    setExpandedGroupId(group.id);

    const center = map.project([group.longitude, group.latitude]);
    const positions: Record<string, { latitude: number; longitude: number }> = {};
    const count = group.songs.length;
    const angleStep = (2 * Math.PI) / count;
    const spiderRadius = Math.max(SPIDER_RADIUS_PX, count * 12);

    for (let i = 0; i < count; i++) {
      const angle = angleStep * i - Math.PI / 2; // Start from top
      const px = center.x + spiderRadius * Math.cos(angle);
      const py = center.y + spiderRadius * Math.sin(angle);
      const lngLat = map.unproject([px, py]);
      positions[group.songs[i].id] = {
        latitude: lngLat.lat,
        longitude: lngLat.lng,
      };
    }

    setSpiderPositions(positions);

    // Pin the cluster card to the right edge of the spider (stored as lat/lng)
    const markerHalf = 28;
    const rightEdge = map.unproject([center.x + spiderRadius + markerHalf + 12, center.y]);
    setExpandedCardGroup(group);
    setExpandedCardAnchor({ latitude: rightEdge.lat, longitude: rightEdge.lng });
  }, [clearHover]);

  const collapseCluster = useCallback(() => {
    setExpandedGroupId(null);
    setSpiderPositions({});
    setExpandedCardGroup(null);
    setExpandedCardAnchor(null);
    clearHover();
  }, [clearHover]);

  // --- Click handlers ---
  const handleMarkerClick = useCallback((song: SongLocation) => {
    if (isTouch.current) {
      if (tappedSongRef.current === song.id && hoveredSong?.id === song.id) {
        // Second tap — open detail panel
        clearHover();
        tappedSongRef.current = null;
        onSongSelect(song);
        onSongOpenDetail(song);
      } else {
        // First tap — show hover card centered above bottom player area
        tappedSongRef.current = song.id;
        const screenW = window.innerWidth;
        const screenH = window.innerHeight;
        setHoverPosition({ x: screenW / 2 - 110, y: screenH / 2 - 140 });
        setHoveredGroup(null);
        setHoveredSong(song);
        onSongSelect(song);
      }
    } else {
      // Desktop: click goes straight to select + detail
      clearHover();
      onSongSelect(song);
      onSongOpenDetail(song);
    }
  }, [hoveredSong, onSongSelect, onSongOpenDetail, clearHover]);

  const handleClusterClick = useCallback((group: MarkerGroup, e?: React.MouseEvent) => {
    // Stop propagation to prevent handleMapClick from immediately collapsing
    e?.stopPropagation();

    if (isTouch.current) {
      if (hoveredGroup?.id === group.id) {
        // Second tap on same cluster — expand it
        expandCluster(group);
      } else {
        // First tap — show cluster hover card
        const screenW = window.innerWidth;
        const screenH = window.innerHeight;
        setHoverPosition({ x: screenW / 2 - 110, y: screenH / 2 - 140 });
        setHoveredSong(null);
        setHoveredGroup(group);
      }
    } else {
      // Desktop: click expands cluster directly
      expandCluster(group);
    }
  }, [hoveredGroup, expandCluster]);

  // Dismiss hover card and collapse clusters on map click
  const handleMapClick = useCallback(() => {
    if (hoveredSong || hoveredGroup) {
      clearHover();
      tappedSongRef.current = null;
    }
    if (expandedGroupId) {
      collapseCluster();
    }
  }, [hoveredSong, hoveredGroup, expandedGroupId, clearHover, collapseCluster]);

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    };
  }, []);

  // Note: we intentionally do NOT collapse on zoom change,
  // so expansion persists when opening/closing song detail (which triggers flyTo).

  // Get song IDs that are in range for quick lookup
  // Filter songs: non-admins only see valid songs (with Spotify URI)
  const visibleSongs = useMemo(() => {
    if (isAdmin) return songs;
    return songs.filter(s => hasPlayableLink(s));
  }, [songs, isAdmin]);

  const inRangeSongIds = useMemo(() => new Set(visibleSongs.map(s => s.id)), [visibleSongs]);

  // Songs outside range (dimmed) - also filtered by validity for non-admins
  const songsOutOfRange = useMemo(() => {
    if (!allSongs || radius === 0) return [];
    const filtered = isAdmin ? allSongs : allSongs.filter(s => hasPlayableLink(s));
    return filtered.filter(s => !inRangeSongIds.has(s.id));
  }, [allSongs, inRangeSongIds, radius, isAdmin]);

  // Group visible songs
  const markerGroups = useMarkerGroups(visibleSongs, viewState, groupingMode, mapRef);

  // Generate radius circle GeoJSON
  const radiusCircle = useMemo(() => {
    if (radius === 0 || !discoveryCenter) return null;
    return createCircleGeoJSON(discoveryCenter.latitude, discoveryCenter.longitude, radius);
  }, [discoveryCenter, radius]);

  // Generate trip route GeoJSON
  const tripRouteGeoJSON = useMemo(() => {
    if (!tripRoute || tripRoute.length === 0) return null;
    return {
      type: 'Feature' as const,
      properties: {},
      geometry: {
        type: 'LineString' as const,
        coordinates: tripRoute
      }
    };
  }, [tripRoute]);

  // Generate spider line GeoJSON for expanded cluster
  const spiderLinesGeoJSON = useMemo(() => {
    if (!expandedGroupId || Object.keys(spiderPositions).length === 0) return null;
    const expandedGroup = markerGroups.find(g => g.id === expandedGroupId);
    if (!expandedGroup) return null;

    const features = expandedGroup.songs.map(song => {
      const pos = spiderPositions[song.id];
      if (!pos) return null;
      return {
        type: 'Feature' as const,
        properties: {},
        geometry: {
          type: 'LineString' as const,
          coordinates: [
            [expandedGroup.longitude, expandedGroup.latitude],
            [pos.longitude, pos.latitude],
          ]
        }
      };
    }).filter(Boolean);

    return {
      type: 'FeatureCollection' as const,
      features,
    };
  }, [expandedGroupId, spiderPositions, markerGroups]);

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
  const circleColor = discoveryMode === 'nearby' ? '#10b981' : discoveryMode === 'trip' ? '#f59e0b' : '#8b5cf6';

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <Map
        ref={mapRef}
        {...viewState}
        onMove={onMove}
        onClick={handleMapClick}
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

        {/* Trip route visualization */}
        {tripRouteGeoJSON && discoveryMode === 'trip' && (
          <Source id="trip-route" type="geojson" data={tripRouteGeoJSON}>
            {/* Route glow */}
            <Layer
              id="trip-route-glow"
              type="line"
              paint={{
                'line-color': '#f59e0b',
                'line-width': 8,
                'line-opacity': 0.3,
                'line-blur': 3
              }}
            />
            {/* Route line */}
            <Layer
              id="trip-route-line"
              type="line"
              paint={{
                'line-color': '#f59e0b',
                'line-width': 4,
                'line-opacity': 0.9
              }}
            />
          </Source>
        )}

        {/* Spider expansion lines */}
        {spiderLinesGeoJSON && (
          <Source id="spider-lines" type="geojson" data={spiderLinesGeoJSON as GeoJSON.FeatureCollection}>
            <Layer
              id="spider-lines-layer"
              type="line"
              paint={{
                'line-color': 'rgba(255, 255, 255, 0.3)',
                'line-width': 1.5,
                'line-dasharray': [3, 3],
              }}
            />
          </Source>
        )}

        {/* Trip destination marker */}
        {discoveryMode === 'trip' && tripDestination && (
          <Marker latitude={tripDestination.lat} longitude={tripDestination.lng}>
            <div style={{
              width: 32,
              height: 32,
              background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
              borderRadius: '50% 50% 50% 0',
              transform: 'rotate(-45deg)',
              border: '3px solid white',
              boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <span style={{ transform: 'rotate(45deg)', fontSize: '14px' }}>📍</span>
            </div>
          </Marker>
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
              onClick={() => handleMarkerClick(song)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleMarkerClick(song) }}
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
            >
              <Music size={14} color="#666" />
            </div>
          </Marker>
        ))}

        {/* Grouped song markers */}
        {markerGroups.map(group => {
          // If this group is expanded, render individual spider markers instead
          if (group.id === expandedGroupId && group.songs.length > 1) {
            return (
              <React.Fragment key={group.id}>
                {/* Center collapse button */}
                <Marker
                  latitude={group.latitude}
                  longitude={group.longitude}
                  anchor="center"
                >
                  <div
                    className="spider-center"
                    onClick={(e) => { e.stopPropagation(); collapseCluster(); }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') collapseCluster(); }}
                    title="Collapse"
                  >
                    <X size={12} color="var(--color-text-muted)" />
                  </div>
                </Marker>

                {/* Expanded individual markers */}
                {group.songs.map(song => {
                  const pos = spiderPositions[song.id];
                  if (!pos) return null;
                  const isPlaying = currentSong?.id === song.id;
                  const isSelected = selectedSong?.id === song.id;

                  return (
                    <Marker
                      key={`spider-${song.id}`}
                      latitude={pos.latitude}
                      longitude={pos.longitude}
                      anchor="center"
                    >
                      <div className="spider-marker">
                        <AlbumMarker
                          song={song}
                          isPlaying={isPlaying}
                          isSelected={isSelected}
                          onClick={() => handleMarkerClick(song)}
                          onMouseEnter={(e: React.MouseEvent) => handleMarkerMouseEnter(song, e)}
                          onMouseLeave={handleMarkerMouseLeave}
                        />
                      </div>
                    </Marker>
                  );
                })}
              </React.Fragment>
            );
          }

          // Single song — render normal AlbumMarker
          if (group.songs.length === 1) {
            const song = group.songs[0];
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
                  onClick={() => handleMarkerClick(song)}
                  onMouseEnter={(e: React.MouseEvent) => handleMarkerMouseEnter(song, e)}
                  onMouseLeave={handleMarkerMouseLeave}
                />
              </Marker>
            );
          }

          // Multi-song group — render ClusterMarker
          const isAnyPlaying = group.songs.some(s => currentSong?.id === s.id);
          const isSelected = group.songs.some(s => selectedSong?.id === s.id);

          return (
            <Marker
              key={group.id}
              latitude={group.latitude}
              longitude={group.longitude}
              anchor="center"
            >
              <ClusterMarker
                group={group}
                isAnyPlaying={isAnyPlaying}
                isSelected={isSelected}
                onClick={(e: React.MouseEvent) => handleClusterClick(group, e)}
                onMouseEnter={(e: React.MouseEvent) => handleClusterMouseEnter(group, e)}
                onMouseLeave={handleMarkerMouseLeave}
              />
            </Marker>
          );
        })}

        {/* Pinned card for expanded cluster — rendered as a Marker so it moves with the map */}
        {expandedCardGroup && expandedCardAnchor && (
          <Marker
            latitude={expandedCardAnchor.latitude}
            longitude={expandedCardAnchor.longitude}
            anchor="left"
            style={{ zIndex: 10 }}
          >
            <div className="hover-card-inner" style={{ cursor: 'default' }}>
              <ClusterHoverCard
                group={expandedCardGroup}
                isExpanded
                onOpenDetail={() => {}}
                onSongSelect={onSongSelect}
                onSongOpenDetail={onSongOpenDetail}
              />
            </div>
          </Marker>
        )}
      </Map>

      {/* Dev grouping toggle */}
      <DevGroupingToggle mode={groupingMode} onChange={handleGroupingModeChange} />

      {/* Hover preview card — for individual songs */}
      {hoveredSong && !hoveredGroup && hoverPosition && (
        <div
          className="hover-card"
          onMouseEnter={handleCardMouseEnter}
          onMouseLeave={handleCardMouseLeave}
          style={{
            left: Math.min(hoverPosition.x, window.innerWidth - 232),
            top: Math.min(hoverPosition.y, window.innerHeight - 280),
          }}
        >
          <MarkerHoverCard
            song={hoveredSong}
            onOpenDetail={() => {
              onSongSelect(hoveredSong);
              onSongOpenDetail(hoveredSong);
              clearHover();
            }}
          />
        </div>
      )}

      {/* Hover preview card — for clusters (normal hover, dismisses on mouse leave) */}
      {hoveredGroup && hoverPosition && !expandedGroupId && (
        <div
          className="hover-card"
          onMouseEnter={handleCardMouseEnter}
          onMouseLeave={handleCardMouseLeave}
          style={{
            left: Math.min(hoverPosition.x, window.innerWidth - 232),
            top: Math.min(hoverPosition.y, window.innerHeight - 300),
          }}
        >
          <ClusterHoverCard
            group={hoveredGroup}
            onOpenDetail={() => {
              expandCluster(hoveredGroup);
            }}
            onSongSelect={onSongSelect}
            onSongOpenDetail={onSongOpenDetail}
          />
        </div>
      )}

    </div>
  );
}
