/**
 * Spotify URI Lookup via iTunes + song.link
 *
 * This approach doesn't require Spotify API access:
 * 1. Search iTunes API for the song (free, no auth)
 * 2. Pass iTunes URL to song.link/Odesli API to get cross-platform links
 * 3. Extract Spotify URI from the response
 */

interface ITunesResult {
  trackId: number;
  trackName: string;
  artistName: string;
  collectionName?: string;
  trackViewUrl: string;
  artworkUrl100?: string;
}

interface ITunesResponse {
  resultCount: number;
  results: ITunesResult[];
}

interface SongLinkResponse {
  entityUniqueId: string;
  linksByPlatform?: {
    spotify?: {
      entityUniqueId: string;
      url: string;
    };
    youtube?: {
      entityUniqueId: string;
      url: string;
    };
    appleMusic?: {
      entityUniqueId: string;
      url: string;
    };
  };
}

export interface SpotifyLookupResult {
  spotifyUri: string | null;
  spotifyUrl: string | null;
  youtubeId: string | null;
  appleMusicId: string | null;
  albumArt: string | null;
  matchedTitle: string;
  matchedArtist: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface LookupProgress {
  current: number;
  total: number;
  songTitle: string;
  status: 'searching' | 'found' | 'not_found' | 'error' | 'rate_limited';
}

/**
 * Search iTunes for a song
 */
async function searchItunes(title: string, artist: string): Promise<ITunesResult | null> {
  try {
    // Clean up search terms
    const cleanTitle = title.replace(/[^\w\s]/g, ' ').trim();
    const cleanArtist = artist.replace(/[^\w\s]/g, ' ').trim();
    const query = encodeURIComponent(`${cleanTitle} ${cleanArtist}`);

    const response = await fetch(
      `https://itunes.apple.com/search?term=${query}&media=music&entity=song&limit=5`
    );

    if (!response.ok) {
      console.warn('iTunes search failed:', response.status);
      return null;
    }

    const data: ITunesResponse = await response.json();

    if (data.resultCount === 0) {
      return null;
    }

    // Find best match by comparing title and artist
    const normalizedTitle = cleanTitle.toLowerCase();
    const normalizedArtist = cleanArtist.toLowerCase();

    // First try exact match
    for (const result of data.results) {
      const resultTitle = result.trackName.toLowerCase();
      const resultArtist = result.artistName.toLowerCase();

      if (resultTitle === normalizedTitle && resultArtist.includes(normalizedArtist)) {
        return result;
      }
    }

    // Then try partial match
    for (const result of data.results) {
      const resultTitle = result.trackName.toLowerCase();
      const resultArtist = result.artistName.toLowerCase();

      if (resultTitle.includes(normalizedTitle) || normalizedTitle.includes(resultTitle)) {
        if (resultArtist.includes(normalizedArtist) || normalizedArtist.includes(resultArtist)) {
          return result;
        }
      }
    }

    // Return first result as fallback
    return data.results[0];
  } catch (error) {
    console.error('iTunes search error:', error);
    return null;
  }
}

/**
 * Get cross-platform links from song.link/Odesli
 */
async function getSongLinks(itunesUrl: string): Promise<SongLinkResponse | null> {
  try {
    const encoded = encodeURIComponent(itunesUrl);
    const response = await fetch(`https://api.song.link/v1-alpha.1/links?url=${encoded}`);

    if (!response.ok) {
      if (response.status === 429) {
        // Rate limited - throw specific error
        throw new Error('RATE_LIMITED');
      }
      console.warn('song.link lookup failed:', response.status);
      return null;
    }

    return await response.json();
  } catch (error) {
    if (error instanceof Error && error.message === 'RATE_LIMITED') {
      throw error;
    }
    console.error('song.link error:', error);
    return null;
  }
}

/**
 * Extract Spotify track ID from song.link entity ID
 * Format: SPOTIFY_SONG::4cOdK2wGLETKBW3PvgPWqT
 */
function extractSpotifyId(entityId: string): string | null {
  if (entityId.startsWith('SPOTIFY_SONG::')) {
    return entityId.replace('SPOTIFY_SONG::', '');
  }
  return null;
}

/**
 * Extract YouTube video ID from song.link entity ID
 * Format: YOUTUBE_VIDEO::dQw4w9WgXcQ
 */
function extractYoutubeId(entityId: string): string | null {
  if (entityId.startsWith('YOUTUBE_VIDEO::')) {
    return entityId.replace('YOUTUBE_VIDEO::', '');
  }
  return null;
}

/**
 * Extract Apple Music ID from song.link entity ID
 * Format: ITUNES_SONG::123456789
 */
function extractAppleMusicId(entityId: string): string | null {
  if (entityId.startsWith('ITUNES_SONG::')) {
    return entityId.replace('ITUNES_SONG::', '');
  }
  return null;
}

/**
 * Look up Spotify URI for a song using iTunes + song.link
 */
export async function lookupSpotifyUri(
  title: string,
  artist: string
): Promise<SpotifyLookupResult> {
  // Step 1: Search iTunes
  const itunesResult = await searchItunes(title, artist);

  if (!itunesResult) {
    return {
      spotifyUri: null,
      spotifyUrl: null,
      youtubeId: null,
      appleMusicId: null,
      albumArt: null,
      matchedTitle: title,
      matchedArtist: artist,
      confidence: 'low'
    };
  }

  // Step 2: Get cross-platform links from song.link
  const songLinks = await getSongLinks(itunesResult.trackViewUrl);

  let spotifyUri: string | null = null;
  let spotifyUrl: string | null = null;
  let youtubeId: string | null = null;
  let appleMusicId: string | null = null;

  if (songLinks?.linksByPlatform) {
    // Extract Spotify
    if (songLinks.linksByPlatform.spotify) {
      const spotifyId = extractSpotifyId(songLinks.linksByPlatform.spotify.entityUniqueId);
      if (spotifyId) {
        spotifyUri = `spotify:track:${spotifyId}`;
        spotifyUrl = songLinks.linksByPlatform.spotify.url;
      }
    }

    // Extract YouTube
    if (songLinks.linksByPlatform.youtube) {
      youtubeId = extractYoutubeId(songLinks.linksByPlatform.youtube.entityUniqueId);
    }

    // Extract Apple Music
    if (songLinks.linksByPlatform.appleMusic) {
      appleMusicId = extractAppleMusicId(songLinks.linksByPlatform.appleMusic.entityUniqueId);
    }
  }

  // Calculate confidence based on title/artist match
  const titleMatch = itunesResult.trackName.toLowerCase() === title.toLowerCase();
  const artistMatch = itunesResult.artistName.toLowerCase().includes(artist.toLowerCase()) ||
                      artist.toLowerCase().includes(itunesResult.artistName.toLowerCase());

  let confidence: 'high' | 'medium' | 'low' = 'low';
  if (titleMatch && artistMatch) {
    confidence = 'high';
  } else if (titleMatch || artistMatch) {
    confidence = 'medium';
  }

  // Get higher resolution album art
  const albumArt = itunesResult.artworkUrl100?.replace('100x100', '600x600') || null;

  return {
    spotifyUri,
    spotifyUrl,
    youtubeId,
    appleMusicId,
    albumArt,
    matchedTitle: itunesResult.trackName,
    matchedArtist: itunesResult.artistName,
    confidence
  };
}

/**
 * Batch lookup Spotify URIs with rate limiting
 * @param songs Array of {title, artist} objects
 * @param onProgress Progress callback
 * @param delayMs Delay between requests (default 1500ms)
 */
export async function batchLookupSpotifyUris(
  songs: Array<{ id: string; title: string; artist: string }>,
  onProgress?: (progress: LookupProgress) => void,
  delayMs: number = 1500
): Promise<Map<string, SpotifyLookupResult>> {
  const results = new Map<string, SpotifyLookupResult>();

  for (let i = 0; i < songs.length; i++) {
    const song = songs[i];

    onProgress?.({
      current: i + 1,
      total: songs.length,
      songTitle: song.title,
      status: 'searching'
    });

    try {
      const result = await lookupSpotifyUri(song.title, song.artist);
      results.set(song.id, result);

      onProgress?.({
        current: i + 1,
        total: songs.length,
        songTitle: song.title,
        status: result.spotifyUri ? 'found' : 'not_found'
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'RATE_LIMITED') {
        onProgress?.({
          current: i + 1,
          total: songs.length,
          songTitle: song.title,
          status: 'rate_limited'
        });

        // Wait longer on rate limit
        await new Promise(resolve => setTimeout(resolve, 5000));

        // Retry once
        try {
          const result = await lookupSpotifyUri(song.title, song.artist);
          results.set(song.id, result);
        } catch {
          results.set(song.id, {
            spotifyUri: null,
            spotifyUrl: null,
            youtubeId: null,
            appleMusicId: null,
            albumArt: null,
            matchedTitle: song.title,
            matchedArtist: song.artist,
            confidence: 'low'
          });
        }
      } else {
        onProgress?.({
          current: i + 1,
          total: songs.length,
          songTitle: song.title,
          status: 'error'
        });

        results.set(song.id, {
          spotifyUri: null,
          spotifyUrl: null,
          youtubeId: null,
          appleMusicId: null,
          albumArt: null,
          matchedTitle: song.title,
          matchedArtist: song.artist,
          confidence: 'low'
        });
      }
    }

    // Rate limit delay between requests
    if (i < songs.length - 1) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  return results;
}
