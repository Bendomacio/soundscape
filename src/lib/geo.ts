// Geographic utility functions

/**
 * Calculate the distance in kilometers between two lat/lng points
 * using the Haversine formula.
 */
export function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Calculate perpendicular distance from a point to a line segment.
 */
export function pointToSegmentDistance(
  pointLat: number,
  pointLng: number,
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const A = pointLat - lat1;
  const B = pointLng - lng1;
  const C = lat2 - lat1;
  const D = lng2 - lng1;

  const dot = A * C + B * D;
  const lenSq = C * C + D * D;

  let param = -1;
  if (lenSq !== 0) {
    param = dot / lenSq;
  }

  let nearestLat: number;
  let nearestLng: number;

  if (param < 0) {
    nearestLat = lat1;
    nearestLng = lng1;
  } else if (param > 1) {
    nearestLat = lat2;
    nearestLng = lng2;
  } else {
    nearestLat = lat1 + param * C;
    nearestLng = lng1 + param * D;
  }

  return getDistanceKm(pointLat, pointLng, nearestLat, nearestLng);
}

/**
 * Calculate minimum distance from a point to a route (polyline).
 * Route coords are in [lng, lat] format (Mapbox convention).
 */
export function getMinDistanceToRoute(
  pointLat: number,
  pointLng: number,
  route: [number, number][]
): number {
  let minDistance = Infinity;

  for (let i = 0; i < route.length - 1; i++) {
    const [lng1, lat1] = route[i];
    const [lng2, lat2] = route[i + 1];

    const dist = pointToSegmentDistance(pointLat, pointLng, lat1, lng1, lat2, lng2);
    if (dist < minDistance) {
      minDistance = dist;
    }
  }

  return minDistance;
}

/**
 * Format distance for display.
 */
export function formatDistance(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)}m`;
  }
  return `${km.toFixed(1)}km`;
}
