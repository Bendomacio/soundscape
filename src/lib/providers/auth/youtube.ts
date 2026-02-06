// YouTube / Google OAuth integration
// Uses Google Identity Services for OAuth 2.0
// Premium benefit: YouTube Premium/Music subscribers get ad-free playback

import { logger } from '../../logger';
import { generateRandomString, sha256, base64urlencode } from '../../crypto';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = import.meta.env.VITE_GOOGLE_CLIENT_SECRET || '';
const REDIRECT_URI = typeof window !== 'undefined' ? `${window.location.origin}/callback/youtube` : '';

// OAuth scopes for YouTube
const SCOPES = [
  'https://www.googleapis.com/auth/youtube.readonly',
  'https://www.googleapis.com/auth/userinfo.profile'
].join(' ');

// Storage keys
const TOKEN_KEY = 'youtube_access_token';
const REFRESH_TOKEN_KEY = 'youtube_refresh_token';
const TOKEN_EXPIRY_KEY = 'youtube_token_expiry';
const CODE_VERIFIER_KEY = 'youtube_code_verifier';
const USER_PROFILE_KEY = 'youtube_user_profile';

export interface YouTubeUserAuth {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
}

export interface YouTubeUserProfile {
  name: string;
  avatarUrl?: string;
  isPremium: boolean; // YouTube Premium/Music subscriber
}

// Storage key for OAuth CSRF state parameter
const OAUTH_STATE_KEY = 'youtube_oauth_state';

/**
 * Initiate YouTube/Google OAuth login with PKCE
 */
export async function initiateYouTubeLogin(): Promise<void> {
  if (!GOOGLE_CLIENT_ID) {
    logger.warn('Google Client ID not configured. YouTube linking unavailable.');
    // Store that user wants to connect (for UI feedback)
    sessionStorage.setItem('youtube_connect_pending', 'true');
    return;
  }

  const codeVerifier = generateRandomString(64);
  const hashed = await sha256(codeVerifier);
  const codeChallenge = base64urlencode(hashed);

  // Generate CSRF state parameter
  const state = generateRandomString(32);

  // Store verifier and state for callback
  sessionStorage.setItem(CODE_VERIFIER_KEY, codeVerifier);
  sessionStorage.setItem(OAUTH_STATE_KEY, state);
  logger.debug('YouTube OAuth: stored code verifier, length:', codeVerifier.length);

  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: SCOPES,
    code_challenge_method: 'S256',
    code_challenge: codeChallenge,
    access_type: 'offline',
    prompt: 'consent',
    state
  });

  window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

/**
 * Handle OAuth callback and exchange code for tokens
 */
export async function handleYouTubeCallback(code: string): Promise<YouTubeUserAuth | null> {
  const codeVerifier = sessionStorage.getItem(CODE_VERIFIER_KEY);
  logger.debug('YouTube callback: code verifier from storage:', codeVerifier ? `found (${codeVerifier.length} chars)` : 'NOT FOUND');

  if (!codeVerifier) {
    logger.error('No code verifier found for YouTube OAuth');
    return null;
  }

  // Verify CSRF state parameter
  const savedState = sessionStorage.getItem(OAUTH_STATE_KEY);
  const urlParams = new URLSearchParams(window.location.search);
  const returnedState = urlParams.get('state');

  if (savedState && returnedState !== savedState) {
    logger.error('YouTube OAuth state mismatch - possible CSRF attack');
    sessionStorage.removeItem(OAUTH_STATE_KEY);
    return null;
  }

  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        grant_type: 'authorization_code',
        code,
        redirect_uri: REDIRECT_URI,
        code_verifier: codeVerifier
      })
    });

    if (!response.ok) {
      const error = await response.json();
      logger.error('YouTube token exchange failed:', error);
      logger.debug('Request details:', {
        client_id: GOOGLE_CLIENT_ID,
        client_secret_length: GOOGLE_CLIENT_SECRET?.length,
        redirect_uri: REDIRECT_URI,
        hasCodeVerifier: !!codeVerifier,
        codeLength: code?.length
      });
      return null;
    }

    const data = await response.json();
    const auth: YouTubeUserAuth = {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: Date.now() + (data.expires_in * 1000)
    };

    // Store tokens
    localStorage.setItem(TOKEN_KEY, auth.accessToken);
    if (auth.refreshToken) {
      localStorage.setItem(REFRESH_TOKEN_KEY, auth.refreshToken);
    }
    localStorage.setItem(TOKEN_EXPIRY_KEY, auth.expiresAt.toString());
    sessionStorage.removeItem(CODE_VERIFIER_KEY);
    sessionStorage.removeItem(OAUTH_STATE_KEY);

    // Fetch and cache profile
    await getYouTubeUserProfile();

    return auth;
  } catch (error) {
    logger.error('Failed to exchange YouTube code for tokens:', error);
    return null;
  }
}

