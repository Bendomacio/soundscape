// Spotify Web API integration

const SPOTIFY_CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID || '';
const SPOTIFY_CLIENT_SECRET = import.meta.env.VITE_SPOTIFY_CLIENT_SECRET || '';

let accessToken: string | null = null;
let tokenExpiry: number = 0;

export interface SpotifyTrack {
  id: string;
  name: string;
  artists: { name: string }[];
  album: {
    name: string;
    images: { url: string; width: number; height: number }[];
  };
  preview_url: string | null;
  external_urls: {
    spotify: string;
  };
}

export interface SpotifySearchResult {
  tracks: {
    items: SpotifyTrack[];
    total: number;
  };
}

// Spotify oEmbed response (public, no auth needed)
export interface SpotifyOEmbed {
  title: string;
  thumbnail_url: string;
  thumbnail_width: number;
  thumbnail_height: number;
  provider_name: string;
}

/**
 * Fetch track info from Spotify's oEmbed API (no authentication required!)
 * This gives us title and album art for any public track
 * Includes retry logic for rate limiting
 */
export async function getTrackInfo(
  trackId: string, 
  retries: number = 2
): Promise<{ title: string; artist: string; albumArt: string } | null> {
  try {
    const response = await fetch(
      `https://open.spotify.com/oembed?url=https://open.spotify.com/track/${trackId}`
    );
    
    // Handle rate limiting with retry
    if (response.status === 429) {
      if (retries > 0) {
        const retryAfter = parseInt(response.headers.get('Retry-After') || '5');
        console.log(`Rate limited, waiting ${retryAfter}s before retry...`);
        await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
        return getTrackInfo(trackId, retries - 1);
      }
      console.error('Rate limit exceeded, no retries left');
      return null;
    }
    
    if (!response.ok) {
      console.error('oEmbed fetch failed:', response.status);
      return null;
    }
    
    const data = await response.json();
    
    // Spotify oEmbed only returns track title, NOT artist
    // Clean up title by removing remaster/version suffixes
    let title = data.title || '';
    
    // Remove common suffixes like "- 2011 Remaster", "(2019 Remaster)", etc.
    title = title
      .replace(/\s*-\s*\d{4}\s*Remaster(ed)?/gi, '')
      .replace(/\s*\(\d{4}\s*Remaster(ed)?\)/gi, '')
      .replace(/\s*-\s*Remaster(ed)?/gi, '')
      .replace(/\s*\(Remaster(ed)?\)/gi, '')
      .trim();
    
    return {
      title,
      artist: '', // oEmbed doesn't provide artist - user must enter manually
      albumArt: data.thumbnail_url
    };
  } catch (error) {
    console.error('Failed to fetch track info:', error);
    return null;
  }
}

async function getAccessToken(): Promise<string> {
  if (accessToken && Date.now() < tokenExpiry) {
    return accessToken;
  }

  if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
    console.warn('Spotify credentials not configured. Using mock search.');
    return 'demo-token';
  }

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + btoa(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`)
    },
    body: 'grant_type=client_credentials'
  });

  if (!response.ok) {
    throw new Error('Failed to get Spotify access token');
  }

  const data = await response.json();
  accessToken = data.access_token;
  tokenExpiry = Date.now() + (data.expires_in * 1000) - 60000;
  
  return accessToken!;
}

export async function searchTracks(query: string, limit: number = 10): Promise<SpotifyTrack[]> {
  if (!query.trim()) return [];

  const token = await getAccessToken();

  if (token === 'demo-token') {
    return getMockResults(query);
  }

  const response = await fetch(
    `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=${limit}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );

  if (!response.ok) {
    console.error('Spotify search failed:', response.status);
    return getMockResults(query);
  }

  const data: SpotifySearchResult = await response.json();
  return data.tracks.items;
}

function getMockResults(query: string): SpotifyTrack[] {
  const mockTracks: SpotifyTrack[] = [
    {
      id: '1Z4Y91PRCAz3q2OP0iCvcJ',
      name: 'London Calling',
      artists: [{ name: 'The Clash' }],
      album: { name: 'London Calling', images: [{ url: 'https://i.scdn.co/image/ab67616d0000b2734c00f12a2aa4f0a606791bff', width: 300, height: 300 }] },
      preview_url: null,
      external_urls: { spotify: 'https://open.spotify.com/track/1Z4Y91PRCAz3q2OP0iCvcJ' }
    },
    {
      id: '1qPbGZqppFwLwcBC1JQ6Vr',
      name: 'Wonderwall',
      artists: [{ name: 'Oasis' }],
      album: { name: "(What's the Story) Morning Glory?", images: [{ url: 'https://i.scdn.co/image/ab67616d0000b273e1b4ef1a8a3e5d2ba7c2e4f1', width: 300, height: 300 }] },
      preview_url: null,
      external_urls: { spotify: 'https://open.spotify.com/track/1qPbGZqppFwLwcBC1JQ6Vr' }
    },
    {
      id: '2EqlS6tkEnglzr7tkKAAYD',
      name: 'Come Together',
      artists: [{ name: 'The Beatles' }],
      album: { name: 'Abbey Road', images: [{ url: 'https://i.scdn.co/image/ab67616d0000b273dc30583ba717007b00cceb25', width: 300, height: 300 }] },
      preview_url: null,
      external_urls: { spotify: 'https://open.spotify.com/track/2EqlS6tkEnglzr7tkKAAYD' }
    }
  ];

  const q = query.toLowerCase();
  return mockTracks.filter(t => 
    t.name.toLowerCase().includes(q) || 
    t.artists.some(a => a.name.toLowerCase().includes(q))
  );
}

export function getTrackIdFromUri(uri: string): string {
  return uri.replace('spotify:track:', '');
}

export function getEmbedUrl(trackId: string): string {
  return `https://open.spotify.com/embed/track/${trackId}?utm_source=generator&theme=0`;
}
