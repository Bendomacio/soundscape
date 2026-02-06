/**
 * Image Caching Utility
 * Uses the browser's Cache API to store album art locally
 * This prevents repeated requests to Spotify's CDN
 */

const CACHE_NAME = 'soundscape-images-v1';

// Track blob URLs to revoke old ones and prevent memory leaks
const blobUrlMap = new Map<string, string>();

/**
 * Get a cached image URL or fetch and cache it
 */
export async function getCachedImageUrl(originalUrl: string): Promise<string> {
  // Skip if no URL or if it's a data URL
  if (!originalUrl || originalUrl.startsWith('data:')) {
    return originalUrl;
  }

  try {
    // Check if Cache API is available
    if (!('caches' in window)) {
      return originalUrl;
    }

    const cache = await caches.open(CACHE_NAME);
    
    // Check if we have a cached version
    const cachedResponse = await cache.match(originalUrl);
    
    if (cachedResponse) {
      // Revoke previous blob URL for this source if it exists
      const existingBlobUrl = blobUrlMap.get(originalUrl);
      if (existingBlobUrl) {
        URL.revokeObjectURL(existingBlobUrl);
      }
      // Return cached blob URL
      const blob = await cachedResponse.blob();
      const blobUrl = URL.createObjectURL(blob);
      blobUrlMap.set(originalUrl, blobUrl);
      return blobUrl;
    }

    // Fetch and cache the image
    const response = await fetch(originalUrl, { mode: 'cors' });

    if (response.ok) {
      // Clone response before caching (response can only be read once)
      const responseToCache = response.clone();
      await cache.put(originalUrl, responseToCache);

      // Revoke previous blob URL for this source if it exists
      const existingBlobUrl = blobUrlMap.get(originalUrl);
      if (existingBlobUrl) {
        URL.revokeObjectURL(existingBlobUrl);
      }
      // Return blob URL
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      blobUrlMap.set(originalUrl, blobUrl);
      return blobUrl;
    }
    
    return originalUrl;
  } catch (error) {
    // If caching fails, just return original URL
    console.warn('Image caching failed:', error);
    return originalUrl;
  }
}

/**
 * Preload and cache multiple images
 */
export async function preloadImages(urls: string[]): Promise<void> {
  if (!('caches' in window)) return;

  const cache = await caches.open(CACHE_NAME);
  const BATCH_SIZE = 5;

  // Filter valid URLs first
  const validUrls = urls.filter(url => url && !url.startsWith('data:'));

  // Process in batches of 5
  for (let i = 0; i < validUrls.length; i += BATCH_SIZE) {
    const batch = validUrls.slice(i, i + BATCH_SIZE);
    await Promise.all(batch.map(async (url) => {
      try {
        // Check if already cached
        const cached = await cache.match(url);
        if (cached) return;

        // Fetch and cache
        const response = await fetch(url, { mode: 'cors' });
        if (response.ok) {
          await cache.put(url, response);
        }
      } catch {
        // Silently fail for individual images
      }
    }));
  }
}

/**
 * Clear old cached images
 */
export async function clearOldCache(): Promise<void> {
  if (!('caches' in window)) return;

  try {
    // Delete old cache versions
    const keys = await caches.keys();
    for (const key of keys) {
      if (key.startsWith('soundscape-images-') && key !== CACHE_NAME) {
        await caches.delete(key);
      }
    }
  } catch (error) {
    console.warn('Cache cleanup failed:', error);
  }
}

/**
 * Get cache statistics
 */
export async function getCacheStats(): Promise<{ count: number; size: string } | null> {
  if (!('caches' in window)) return null;

  try {
    const cache = await caches.open(CACHE_NAME);
    const keys = await cache.keys();
    
    let totalSize = 0;
    for (const request of keys) {
      const response = await cache.match(request);
      if (response) {
        const blob = await response.clone().blob();
        totalSize += blob.size;
      }
    }

    return {
      count: keys.length,
      size: `${(totalSize / 1024 / 1024).toFixed(2)} MB`
    };
  } catch (error) {
    return null;
  }
}
