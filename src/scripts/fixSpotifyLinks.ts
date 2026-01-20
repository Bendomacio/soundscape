/**
 * Fix Spotify Links Script
 * 
 * This script searches Spotify for each song and updates the database
 * with the correct track ID (picks the top/most popular result).
 * 
 * SETUP:
 * 1. Go to https://developer.spotify.com/dashboard
 * 2. Create an app (any name, any description)
 * 3. Copy your Client ID and Client Secret
 * 4. Run: SPOTIFY_CLIENT_ID=xxx SPOTIFY_CLIENT_SECRET=yyy npx tsx src/scripts/fixSpotifyLinks.ts
 */

import { createClient } from '@supabase/supabase-js';

// Supabase config
const SUPABASE_URL = 'https://tairuapqunhrpzkvoxor.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhaXJ1YXBxdW5ocnB6a3ZveG9yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5MjUxNjcsImV4cCI6MjA4NDUwMTE2N30.jM3yaOeMajGQCjP80zeRb3APlTUY7iDQv1wUFiaOisI';

// Spotify credentials from environment
const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
  console.error('❌ Missing Spotify credentials!');
  console.error('');
  console.error('To get credentials:');
  console.error('1. Go to https://developer.spotify.com/dashboard');
  console.error('2. Log in and click "Create App"');
  console.error('3. Fill in any name/description, set redirect URI to http://localhost');
  console.error('4. Copy the Client ID and Client Secret');
  console.error('');
  console.error('Then run:');
  console.error('$env:SPOTIFY_CLIENT_ID="your_client_id"; $env:SPOTIFY_CLIENT_SECRET="your_secret"; npx tsx src/scripts/fixSpotifyLinks.ts');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Get Spotify access token using Client Credentials flow
async function getSpotifyToken(): Promise<string> {
  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64')
    },
    body: 'grant_type=client_credentials'
  });

  if (!response.ok) {
    throw new Error(`Failed to get Spotify token: ${response.status}`);
  }

  const data = await response.json();
  return data.access_token;
}

// Search Spotify and return the top result
async function searchSpotify(token: string, title: string, artist: string): Promise<{
  trackId: string;
  name: string;
  artist: string;
  albumArt: string;
  popularity: number;
} | null> {
  // Clean up search query
  const query = `track:${title} artist:${artist}`.replace(/['"]/g, '');
  
  const response = await fetch(
    `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=5`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );

  if (!response.ok) {
    console.error(`  Search failed: ${response.status}`);
    return null;
  }

  const data = await response.json();
  const tracks = data.tracks?.items || [];

  if (tracks.length === 0) {
    // Try a simpler search without track:/artist: prefixes
    const simpleQuery = `${title} ${artist}`;
    const retryResponse = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(simpleQuery)}&type=track&limit=5`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    if (retryResponse.ok) {
      const retryData = await retryResponse.json();
      const retryTracks = retryData.tracks?.items || [];
      if (retryTracks.length > 0) {
        const track = retryTracks[0];
        return {
          trackId: track.id,
          name: track.name,
          artist: track.artists[0]?.name || '',
          albumArt: track.album.images[0]?.url || '',
          popularity: track.popularity
        };
      }
    }
    return null;
  }

  // Return the first (most relevant) result
  const track = tracks[0];
  return {
    trackId: track.id,
    name: track.name,
    artist: track.artists[0]?.name || '',
    albumArt: track.album.images[0]?.url || '',
    popularity: track.popularity
  };
}

async function fixAllSongs() {
  console.log('🎵 Fixing Spotify Links');
  console.log('========================');
  console.log('');

  // Get Spotify token
  console.log('🔑 Getting Spotify access token...');
  const token = await getSpotifyToken();
  console.log('✅ Got token');
  console.log('');

  // Fetch all songs from database
  console.log('📚 Fetching songs from database...');
  const { data: songs, error } = await supabase
    .from('songs')
    .select('*')
    .order('title');

  if (error || !songs) {
    console.error('❌ Failed to fetch songs:', error);
    process.exit(1);
  }

  console.log(`📦 Found ${songs.length} songs`);
  console.log('');

  let fixed = 0;
  let failed = 0;
  let skipped = 0;

  for (let i = 0; i < songs.length; i++) {
    const song = songs[i];
    console.log(`[${i + 1}/${songs.length}] ${song.title} - ${song.artist}`);

    // Search Spotify
    const result = await searchSpotify(token, song.title, song.artist);

    if (!result) {
      console.log(`  ❌ No results found`);
      failed++;
      continue;
    }

    // Check if it looks like the right song
    const titleMatch = result.name.toLowerCase().includes(song.title.toLowerCase().substring(0, 10)) ||
                       song.title.toLowerCase().includes(result.name.toLowerCase().substring(0, 10));
    const artistMatch = result.artist.toLowerCase().includes(song.artist.toLowerCase().split(' ')[0]) ||
                        song.artist.toLowerCase().includes(result.artist.toLowerCase().split(' ')[0]);

    if (!titleMatch && !artistMatch) {
      console.log(`  ⚠️  Mismatch: Found "${result.name}" by "${result.artist}" - skipping`);
      skipped++;
      continue;
    }

    // Update database
    const { error: updateError } = await supabase
      .from('songs')
      .update({
        spotify_uri: `spotify:track:${result.trackId}`,
        album_art: result.albumArt,
        updated_at: new Date().toISOString()
      })
      .eq('id', song.id);

    if (updateError) {
      console.log(`  ❌ Failed to update: ${updateError.message}`);
      failed++;
    } else {
      console.log(`  ✅ Found: "${result.name}" by ${result.artist} (popularity: ${result.popularity})`);
      fixed++;
    }

    // Rate limit: wait 100ms between requests
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log('');
  console.log('========================');
  console.log('🎉 Complete!');
  console.log(`   ✅ Fixed: ${fixed}`);
  console.log(`   ⚠️  Skipped (mismatch): ${skipped}`);
  console.log(`   ❌ Failed: ${failed}`);
}

// Run
fixAllSongs().catch(console.error);
