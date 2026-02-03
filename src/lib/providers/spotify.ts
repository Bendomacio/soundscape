import type { MusicProviderAdapter, ProviderTrackInfo, EmbedConfig } from './types';

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

  async getTrackInfo(id: string): Promise<ProviderTrackInfo | null> {
    try {
      const response = await fetch(
        `https://open.spotify.com/oembed?url=https://open.spotify.com/track/${id}`
      );

      if (response.status === 429) {
        // Rate limited - wait and retry once
        const retryAfter = parseInt(response.headers.get('Retry-After') || '5');
        await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
        return this.getTrackInfo(id);
      }

      if (!response.ok) {
        return null;
      }

      const data = await response.json();

      // Clean up title (remove remaster suffixes)
      let title = data.title || '';
      title = title
        .replace(/\s*-\s*\d{4}\s*Remaster(ed)?/gi, '')
        .replace(/\s*\(\d{4}\s*Remaster(ed)?\)/gi, '')
        .replace(/\s*-\s*Remaster(ed)?/gi, '')
        .replace(/\s*\(Remaster(ed)?\)/gi, '')
        .trim();

      return {
        title,
        artist: '', // oEmbed doesn't provide artist
        albumArt: data.thumbnail_url
      };
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
