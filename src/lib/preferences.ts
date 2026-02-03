import type { MusicProvider } from '../types';
import { supabase } from './supabase';
import { logger } from './logger';

const PROVIDER_PREFERENCE_COOKIE = 'soundscape_music_provider';
const COOKIE_MAX_AGE = 365 * 24 * 60 * 60; // 1 year in seconds

/**
 * Get music provider preference from cookie
 */
export function getPreferenceFromCookie(): MusicProvider | null {
  if (typeof document === 'undefined') return null;

  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === PROVIDER_PREFERENCE_COOKIE) {
      const provider = decodeURIComponent(value) as MusicProvider;
      // Validate it's a valid provider
      if (['spotify', 'youtube', 'apple_music', 'soundcloud'].includes(provider)) {
        return provider;
      }
    }
  }
  return null;
}

/**
 * Set music provider preference in cookie
 */
export function setPreferenceCookie(provider: MusicProvider): void {
  if (typeof document === 'undefined') return;

  document.cookie = `${PROVIDER_PREFERENCE_COOKIE}=${encodeURIComponent(provider)}; path=/; max-age=${COOKIE_MAX_AGE}; samesite=lax`;
}

/**
 * Clear music provider preference cookie
 */
export function clearPreferenceCookie(): void {
  if (typeof document === 'undefined') return;

  document.cookie = `${PROVIDER_PREFERENCE_COOKIE}=; path=/; max-age=0`;
}

/**
 * Get user's music provider preference from database
 * Returns null if not found or not logged in
 */
export async function getUserPreference(userId: string): Promise<MusicProvider | null> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('music_provider')
      .eq('id', userId)
      .single();

    if (error || !data) {
      return null;
    }

    const provider = data.music_provider as MusicProvider | null;
    if (provider && ['spotify', 'youtube', 'apple_music', 'soundcloud'].includes(provider)) {
      return provider;
    }

    return null;
  } catch (err) {
    logger.error('Failed to get user music provider preference:', err);
    return null;
  }
}

/**
 * Set user's music provider preference in database
 */
export async function setUserPreference(userId: string, provider: MusicProvider): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ music_provider: provider })
      .eq('id', userId);

    if (error) {
      logger.error('Failed to set user music provider preference:', error);
      return false;
    }

    return true;
  } catch (err) {
    logger.error('Failed to set user music provider preference:', err);
    return false;
  }
}

/**
 * Get the effective music provider preference
 * Checks: 1) User database preference (if logged in), 2) Cookie
 * Returns 'spotify' as default if nothing is set
 */
export async function getEffectivePreference(userId?: string | null): Promise<MusicProvider> {
  // First, try to get from database if user is logged in
  if (userId) {
    const dbPref = await getUserPreference(userId);
    if (dbPref) {
      // Sync to cookie for offline access
      setPreferenceCookie(dbPref);
      return dbPref;
    }
  }

  // Fall back to cookie
  const cookiePref = getPreferenceFromCookie();
  if (cookiePref) {
    return cookiePref;
  }

  // Default to Spotify
  return 'spotify';
}

/**
 * Set the music provider preference (both cookie and database if logged in)
 */
export async function setEffectivePreference(provider: MusicProvider, userId?: string | null): Promise<void> {
  // Always set cookie (works offline)
  setPreferenceCookie(provider);

  // Also save to database if logged in
  if (userId) {
    await setUserPreference(userId, provider);
  }
}
