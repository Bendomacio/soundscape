import { useState, useEffect, useRef, useMemo } from 'react';
import {
  X,
  MapPin,
  Heart,
  Share2,
  ExternalLink,
  CheckCircle,
  Music,
  User,
  Tag,
  Play,
  Pause,
  MessageCircle,
  Camera,
  Send,
  Trash2,
  Clock,
  ImageIcon,
  Navigation,
  Eye,
  Compass,
  Users
} from 'lucide-react';
import type { SongLocation, SongComment, SongPhoto } from '../types';
import { hasPlayableLink } from '../types';
import { useSpotifyPlayer } from '../contexts/SpotifyPlayerContext';
import { useAuth } from '../contexts/AuthContext';
import { getComments, addComment, deleteComment, getPhotos, uploadPhoto } from '../lib/comments';
import { likeSong, unlikeSong, hasUserLikedSong, getSongLikeCount } from '../lib/songs';
import { LoadingSpinner, UserAvatar, EmptyState } from './ui';

interface SongDetailPanelProps {
  song: SongLocation;
  onClose: () => void;
  userLocation?: { latitude: number; longitude: number } | null;
  allSongs?: SongLocation[];
  onSongSelect?: (song: SongLocation) => void;
}

// Detect mobile device
const isMobile = () => /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

// Fallback image for failed loads
const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop';

// Extract dominant color from image (simplified approach using canvas)
function useDominantColor(imageUrl: string): string {
  const [color, setColor] = useState('rgba(30, 215, 96, 0.3)'); // Default Spotify green

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        canvas.width = 50;
        canvas.height = 50;
        ctx.drawImage(img, 0, 0, 50, 50);
        
        const imageData = ctx.getImageData(0, 0, 50, 50).data;
        let r = 0, g = 0, b = 0, count = 0;
        
        // Sample pixels to get average color
        for (let i = 0; i < imageData.length; i += 16) {
          r += imageData[i];
          g += imageData[i + 1];
          b += imageData[i + 2];
          count++;
        }
        
        r = Math.round(r / count);
        g = Math.round(g / count);
        b = Math.round(b / count);
        
        setColor(`rgba(${r}, ${g}, ${b}, 0.4)`);
      } catch {
        // CORS or other error - use default
      }
    };
    img.src = imageUrl;
  }, [imageUrl]);

  return color;
}

// Calculate distance between two coordinates in km
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

