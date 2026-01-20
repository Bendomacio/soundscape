/**
 * Image Caching Utility
 * Uses the browser's Cache API to store album art locally
 * This prevents repeated requests to Spotify's CDN
 */

const CACHE_NAME = 'soundscape-images-v1';
const CACHE_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

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
      // Return cached blob URL
      const blob = await cachedResponse.blob();
      return URL.createObjectURL(blob);
    }

    // Fetch and cache the image
    const response = await fetch(originalUrl, { mode: 'cors' });
    
    if (response.ok) {
      // Clone response before caching (response can only be read once)
      const responseToCache = response.clone();
      await cache.put(originalUrl, responseToCache);
      
      // Return blob URL
      const blob = await response.blob();
      return URL.createObjectURL(blob);
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
  
  for (const url of urls) {
    if (!url || url.startsWith('data:')) continue;
    
    try {
      // Check if already cached
      const cached = await cache.match(url);
      if (cached) continue;

      // Fetch and cache
      const response = await fetch(url, { mode: 'cors' });
      if (response.ok) {
        await cache.put(url, response);
      }
    } catch (error) {
      // Silently fail for individual images
    }
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
