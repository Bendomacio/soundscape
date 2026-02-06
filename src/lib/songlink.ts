// Shared song.link entity parsing and title cleanup

export interface SonglinkMetadata {
  title: string;
  artist: string;
  albumArt: string;
  album?: string;
}

/**
 * Parse song.link API response entities to extract metadata.
 * Prefers iTunes/Apple Music entities for best quality metadata,
 * falls back to Spotify entities.
 */
export function parseSonglinkEntities(entities: Record<string, unknown>): SonglinkMetadata | null {
  let title = '';
  let artist = '';
  let albumArt = '';
  let album = '';

  // Try iTunes/Apple Music first (best metadata)
  for (const [entityId, entity] of Object.entries(entities)) {
    if (entityId.startsWith('ITUNES_SONG::') || entityId.startsWith('APPLE_MUSIC::')) {
      const e = entity as { title?: string; artistName?: string; thumbnailUrl?: string; albumName?: string };
      title = e.title || '';
      artist = e.artistName || '';
      albumArt = e.thumbnailUrl?.replace('100x100', '600x600') || '';
      album = e.albumName || '';
      break;
    }
  }

  // Fallback to Spotify entity
  if (!title) {
    for (const [entityId, entity] of Object.entries(entities)) {
      if (entityId.startsWith('SPOTIFY_SONG::')) {
        const e = entity as { title?: string; artistName?: string; thumbnailUrl?: string; albumName?: string };
        title = e.title || '';
        artist = e.artistName || '';
        albumArt = e.thumbnailUrl || '';
        album = e.albumName || '';
        break;
      }
    }
  }

  if (!title) return null;

  title = cleanRemasterSuffix(title);

  return { title, artist, albumArt, album };
}

/**
 * Remove remaster suffixes from track titles for cleaner display.
 */
export function cleanRemasterSuffix(title: string): string {
  return title
    .replace(/\s*-\s*\d{4}\s*Remaster(ed)?/gi, '')
    .replace(/\s*\(\d{4}\s*Remaster(ed)?\)/gi, '')
    .replace(/\s*-\s*Remaster(ed)?/gi, '')
    .replace(/\s*\(Remaster(ed)?\)/gi, '')
    .trim();
}
