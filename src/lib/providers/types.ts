import type { MusicProvider } from '../../types';

/**
 * Track information returned by provider adapters
 */
export interface ProviderTrackInfo {
  title: string;
  artist: string;
  albumArt?: string;
  duration?: number; // in milliseconds
  previewUrl?: string;
}

/**
 * Embed configuration for rendering player
 */
export interface EmbedConfig {
  type: 'iframe' | 'widget';
  url: string;
  width: string | number;
  height: number;
  allow?: string;
  frameBorder?: string;
}

/**
 * Base interface for music provider adapters
 */
export interface MusicProviderAdapter {
  /** Provider identifier */
  provider: MusicProvider;

  /** Display name for UI */
  displayName: string;

  /** Brand color for UI */
  brandColor: string;

  /** Check if input matches this provider's URL patterns */
  detectUrl(input: string): boolean;

  /** Extract provider-specific ID from URL or input */
  extractId(input: string): string | null;

  /** Fetch track information using oEmbed or API */
  getTrackInfo(id: string): Promise<ProviderTrackInfo | null>;

  /** Get embed configuration for player */
  getEmbedConfig(id: string): EmbedConfig;

  /** Build a canonical URL from the ID */
  buildUrl(id: string): string;
}
