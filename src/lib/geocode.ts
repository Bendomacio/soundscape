/**
 * Geolocation validation & correction utilities.
 *
 * Uses the Google Maps Geocoding API to geocode a song's locationName,
 * compare against stored coordinates, and classify the mismatch severity.
 *
 * Google Geocoding handles POI/landmark names (e.g. "Abbey Road Studios")
 * far better than Mapbox's geocoder which is more address-oriented.
 *
 * Requires: VITE_GOOGLE_MAPS_API_KEY (with Geocoding API enabled).
 */

import { getDistanceKm } from './geo';
import type { SongLocation } from '../types';

const GOOGLE_MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface GeoCandidate {
  placeName: string;
  latitude: number;
  longitude: number;
  /** Google result types (e.g. "establishment", "point_of_interest") */
  types: string[];
}

export type GeoSeverity = 'ok' | 'suspicious' | 'bad' | 'error';

export interface GeoAuditResult {
  songId: string;
  songTitle: string;
  songArtist: string;
  locationName: string;
  currentLat: number;
  currentLng: number;
  severity: GeoSeverity;
  distanceKm: number;
  suggestedLat: number;
  suggestedLng: number;
  suggestedPlaceName: string;
  candidates: GeoCandidate[];
  error?: string;
}

export interface GeoAuditProgress {
  current: number;
  total: number;
  songTitle: string;
  status: 'geocoding' | 'done' | 'error';
}

export interface GeoAuditConfig {
  /** Distance (km) above which a song is flagged as suspicious. Default 50. */
  suspiciousThresholdKm: number;
  /** Distance (km) above which a song is flagged as bad. Default 500. */
  badThresholdKm: number;
}

