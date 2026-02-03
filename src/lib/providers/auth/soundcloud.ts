// SoundCloud account linking
// Note: SoundCloud's public API has been deprecated since 2017
// This implementation uses a self-reported connection status
// Premium benefit: SoundCloud Go/Go+ subscribers get full playback, offline, no ads

import { logger } from '../../logger';

// Storage keys
const CONNECTED_KEY = 'soundcloud_connected';
const USER_PROFILE_KEY = 'soundcloud_user_profile';
const PREMIUM_KEY = 'soundcloud_is_premium';

export interface SoundCloudUserProfile {
  name: string;
  avatarUrl?: string;
  isPremium: boolean; // SoundCloud Go/Go+ subscriber
}

/**
 * "Connect" to SoundCloud
 * Since API is deprecated, this is a self-reported connection
 * Opens SoundCloud in a new tab for user to verify they're logged in
 */
export function initiateSoundCloudLogin(): void {
  // Open SoundCloud in new tab for user to sign in
  window.open('https://soundcloud.com/signin', '_blank', 'width=600,height=700');

  // Mark as pending - user will confirm via UI
  sessionStorage.setItem('soundcloud_connect_pending', 'true');
}

/**
 * Confirm SoundCloud connection (called by UI after user confirms)
 */
export function confirmSoundCloudConnection(isPremium: boolean = false, displayName?: string): void {
  const profile: SoundCloudUserProfile = {
    name: displayName || 'SoundCloud User',
    isPremium
  };

  localStorage.setItem(CONNECTED_KEY, 'true');
  localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profile));
  localStorage.setItem(PREMIUM_KEY, isPremium.toString());
  sessionStorage.removeItem('soundcloud_connect_pending');

  logger.debug('SoundCloud connection confirmed:', { isPremium, displayName });
}

/**
 * Check if user is connected to SoundCloud
 */
export function isSoundCloudConnected(): boolean {
  return localStorage.getItem(CONNECTED_KEY) === 'true';
}

/**
 * Check if user has SoundCloud Go/Go+
 */
export function isSoundCloudPremium(): boolean {
  return localStorage.getItem(PREMIUM_KEY) === 'true';
}

/**
 * Clear SoundCloud connection
 */
export function clearSoundCloudAuth(): void {
  localStorage.removeItem(CONNECTED_KEY);
  localStorage.removeItem(USER_PROFILE_KEY);
  localStorage.removeItem(PREMIUM_KEY);
  sessionStorage.removeItem('soundcloud_connect_pending');
}

/**
 * Get SoundCloud user profile
 */
export function getSoundCloudUserProfile(): SoundCloudUserProfile | null {
  if (!isSoundCloudConnected()) return null;

  const cached = localStorage.getItem(USER_PROFILE_KEY);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch {
      // Fall through to default
    }
  }

  return {
    name: 'SoundCloud User',
    isPremium: isSoundCloudPremium()
  };
}

/**
 * Update premium status (user can toggle this)
 */
export function setSoundCloudPremium(isPremium: boolean): void {
  localStorage.setItem(PREMIUM_KEY, isPremium.toString());

  const profile = getSoundCloudUserProfile();
  if (profile) {
    profile.isPremium = isPremium;
    localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profile));
  }
}

/**
 * Check if connection is pending (user opened SoundCloud but hasn't confirmed)
 */
export function isSoundCloudConnectionPending(): boolean {
  return sessionStorage.getItem('soundcloud_connect_pending') === 'true';
}
