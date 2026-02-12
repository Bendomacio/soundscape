import { useMemo, useState, useEffect } from 'react';
import type { MapRef } from 'react-map-gl';
import type { SongLocation, MapViewState } from '../types';
import { getDistanceKm } from '../lib/geo';
import { reverseGeocode, cacheKey, getCachedName, zoomToPlaceLevel } from '../lib/reverseGeocode';

export type GroupingMode = 'off' | 'location' | 'location+proximity' | 'cluster';

export interface MarkerGroup {
  id: string;
  songs: SongLocation[];
  latitude: number;
  longitude: number;
  type: 'single' | 'location' | 'proximity';
  locationName?: string;
}

const MAX_SAME_LOCATION_DISTANCE_KM = 0.5; // 500m
const PROXIMITY_PIXEL_THRESHOLD = 60;

/**
 * Group songs by exact locationName match, with a distance sanity check
 * to prevent grouping same-name places in different cities.
 */
function groupByLocation(songs: SongLocation[]): MarkerGroup[] {
  const nameMap = new Map<string, SongLocation[]>();

  for (const song of songs) {
    const key = song.locationName.toLowerCase().trim();
    const list = nameMap.get(key);
    if (list) {
      list.push(song);
    } else {
      nameMap.set(key, [song]);
    }
  }

  const groups: MarkerGroup[] = [];

  for (const [, locationSongs] of nameMap) {
    if (locationSongs.length === 1) {
      const s = locationSongs[0];
      groups.push({
        id: s.id,
        songs: [s],
        latitude: s.latitude,
        longitude: s.longitude,
        type: 'single',
      });
      continue;
    }

    // Sub-cluster by proximity within same name group
    // (handles edge case of same name in different cities)
    const subclusters: SongLocation[][] = [];
    const assigned = new Set<number>();

    for (let i = 0; i < locationSongs.length; i++) {
      if (assigned.has(i)) continue;
      const cluster = [locationSongs[i]];
      assigned.add(i);

      for (let j = i + 1; j < locationSongs.length; j++) {
        if (assigned.has(j)) continue;
        const dist = getDistanceKm(
          locationSongs[i].latitude, locationSongs[i].longitude,
          locationSongs[j].latitude, locationSongs[j].longitude
        );
        if (dist <= MAX_SAME_LOCATION_DISTANCE_KM) {
          cluster.push(locationSongs[j]);
          assigned.add(j);
        }
      }
      subclusters.push(cluster);
    }

    for (const cluster of subclusters) {
      if (cluster.length === 1) {
        const s = cluster[0];
        groups.push({
          id: s.id,
          songs: [s],
          latitude: s.latitude,
          longitude: s.longitude,
          type: 'single',
        });
      } else {
        const avgLat = cluster.reduce((sum, s) => sum + s.latitude, 0) / cluster.length;
        const avgLng = cluster.reduce((sum, s) => sum + s.longitude, 0) / cluster.length;
        groups.push({
          id: `loc-${cluster.map(s => s.id).sort().join('-')}`,
          songs: cluster,
          latitude: avgLat,
          longitude: avgLng,
          type: 'location',
          locationName: cluster[0].locationName,
        });
      }
    }
  }

  return groups;
}

/**
 * Merge groups that are within a pixel threshold on screen.
 */
function mergeByProximity(
  groups: MarkerGroup[],
  mapRef: React.RefObject<MapRef | null>,
  pixelThreshold: number
): MarkerGroup[] {
  const map = mapRef.current;
  if (!map) return groups;

  // Project all group centers to screen coordinates
  const projected = groups.map(g => {
    const point = map.project([g.longitude, g.latitude]);
    return { group: g, x: point.x, y: point.y };
  });

  const merged: MarkerGroup[] = [];
  const used = new Set<number>();

  for (let i = 0; i < projected.length; i++) {
    if (used.has(i)) continue;
    used.add(i);

    const cluster = [projected[i]];
    const clusterGroups = [projected[i].group];

    // Find all nearby groups
    for (let j = i + 1; j < projected.length; j++) {
      if (used.has(j)) continue;
      const dx = projected[i].x - projected[j].x;
      const dy = projected[i].y - projected[j].y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= pixelThreshold) {
        cluster.push(projected[j]);
        clusterGroups.push(projected[j].group);
        used.add(j);
      }
    }

    if (clusterGroups.length === 1) {
      merged.push(clusterGroups[0]);
    } else {
      // Merge all songs from all groups
      const allSongs = clusterGroups.flatMap(g => g.songs);
      const avgLat = allSongs.reduce((sum, s) => sum + s.latitude, 0) / allSongs.length;
      const avgLng = allSongs.reduce((sum, s) => sum + s.longitude, 0) / allSongs.length;

      // Use location name if all groups share the same one
      const names = new Set(clusterGroups.map(g => g.locationName).filter(Boolean));
      const locationName = names.size === 1 ? [...names][0] : undefined;

      merged.push({
        id: `prox-${allSongs.map(s => s.id).sort().join('-')}`,
        songs: allSongs,
        latitude: avgLat,
        longitude: avgLng,
        type: 'proximity',
        locationName,
      });
    }
  }

  return merged;
}

