// Spotify Web API integration with OAuth and Web Playback SDK

const SPOTIFY_CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID || '';
const SPOTIFY_CLIENT_SECRET = import.meta.env.VITE_SPOTIFY_CLIENT_SECRET || '';
const REDIRECT_URI = typeof window !== 'undefined' ? `${window.location.origin}/callback` : '';

// OAuth scopes needed for full playback
const SCOPES = [
  'streaming',
  'user-read-email',
  'user-read-private',
  'user-read-playback-state',
  'user-modify-playback-state',
  'user-read-currently-playing'
].join(' ');

// Token storage keys
const TOKEN_KEY = 'spotify_access_token';
const REFRESH_TOKEN_KEY = 'spotify_refresh_token';
const TOKEN_EXPIRY_KEY = 'spotify_token_expiry';
const CODE_VERIFIER_KEY = 'spotify_code_verifier';

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

// User OAuth tokens (for Web Playback SDK)
export interface SpotifyUserAuth {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

// =====================================================
// PKCE OAuth Flow (no client secret exposed in browser)
// =====================================================

function generateRandomString(length: number): string {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const values = crypto.getRandomValues(new Uint8Array(length));
  return values.reduce((acc, x) => acc + possible[x % possible.length], '');
}

async function sha256(plain: string): Promise<ArrayBuffer> {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  return window.crypto.subtle.digest('SHA-256', data);
}

function base64urlencode(input: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(input)))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

/**
 * Initiate Spotify OAuth login with PKCE
 */
export async function initiateSpotifyLogin(): Promise<void> {
  if (!SPOTIFY_CLIENT_ID) {
    console.error('Spotify Client ID not configured');
    return;
  }

  const codeVerifier = generateRandomString(64);
  const hashed = await sha256(codeVerifier);
  const codeChallenge = base64urlencode(hashed);

  // Store verifier for callback
  sessionStorage.setItem(CODE_VERIFIER_KEY, codeVerifier);

  const params = new URLSearchParams({
    client_id: SPOTIFY_CLIENT_ID,
    response_type: 'code',
    redirect_uri: REDIRECT_URI,
    scope: SCOPES,
    code_challenge_method: 'S256',
    code_challenge: codeChallenge
  });

  window.location.href = `https://accounts.spotify.com/authorize?${params.toString()}`;
}

/**
 * Handle OAuth callback and exchange code for tokens
 */
export async function handleSpotifyCallback(code: string): Promise<SpotifyUserAuth | null> {
  const codeVerifier = sessionStorage.getItem(CODE_VERIFIER_KEY);
  
  if (!codeVerifier) {
    console.error('No code verifier found');
    return null;
  }

  try {
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        client_id: SPOTIFY_CLIENT_ID,
        grant_type: 'authorization_code',
        code,
        redirect_uri: REDIRECT_URI,
        code_verifier: codeVerifier
      })
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Token exchange failed:', error);
      return null;
    }

    const data = await response.json();
    const auth: SpotifyUserAuth = {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: Date.now() + (data.expires_in * 1000)
    };

    // Store tokens
    localStorage.setItem(TOKEN_KEY, auth.accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, auth.refreshToken);
    localStorage.setItem(TOKEN_EXPIRY_KEY, auth.expiresAt.toString());
    sessionStorage.removeItem(CODE_VERIFIER_KEY);

    return auth;
  } catch (error) {
    console.error('Failed to exchange code for tokens:', error);
    return null;
  }
}

/**
 * Refresh the user's access token
 */
export async function refreshUserToken(): Promise<SpotifyUserAuth | null> {
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
  
  if (!refreshToken) {
    return null;
  }

  try {
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        client_id: SPOTIFY_CLIENT_ID,
        grant_type: 'refresh_token',
        refresh_token: refreshToken
      })
    });

    if (!response.ok) {
      // Token might be revoked, clear storage
      clearSpotifyAuth();
      return null;
    }

    const data = await response.json();
    const auth: SpotifyUserAuth = {
      accessToken: data.access_token,
      refreshToken: data.refresh_token || refreshToken,
      expiresAt: Date.now() + (data.expires_in * 1000)
    };

    localStorage.setItem(TOKEN_KEY, auth.accessToken);
    if (data.refresh_token) {
      localStorage.setItem(REFRESH_TOKEN_KEY, data.refresh_token);
    }
    localStorage.setItem(TOKEN_EXPIRY_KEY, auth.expiresAt.toString());

    return auth;
  } catch (error) {
    console.error('Failed to refresh token:', error);
    return null;
  }
}