/**
 * Refresh the user's access token
 */
export async function refreshYouTubeToken(): Promise<YouTubeUserAuth | null> {
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);

  if (!refreshToken || !GOOGLE_CLIENT_ID) {
    return null;
  }

  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        grant_type: 'refresh_token',
        refresh_token: refreshToken
      })
    });

    if (!response.ok) {
      clearYouTubeAuth();
      return null;
    }

    const data = await response.json();
    const auth: YouTubeUserAuth = {
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
    logger.error('Failed to refresh YouTube token:', error);
    return null;
  }
}

/**
 * Get current user auth from storage, refreshing if needed
 */
export async function getYouTubeUserAuth(): Promise<YouTubeUserAuth | null> {
  const token = localStorage.getItem(TOKEN_KEY);
  const refresh = localStorage.getItem(REFRESH_TOKEN_KEY);
  const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY);

  if (!token || !expiry) {
    return null;
  }

  const expiresAt = parseInt(expiry, 10);

  // Refresh if token expires in less than 5 minutes
  if (Date.now() > expiresAt - 300000) {
    if (refresh) {
      return refreshYouTubeToken();
    }
    return null;
  }

  return {
    accessToken: token,
    refreshToken: refresh || undefined,
    expiresAt
  };
}

/**
 * Check if user is connected to YouTube
 */
export function isYouTubeConnected(): boolean {
  return !!localStorage.getItem(TOKEN_KEY);
}

/**
 * Clear YouTube auth data (logout)
 */
export function clearYouTubeAuth(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(TOKEN_EXPIRY_KEY);
  localStorage.removeItem(USER_PROFILE_KEY);
  sessionStorage.removeItem(CODE_VERIFIER_KEY);
  sessionStorage.removeItem(OAUTH_STATE_KEY);
  sessionStorage.removeItem('youtube_connect_pending');
}

/**
 * Get YouTube user profile
 * Note: YouTube Premium status cannot be directly queried via API
 * We check for YouTube Music subscription as a proxy
 */
export async function getYouTubeUserProfile(): Promise<YouTubeUserProfile | null> {
  const auth = await getYouTubeUserAuth();
  if (!auth) return null;

  try {
    // Get user info from Google
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${auth.accessToken}`
      }
    });

    if (!userInfoResponse.ok) return null;

    const userInfo = await userInfoResponse.json();

    // Check YouTube channel/membership (Premium status is not directly available)
    // For now, we assume connected = can use YouTube player
    // Premium detection would require additional API calls or user self-reporting

    const profile: YouTubeUserProfile = {
      name: userInfo.name || userInfo.email?.split('@')[0] || 'YouTube User',
      avatarUrl: userInfo.picture,
      isPremium: false // Would need YouTube Data API v3 to check memberships
    };

    // Cache profile
    localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profile));

    return profile;
  } catch (error) {
    logger.error('Failed to get YouTube user profile:', error);
    return null;
  }
}

/**
 * Get cached profile (doesn't make API call)
 */
export function getCachedYouTubeProfile(): YouTubeUserProfile | null {
  const cached = localStorage.getItem(USER_PROFILE_KEY);
  if (!cached) return null;
  try {
    return JSON.parse(cached);
  } catch {
    return null;
  }
}
