// Provider authentication - unified exports

export * from './types';

// YouTube
export {
  initiateYouTubeLogin,
  handleYouTubeCallback,
  isYouTubeConnected,
  clearYouTubeAuth,
  getYouTubeUserProfile,
  getCachedYouTubeProfile,
  getYouTubeUserAuth
} from './youtube';

// Apple Music
export {
  initiateAppleMusicLogin,
  isAppleMusicConnected,
  clearAppleMusicAuth,
  getAppleMusicUserProfile,
  getCachedAppleMusicProfile,
  getAppleMusicUserToken,
  isAppleMusicConfigured
} from './appleMusic';

// SoundCloud
export {
  initiateSoundCloudLogin,
  confirmSoundCloudConnection,
  isSoundCloudConnected,
  isSoundCloudPremium,
  clearSoundCloudAuth,
  getSoundCloudUserProfile,
  setSoundCloudPremium,
  isSoundCloudConnectionPending
} from './soundcloud';
