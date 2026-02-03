import type { MusicProviderAdapter, ProviderTrackInfo, EmbedConfig } from './types';

/**
 * Apple Music provider adapter
 * Uses iTunes Search API for track info (no auth required)
 * Uses embed player for 30-second previews
 */
export const appleMusicAdapter: MusicProviderAdapter = {
  provider: 'apple_music',
  displayName: 'Apple Music',
  brandColor: '#FC3C44',

  detectUrl(input: string): boolean {
    const trimmed = input.trim().toLowerCase();
    return (
      trimmed.includes('music.apple.com') &&
      (trimmed.includes('/song/') || trimmed.includes('/album/'))
    );
  },

  extractId(input: string): string | null {
    const trimmed = input.trim();

    // music.apple.com/us/song/song-name/1234567890
    // music.apple.com/us/album/album-name/1234567890?i=1234567891 (song within album)
    const songMatch = trimmed.match(/music\.apple\.com\/[a-z]{2}\/song\/[^/]+\/(\d+)/);
    if (songMatch) {
      return songMatch[1];
    }

    // Album URL with song param: ?i=songId
    const albumSongMatch = trimmed.match(/music\.apple\.com\/[a-z]{2}\/album\/[^?]+\?i=(\d+)/);
    if (albumSongMatch) {
      return albumSongMatch[1];
    }

    // Just a numeric ID
    if (/^\d{7,12}$/.test(trimmed)) {
      return trimmed;
    }

    return null;
  },

  async getTrackInfo(id: string): Promise<ProviderTrackInfo | null> {
    try {
      // iTunes Search/Lookup API (no auth required)
      const response = await fetch(
        `https://itunes.apple.com/lookup?id=${id}&entity=song`
      );

      if (!response.ok) {
        return null;
      }

      const data = await response.json();

      if (!data.results || data.results.length === 0) {
        return null;
      }

      const track = data.results[0];

      return {
        title: track.trackName || track.collectionName || '',
        artist: track.artistName || '',
        albumArt: track.artworkUrl100?.replace('100x100', '300x300') || track.artworkUrl60,
        duration: track.trackTimeMillis,
        previewUrl: track.previewUrl
      };
    } catch (error) {
      console.error('Apple Music getTrackInfo error:', error);
      return null;
    }
  },

  getEmbedConfig(id: string): EmbedConfig {
    return {
      type: 'iframe',
      url: `https://embed.music.apple.com/us/song/${id}?app=music`,
      width: '100%',
      height: 150,
      allow: 'autoplay *; encrypted-media *; fullscreen *',
      frameBorder: '0'
    };
  },

  buildUrl(id: string): string {
    // Note: This is a simplified URL - real URLs include song name
    return `https://music.apple.com/us/song/${id}`;
  }
};
