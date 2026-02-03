// Provider authentication types

import type { MusicProvider } from '../../../types';

export interface ProviderConnection {
  isConnected: boolean;
  isPremium: boolean;
  userName: string | null;
  avatarUrl?: string | null;
  isConnecting: boolean;
  error?: string | null;
}

export type ProviderConnections = Record<MusicProvider, ProviderConnection>;

export const defaultConnection: ProviderConnection = {
  isConnected: false,
  isPremium: false,
  userName: null,
  avatarUrl: null,
  isConnecting: false,
  error: null
};

export interface ProviderAuthAdapter {
  // Check if connected (from storage)
  isConnected(): boolean;

  // Initiate OAuth flow
  connect(): Promise<void>;

  // Handle OAuth callback (if applicable)
  handleCallback?(code: string, state?: string): Promise<boolean>;

  // Disconnect/clear auth
  disconnect(): void;

  // Get user profile info
  getProfile(): Promise<{ name: string; avatarUrl?: string; isPremium: boolean } | null>;

  // Get current auth tokens (if applicable)
  getAuth(): Promise<{ accessToken: string; refreshToken?: string; expiresAt?: number } | null>;
}
