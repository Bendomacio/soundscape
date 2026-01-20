import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://tairuapqunhrpzkvoxor.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhaXJ1YXBxdW5ocnB6a3ZveG9yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5MjUxNjcsImV4cCI6MjA4NDUwMTE2N30.jM3yaOeMajGQCjP80zeRb3APlTUY7iDQv1wUFiaOisI');

async function list() {
  const { data, error } = await supabase.from('songs').select('id, title, artist, location_name').order('id');
  if (error) {
    console.error('Error:', error);
    return;
  }
  console.log('Songs in database:');
  for (const s of data || []) {
    console.log(`${s.id} | ${s.title} | ${s.artist} | ${s.location_name}`);
  }
}

list();
