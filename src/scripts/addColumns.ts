/**
 * Add new columns to songs table for enriched location data
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://tairuapqunhrpzkvoxor.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhaXJ1YXBxdW5ocnB6a3ZveG9yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5MjUxNjcsImV4cCI6MjA4NDUwMTE2N30.jM3yaOeMajGQCjP80zeRb3APlTUY7iDQv1wUFiaOisI';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function addColumns() {
  console.log('🔧 Adding new columns to songs table...');
  console.log('');
  console.log('Please run these SQL commands in Supabase SQL Editor:');
  console.log('');
  console.log('----------------------------------------');
  console.log(`
-- Add description column for detailed location info
ALTER TABLE songs ADD COLUMN IF NOT EXISTS description TEXT;

-- Add location_name column for human-readable location
ALTER TABLE songs ADD COLUMN IF NOT EXISTS location_name TEXT;

-- Add tags column for categorization (stored as JSON array)
ALTER TABLE songs ADD COLUMN IF NOT EXISTS tags TEXT[];
`);
  console.log('----------------------------------------');
  console.log('');
  console.log('After running the SQL, run: npx tsx src/scripts/enrichLocations.ts');
}

addColumns();