const DEFAULT_CONFIG: GeoAuditConfig = {
  suspiciousThresholdKm: 50,
  badThresholdKm: 500,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Build a geocoding query string from the locationName.
 *
 * locationDescription is intentionally NOT included — in this codebase it
 * contains narrative text about the song/place, not address data.
 */
export function buildGeoQuery(locationName: string): string {
  return locationName.trim();
}

function classifySeverity(
  distanceKm: number,
  config: GeoAuditConfig
): GeoSeverity {
  if (distanceKm >= config.badThresholdKm) return 'bad';
  if (distanceKm >= config.suspiciousThresholdKm) return 'suspicious';
  return 'ok';
}

// ---------------------------------------------------------------------------
// Google Maps Geocoding
// ---------------------------------------------------------------------------

interface GoogleGeocodeResult {
  formatted_address: string;
  geometry: {
    location: { lat: number; lng: number };
  };
  types: string[];
}

/**
 * Geocode via Google Maps Geocoding API.
 *
 * When `bounds` is provided, Google biases (but does not restrict) results
 * toward that viewport. We build a ~100km box around the stored coordinates
 * so that "Abbey Road Studios" near London returns the London result.
 */
async function geocode(
  query: string,
  biasPoint?: { lat: number; lng: number }
): Promise<GeoCandidate[]> {
  const params = new URLSearchParams({
    address: query,
    key: GOOGLE_MAPS_KEY,
  });

  if (biasPoint) {
    // ~0.5 degrees ≈ 55km at mid-latitudes → ~110km box
    const offset = 0.5;
    params.set(
      'bounds',
      `${biasPoint.lat - offset},${biasPoint.lng - offset}|${biasPoint.lat + offset},${biasPoint.lng + offset}`
    );
  }

  const response = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?${params.toString()}`
  );

  if (!response.ok) {
    throw new Error(`Google Geocoding API HTTP error: ${response.status}`);
  }

  const data = await response.json();

  if (data.status === 'ZERO_RESULTS') {
    return [];
  }
  if (data.status !== 'OK') {
    throw new Error(`Google Geocoding API: ${data.status}${data.error_message ? ` — ${data.error_message}` : ''}`);
  }

  return (data.results as GoogleGeocodeResult[]).map((r) => ({
    placeName: r.formatted_address,
    latitude: r.geometry.location.lat,
    longitude: r.geometry.location.lng,
    types: r.types,
  }));
}

/** Find the candidate closest to a point, returning its index and distance. */
function findClosest(
  lat: number,
  lng: number,
  candidates: GeoCandidate[]
): { idx: number; distanceKm: number } {
  let idx = 0;
  let distanceKm = Infinity;
  for (let i = 0; i < candidates.length; i++) {
    const d = getDistanceKm(lat, lng, candidates[i].latitude, candidates[i].longitude);
    if (d < distanceKm) {
      distanceKm = d;
      idx = i;
    }
  }
  return { idx, distanceKm };
}

const OK_RESULT = (
  base: Omit<GeoAuditResult, 'severity' | 'distanceKm' | 'suggestedLat' | 'suggestedLng' | 'suggestedPlaceName' | 'candidates'>,
  error?: string
): GeoAuditResult => ({
  ...base,
  severity: 'ok',
  distanceKm: 0,
  suggestedLat: base.currentLat,
  suggestedLng: base.currentLng,
  suggestedPlaceName: '',
  candidates: [],
  error,
});

// ---------------------------------------------------------------------------
// Single-song audit
// ---------------------------------------------------------------------------

/**
 * Geocode a single song's locationName via Google and compare with stored coords.
 *
 * Two-pass strategy:
 *  1. **Bounds-biased request** — biases results toward the stored coordinates.
 *     Handles POI names that aren't globally unique. If a result is close → OK.
 *  2. **Unbiased request** (only when pass 1 flags) — gets the canonical result
 *     to use as the correction suggestion.
 */
export async function auditSongGeo(
  song: SongLocation,
  config: GeoAuditConfig = DEFAULT_CONFIG
): Promise<GeoAuditResult> {
  const query = buildGeoQuery(song.locationName);

  const base: Omit<GeoAuditResult, 'severity' | 'distanceKm' | 'suggestedLat' | 'suggestedLng' | 'suggestedPlaceName' | 'candidates'> = {
    songId: song.id,
    songTitle: song.title,
    songArtist: song.artist,
    locationName: song.locationName,
    currentLat: song.latitude,
    currentLng: song.longitude,
  };

  if (!GOOGLE_MAPS_KEY) {
    return OK_RESULT(base, 'Google Maps API key not configured (VITE_GOOGLE_MAPS_API_KEY)');
  }

  try {
    // --- Pass 1: bounds-biased toward stored coordinates ---
    const biasedCandidates = await geocode(query, {
      lat: song.latitude,
      lng: song.longitude,
    });

    // If biased search found results, check if any are close
    if (biasedCandidates.length > 0) {
      const { idx: closestIdx, distanceKm: closestDist } = findClosest(
        song.latitude,
        song.longitude,
        biasedCandidates
      );

      // If the biased closest candidate is within threshold → OK
      if (closestDist < config.suspiciousThresholdKm) {
        const closest = biasedCandidates[closestIdx];
        return {
          ...base,
          severity: 'ok',
          distanceKm: closestDist,
          suggestedLat: closest.latitude,
          suggestedLng: closest.longitude,
          suggestedPlaceName: closest.placeName,
          candidates: biasedCandidates,
        };
      }
    }

    // --- Pass 2: unbiased (global) ---
    // Always runs when biased search returned zero results OR flagged a mismatch
    const globalCandidates = await geocode(query);

    // Merge both sets, deduplicating by coordinates
    const seen = new Set<string>();
    const allCandidates: GeoCandidate[] = [];
    for (const c of [...globalCandidates, ...biasedCandidates]) {
      const key = `${c.latitude.toFixed(5)},${c.longitude.toFixed(5)}`;
      if (!seen.has(key)) {
        seen.add(key);
        allCandidates.push(c);
      }
    }

    // No results from either pass
    if (allCandidates.length === 0) {
      return OK_RESULT(base, 'No geocoding results');
    }

    // Check if any combined candidate is close
    const { idx: allClosestIdx, distanceKm: allClosestDist } = findClosest(
      song.latitude,
      song.longitude,
      allCandidates
    );

    if (allClosestDist < config.suspiciousThresholdKm) {
      const closest = allCandidates[allClosestIdx];
      return {
        ...base,
        severity: 'ok',
        distanceKm: allClosestDist,
        suggestedLat: closest.latitude,
        suggestedLng: closest.longitude,
        suggestedPlaceName: closest.placeName,
        candidates: allCandidates,
      };
    }

    // Genuinely flagged — use the top global result as the suggestion
    const suggested = globalCandidates[0] ?? allCandidates[0];
    const suggestedDist = getDistanceKm(
      song.latitude,
      song.longitude,
      suggested.latitude,
      suggested.longitude
    );

    return {
      ...base,
      severity: classifySeverity(suggestedDist, config),
      distanceKm: suggestedDist,
      suggestedLat: suggested.latitude,
      suggestedLng: suggested.longitude,
      suggestedPlaceName: suggested.placeName,
      candidates: allCandidates,
    };
  } catch (err) {
    return {
      ...base,
      severity: 'error' as GeoSeverity,
      distanceKm: 0,
      suggestedLat: base.currentLat,
      suggestedLng: base.currentLng,
      suggestedPlaceName: '',
      candidates: [],
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

// ---------------------------------------------------------------------------
// Batch audit
// ---------------------------------------------------------------------------

/**
 * Batch audit songs with rate limiting.
 * Google Geocoding API allows 50 req/s. 200ms delay = ~5 req/s (safe margin).
 * Flagged songs make 2 requests (biased + unbiased), so effective rate is
 * still well within limits.
 */
export async function batchAuditGeo(
  songs: SongLocation[],
  onProgress?: (progress: GeoAuditProgress) => void,
  config: GeoAuditConfig = DEFAULT_CONFIG,
  delayMs: number = 200
): Promise<Map<string, GeoAuditResult>> {
  const results = new Map<string, GeoAuditResult>();

  for (let i = 0; i < songs.length; i++) {
    const song = songs[i];

    onProgress?.({
      current: i + 1,
      total: songs.length,
      songTitle: song.title,
      status: 'geocoding',
    });

    const result = await auditSongGeo(song, config);
    results.set(song.id, result);

    onProgress?.({
      current: i + 1,
      total: songs.length,
      songTitle: song.title,
      status: result.error ? 'error' : 'done',
    });

    // Rate limit delay between songs
    if (i < songs.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  return results;
}
