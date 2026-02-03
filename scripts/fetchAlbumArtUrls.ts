/**
 * Fetch album art URLs from Spotify oEmbed for songs missing art
 * Outputs SQL UPDATE statements to run via Supabase MCP
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import { fileURLToPath } from 'url';
import * as path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = 'https://tairuapqunhrpzkvoxor.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_bmz8-P_JcBK4606s5utiUA_E9GPrN9i';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

interface SpotifyOEmbed {
  title: string;
  thumbnail_url: string;
}

async function fetchSpotifyArt(trackId: string): Promise<string | null> {
  try {
    const response = await fetch(
      `https://open.spotify.com/oembed?url=https://open.spotify.com/track/${trackId}`
    );

    if (!response.ok) {
      if (response.status === 429) {
        const retryAfter = parseInt(response.headers.get('Retry-After') || '5');
        console.log(`  Rate limited, waiting ${retryAfter}s...`);
        await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
        return fetchSpotifyArt(trackId);
      }
      return null;
    }

    const data: SpotifyOEmbed = await response.json();
    return data.thumbnail_url;
  } catch {
    return null;
  }
}

async function main() {
  console.log('Fetching songs missing album art...\n');

  const { data: songs, error } = await supabase
    .from('songs')
    .select('id, title, artist, spotify_uri, album_art')
    .or('album_art.is.null,album_art.eq.');

  if (error || !songs) {
    console.error('Failed to fetch songs:', error);
    return;
  }

  const needsArt = songs.filter(s => s.spotify_uri && (!s.album_art || s.album_art === ''));
  console.log(`Found ${needsArt.length} songs needing album art\n`);

  const updates: Array<{id: string, url: string}> = [];

  for (let i = 0; i < needsArt.length; i++) {
    const song = needsArt[i];
    const trackId = song.spotify_uri?.replace('spotify:track:', '');

    console.log(`[${i + 1}/${needsArt.length}] ${song.title} - ${song.artist}`);

    if (!trackId) {
      console.log('  No track ID');
      continue;
    }

    const albumArt = await fetchSpotifyArt(trackId);

    if (albumArt) {
      console.log(`  ✓ ${albumArt.slice(0, 60)}...`);
      updates.push({ id: song.id, url: albumArt });
    } else {
      console.log('  ✗ Failed');
    }

    // Rate limit: 1.5 seconds between requests
    if (i < needsArt.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1500));
    }
  }

  // Output as JSON for further processing
  const outputPath = path.join(__dirname, '../data/album_art_updates.json');
  fs.writeFileSync(outputPath, JSON.stringify(updates, null, 2));
  console.log(`\n✓ Saved ${updates.length} updates to ${outputPath}`);
}

main().catch(console.error);
