import type { MusicProviderAdapter, ProviderTrackInfo, EmbedConfig } from './types';

/**
 * SoundCloud provider adapter
 * Uses oEmbed for track info (no auth required)
 * Uses Widget API for full playback (many tracks available for free)
 */
export const soundcloudAdapter: MusicProviderAdapter = {
  provider: 'soundcloud',
  displayName: 'SoundCloud',
  brandColor: '#FF5500',

  detectUrl(input: string): boolean {
    const trimmed = input.trim().toLowerCase();
    return trimmed.includes('soundcloud.com/') && !trimmed.includes('/sets/');
  },

  extractId(input: string): string | null {
    const trimmed = input.trim();

    // SoundCloud uses full URLs as IDs (not numeric IDs like other providers)
    // Format: https://soundcloud.com/artist/track-name
    const match = trimmed.match(/soundcloud\.com\/([^/]+\/[^/?]+)/);
    if (match) {
      // Return the full URL for embedding (SoundCloud embeds use full URL)
      return `https://soundcloud.com/${match[1]}`;
    }

    // If already a full SoundCloud URL, return as-is
    if (trimmed.startsWith('https://soundcloud.com/')) {
      // Remove query params
      return trimmed.split('?')[0];
    }

    return null;
  },

  async getTrackInfo(id: string): Promise<ProviderTrackInfo | null> {
    try {
      // SoundCloud oEmbed API (no auth required)
      const response = await fetch(
        `https://soundcloud.com/oembed?url=${encodeURIComponent(id)}&format=json`
      );

      if (!response.ok) {
        return null;
      }

      const data = await response.json();

      // Parse title - SoundCloud titles often have "Artist - Song" in the title
      let title = data.title || '';
      let artist = data.author_name || '';

      // Try to extract better title/artist from title if format is "Song by Artist"
      // SoundCloud oEmbed returns title as "Song Title" and author_name as artist

      return {
        title,
        artist,
        albumArt: data.thumbnail_url
      };
    } catch (error) {
      console.error('SoundCloud getTrackInfo error:', error);
      return null;
    }
  },

  getEmbedConfig(id: string): EmbedConfig {
    // SoundCloud widget uses URL encoding
    const encodedUrl = encodeURIComponent(id);
    return {
      type: 'widget',
      url: `https://w.soundcloud.com/player/?url=${encodedUrl}&color=%23ff5500&auto_play=true&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false&visual=false`,
      width: '100%',
      height: 166,
      allow: 'autoplay',
      frameBorder: 'no'
    };
  },

  buildUrl(id: string): string {
    // ID is already the full URL for SoundCloud
    return id;
  }
};
