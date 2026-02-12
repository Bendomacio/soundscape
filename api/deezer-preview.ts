/**
 * Vercel Edge Function to proxy Deezer search API requests.
 * Used to find 30-second preview URLs for songs, enabling native
 * <audio> playback with volume control (no Spotify auth needed).
 */

export const config = {
  runtime: 'edge',
};

export default async function handler(request: Request) {
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  const url = new URL(request.url);
  const title = url.searchParams.get('title');
  const artist = url.searchParams.get('artist');

  if (!title || !artist) {
    return new Response(JSON.stringify({ error: 'Missing title or artist parameter' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  try {
    const query = `track:"${title}" artist:"${artist}"`;
    const deezerUrl = `https://api.deezer.com/search?q=${encodeURIComponent(query)}&limit=5`;

    const response = await fetch(deezerUrl, {
      headers: { 'User-Agent': 'Soundscape/1.0' },
    });

    if (!response.ok) {
      return new Response(JSON.stringify({ error: `Deezer returned ${response.status}` }), {
        status: response.status,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch (error) {
    console.error('Deezer proxy error:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch from Deezer' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
}
