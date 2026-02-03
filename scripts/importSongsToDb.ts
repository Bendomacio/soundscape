/**
 * Import songs from CSV to Supabase database
 *
 * Usage: npx tsx scripts/importSongsToDb.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Supabase setup
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://tairuapqunhrpzkvoxor.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_bmz8-P_JcBK4606s5utiUA_E9GPrN9i';
const supabase = createClient(supabaseUrl, supabaseKey);

// Missing Spotify URIs (manually looked up)
const MISSING_URIS: Record<string, { spotify_uri?: string; youtube_id?: string }> = {
  'Empire State of Mind': { spotify_uri: 'spotify:track:2igwFfvr1OAGX9SKDCPBwO' },
  'Purple Rain': { spotify_uri: 'spotify:track:54X78diSLoUDI3joC2bjMz' },
  'Runaway': { spotify_uri: 'spotify:track:3DK6m7It6Pw857FcQftMds', youtube_id: '6CHs4x2uqcQ' },
  'The Sound of Silence': { spotify_uri: 'spotify:track:3YfS47QufnLDFA71FUsgCM' },
  'El Día Que Me Quieras': { spotify_uri: 'spotify:track:2g1KggYmFMwXyBNfddjiE8', youtube_id: 'XH4sXkLSvhg' },
  'Cumbia Sobre el Mar': { spotify_uri: 'spotify:track:0xpWdCLmQYwBaJrMnl4o5g' },
  'Pata Pata': { spotify_uri: 'spotify:track:70pAVKEJEihPKUBXDpDt2o' },
  'Tokyo Drift': { spotify_uri: 'spotify:track:6uQjdsmAPZM11jVqxWgUpT' },
  'Ya Rayah': { spotify_uri: 'spotify:track:5VFg3eCJOvWV7bJH8v1Bka' }
};

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

// Parse CSV line handling quoted fields
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
        i++;
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

// Parse CSV content
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

// Clean and normalize tags
function normalizeTags(tagsStr: string): string[] {
  if (!tagsStr) return [];
  return tagsStr
    .split(',')
    .map(t => t.trim().toLowerCase().replace(/\s+/g, '-'))
    .filter(t => t.length > 0);
}

// Clean location description - remove template boilerplate
function cleanDescription(desc: string): string {
  // Remove the repeated SoundScape template text
  const templatePhrases = [
    /This SoundScape pin uses \*\*[^*]+\*\* as the anchor[^.]+\./g,
    /If you visit [^.]+today, look for the everyday details[^.]+\./g,
    /Places change over time[^.]+\./g,
    /Try listening once while standing still[^.]+\./g,
  ];

  let cleaned = desc;
  for (const phrase of templatePhrases) {
    cleaned = cleaned.replace(phrase, '');
  }

  // Clean up extra whitespace
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  return cleaned;
}

async function main() {
  const inputPath = path.join(__dirname, '../data/import_songs_with_uris.csv');

  console.log('Reading CSV...');
  const content = fs.readFileSync(inputPath, 'utf-8');
  const rows = parseCSV(content);

  console.log(`Found ${rows.length} songs to import\n`);

  let imported = 0;
  let skipped = 0;
  let errors = 0;

  for (const row of rows) {
    // Fill in missing URIs from our manual lookup
    if (!row.spotify_uri && MISSING_URIS[row.title]) {
      row.spotify_uri = MISSING_URIS[row.title].spotify_uri || '';
      if (MISSING_URIS[row.title].youtube_id) {
        row.youtube_id = MISSING_URIS[row.title].youtube_id || row.youtube_id;
      }
    }

    // Skip if no Spotify URI (we need at least one playback option)
    if (!row.spotify_uri && !row.youtube_id) {
      console.log(`[SKIP] "${row.title}" - No Spotify URI or YouTube ID`);
      skipped++;
      continue;
    }

    // Prepare the database record
    const dbRecord = {
      id: row.id,
      title: row.title,
      artist: row.artist,
      album: row.album || null,
      spotify_uri: row.spotify_uri || null,
      youtube_id: row.youtube_id || null,
      apple_music_id: row.apple_music_id || null,
      soundcloud_url: row.soundcloud_url || null,
      latitude: parseFloat(row.latitude),
      longitude: parseFloat(row.longitude),
      location_name: row.location_name,
      location_description: cleanDescription(row.location_description),
      tags: normalizeTags(row.tags),
      status: 'live',
      verified: true,
      upvotes: 0
    };

    // Check if song already exists
    const { data: existing } = await supabase
      .from('songs')
      .select('id')
      .eq('id', row.id)
      .single();

    if (existing) {
      console.log(`[UPDATE] "${row.title}" - Already exists, updating...`);
      const { error } = await supabase
        .from('songs')
        .update(dbRecord)
        .eq('id', row.id);

      if (error) {
        console.error(`  Error: ${error.message}`);
        errors++;
      } else {
        imported++;
      }
    } else {
      console.log(`[INSERT] "${row.title}" by ${row.artist}`);
      const { error } = await supabase
        .from('songs')
        .insert(dbRecord);

      if (error) {
        console.error(`  Error: ${error.message}`);
        errors++;
      } else {
        imported++;
      }
    }

    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log(`\n${'='.repeat(50)}`);
  console.log(`Import Results:`);
  console.log(`  Imported/Updated: ${imported}`);
  console.log(`  Skipped: ${skipped}`);
  console.log(`  Errors: ${errors}`);
}

main().catch(console.error);
