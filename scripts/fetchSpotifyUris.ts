/**
 * Fetch Spotify URIs for songs using the song.link (Odesli) API
 *
 * Usage: npx tsx scripts/fetchSpotifyUris.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface SongRow {
  id: string;
  title: string;
  artist: string;
  album: string;
  spotify_uri: string;
  youtube_id: string;
  apple_music_id: string;
  soundcloud_url: string;
  latitude: string;
  longitude: string;
  location_name: string;
  location_description: string;
  tags: string;
  status: string;
}

interface OdesliResponse {
  entityUniqueId?: string;
  linksByPlatform?: {
    spotify?: {
      url?: string;
      entityUniqueId?: string;
    };
    youtube?: {
      url?: string;
      entityUniqueId?: string;
    };
    youtubeMusic?: {
      url?: string;
      entityUniqueId?: string;
    };
    appleMusic?: {
      url?: string;
      entityUniqueId?: string;
    };
  };
  entitiesByUniqueId?: Record<string, {
    id?: string;
    type?: string;
    title?: string;
    artistName?: string;
  }>;
}

// Parse CSV manually (simple parser for our known format)
function parseCSV(content: string): SongRow[] {
  const lines = content.split('\n');
  const headers = parseCSVLine(lines[0]);
  const rows: SongRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = parseCSVLine(line);
    const row: Record<string, string> = {};

    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });

    rows.push(row as unknown as SongRow);
  }

  return rows;
}

// Parse a single CSV line handling quoted fields
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"' && !inQuotes) {
      inQuotes = true;
    } else if (char === '"' && inQuotes) {
      if (nextChar === '"') {
        current += '"';
        i++; // Skip next quote
      } else {
        inQuotes = false;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);

  return result;
}

// Convert row back to CSV line
function toCSVLine(row: SongRow): string {
  const values = [
    row.id || '',
    row.title || '',
    row.artist || '',
    row.album || '',
    row.spotify_uri || '',
    row.youtube_id || '',
    row.apple_music_id || '',
    row.soundcloud_url || '',
    row.latitude || '',
    row.longitude || '',
    row.location_name || '',
    row.location_description || '',
    row.tags || '',
    row.status || ''
  ];

  return values.map(v => {
    const str = String(v);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }).join(',');
}

// Search song.link API
async function searchSongLink(title: string, artist: string): Promise<OdesliResponse | null> {
  // Clean up artist name (remove "feat." parts for cleaner search)
  const cleanArtist = artist.split(/\s+(feat\.|ft\.|featuring)/i)[0].trim();

  // Try searching via YouTube Music search URL (works better than direct API search)
  const searchQuery = encodeURIComponent(`${cleanArtist} ${title}`);
  const searchUrl = `https://music.youtube.com/search?q=${searchQuery}`;

  try {
    const response = await fetch(
      `https://api.song.link/v1-alpha.1/links?url=${encodeURIComponent(searchUrl)}&userCountry=US`
    );

    if (response.ok) {
      return await response.json();
    }
  } catch (e) {
    // YouTube Music search didn't work, try Spotify search URL
  }

  // Fallback: Try Spotify search URL
  const spotifySearchUrl = `https://open.spotify.com/search/${searchQuery}`;
  try {
    const response = await fetch(
      `https://api.song.link/v1-alpha.1/links?url=${encodeURIComponent(spotifySearchUrl)}&userCountry=US`
    );

    if (response.ok) {
      return await response.json();
    }
  } catch (e) {
    // Spotify search also failed
  }

  return null;
}

// Alternative: Direct search using a known track URL pattern
async function searchByArtistTitle(title: string, artist: string): Promise<{ spotifyUri?: string; youtubeId?: string } | null> {
  const cleanArtist = artist.split(/\s+(feat\.|ft\.|featuring)/i)[0].trim();
  const searchQuery = `${cleanArtist} ${title}`;

  // Use DuckDuckGo to find YouTube video
  // Actually, let's try a different approach - use the iTunes Search API which is free
  const itunesUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(searchQuery)}&media=music&limit=1`;

  try {
    const itunesResponse = await fetch(itunesUrl);
    if (itunesResponse.ok) {
      const itunesData = await itunesResponse.json();
      if (itunesData.results && itunesData.results.length > 0) {
        const track = itunesData.results[0];
        // Get the Apple Music URL and convert via song.link
        const appleUrl = track.trackViewUrl;

        if (appleUrl) {
          const songLinkResponse = await fetch(
            `https://api.song.link/v1-alpha.1/links?url=${encodeURIComponent(appleUrl)}&userCountry=US`
          );

          if (songLinkResponse.ok) {
            const data: OdesliResponse = await songLinkResponse.json();

            let spotifyUri: string | undefined;
            let youtubeId: string | undefined;

            // Extract Spotify URI
            if (data.linksByPlatform?.spotify?.url) {
              const spotifyUrl = data.linksByPlatform.spotify.url;
              const match = spotifyUrl.match(/track\/([a-zA-Z0-9]+)/);
              if (match) {
                spotifyUri = `spotify:track:${match[1]}`;
              }
            }

            // Extract YouTube ID
            if (data.linksByPlatform?.youtube?.url) {
              const ytUrl = data.linksByPlatform.youtube.url;
              const match = ytUrl.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
              if (match) {
                youtubeId = match[1];
              }
            }

            return { spotifyUri, youtubeId };
          }
        }
      }
    }
  } catch (e) {
    console.error(`  Error searching for "${title}" by ${artist}:`, e);
  }

  return null;
}

async function main() {
  const inputPath = path.join(__dirname, '../data/import_songs.csv');
  const outputPath = path.join(__dirname, '../data/import_songs_with_uris.csv');

  console.log('Reading CSV...');
  const content = fs.readFileSync(inputPath, 'utf-8');
  const rows = parseCSV(content);

  console.log(`Found ${rows.length} songs to process\n`);

  let processed = 0;
  let found = 0;
  let notFound = 0;

  for (const row of rows) {
    processed++;
    console.log(`[${processed}/${rows.length}] "${row.title}" by ${row.artist}`);

    // Skip if already has Spotify URI
    if (row.spotify_uri) {
      console.log(`  Already has Spotify URI: ${row.spotify_uri}`);
      found++;
      continue;
    }

    // Rate limit: 1 request per second
    await new Promise(resolve => setTimeout(resolve, 1000));

    const result = await searchByArtistTitle(row.title, row.artist);

    if (result) {
      if (result.spotifyUri) {
        row.spotify_uri = result.spotifyUri;
        console.log(`  ✓ Spotify: ${result.spotifyUri}`);
        found++;
      } else {
        console.log(`  ✗ No Spotify URI found`);
        notFound++;
      }

      if (result.youtubeId && !row.youtube_id) {
        row.youtube_id = result.youtubeId;
        console.log(`  ✓ YouTube: ${result.youtubeId}`);
      }
    } else {
      console.log(`  ✗ No results found`);
      notFound++;
    }
  }

  // Write output
  const headers = 'id,title,artist,album,spotify_uri,youtube_id,apple_music_id,soundcloud_url,latitude,longitude,location_name,location_description,tags,status';
  const outputLines = [headers, ...rows.map(toCSVLine)];
  fs.writeFileSync(outputPath, outputLines.join('\n'), 'utf-8');

  console.log(`\n${'='.repeat(50)}`);
  console.log(`Results:`);
  console.log(`  Total: ${rows.length}`);
  console.log(`  Found: ${found}`);
  console.log(`  Not Found: ${notFound}`);
  console.log(`\nOutput saved to: ${outputPath}`);
}

main().catch(console.error);
