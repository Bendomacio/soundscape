// Apple Music / MusicKit JS integration
// Requires Apple Developer account with MusicKit key
// Premium benefit: Apple Music subscribers get full playback

import { logger } from '../../logger';

const APPLE_DEVELOPER_TOKEN = import.meta.env.VITE_APPLE_MUSIC_TOKEN || '';

// Storage keys
const USER_TOKEN_KEY = 'apple_music_user_token';
const USER_PROFILE_KEY = 'apple_music_user_profile';

export interface AppleMusicUserProfile {
  name: string;
  isPremium: boolean; // Apple Music subscriber
}

// MusicKit types (simplified)
interface MusicKitInstance {
  authorize(): Promise<string>;
  unauthorize(): Promise<void>;
  isAuthorized: boolean;
  musicUserToken?: string;
  api: {
    music(path: string, options?: object): Promise<{ data: { data: unknown[] } }>;
  };
}

declare global {
  interface Window {
    MusicKit?: {
      configure(config: { developerToken: string; app: { name: string; build: string } }): Promise<MusicKitInstance>;
      getInstance(): MusicKitInstance;
    };
  }
}

let musicKitInstance: MusicKitInstance | null = null;
let configurePromise: Promise<MusicKitInstance> | null = null;

/**
 * Load MusicKit JS library
 */
function loadMusicKitScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.MusicKit) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://js-cdn.music.apple.com/musickit/v3/musickit.js';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load MusicKit JS'));
    document.head.appendChild(script);
  });
}

/**
 * Configure MusicKit instance
 */
async function configureMusicKit(): Promise<MusicKitInstance> {
  if (musicKitInstance) return musicKitInstance;
  if (configurePromise) return configurePromise;

  configurePromise = (async () => {
    await loadMusicKitScript();

    if (!window.MusicKit) {
      throw new Error('MusicKit not available');
    }

    if (!APPLE_DEVELOPER_TOKEN) {
      throw new Error('Apple Music developer token not configured');
    }

    musicKitInstance = await window.MusicKit.configure({
      developerToken: APPLE_DEVELOPER_TOKEN,
      app: {
        name: 'Soundscape',
        build: '1.0.0'
      }
    });

    return musicKitInstance;
  })();

  return configurePromise;
}

/**
 * Initiate Apple Music authorization
 */
export async function initiateAppleMusicLogin(): Promise<boolean> {
  if (!APPLE_DEVELOPER_TOKEN) {
    logger.warn('Apple Music developer token not configured. Apple Music linking unavailable.');
    sessionStorage.setItem('apple_music_connect_pending', 'true');
    return false;
  }

  try {
    const music = await configureMusicKit();
    const userToken = await music.authorize();

    if (userToken) {
      localStorage.setItem(USER_TOKEN_KEY, userToken);
      await getAppleMusicUserProfile();
      return true;
    }

    return false;
  } catch (error) {
    logger.error('Apple Music authorization failed:', error);
    return false;
  }
}

/**
 * Check if user is connected to Apple Music
 */
export function isAppleMusicConnected(): boolean {
  return !!localStorage.getItem(USER_TOKEN_KEY);
}

/**
 * Clear Apple Music auth data (logout)
 */
export async function clearAppleMusicAuth(): Promise<void> {
  localStorage.removeItem(USER_TOKEN_KEY);
  localStorage.removeItem(USER_PROFILE_KEY);
  sessionStorage.removeItem('apple_music_connect_pending');

  try {
    if (musicKitInstance) {
      await musicKitInstance.unauthorize();
    }
  } catch (error) {
    logger.warn('Failed to unauthorize MusicKit:', error);
  }
}

/**
 * Get Apple Music user profile
 */
export async function getAppleMusicUserProfile(): Promise<AppleMusicUserProfile | null> {
  const userToken = localStorage.getItem(USER_TOKEN_KEY);
  if (!userToken) return null;

  try {
    const music = await configureMusicKit();

    // Check if user has Apple Music subscription by trying to access their library
    // If they can access it, they're a subscriber
    let isPremium = false;

    try {
      await music.api.music('/v1/me/library/songs', { limit: 1 });
      isPremium = true; // If we can access library, user is subscribed
    } catch {
      isPremium = false; // Can't access library = not subscribed
    }

    const profile: AppleMusicUserProfile = {
      name: 'Apple Music User', // Apple doesn't expose user name via MusicKit
      isPremium
    };

    localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profile));
    return profile;
  } catch (error) {
    logger.error('Failed to get Apple Music profile:', error);
    return null;
  }
}

/**
 * Get cached profile (doesn't make API call)
 */
export function getCachedAppleMusicProfile(): AppleMusicUserProfile | null {
  const cached = localStorage.getItem(USER_PROFILE_KEY);
  if (!cached) return null;
  try {
    return JSON.parse(cached);
  } catch {
    return null;
  }
}

/**
 * Get user token for Apple Music API calls
 */
export function getAppleMusicUserToken(): string | null {
  return localStorage.getItem(USER_TOKEN_KEY);
}

/**
 * Check if Apple Music is configured (has developer token)
 */
export function isAppleMusicConfigured(): boolean {
  return !!APPLE_DEVELOPER_TOKEN;
}
