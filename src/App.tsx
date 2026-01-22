import { useState, useEffect, useCallback } from 'react';
import './utils/uiTests'; // Auto-runs UI tests in dev mode
import { MusicMap } from './components/MusicMap';
import { MusicPlayer } from './components/MusicPlayer';
import { DiscoveryPanel } from './components/DiscoveryPanel';
import { SongDetailPanel } from './components/SongDetailPanel';
import { SubmitSongModal } from './components/SubmitSongModal';
import { Header } from './components/Header';
import { AuthModal } from './components/AuthModal';
import { AdminPanel } from './components/AdminPanel';
import { MySubmissions } from './components/MySubmissions';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SpotifyPlayerProvider, useSpotifyPlayer } from './contexts/SpotifyPlayerContext';
import { fetchSongs, updateSong, addSong, deleteSong } from './lib/songs';
import { getTrackInfo, handleSpotifyCallback } from './lib/spotify';
import { preloadImages, clearOldCache } from './lib/imageCache';
import type { SongLocation, MapViewState } from './types';

// Handle Spotify OAuth callback
function SpotifyCallbackHandler() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const errorParam = params.get('error');

    // Check if this is a callback from Spotify
    if (window.location.pathname === '/callback' || code) {
      if (errorParam) {
        setError('Spotify authorization was denied');
        // Clear URL params
        window.history.replaceState({}, '', '/');
        return;
      }

      if (code && !isProcessing) {
        setIsProcessing(true);
        handleSpotifyCallback(code)
          .then((auth) => {
            if (auth) {
              console.log('Spotify connected successfully!');
              // Force reload to re-initialize player with new auth
              window.location.href = '/';
            } else {
              setError('Failed to connect to Spotify');
              window.history.replaceState({}, '', '/');
            }
          })
          .catch((err) => {
            console.error('Callback error:', err);
            setError('Failed to connect to Spotify');
            window.history.replaceState({}, '', '/');
          })
          .finally(() => setIsProcessing(false));
      }
    }
  }, [isProcessing]);

  if (isProcessing) {
    return (
      <div style={{
        position: 'fixed',
        inset: 0,
        background: 'var(--color-dark)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '16px',
        zIndex: 9999
      }}>
        <div className="animate-spin" style={{
          width: 48,
          height: 48,
          border: '3px solid var(--color-dark-lighter)',
          borderTopColor: '#1DB954',
          borderRadius: '50%'
        }} />
        <p style={{ color: 'var(--color-text)' }}>Connecting to Spotify...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        padding: '12px',
        background: '#ef4444',
        color: 'white',
        textAlign: 'center',
        zIndex: 9999
      }}>
        {error}
        <button 
          onClick={() => setError(null)}
          style={{ marginLeft: '12px', textDecoration: 'underline', background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}
        >
          Dismiss
        </button>
      </div>
    );
  }

  return null;
}

