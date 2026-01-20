/**
 * Clear Bad Spotify Links
 * Removes spotify_uri for songs that are likely wrong
 * Better to show "no link" than play wrong song
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://tairuapqunhrpzkvoxor.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhaXJ1YXBxdW5ocnB6a3ZveG9yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5MjUxNjcsImV4cCI6MjA4NDUwMTE2N30.jM3yaOeMajGQCjP80zeRb3APlTUY7iDQv1wUFiaOisI';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Keep only these verified working IDs, clear the rest
const VERIFIED_WORKING = [
  'london-11', // Wonderwall - Oasis (1qPbGZqppFwLwcBC1JQ6Vr)
  'london-15', // Come Together - Beatles (2EqlS6tkEnglzr7tkKAAYD)
  'london-23', // Electric Avenue - Eddy Grant (2iUmqdfGZcHIhS3b9E9EWq)
  'london-52', // Parklife - Blur (likely working)
];

async function clearBadLinks() {
  console.log('🧹 Clearing bad Spotify links...');
  
  // Get all songs
  const { data: songs, error } = await supabase
    .from('songs')
    .select('id, title, artist');
    
  if (error || !songs) {
    console.error('Failed to fetch songs:', error);
    return;
  }
  
  let cleared = 0;
  
  for (const song of songs) {
    // Skip verified working ones
    if (VERIFIED_WORKING.includes(song.id)) {
      console.log(`✅ Keeping ${song.title} - verified working`);
      continue;
    }
    
    // Clear the spotify_uri
    const { error: updateError } = await supabase
      .from('songs')
      .update({ spotify_uri: null })
      .eq('id', song.id);
      
    if (!updateError) {
      console.log(`🗑️  Cleared ${song.title} - ${song.artist}`);
      cleared++;
    }
  }
  
  console.log('');
  console.log(`🎉 Done! Cleared ${cleared} bad links.`);
  console.log('');
  console.log('Now you can fix songs manually via Admin Panel:');
  console.log('1. Log in as admin@example.com');
  console.log('2. Open Admin Panel');
  console.log('3. Click edit icon on a song');
  console.log('4. Paste the Spotify URL/ID for the correct track');
}

clearBadLinks();