// Format distance for display
function formatDistance(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)}m`;
  }
  return `${km.toFixed(1)}km`;
}

export function SongDetailPanel({ song, onClose, userLocation, allSongs = [], onSongSelect }: SongDetailPanelProps) {
  const [albumImgError, setAlbumImgError] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(song.upvotes || 0);
  const [isLiking, setIsLiking] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'comments' | 'photos'>('info');
  const [comments, setComments] = useState<SongComment[]>([]);
  const [photos, setPhotos] = useState<SongPhoto[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [photoCaption, setPhotoCaption] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { currentSong, isPlaying, isLoading, play, togglePlayPause } = useSpotifyPlayer();
  const { user, profile } = useAuth();
  const dominantColor = useDominantColor(song.albumArt || FALLBACK_IMAGE);

  // Calculate nearby songs (within 5km, sorted by distance)
  const nearbySongs = useMemo(() => {
    if (!allSongs.length) return [];
    return allSongs
      .filter(s => s.id !== song.id && hasPlayableLink(s)) // Exclude current song and invalid songs
      .map(s => ({
        ...s,
        distance: getDistanceKm(song.latitude, song.longitude, s.latitude, s.longitude)
      }))
      .filter(s => s.distance <= 5) // Within 5km
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 10); // Max 10 songs
  }, [allSongs, song.id, song.latitude, song.longitude]);

  // Calculate related songs (same artist)
  const relatedSongs = useMemo(() => {
    if (!allSongs.length || !song.artist) return [];
    const currentArtist = song.artist.toLowerCase().trim();
    return allSongs
      .filter(s =>
        s.id !== song.id &&
        hasPlayableLink(s) &&
        s.artist &&
        s.artist.toLowerCase().trim() === currentArtist
      )
      .slice(0, 10); // Max 10 songs
  }, [allSongs, song.id, song.artist]);

  // Load like state on mount
  useEffect(() => {
    async function loadLikeState() {
      if (user) {
        const hasLiked = await hasUserLikedSong(song.id, user.id);
        setLiked(hasLiked);
      }
      const count = await getSongLikeCount(song.id);
      if (count > 0) setLikeCount(count);
    }
    loadLikeState();
  }, [song.id, user]);

  const canPlay = hasPlayableLink(song);
  const spotifyTrackId = song.spotifyUri?.replace('spotify:track:', '') || song.providerLinks?.spotify?.replace('spotify:track:', '');
  const isThisSongPlaying = currentSong?.id === song.id && isPlaying;
  const isThisSongLoading = currentSong?.id === song.id && isLoading;

  // Load comments when tab changes
  useEffect(() => {
    if (activeTab === 'comments' && comments.length === 0) {
      setLoadingComments(true);
      getComments(song.id).then(data => {
        setComments(data);
        setLoadingComments(false);
      });
    }
  }, [activeTab, song.id, comments.length]);

  // Load photos when tab changes
  useEffect(() => {
    if (activeTab === 'photos' && photos.length === 0) {
      setLoadingPhotos(true);
      getPhotos(song.id, !!user).then(data => {
        setPhotos(data);
        setLoadingPhotos(false);
      });
    }
  }, [activeTab, song.id, photos.length, user]);

  const handlePlayPause = () => {
    if (isThisSongPlaying || isThisSongLoading) {
      togglePlayPause();
    } else {
      play(song);
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: `${song.title} by ${song.artist}`,
      text: `Check out "${song.title}" at ${song.locationName} on Soundscape!`,
      url: `${window.location.origin}/?song=${song.id}`
    };

    // Use native share on mobile if available
    if (navigator.share && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
      try {
        await navigator.share(shareData);
        return;
      } catch (err) {
        // User cancelled or share failed, fall back to clipboard
        if ((err as Error).name === 'AbortError') return;
      }
    }

    // Fallback: copy to clipboard
    try {
      await navigator.clipboard.writeText(shareData.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
    }
  };

  const handleGetDirections = () => {
    // Opens Google Maps with directions from current location to song location
    const destination = `${song.latitude},${song.longitude}`;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=walking`;
    window.open(url, '_blank');
  };

  const handleOpenStreetView = () => {
    // Opens Google Street View at the song location
    const url = `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${song.latitude},${song.longitude}`;
    window.open(url, '_blank');
  };

  const handleLike = async () => {
    if (!user) {
      alert('Please sign in to like songs');
      return;
    }
    if (isLiking) return;
    
    setIsLiking(true);
    
    if (liked) {
      // Unlike
      const success = await unlikeSong(song.id, user.id);
      if (success) {
        setLiked(false);
        setLikeCount(prev => Math.max(0, prev - 1));
      }
    } else {
      // Like
      const success = await likeSong(song.id, user.id);
      if (success) {
        setLiked(true);
        setLikeCount(prev => prev + 1);
      }
    }
    
    setIsLiking(false);
  };

  const handleSubmitComment = async () => {
    if (!user || !newComment.trim()) return;
    
    setIsSubmittingComment(true);
    try {
      const comment = await addComment(song.id, user.id, newComment);
      if (comment) {
        // Add profile info from current user
        comment.userDisplayName = profile?.display_name || user.email || 'Anonymous';
        comment.userAvatarUrl = profile?.avatar_url ?? undefined;
        setComments([comment, ...comments]);
        setNewComment('');
      } else {
        console.error('Failed to add comment - no data returned');
        alert('Failed to add comment. Please try again.');
      }
    } catch (err) {
      console.error('Error submitting comment:', err);
      alert('Failed to add comment. Please try again.');
    }
    setIsSubmittingComment(false);
  };

  const handleDeleteComment = async (commentId: string) => {
    if (await deleteComment(commentId)) {
      setComments(comments.filter(c => c.id !== commentId));
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setIsUploadingPhoto(true);
    const photo = await uploadPhoto(song.id, user.id, file, photoCaption);
    if (photo) {
      photo.userDisplayName = profile?.display_name || 'You';
      setPhotos([photo, ...photos]);
      setPhotoCaption('');
    }
    setIsUploadingPhoto(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  // Check if on desktop for sidebar display
  const isDesktop = !isMobile();

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      zIndex: 9999
    }}>
      {/* Backdrop - darker with more blur */}
      <div
        onClick={onClose}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.9)',
          backdropFilter: 'blur(12px)'
        }}
      />

      {/* Container for main panel + sidebars */}
      <div
        onClick={e => e.stopPropagation()}
        className="animate-scale-in"
        style={{
          display: 'flex',
          gap: '16px',
          maxHeight: '90vh',
          position: 'relative'
        }}
      >
        {/* Main Panel - Glassmorphism */}
        <div
          ref={panelRef}
          className="song-detail-panel glass-dark"
          style={{
            position: 'relative',
            width: '100%',
            maxWidth: '420px',
            maxHeight: '90vh',
            borderRadius: '24px',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.7), 0 0 0 1px var(--glass-border)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
        {/* Dynamic gradient header based on album colors - enhanced glow */}
        <div style={{
          position: 'relative',
          padding: '24px 24px 80px 24px',
          background: `linear-gradient(180deg, ${dominantColor} 0%, transparent 100%)`
        }}>
          {/* Close button - glass style */}
          <button
            onClick={onClose}
            className="btn-glass"
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              width: '40px',
              height: '40px',
              padding: 0,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              cursor: 'pointer'
            }}
            aria-label="Close"
          >
            <X size={20} />
          </button>

          {/* Hero Album Art with Play Button */}
          <div style={{
            position: 'relative',
            width: '180px',
            height: '180px',
            margin: '20px auto 0',
          }}>
            {/* Glow effect - more vibrant */}
            <div style={{
              position: 'absolute',
              inset: '-30px',
              background: dominantColor,
              filter: 'blur(50px)',
              opacity: 0.7,
              borderRadius: '50%',
              animation: 'pulse 3s ease-in-out infinite'
            }} />

            {/* Album art with glass border */}
            <div style={{
              position: 'relative',
              width: '100%',
              height: '100%',
              borderRadius: '20px',
              overflow: 'hidden',
              boxShadow: '0 20px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.1)'
            }}>
              <img
                src={albumImgError ? FALLBACK_IMAGE : song.albumArt}
                alt={song.album || song.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={() => setAlbumImgError(true)}
              />

              {/* Play button overlay - gradient style */}
              {canPlay && (
                <button
                  onClick={handlePlayPause}
                  className={!isThisSongPlaying ? 'animate-pulse-glow' : ''}
                  style={{
                    position: 'absolute',
                    bottom: '12px',
                    right: '12px',
                    width: '52px',
                    height: '52px',
                    borderRadius: '50%',
                    border: isThisSongPlaying ? '2px solid var(--color-primary)' : 'none',
                    background: isThisSongPlaying
                      ? 'rgba(255,255,255,0.1)'
                      : 'linear-gradient(135deg, #1DB954 0%, #1ed760 100%)',
                    backdropFilter: isThisSongPlaying ? 'blur(10px)' : 'none',
                    color: isThisSongPlaying ? 'var(--color-primary)' : 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: isThisSongPlaying
                      ? 'none'
                      : '0 8px 24px rgba(29, 185, 84, 0.4)',
                    transition: 'transform 0.2s, box-shadow 0.2s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                  {isThisSongLoading ? (
                    <LoadingSpinner size={24} />
                  ) : isThisSongPlaying ? (
                    <Pause size={24} fill="currentColor" />
                  ) : (
                    <Play size={24} fill="currentColor" style={{ marginLeft: '3px' }} />
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div 
          className="song-detail-content"
          style={{ 
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            padding: '0 24px 24px', 
            marginTop: '-40px', 
            position: 'relative',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          {/* Song title and artist */}
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <h2 style={{ 
                fontSize: '24px', 
                fontWeight: 700, 
                margin: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: '300px'
              }}>
                {song.title}
              </h2>
              {song.verified && (
                <CheckCircle size={20} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
              )}
            </div>
            <p style={{ 
              color: 'var(--color-text-muted)', 
              margin: '4px 0 0',
              fontSize: '16px'
            }}>
              {song.artist}
            </p>
            {song.album && (
              <p style={{ 
                color: 'var(--color-text-muted)', 
                margin: '2px 0 0',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px'
              }}>
                <Music size={12} />
                {song.album}
              </p>
            )}
          </div>

          {/* Location card - glass style */}
          <div className="glass-light" style={{
            padding: '16px',
            borderRadius: '16px',
            marginBottom: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'rgba(16, 185, 129, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-primary)'
              }}>
                <MapPin size={18} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontWeight: 600, fontSize: '14px' }}>{song.locationName}</span>
                {song.locationDescription && (
                  <p style={{
                    margin: '4px 0 0',
                    fontSize: '13px',
                    color: 'var(--color-text-muted)',
                    lineHeight: 1.4
                  }}>
                    {song.locationDescription}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Tags - badge style */}
          {song.tags && song.tags.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
              {song.tags.map(tag => (
                <span
                  key={tag}
                  className="badge"
                  style={{
                    padding: '6px 12px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid var(--glass-border)'
                  }}
                >
                  <Tag size={11} style={{ opacity: 0.7 }} />
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Action buttons - glass pill style */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            padding: '16px 0',
            borderTop: '1px solid var(--glass-border)',
            borderBottom: '1px solid var(--glass-border)',
            margin: '8px 0'
          }}>
            {/* Like button */}
            <button
              onClick={handleLike}
              className="btn-glass"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                background: liked ? 'rgba(244, 63, 94, 0.15)' : undefined,
                borderColor: liked ? 'rgba(244, 63, 94, 0.3)' : undefined,
                color: liked ? 'var(--color-accent)' : 'var(--color-text-muted)',
                cursor: 'pointer'
              }}
            >
              <Heart size={18} fill={liked ? 'currentColor' : 'none'} />
              <span style={{ fontWeight: 600, fontSize: '13px' }}>{likeCount}</span>
            </button>

            {/* Share button */}
            <button
              onClick={handleShare}
              className="btn-glass"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                background: copied ? 'rgba(16, 185, 129, 0.15)' : undefined,
                borderColor: copied ? 'rgba(16, 185, 129, 0.3)' : undefined,
                color: copied ? 'var(--color-primary)' : 'var(--color-text-muted)',
                cursor: 'pointer'
              }}
            >
              <Share2 size={18} />
              <span style={{ fontWeight: 600, fontSize: '13px' }}>{copied ? 'Copied!' : 'Share'}</span>
            </button>

            {/* Spotify link */}
            {spotifyTrackId && (
              <a
                href={`https://open.spotify.com/track/${spotifyTrackId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-glass"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 18px',
                  color: '#1DB954',
                  textDecoration: 'none'
                }}
              >
                <ExternalLink size={18} />
                <span style={{ fontWeight: 600, fontSize: '13px' }}>Spotify</span>
              </a>
            )}
          </div>

          {/* Submitted by */}
          {song.submittedBy && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              marginTop: '16px',
              color: 'var(--color-text-muted)',
              fontSize: '13px'
            }}>
              <div style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: 'var(--color-dark-lighter)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <User size={14} />
              </div>
              <span>
                Submitted by <strong style={{ color: 'var(--color-text)' }}>{song.submittedBy}</strong>
                {song.submittedAt && (
                  <span style={{ marginLeft: '6px', opacity: 0.7 }}>
                    · {formatTimeAgo(new Date(song.submittedAt))}
                  </span>
                )}
              </span>
            </div>
          )}

          {/* Tabs - toggle group style */}
          <div className="toggle-group" style={{ marginTop: '20px' }}>
            {[
              { id: 'info' as const, label: 'Info', icon: Compass },
              { id: 'comments' as const, label: 'Comments', icon: MessageCircle },
              { id: 'photos' as const, label: 'Photos', icon: Camera }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`toggle-item ${activeTab === tab.id ? 'active' : ''}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <tab.icon size={15} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div style={{ marginTop: '16px', minHeight: '150px' }}>
            {/* Info Tab - Mini map and navigation */}
            {activeTab === 'info' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* Map Preview - glass card */}
                <div className="glass-light" style={{
                  position: 'relative',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  padding: '4px'
                }}>
                  {isMobile() && userLocation ? (
                    // Mobile: Embedded Google Maps with directions route
                    <iframe
                      src={`https://www.google.com/maps?saddr=${userLocation.latitude},${userLocation.longitude}&daddr=${song.latitude},${song.longitude}&dirflg=w&output=embed`}
                      style={{
                        width: '100%',
                        height: '200px',
                        border: 'none',
                        display: 'block',
                        borderRadius: '12px'
                      }}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                    />
                  ) : (
                    // Desktop: Static Mapbox map
                    <div style={{ position: 'relative' }}>
                      <img
                        src={`https://api.mapbox.com/styles/v1/mapbox/dark-v11/static/pin-s+10b981(${song.longitude},${song.latitude})/${song.longitude},${song.latitude},15,0/400x200@2x?access_token=${import.meta.env.VITE_MAPBOX_TOKEN}`}
                        alt={`Map of ${song.locationName}`}
                        style={{
                          width: '100%',
                          height: '160px',
                          objectFit: 'cover',
                          display: 'block',
                          borderRadius: '12px'
                        }}
                      />
                      {/* Coordinates overlay - glass style */}
                      <div className="glass" style={{
                        position: 'absolute',
                        bottom: '8px',
                        left: '8px',
                        padding: '6px 10px',
                        borderRadius: '8px',
                        fontSize: '11px',
                        color: 'var(--color-text-muted)',
                        fontFamily: 'monospace'
                      }}>
                        {song.latitude.toFixed(5)}, {song.longitude.toFixed(5)}
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons - gradient and glass */}
                <div style={{ display: 'flex', gap: '10px' }}>
                  {/* Get Directions - gradient button */}
                  <button
                    onClick={handleGetDirections}
                    className="btn-gradient"
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      padding: '14px 16px',
                      background: 'var(--gradient-primary)',
                      borderRadius: '12px',
                      color: 'white',
                      fontSize: '14px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      boxShadow: 'var(--shadow-glow-primary)'
                    }}
                  >
                    <Navigation size={18} />
                    {isMobile() ? 'Open in Maps' : 'Get Directions'}
                  </button>

                  {/* Street View - glass button */}
                  <button
                    onClick={handleOpenStreetView}
                    className="btn-glass"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      padding: '14px 16px',
                      fontSize: '14px',
                      fontWeight: 500,
                      cursor: 'pointer'
                    }}
                  >
                    <Eye size={18} />
                    Street View
                  </button>
                </div>

                {/* Location tip - subtle */}
                <p style={{
                  fontSize: '12px',
                  color: 'var(--color-text-muted)',
                  textAlign: 'center',
                  margin: 0,
                  opacity: 0.6
                }}>
                  {isMobile() && userLocation
                    ? 'Route shown from your current location'
                    : 'Tap "Get Directions" to navigate to this song\'s location'}
                </p>
              </div>
            )}

            {/* Comments Tab */}
            {activeTab === 'comments' && (
              <div>
                {/* Add comment input - glass style */}
                {user ? (
                  <div className="glass-light" style={{
                    display: 'flex',
                    gap: '10px',
                    marginBottom: '16px',
                    padding: '12px',
                    borderRadius: '14px'
                  }}>
                    <UserAvatar
                      avatarUrl={profile?.avatar_url}
                      displayName={profile?.display_name}
                      email={user.email}
                      size={36}
                    />
                    <input
                      type="text"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Add a comment..."
                      maxLength={500}
                      className="input-glass"
                      style={{
                        flex: 1,
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid var(--glass-border)',
                        borderRadius: '10px',
                        padding: '8px 12px',
                        color: 'white',
                        fontSize: '14px',
                        outline: 'none'
                      }}
                      onKeyDown={(e) => e.key === 'Enter' && handleSubmitComment()}
                    />
                    <button
                      onClick={handleSubmitComment}
                      disabled={!newComment.trim() || isSubmittingComment}
                      style={{
                        background: newComment.trim() ? 'var(--gradient-primary)' : 'rgba(255,255,255,0.05)',
                        border: 'none',
                        borderRadius: '10px',
                        width: '36px',
                        height: '36px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: newComment.trim() ? 'pointer' : 'default',
                        color: newComment.trim() ? 'white' : 'var(--color-text-muted)',
                        boxShadow: newComment.trim() ? '0 4px 12px rgba(16, 185, 129, 0.3)' : 'none',
                        transition: 'all 0.2s'
                      }}
                    >
                      {isSubmittingComment ? <LoadingSpinner size={16} /> : <Send size={16} />}
                    </button>
                  </div>
                ) : (
                  <div className="glass-light" style={{
                    padding: '20px',
                    borderRadius: '14px',
                    textAlign: 'center',
                    marginBottom: '16px'
                  }}>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '14px', margin: 0 }}>
                      Sign in to leave a comment
                    </p>
                  </div>
                )}

                {/* Comments list */}
                {loadingComments ? (
                  <div style={{ textAlign: 'center', padding: '24px' }}>
                    <LoadingSpinner size={24} className="text-[var(--color-text-muted)]" />
                  </div>
                ) : comments.length === 0 ? (
                  <EmptyState icon={MessageCircle} message="No comments yet. Be the first!" />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {comments.map(comment => (
                      <div
                        key={comment.id}
                        className="glass-light"
                        style={{
                          display: 'flex',
                          gap: '12px',
                          padding: '14px',
                          borderRadius: '14px'
                        }}
                      >
                        <UserAvatar
                          avatarUrl={comment.userAvatarUrl}
                          size={36}
                          bgColor="rgba(255,255,255,0.05)"
                          showFallbackIcon
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                            <span style={{ fontWeight: 600, fontSize: '13px' }}>{comment.userDisplayName}</span>
                            <span className="badge" style={{
                              padding: '2px 8px',
                              fontSize: '10px',
                              background: 'rgba(255,255,255,0.05)',
                              gap: '4px'
                            }}>
                              <Clock size={9} />
                              {formatTimeAgo(comment.createdAt)}
                            </span>
                          </div>
                          <p style={{ fontSize: '14px', margin: 0, wordBreak: 'break-word', lineHeight: 1.5 }}>{comment.content}</p>
                        </div>
                        {user?.id === comment.userId && (
                          <button
                            onClick={() => handleDeleteComment(comment.id)}
                            className="btn-glass"
                            style={{
                              padding: '6px',
                              color: 'var(--color-text-muted)',
                              opacity: 0.6
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.color = 'var(--color-accent)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.6'; e.currentTarget.style.color = 'var(--color-text-muted)'; }}
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Photos Tab */}
            {activeTab === 'photos' && (
              <div>
                {/* Upload photo - glass dashed border */}
                {user && (
                  <div className="glass-light" style={{
                    padding: '16px',
                    borderRadius: '14px',
                    marginBottom: '16px'
                  }}>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      style={{ display: 'none' }}
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingPhoto}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '10px',
                        padding: '16px',
                        background: 'rgba(255,255,255,0.02)',
                        border: '2px dashed rgba(255,255,255,0.1)',
                        borderRadius: '12px',
                        color: 'var(--color-text-muted)',
                        cursor: 'pointer',
                        fontSize: '14px',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.color = 'var(--color-primary)'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'var(--color-text-muted)'; }}
                    >
                      {isUploadingPhoto ? (
                        <><LoadingSpinner size={18} /> Uploading...</>
                      ) : (
                        <><Camera size={20} /> Share a photo from this location</>
                      )}
                    </button>
                    <p style={{
                      fontSize: '11px',
                      color: 'var(--color-text-muted)',
                      textAlign: 'center',
                      marginTop: '10px',
                      opacity: 0.6
                    }}>
                      Photos require admin approval before appearing
                    </p>
                  </div>
                )}

                {/* Photos grid */}
                {loadingPhotos ? (
                  <div style={{ textAlign: 'center', padding: '24px' }}>
                    <LoadingSpinner size={24} className="text-[var(--color-text-muted)]" />
                  </div>
                ) : photos.length === 0 ? (
                  <EmptyState icon={ImageIcon} message="No photos yet. Be the first to share!" />
                ) : (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '10px'
                  }}>
                    {photos.map(photo => (
                      <div
                        key={photo.id}
                        className="glass-light"
                        style={{
                          position: 'relative',
                          paddingBottom: '100%',
                          borderRadius: '14px',
                          overflow: 'hidden'
                        }}
                      >
                        <img
                          src={photo.photoUrl}
                          alt={photo.caption || 'User photo'}
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                          }}
                        />
                        {!photo.approved && photo.userId === user?.id && (
                          <div className="badge badge-amber" style={{
                            position: 'absolute',
                            top: '8px',
                            left: '8px',
                            padding: '4px 10px',
                            fontSize: '10px'
                          }}>
                            Pending
                          </div>
                        )}
                        <div style={{
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          right: 0,
                          padding: '10px 12px',
                          background: 'linear-gradient(transparent, rgba(0,0,0,0.85))',
                          fontSize: '11px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          <Camera size={10} style={{ opacity: 0.7 }} />
                          <span style={{ opacity: 0.9 }}>{photo.userDisplayName}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        </div>

        {/* Sidebar panels - Desktop only - Glassmorphism */}
        {isDesktop && (nearbySongs.length > 0 || relatedSongs.length > 0) && (
          <div
            className="animate-slide-left"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              width: '300px',
              maxHeight: '90vh',
              flexShrink: 0
            }}
          >
            {/* Songs Nearby Panel - Glass card with gradient accent */}
            {nearbySongs.length > 0 && (
              <div className="card-glass" style={{
                overflow: 'hidden',
                maxHeight: 'calc(45vh - 8px)'
              }}>
                {/* Header with icon */}
                <div style={{
                  padding: '16px',
                  borderBottom: '1px solid var(--glass-border)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: 'rgba(16, 185, 129, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Compass size={16} style={{ color: 'var(--color-primary)' }} />
                  </div>
                  <span style={{ fontSize: '14px', fontWeight: 600 }}>Songs Nearby</span>
                  <span className="badge badge-primary" style={{ marginLeft: 'auto', padding: '2px 8px', fontSize: '10px' }}>
                    {nearbySongs.length}
                  </span>
                </div>
                <div style={{
                  padding: '10px',
                  overflowY: 'auto',
                  maxHeight: 'calc(45vh - 70px)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}>
                  {nearbySongs.map(nearbySong => (
                    <button
                      key={nearbySong.id}
                      onClick={() => onSongSelect?.(nearbySong)}
                      className="glass-light"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '10px',
                        border: 'none',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        textAlign: 'left',
                        width: '100%',
                        transition: 'all 0.2s'
                      }}
                    >
                      <div style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '10px',
                        overflow: 'hidden',
                        flexShrink: 0,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                      }}>
                        {nearbySong.albumArt ? (
                          <img
                            src={nearbySong.albumArt}
                            alt={nearbySong.title}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          <div style={{
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'rgba(255,255,255,0.05)'
                          }}>
                            <Music size={18} color="var(--color-text-muted)" />
                          </div>
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontWeight: 600,
                          fontSize: '13px',
                          color: 'white',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {nearbySong.title}
                        </div>
                        <div style={{
                          fontSize: '11px',
                          color: 'var(--color-text-muted)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {nearbySong.artist}
                        </div>
                      </div>
                      <span className="badge badge-primary" style={{
                        padding: '4px 10px',
                        fontSize: '10px',
                        fontWeight: 600,
                        flexShrink: 0
                      }}>
                        {formatDistance(nearbySong.distance)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Related Songs Panel - Glass card with purple accent */}
            {relatedSongs.length > 0 && (
              <div className="card-glass" style={{
                overflow: 'hidden',
                maxHeight: 'calc(45vh - 8px)'
              }}>
                {/* Header with icon */}
                <div style={{
                  padding: '16px',
                  borderBottom: '1px solid var(--glass-border)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: 'rgba(139, 92, 246, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Users size={16} style={{ color: '#8B5CF6' }} />
                  </div>
                  <span style={{ fontSize: '14px', fontWeight: 600 }}>More by {song.artist}</span>
                  <span className="badge badge-purple" style={{ marginLeft: 'auto', padding: '2px 8px', fontSize: '10px' }}>
                    {relatedSongs.length}
                  </span>
                </div>
                <div style={{
                  padding: '10px',
                  overflowY: 'auto',
                  maxHeight: 'calc(45vh - 70px)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}>
                  {relatedSongs.map(relatedSong => (
                    <button
                      key={relatedSong.id}
                      onClick={() => onSongSelect?.(relatedSong)}
                      className="glass-light"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '10px',
                        border: 'none',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        textAlign: 'left',
                        width: '100%',
                        transition: 'all 0.2s'
                      }}
                    >
                      <div style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '10px',
                        overflow: 'hidden',
                        flexShrink: 0,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                      }}>
                        {relatedSong.albumArt ? (
                          <img
                            src={relatedSong.albumArt}
                            alt={relatedSong.title}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          <div style={{
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'rgba(255,255,255,0.05)'
                          }}>
                            <Music size={18} color="var(--color-text-muted)" />
                          </div>
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontWeight: 600,
                          fontSize: '13px',
                          color: 'white',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {relatedSong.title}
                        </div>
                        <div style={{
                          fontSize: '11px',
                          color: 'var(--color-text-muted)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          <MapPin size={10} />
                          {relatedSong.locationName}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