function AppContent() {
  // Auth & Spotify player
  const { user, profile } = useAuth();
  const { play } = useSpotifyPlayer();
  
  // State
  const [songs, setSongs] = useState<SongLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentSong, setCurrentSong] = useState<SongLocation | null>(null);
  const [selectedSong, setSelectedSong] = useState<SongLocation | null>(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showDetailPanel, setShowDetailPanel] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showMySubmissions, setShowMySubmissions] = useState(false);
  const [radius, setRadius] = useState(5);
  const [discoveryMode, setDiscoveryMode] = useState<'nearby' | 'explore'>('nearby');
  
  // User location (default to central London)
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>({
    latitude: 51.5074,
    longitude: -0.1278
  });

  // Exploration center (for "explore map" mode)
  const [exploreCenter, setExploreCenter] = useState<{ latitude: number; longitude: number; name?: string } | null>(null);

  // Map view state - centered on central London
  const [viewState, setViewState] = useState<MapViewState>({
    longitude: -0.1278,
    latitude: 51.5074,
    zoom: 13
  });

  // Load songs from database on mount and fetch real Spotify album art (with caching & rate limiting)
  useEffect(() => {
    async function loadSongs() {
      setIsLoading(true);
      const data = await fetchSongs();
      setSongs(data);
      setIsLoading(false);
      
      // Only fetch album art for songs that don't have real Spotify art cached
      // Real Spotify art URLs contain "i.scdn.co"
      const songsNeedingArt = data.filter(s => 
        s.spotifyUri && 
        s.albumArt && 
        !s.albumArt.includes('i.scdn.co')
      );
      
      if (songsNeedingArt.length === 0) {
        console.log('All songs have cached album art');
        return;
      }
      
      console.log(`Fetching album art for ${songsNeedingArt.length} songs (rate limited)...`);
      
      // Process one at a time with delays to avoid rate limiting (429 errors)
      const BATCH_SIZE = 1;  // Process one song at a time
      const DELAY_MS = 2000; // 2 seconds between requests
      
      for (let i = 0; i < songsNeedingArt.length; i += BATCH_SIZE) {
        const batch = songsNeedingArt.slice(i, i + BATCH_SIZE);
        
        // Process batch in parallel
        const results = await Promise.all(
          batch.map(async (song) => {
            const trackId = song.spotifyUri?.replace('spotify:track:', '');
            if (!trackId) return null;
            
            try {
              const trackInfo = await getTrackInfo(trackId);
              if (trackInfo?.albumArt) {
                return { songId: song.id, albumArt: trackInfo.albumArt };
              }
            } catch (err) {
              console.warn(`Failed to fetch art for ${song.title}`);
            }
            return null;
          })
        );
        
        // Update local state and persist to database
        for (const result of results) {
          if (result) {
            setSongs(prev => prev.map(s => 
              s.id === result.songId ? { ...s, albumArt: result.albumArt } : s
            ));
            // Cache in database so we don't need to fetch again
            updateSong(result.songId, { albumArt: result.albumArt });
          }
        }
        
        // Wait before next batch (if not last batch)
        if (i + BATCH_SIZE < songsNeedingArt.length) {
          await new Promise(resolve => setTimeout(resolve, DELAY_MS));
        }
      }
      
      console.log('Album art fetch complete');
    }
    
    // Clear old caches and preload images
    async function initCache() {
      await clearOldCache();
    }
    
    loadSongs();
    initCache();
  }, []);

  // Refresh songs (for admin panel)
  const refreshSongs = useCallback(async () => {
    const data = await fetchSongs();
    setSongs(data);
  }, []);

  // Preload album art images into browser cache when songs change
  useEffect(() => {
    if (songs.length > 0) {
      const imageUrls = songs
        .map(s => s.albumArt)
        .filter((url): url is string => !!url && url.includes('i.scdn.co'));
      
      if (imageUrls.length > 0) {
        console.log(`📷 Caching ${imageUrls.length} album art images...`);
        preloadImages(imageUrls).then(() => {
          console.log('✅ Image caching complete');
        });
      }
    }
  }, [songs]);

  // Get user's actual location
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };
          setUserLocation(newLocation);
          setViewState(prev => ({
            ...prev,
            latitude: newLocation.latitude,
            longitude: newLocation.longitude
          }));
        },
        (error) => {
          console.log('Geolocation error:', error.message);
        }
      );
    }
  }, []);

  // Calculate songs in radius based on discovery mode
  const songsInRadius = songs.filter(song => {
    // If radius is 0, show all songs (no filtering)
    if (radius === 0) return true;
    
    // Determine center point based on mode
    let centerLat: number;
    let centerLng: number;
    
    if (discoveryMode === 'nearby') {
      if (!userLocation) return true;
      centerLat = userLocation.latitude;
      centerLng = userLocation.longitude;
    } else {
      // Explore mode - use explore center or map center
      if (exploreCenter) {
        centerLat = exploreCenter.latitude;
        centerLng = exploreCenter.longitude;
      } else {
        // Fall back to current map view center
        centerLat = viewState.latitude;
        centerLng = viewState.longitude;
      }
    }
    
    const distance = getDistanceKm(centerLat, centerLng, song.latitude, song.longitude);
    return distance <= radius;
  });

  function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  // Handlers
  const handleSongSelect = useCallback((song: SongLocation) => {
    setSelectedSong(song);
    setCurrentSong(song);
  }, []);

  const handleShuffle = useCallback(() => {
    // Only shuffle songs with valid Spotify links
    const playableSongs = songsInRadius.filter(s => s.spotifyUri);
    if (playableSongs.length === 0) return;
    
    const randomIndex = Math.floor(Math.random() * playableSongs.length);
    const song = playableSongs[randomIndex];
    
    setCurrentSong(song);
    setSelectedSong(song);
    play(song); // Auto-play the shuffled song
  }, [songsInRadius, play]);

  const handleSubmitSong = useCallback(async (data: {
    title: string;
    artist: string;
    locationName: string;
    latitude: number;
    longitude: number;
    locationDescription: string;
    spotifyUrl?: string;
    albumArt?: string;
  }) => {
    const newSong: SongLocation = {
      id: `user-${Date.now()}`,
      title: data.title,
      artist: data.artist,
      albumArt: data.albumArt || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400',
      spotifyUri: data.spotifyUrl,
      latitude: data.latitude,
      longitude: data.longitude,
      locationName: data.locationName,
      locationDescription: data.locationDescription,
      upvotes: 0,
      verified: false,
      userId: user?.id,
      submittedBy: profile?.display_name || user?.email || 'Anonymous',
      submittedAt: new Date()
    };
    
    // Update local state immediately
    setSongs(prev => [...prev, newSong]);
    setShowSubmitModal(false);
    
    // Persist to database
    await addSong(newSong);
  }, [user, profile]);

  // Admin handlers
  const handleUpdateSong = useCallback(async (songId: string, updates: Partial<SongLocation>) => {
    // Update local state immediately
    setSongs(prev => prev.map(song => 
      song.id === songId ? { ...song, ...updates } : song
    ));
    
    // Also update currentSong if it's the one being updated
    setCurrentSong(prev => prev?.id === songId ? { ...prev, ...updates } : prev);
    
    // Persist to database
    await updateSong(songId, updates);
  }, []);

  const handleDeleteSong = useCallback(async (songId: string) => {
    // Update local state immediately
    setSongs(prev => prev.filter(song => song.id !== songId));
    if (currentSong?.id === songId) {
      setCurrentSong(null);
      setSelectedSong(null);
    }
    
    // Persist to database
    await deleteSong(songId);
  }, [currentSong]);

  // Loading state
  if (isLoading) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-[#0D1117]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[var(--color-text-muted)]">Loading SoundScape...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full relative overflow-hidden bg-[#0D1117]">
      {/* Header */}
      <Header 
        onSubmitClick={() => user ? setShowSubmitModal(true) : setShowAuthModal(true)} 
        onLoginClick={() => setShowAuthModal(true)}
        onAdminClick={() => setShowAdminPanel(true)}
        onMySubmissionsClick={() => user ? setShowMySubmissions(true) : setShowAuthModal(true)}
      />

      {/* Map */}
      <MusicMap
        songs={songsInRadius}
        allSongs={songs}
        currentSong={currentSong}
        selectedSong={selectedSong}
        onSongSelect={handleSongSelect}
        userLocation={userLocation}
        radius={radius}
        viewState={viewState}
        onViewStateChange={setViewState}
        discoveryMode={discoveryMode}
        discoveryCenter={
          discoveryMode === 'nearby' 
            ? userLocation 
            : exploreCenter || { latitude: viewState.latitude, longitude: viewState.longitude }
        }
      />

      {/* Discovery Panel */}
      <DiscoveryPanel
        radius={radius}
        onRadiusChange={setRadius}
        songCount={songsInRadius.length}
        totalSongCount={songs.length}
        mode={discoveryMode}
        onModeChange={setDiscoveryMode}
        onLocationSearch={(lat, lng, name) => {
          setExploreCenter({ latitude: lat, longitude: lng, name });
          setDiscoveryMode('explore');
          setViewState(prev => ({
            ...prev,
            latitude: lat,
            longitude: lng,
            zoom: 13
          }));
        }}
        onUseMyLocation={() => {
          if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
              (position) => {
                const newLocation = {
                  latitude: position.coords.latitude,
                  longitude: position.coords.longitude
                };
                setUserLocation(newLocation);
                setDiscoveryMode('nearby');
                setViewState(prev => ({
                  ...prev,
                  latitude: newLocation.latitude,
                  longitude: newLocation.longitude
                }));
              },
              (error) => {
                console.log('Geolocation error:', error.message);
                alert('Could not get your location. Please check permissions.');
              }
            );
          }
        }}
      />

      {/* Music Player */}
      <MusicPlayer
        currentSong={currentSong}
        onSongClick={() => currentSong && setShowDetailPanel(true)}
        onShuffle={handleShuffle}
      />

      {/* Song Detail Panel */}
      {showDetailPanel && currentSong && (
        <SongDetailPanel
          song={currentSong}
          onClose={() => setShowDetailPanel(false)}
        />
      )}

      {/* Submit Song Modal */}
      {showSubmitModal && (
        <SubmitSongModal
          onClose={() => setShowSubmitModal(false)}
          onSubmit={handleSubmitSong}
          userLocation={userLocation}
        />
      )}

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />

      {/* Admin Panel */}
      <AdminPanel
        isOpen={showAdminPanel}
        onClose={() => setShowAdminPanel(false)}
        songs={songs}
        onUpdateSong={handleUpdateSong}
        onDeleteSong={handleDeleteSong}
        onRefreshSongs={refreshSongs}
      />

      {/* My Submissions */}
      <MySubmissions
        isOpen={showMySubmissions}
        onClose={() => setShowMySubmissions(false)}
      />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <SpotifyPlayerProvider>
        <SpotifyCallbackHandler />
        <AppContent />
      </SpotifyPlayerProvider>
    </AuthProvider>
  );
}

export default App;
