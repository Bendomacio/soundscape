import type { MusicProviderAdapter, ProviderTrackInfo, EmbedConfig } from './types';

/**
 * YouTube provider adapter
 * Uses oEmbed for track info (no auth required)
 * Uses IFrame API for playback (full playback, with ads)
 */
export const youtubeAdapter: MusicProviderAdapter = {
  provider: 'youtube',
  displayName: 'YouTube',
  brandColor: '#FF0000',

  detectUrl(input: string): boolean {
    const trimmed = input.trim().toLowerCase();
    return (
      trimmed.includes('youtube.com/watch') ||
      trimmed.includes('youtu.be/') ||
      trimmed.includes('music.youtube.com/watch') ||
      trimmed.includes('youtube.com/embed/')
    );
  },

  extractId(input: string): string | null {
    const trimmed = input.trim();

    // youtube.com/watch?v=xxx
    const watchMatch = trimmed.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
    if (watchMatch) {
      return watchMatch[1];
    }

    // youtu.be/xxx
    const shortMatch = trimmed.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
    if (shortMatch) {
      return shortMatch[1];
    }

    // youtube.com/embed/xxx
    const embedMatch = trimmed.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/);
    if (embedMatch) {
      return embedMatch[1];
    }

    // music.youtube.com/watch?v=xxx
    const musicMatch = trimmed.match(/music\.youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/);
    if (musicMatch) {
      return musicMatch[1];
    }

    // Just the 11-character ID
    if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
      return trimmed;
    }

    return null;
  },

  async getTrackInfo(id: string): Promise<ProviderTrackInfo | null> {
    try {
      // YouTube oEmbed API (no auth required)
      const response = await fetch(
        `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${id}&format=json`
      );

      if (!response.ok) {
        return null;
      }

      const data = await response.json();

      // Parse title - YouTube titles often have "Artist - Song" format
      let title = data.title || '';
      let artist = data.author_name || '';

      // Try to extract artist from title if it contains " - "
      const titleParts = title.split(' - ');
      if (titleParts.length >= 2) {
        artist = titleParts[0].trim();
        title = titleParts.slice(1).join(' - ').trim();
      }

      // Clean up common suffixes
      title = title
        .replace(/\s*\(Official (Music )?Video\)/gi, '')
        .replace(/\s*\[Official (Music )?Video\]/gi, '')
        .replace(/\s*\(Official Audio\)/gi, '')
        .replace(/\s*\[Official Audio\]/gi, '')
        .replace(/\s*\(Lyric(s)? Video\)/gi, '')
        .replace(/\s*\[Lyric(s)? Video\]/gi, '')
        .replace(/\s*\(Audio\)/gi, '')
        .replace(/\s*\(HD\)/gi, '')
        .replace(/\s*\(4K\)/gi, '')
        .trim();

      return {
        title,
        artist,
        // YouTube oEmbed provides thumbnail
        albumArt: `https://img.youtube.com/vi/${id}/hqdefault.jpg`
      };
    } catch (error) {
      console.error('YouTube getTrackInfo error:', error);
      return null;
    }
  },

  getEmbedConfig(id: string): EmbedConfig {
    return {
      type: 'iframe',
      url: `https://www.youtube.com/embed/${id}?autoplay=1&enablejsapi=1`,
      width: '100%',
      height: 152, // YouTube needs more height for controls
      allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture',
      frameBorder: '0'
    };
  },

  buildUrl(id: string): string {
    return `https://www.youtube.com/watch?v=${id}`;
  }
};
