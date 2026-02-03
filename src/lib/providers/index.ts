import type { MusicProvider, ProviderLinks, SongLocation } from '../../types';
import type { MusicProviderAdapter, ProviderTrackInfo, EmbedConfig } from './types';
import { spotifyAdapter } from './spotify';
import { youtubeAdapter } from './youtube';
import { appleMusicAdapter } from './appleMusic';
import { soundcloudAdapter } from './soundcloud';

// Export types
export type { MusicProviderAdapter, ProviderTrackInfo, EmbedConfig };

// Provider registry
export const providers: Record<MusicProvider, MusicProviderAdapter> = {
  spotify: spotifyAdapter,
  youtube: youtubeAdapter,
  apple_music: appleMusicAdapter,
  soundcloud: soundcloudAdapter
};

// Default provider priority (used when user preference doesn't have a link)
export const defaultProviderPriority: MusicProvider[] = [
  'spotify',
  'youtube',
  'apple_music',
  'soundcloud'
];

/**
 * Detect which provider a URL/input belongs to
 * Returns null if no provider matches
 */
export function detectProvider(input: string): MusicProvider | null {
  if (!input || typeof input !== 'string') return null;

  const trimmed = input.trim();
  if (!trimmed) return null;

  for (const [provider, adapter] of Object.entries(providers)) {
    if (adapter.detectUrl(trimmed)) {
      return provider as MusicProvider;
    }
  }

  return null;
}

/**
 * Get adapter for a specific provider
 */
export function getAdapter(provider: MusicProvider): MusicProviderAdapter {
  return providers[provider];
}

/**
 * Extract provider ID from a URL/input using the detected provider
 */
export function extractProviderId(input: string): { provider: MusicProvider; id: string } | null {
  const provider = detectProvider(input);
  if (!provider) return null;

  const adapter = getAdapter(provider);
  const id = adapter.extractId(input);
  if (!id) return null;

  return { provider, id };
}

/**
 * Get track info for any supported provider URL
 */
export async function getTrackInfoFromUrl(
  input: string
): Promise<{ provider: MusicProvider; id: string; info: ProviderTrackInfo } | null> {
  const extracted = extractProviderId(input);
  if (!extracted) return null;

  const adapter = getAdapter(extracted.provider);
  const info = await adapter.getTrackInfo(extracted.id);
  if (!info) return null;

  return {
    provider: extracted.provider,
    id: extracted.id,
    info
  };
}

/**
 * Get the best available provider for a song based on user preference
 * Returns the provider and its ID, falling back through providers if needed
 */
export function getBestProvider(
  song: SongLocation,
  userPreference?: MusicProvider
): { provider: MusicProvider; id: string } | null {
  // Build available providers map
  const available: Partial<Record<MusicProvider, string>> = {};

  // Check spotifyUri (legacy field)
  if (song.spotifyUri) {
    const id = song.spotifyUri.replace('spotify:track:', '');
    available.spotify = id;
  }

  // Check providerLinks (new field)
  if (song.providerLinks) {
    if (song.providerLinks.spotify) {
      available.spotify = song.providerLinks.spotify.replace('spotify:track:', '');
    }
    if (song.providerLinks.youtube) {
      available.youtube = song.providerLinks.youtube;
    }
    if (song.providerLinks.appleMusic) {
      available.apple_music = song.providerLinks.appleMusic;
    }
    if (song.providerLinks.soundcloud) {
      available.soundcloud = song.providerLinks.soundcloud;
    }
  }

  // If no providers available, return null
  const availableProviders = Object.keys(available) as MusicProvider[];
  if (availableProviders.length === 0) {
    return null;
  }

  // If user has a preference and it's available, use it
  if (userPreference && available[userPreference]) {
    return { provider: userPreference, id: available[userPreference]! };
  }

  // Fall back through default priority
  for (const provider of defaultProviderPriority) {
    if (available[provider]) {
      return { provider, id: available[provider]! };
    }
  }

  // Return first available (shouldn't reach here normally)
  const firstProvider = availableProviders[0];
  return { provider: firstProvider, id: available[firstProvider]! };
}

/**
 * Get embed config for a song using the best available provider
 */
export function getEmbedConfigForSong(
  song: SongLocation,
  userPreference?: MusicProvider
): { provider: MusicProvider; config: EmbedConfig } | null {
  const best = getBestProvider(song, userPreference);
  if (!best) return null;

  const adapter = getAdapter(best.provider);
  const config = adapter.getEmbedConfig(best.id);

  return { provider: best.provider, config };
}

/**
 * Check if a song has any playable provider link
 */
export function hasPlayableLink(song: SongLocation): boolean {
  // Check legacy spotifyUri
  if (song.spotifyUri) return true;

  // Check providerLinks
  if (song.providerLinks) {
    return !!(
      song.providerLinks.spotify ||
      song.providerLinks.youtube ||
      song.providerLinks.appleMusic ||
      song.providerLinks.soundcloud
    );
  }

  return false;
}

/**
 * Get all available providers for a song
 */
export function getAvailableProviders(song: SongLocation): MusicProvider[] {
  const available: MusicProvider[] = [];

  // Check legacy spotifyUri
  if (song.spotifyUri) {
    available.push('spotify');
  }

  // Check providerLinks
  if (song.providerLinks) {
    if (song.providerLinks.spotify && !available.includes('spotify')) {
      available.push('spotify');
    }
    if (song.providerLinks.youtube) {
      available.push('youtube');
    }
    if (song.providerLinks.appleMusic) {
      available.push('apple_music');
    }
    if (song.providerLinks.soundcloud) {
      available.push('soundcloud');
    }
  }

  return available;
}

/**
 * Convert providerLinks to individual fields for database storage
 */
export function providerLinksToDb(links: ProviderLinks | undefined): {
  spotify_uri?: string;
  youtube_id?: string;
  apple_music_id?: string;
  soundcloud_url?: string;
} {
  if (!links) return {};

  return {
    spotify_uri: links.spotify ? `spotify:track:${links.spotify.replace('spotify:track:', '')}` : undefined,
    youtube_id: links.youtube,
    apple_music_id: links.appleMusic,
    soundcloud_url: links.soundcloud
  };
}

/**
 * Convert database fields to providerLinks
 */
export function dbToProviderLinks(row: {
  spotify_uri?: string | null;
  youtube_id?: string | null;
  apple_music_id?: string | null;
  soundcloud_url?: string | null;
}): ProviderLinks | undefined {
  const links: ProviderLinks = {};
  let hasAny = false;

  if (row.spotify_uri) {
    links.spotify = row.spotify_uri.replace('spotify:track:', '');
    hasAny = true;
  }
  if (row.youtube_id) {
    links.youtube = row.youtube_id;
    hasAny = true;
  }
  if (row.apple_music_id) {
    links.appleMusic = row.apple_music_id;
    hasAny = true;
  }
  if (row.soundcloud_url) {
    links.soundcloud = row.soundcloud_url;
    hasAny = true;
  }

  return hasAny ? links : undefined;
}