export function useMarkerGroups(
  songs: SongLocation[],
  viewState: MapViewState,
  groupingMode: GroupingMode,
  mapRef: React.RefObject<MapRef | null>
): MarkerGroup[] {
  // Resolved reverse-geocode names, keyed by cacheKey(lat, lng, zoom)
  const [resolvedNames, setResolvedNames] = useState<Record<string, string>>({});

  const groups = useMemo(() => {
    if (groupingMode === 'off' || songs.length === 0) {
      return songs.map(s => ({
        id: s.id,
        songs: [s],
        latitude: s.latitude,
        longitude: s.longitude,
        type: 'single' as const,
      }));
    }

    // Step 1: Always group by location name
    let result = groupByLocation(songs);

    // Step 2: Proximity merge (if enabled)
    if (groupingMode === 'location+proximity' || groupingMode === 'cluster') {
      const threshold = groupingMode === 'cluster'
        ? Math.max(PROXIMITY_PIXEL_THRESHOLD, 120 * Math.pow(0.9, viewState.zoom))
        : PROXIMITY_PIXEL_THRESHOLD;
      result = mergeByProximity(result, mapRef, threshold);
    }

    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [songs, groupingMode, viewState.zoom]);

  // At high zoom, location-based groups keep their original venue name.
  // Only resolve names for proximity-merged multi-song groups that lack a shared locationName,
  // AND for location groups when zoomed out (where venue name is too specific).
  const zoom = viewState.zoom;
  const placeLevel = zoomToPlaceLevel(zoom);

  useEffect(() => {
    const toResolve = groups.filter(g => {
      if (g.songs.length <= 1) return false;
      // Proximity groups always need a resolved name (they merged different locations)
      if (g.type === 'proximity' && !g.locationName) return true;
      // Location groups: at country/region/place zoom, the venue name is too specific
      if (g.type === 'location' && (placeLevel === 'country' || placeLevel === 'region' || placeLevel === 'place')) {
        const key = cacheKey(g.latitude, g.longitude, zoom);
        return !getCachedName(g.latitude, g.longitude, zoom) && !(key in resolvedNames);
      }
      return false;
    });

    if (toResolve.length === 0) return;

    let cancelled = false;

    (async () => {
      for (const group of toResolve) {
        if (cancelled) break;
        const name = await reverseGeocode(group.latitude, group.longitude, zoom);
        if (!cancelled && name) {
          const key = cacheKey(group.latitude, group.longitude, zoom);
          setResolvedNames(prev => ({ ...prev, [key]: name }));
        }
      }
    })();

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groups, zoom, placeLevel]);

  // Merge resolved names into groups
  return useMemo(() => {
    return groups.map(g => {
      if (g.songs.length <= 1) return g;

      // Proximity groups without a shared name: always use resolved name
      if (g.type === 'proximity' && !g.locationName) {
        const key = cacheKey(g.latitude, g.longitude, zoom);
        const name = resolvedNames[key] || getCachedName(g.latitude, g.longitude, zoom);
        return name ? { ...g, locationName: name } : g;
      }

      // Location groups at low zoom: override venue name with geographic name
      if (g.type === 'location' && (placeLevel === 'country' || placeLevel === 'region' || placeLevel === 'place')) {
        const key = cacheKey(g.latitude, g.longitude, zoom);
        const name = resolvedNames[key] || getCachedName(g.latitude, g.longitude, zoom);
        return name ? { ...g, locationName: name } : g;
      }

      return g;
    });
  }, [groups, resolvedNames, zoom, placeLevel]);
}
