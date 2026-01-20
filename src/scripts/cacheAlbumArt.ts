/**
 * Album Art Caching Script
 * Fetches real Spotify album art for all songs and caches in database
 * Run once to pre-populate, then app won't need to call Spotify API
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://tairuapqunhrpzkvoxor.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhaXJ1YXBxdW5ocnB6a3ZveG9yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5MjUxNjcsImV4cCI6MjA4NDUwMTE2N30.jM3yaOeMajGQCjP80zeRb3APlTUY7iDQv1wUFiaOisI';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

interface SpotifyOEmbed {
  title: string;
  thumbnail_url: string;
}

async function fetchSpotifyArt(trackId: string, retries = 3): Promise<string | null> {
  try {
    const response = await fetch(
      `https://open.spotify.com/oembed?url=https://open.spotify.com/track/${trackId}`
    );
    
    if (response.status === 429) {
      if (retries > 0) {
        const retryAfter = parseInt(response.headers.get('Retry-After') || '10');
        console.log(`  ⏳ Rate limited, waiting ${retryAfter}s...`);
        await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
        return fetchSpotifyArt(trackId, retries - 1);
      }
      return null;
    }
    
    if (!response.ok) return null;
    
    const data: SpotifyOEmbed = await response.json();
    return data.thumbnail_url;
  } catch {
    return null;
  }
}

async function cacheAllAlbumArt() {
  console.log('🎨 Starting album art caching...\n');
  
  // Fetch all songs
  const { data: songs, error } = await supabase
    .from('songs')
    .select('id, title, artist, spotify_uri, album_art');
  
  if (error || !songs) {
    console.error('Failed to fetch songs:', error);
    return;
  }
  
  // Filter songs that need album art (don't have Spotify CDN art)
  const needsArt = songs.filter(s => 
    s.spotify_uri && 
    (!s.album_art || !s.album_art.includes('i.scdn.co'))
  );
  
  console.log(`📦 ${songs.length} total songs`);
  console.log(`🔍 ${needsArt.length} need album art\n`);
  
  if (needsArt.length === 0) {
    console.log('✅ All songs already have cached album art!');
    return;
  }
  
  let success = 0;
  let failed = 0;
  
  // Process one at a time with delays to avoid rate limits
  for (let i = 0; i < needsArt.length; i++) {
    const song = needsArt[i];
    const trackId = song.spotify_uri?.replace('spotify:track:', '');
    
    console.log(`[${i + 1}/${needsArt.length}] ${song.title} - ${song.artist}`);
    
    if (!trackId) {
      console.log('  ⚠️  No track ID, skipping');
      failed++;
      continue;
    }
    
    const albumArt = await fetchSpotifyArt(trackId);
    
    if (albumArt) {
      // Update database
      const { error: updateError } = await supabase
        .from('songs')
        .update({ album_art: albumArt, updated_at: new Date().toISOString() })
        .eq('id', song.id);
      
      if (updateError) {
        console.log(`  ❌ DB update failed: ${updateError.message}`);
        failed++;
      } else {
        console.log(`  ✅ Cached: ${albumArt.slice(0, 50)}...`);
        success++;
      }
    } else {
      console.log('  ❌ Failed to fetch from Spotify');
      failed++;
    }
    
    // Wait 2 seconds between requests to be safe
    if (i < needsArt.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  console.log('\n🎉 Caching complete!');
  console.log(`   ✅ ${success} cached`);
  console.log(`   ❌ ${failed} failed`);
}

cacheAllAlbumArt();
