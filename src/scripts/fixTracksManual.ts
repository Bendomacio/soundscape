/**
 * Manual Track ID Fix Script
 * These are verified Spotify track IDs for the London songs
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://tairuapqunhrpzkvoxor.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhaXJ1YXBxdW5ocnB6a3ZveG9yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5MjUxNjcsImV4cCI6MjA4NDUwMTE2N30.jM3yaOeMajGQCjP80zeRb3APlTUY7iDQv1wUFiaOisI';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Verified Spotify Track IDs
// Format: 'song-id': 'spotify-track-id'
const VERIFIED_TRACKS: Record<string, string> = {
  // Central London
  'london-1': '2vEQ9zBiwbAVXzS2SOxodY',   // London Calling - The Clash
  'london-2': '3VgeLthwJkUvc5P94TaakJ',   // Waterloo Sunset - The Kinks
  'london-3': '2cGxRwrMyEAp8dEbuZaVv6',   // West End Girls - Pet Shop Boys
  'london-4': '4bLXUhpVjMiKLuhCgXz8JD',   // A Nightingale Sang in Berkeley Square - Vera Lynn
  'london-5': '1qU99DpqhYIfrBSqGBaIEd',   // Baker Street - Gerry Rafferty
  'london-6': '2RSHbUBQGxfpWjyRFcvPpK',   // Piccadilly Palare - Morrissey
  'london-7': '4FpuOTdeLrJbzCmOj4Lw9W',   // Warwick Avenue - Duffy
  'london-8': '0hrBpAOgrt8RXigk8zsHVm',   // London Bridge - Fergie
  'london-10': '5XcZRgJv3zMhTqCyESjQrF',  // Victoria - The Kinks
  
  // Soho & West End
  'london-11': '1qPbGZqppFwLwcBC1JQ6Vr',  // Wonderwall - Oasis
  'london-14': '1Dh4E0LVkCZ2gIWvhcWYbA',  // A Foggy Day - Ella Fitzgerald
  
  // North London
  'london-15': '2EqlS6tkEnglzr7tkKAAYD',  // Come Together - The Beatles
  'london-16': '6Nle9hKrkL1wQpwNfEkxjh',  // Our House - Madness
  'london-18': '6dBUzqjtbnIa1TwYbyw5CM',  // Sunny Afternoon - The Kinks
  'london-19': '7MXlTgSkhzFCwXwJmQGKjx',  // The Streets of London - Ralph McTell
  
  // South London
  'london-23': '2iUmqdfGZcHIhS3b9E9EWq',  // Electric Avenue - Eddy Grant
  'london-24': '39b0PdXDCP8xSMiB3FJcJc',  // The Guns of Brixton - The Clash
  'london-25': '5UqTO8smerMvxHYA5xsXb6',  // Up the Junction - Squeeze
  'london-26': '0sXbilKMjfIqPmyYgUgRb1',  // South London Forever - Florence + the Machine
  'london-29': '2tpS14bqGPcsLRrfNUbAMA',  // Werewolves of London - Warren Zevon
  
  // East London
  'london-31': '0q6LuUqGLUiCPP1cbdwFs3',  // Mile End - Pulp
  'london-32': '4RHeDPAyjCPKkIghLkPCdK',  // Down in the Tube Station at Midnight - The Jam
  'london-36': '2KH16WveTQWT6KOG9Rg6e2',  // Itchycoo Park - Small Faces
  
  // West London
  'london-40': '1qmDYB55raNR0NJBJaXf3d',  // White Riot - The Clash
  'london-43': '3qT4bUD1MaWpGrTwcvguhb',  // My Generation - The Who
  'london-44': '6lBsHAZduqGYlGKaMGqnsY',  // (White Man) In Hammersmith Palais - The Clash
  
  // Special Locations
  'london-49': '6a0gjFnJDV7arPfWYtMQhL',  // London Loves - Blur
  'london-51': '7l1lWqwVjgnHzRv7qiU3Py',  // LDN - Lily Allen
  'london-52': '56VZbFWbgN2aWigVbUyBjQ',  // Parklife - Blur
  'london-53': '1WZuhFqkTJJ0vHnJ8ZlHh2',  // Waterloo - ABBA
};

async function fixTracks() {
  console.log('🎵 Fixing Spotify Track IDs');
  console.log('============================');
  console.log('');

  let updated = 0;
  let failed = 0;

  for (const [songId, trackId] of Object.entries(VERIFIED_TRACKS)) {
    const { error } = await supabase
      .from('songs')
      .update({
        spotify_uri: `spotify:track:${trackId}`,
        updated_at: new Date().toISOString()
      })
      .eq('id', songId);

    if (error) {
      console.log(`❌ Failed to update ${songId}: ${error.message}`);
      failed++;
    } else {
      console.log(`✅ Updated ${songId} -> ${trackId}`);
      updated++;
    }
  }

  console.log('');
  console.log('============================');
  console.log(`✅ Updated: ${updated}`);
  console.log(`❌ Failed: ${failed}`);
  console.log('');
  console.log('Now fetching album art from Spotify oEmbed...');
  
  // Now fetch album art for the updated tracks
  for (const [songId, trackId] of Object.entries(VERIFIED_TRACKS)) {
    try {
      const response = await fetch(
        `https://open.spotify.com/oembed?url=https://open.spotify.com/track/${trackId}`
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.thumbnail_url) {
          await supabase
            .from('songs')
            .update({ album_art: data.thumbnail_url })
            .eq('id', songId);
          console.log(`🖼️  Got art for ${songId}`);
        }
      }
      
      // Rate limit
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (err) {
      console.log(`⚠️  Failed to get art for ${songId}`);
    }
  }
  
  console.log('');
  console.log('🎉 Done!');
}

fixTracks().catch(console.error);
