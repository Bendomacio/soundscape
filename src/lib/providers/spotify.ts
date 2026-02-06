import type { MusicProviderAdapter, ProviderTrackInfo, EmbedConfig } from './types';
import { parseSonglinkEntities } from '../songlink';

/**
 * Spotify provider adapter
 * Uses oEmbed for track info (no auth required)
 * Uses IFrame API or Web Playback SDK for playback
 */
export const spotifyAdapter: MusicProviderAdapter = {
  provider: 'spotify',
  displayName: 'Spotify',
  brandColor: '#1DB954',

  detectUrl(input: string): boolean {
    const trimmed = input.trim().toLowerCase();
    return (
      trimmed.includes('open.spotify.com/track/') ||
      trimmed.includes('spotify.com/track/') ||
      trimmed.startsWith('spotify:track:') ||
      // 22-character alphanumeric ID (only if it looks like just an ID)
      /^[a-zA-Z0-9]{22}$/.test(input.trim())
    );
  },

  extractId(input: string): string | null {
    const trimmed = input.trim();

    // spotify:track:xxx format
    if (trimmed.startsWith('spotify:track:')) {
      return trimmed.replace('spotify:track:', '');
    }

    // URL format: https://open.spotify.com/track/xxx?si=...
    const urlMatch = trimmed.match(/open\.spotify\.com\/track\/([a-zA-Z0-9]+)/);
    if (urlMatch) {
      return urlMatch[1];
    }

    // Just the 22-character ID
    if (/^[a-zA-Z0-9]{22}$/.test(trimmed)) {
      return trimmed;
    }

    return null;
  },

  async getTrackInfo(id: string, retries: number = 3): Promise<ProviderTrackInfo | null> {
    try {
      // Use song.link API via proxy to avoid CORS issues
      const spotifyUrl = `https://open.spotify.com/track/${id}`;
      const encoded = encodeURIComponent(spotifyUrl);

      const response = await fetch(`/api/songlink?url=${encoded}`);

      if (response.status === 429) {
        if (retries <= 0) {
          console.error('Spotify getTrackInfo: rate limit retries exhausted');
          return null;
        }
        // Rate limited - wait and retry
        await new Promise(resolve => setTimeout(resolve, 5000));
        return this.getTrackInfo(id, retries - 1);
      }

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      const entities = data.entitiesByUniqueId || {};

      // Use shared entity parser
      const parsed = parseSonglinkEntities(entities);
      if (!parsed) return null;

      return { title: parsed.title, artist: parsed.artist, albumArt: parsed.albumArt };
    } catch (error) {
      console.error('Spotify getTrackInfo error:', error);
      return null;
    }
  },

  getEmbedConfig(id: string): EmbedConfig {
    return {
      type: 'iframe',
      url: `https://open.spotify.com/embed/track/${id}?utm_source=generator&theme=0`,
      width: '100%',
      height: 80,
      allow: 'autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture',
      frameBorder: '0'
    };
  },

  buildUrl(id: string): string {
    return `https://open.spotify.com/track/${id}`;
  }
};
