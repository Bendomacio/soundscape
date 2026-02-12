/**
 * Mapbox reverse geocoding with zoom-aware place level and in-memory cache.
 * Used to label cluster markers with appropriate geographic names at each zoom level.
 */

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

type PlaceLevel = 'country' | 'region' | 'place' | 'neighborhood';

/** Map zoom level to the appropriate geographic granularity */
export function zoomToPlaceLevel(zoom: number): PlaceLevel {
  if (zoom < 5) return 'country';
  if (zoom < 8) return 'region';
  if (zoom < 12) return 'place';
  return 'neighborhood';
}

/**
 * Build a stable cache key from rounded coordinates + place level.
 * Precision scales with level so nearby clusters share the same cache entry.
 */
export function cacheKey(lat: number, lng: number, zoom: number): string {
  const level = zoomToPlaceLevel(zoom);
  // Coarser rounding at lower zoom (fewer API calls)
  const precision = level === 'country' ? 0 : level === 'region' ? 0 : level === 'place' ? 1 : 2;
  const factor = Math.pow(10, precision);
  return `${Math.round(lat * factor)},${Math.round(lng * factor)},${level}`;
}

// Module-level in-memory cache (persists for session)
const nameCache = new Map<string, string>();
// Track in-flight requests to avoid duplicates
const pendingRequests = new Map<string, Promise<string | null>>();

/**
 * Reverse geocode a lat/lng to a place name appropriate for the current zoom level.
 * Returns cached result instantly if available.
 */
export async function reverseGeocode(
  lat: number,
  lng: number,
  zoom: number
): Promise<string | null> {
  if (!MAPBOX_TOKEN) return null;

  const key = cacheKey(lat, lng, zoom);
  if (nameCache.has(key)) return nameCache.get(key)!;

  // Deduplicate concurrent requests for the same key
  if (pendingRequests.has(key)) return pendingRequests.get(key)!;

  const level = zoomToPlaceLevel(zoom);
  // For neighborhood, also include locality as fallback
  const types = level === 'neighborhood' ? 'neighborhood,locality' : level;

  const request = (async () => {
    try {
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}&types=${types}&limit=1`;
      const res = await fetch(url);
      if (!res.ok) return null;
      const data = await res.json();
      const name: string | undefined = data.features?.[0]?.text;
      if (name) {
        nameCache.set(key, name);
        return name;
      }
      return null;
    } catch {
      return null;
    } finally {
      pendingRequests.delete(key);
    }
  })();

  pendingRequests.set(key, request);
  return request;
}

/** Synchronous cache lookup — returns undefined if not yet resolved */
export function getCachedName(lat: number, lng: number, zoom: number): string | undefined {
  return nameCache.get(cacheKey(lat, lng, zoom));
}