/**
 * Get current user auth from storage, refreshing if needed
 */
export async function getSpotifyUserAuth(): Promise<SpotifyUserAuth | null> {
  const token = localStorage.getItem(TOKEN_KEY);
  const refresh = localStorage.getItem(REFRESH_TOKEN_KEY);
  const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY);

  if (!token || !refresh || !expiry) {
    return null;
  }

  const expiresAt = parseInt(expiry, 10);

  // Refresh if token expires in less than 5 minutes
  if (Date.now() > expiresAt - 300000) {
    return refreshUserToken();
  }

  return {
    accessToken: token,
    refreshToken: refresh,
    expiresAt
  };
}

/**
 * Check if user is connected to Spotify
 */
export function isSpotifyConnected(): boolean {
  return !!localStorage.getItem(TOKEN_KEY);
}

/**
 * Clear Spotify auth data (logout)
 */
export function clearSpotifyAuth(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(TOKEN_EXPIRY_KEY);
  sessionStorage.removeItem(CODE_VERIFIER_KEY);
}

/**
 * Get Spotify user profile
 */
export async function getSpotifyUserProfile(): Promise<{ display_name: string; images: { url: string }[]; product: string } | null> {
  const auth = await getSpotifyUserAuth();
  if (!auth) return null;

  try {
    const response = await fetch('https://api.spotify.com/v1/me', {
      headers: {
        'Authorization': `Bearer ${auth.accessToken}`
      }
    });

    if (!response.ok) return null;
    return response.json();
  } catch {
    return null;
  }
}

/**
 * Fetch track info via song.link API (CORS-friendly)
 * This gives us title, artist, and album art for any public track
 * Uses song.link → iTunes/Spotify metadata
 */
export async function getTrackInfo(
  trackId: string,
  _retries: number = 2
): Promise<{ title: string; artist: string; albumArt: string } | null> {
  try {
    const spotifyUrl = `https://open.spotify.com/track/${trackId}`;
    const encoded = encodeURIComponent(spotifyUrl);

    // Use proxy endpoint to avoid CORS issues
    const response = await fetch(`/api/songlink?url=${encoded}`);

    // Handle rate limiting with retry
    if (response.status === 429) {
      console.log('Rate limited by song.link, waiting 5s...');
      await new Promise(resolve => setTimeout(resolve, 5000));
      return getTrackInfo(trackId, 0);
    }

    if (!response.ok) {
      console.error('song.link fetch failed:', response.status);
      return null;
    }

    const data = await response.json();

    // Get metadata from entities
    const entities = data.entitiesByUniqueId || {};
    let title = '';
    let artist = '';
    let albumArt = '';

    // Try iTunes/Apple Music first (best metadata)
    for (const [entityId, entity] of Object.entries(entities)) {
      if (entityId.startsWith('ITUNES_SONG::') || entityId.startsWith('APPLE_MUSIC::')) {
        const e = entity as { title?: string; artistName?: string; thumbnailUrl?: string };
        title = e.title || '';
        artist = e.artistName || '';
        albumArt = e.thumbnailUrl?.replace('100x100', '600x600') || '';
        break;
      }
    }

    // Fallback to Spotify entity
    if (!title) {
      for (const [entityId, entity] of Object.entries(entities)) {
        if (entityId.startsWith('SPOTIFY_SONG::')) {
          const e = entity as { title?: string; artistName?: string; thumbnailUrl?: string };
          title = e.title || '';
          artist = e.artistName || '';
          albumArt = e.thumbnailUrl || '';
          break;
        }
      }
    }

    if (!title) {
      return null;
    }

    // Clean up title (remove remaster suffixes)
    title = title
      .replace(/\s*-\s*\d{4}\s*Remaster(ed)?/gi, '')
      .replace(/\s*\(\d{4}\s*Remaster(ed)?\)/gi, '')
      .replace(/\s*-\s*Remaster(ed)?/gi, '')
      .replace(/\s*\(Remaster(ed)?\)/gi, '')
      .trim();

    return { title, artist, albumArt };
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
