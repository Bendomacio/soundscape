import { useState, useEffect } from 'react';

const CACHE_NAME = 'soundscape-images-v1';

/**
 * Hook to load and cache images
 * Returns a blob URL for cached images, or the original URL while loading
 */
export function useCachedImage(originalUrl: string | undefined): {
  src: string;
  isLoading: boolean;
  error: boolean;
} {
  const [src, setSrc] = useState(originalUrl || '');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!originalUrl) {
      setIsLoading(false);
      return;
    }

    // Reset state when URL changes
    setSrc(originalUrl);
    setIsLoading(true);
    setError(false);

    let blobUrl: string | null = null;

    async function loadAndCache() {
      // Skip caching for data URLs or if Cache API not available
      if (!originalUrl || originalUrl.startsWith('data:') || !('caches' in window)) {
        setIsLoading(false);
        return;
      }

      const url = originalUrl; // Capture for closure

      try {
        const cache = await caches.open(CACHE_NAME);
        
        // Check if already cached
        const cachedResponse = await cache.match(url);
        
        if (cachedResponse) {
          const blob = await cachedResponse.blob();
          blobUrl = URL.createObjectURL(blob);
          setSrc(blobUrl);
          setIsLoading(false);
          return;
        }

        // Fetch and cache
        const response = await fetch(url, { mode: 'cors' });
        
        if (response.ok) {
          const responseToCache = response.clone();
          await cache.put(url, responseToCache);
          
          const blob = await response.blob();
          blobUrl = URL.createObjectURL(blob);
          setSrc(blobUrl);
        } else {
          setError(true);
        }
      } catch (err) {
        // On error, keep using original URL
        console.warn('Image cache failed:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadAndCache();

    // Cleanup blob URL on unmount
    return () => {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [originalUrl]);

  return { src, isLoading, error };
}
