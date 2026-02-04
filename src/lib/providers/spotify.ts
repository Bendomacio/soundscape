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
      // Use song.link API via proxy to avoid CORS issues
      const spotifyUrl = `https://open.spotify.com/track/${id}`;
      const encoded = encodeURIComponent(spotifyUrl);

      const response = await fetch(`/api/songlink?url=${encoded}`);

      if (response.status === 429) {
        // Rate limited - wait and retry once
        await new Promise(resolve => setTimeout(resolve, 5000));
        return this.getTrackInfo(id);
      }

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      const entities = data.entitiesByUniqueId || {};

      let title = '';
      let artist = '';
      let albumArt = '';

      // Try iTunes/Apple Music first
      for (const [entityId, entity] of Object.entries(entities)) {
        if (entityId.startsWith('ITUNES_SONG::') || entityId.startsWith('APPLE_MUSIC::')) {
          const e = entity as { title?: string; artistName?: string; thumbnailUrl?: string };
          title = e.title || '';
          artist = e.artistName || '';
          albumArt = e.thumbnailUrl?.replace('100x100', '600x600') || '';
          break;
        }
      }

      // Fallback to Spotify entity
      if (!title) {
        for (const [entityId, entity] of Object.entries(entities)) {
          if (entityId.startsWith('SPOTIFY_SONG::')) {
            const e = entity as { title?: string; artistName?: string; thumbnailUrl?: string };
            title = e.title || '';
            artist = e.artistName || '';
            albumArt = e.thumbnailUrl || '';
            break;
          }
        }
      }

      if (!title) return null;

      // Clean up title (remove remaster suffixes)
      title = title
        .replace(/\s*-\s*\d{4}\s*Remaster(ed)?/gi, '')
        .replace(/\s*\(\d{4}\s*Remaster(ed)?\)/gi, '')
        .replace(/\s*-\s*Remaster(ed)?/gi, '')
        .replace(/\s*\(Remaster(ed)?\)/gi, '')
        .trim();

      return { title, artist, albumArt };
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
