import { useState, useEffect, useRef } from 'react';
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
  Loader2,
  MessageCircle,
  Camera,
  Send,
  Trash2,
  Clock,
  ImageIcon
} from 'lucide-react';
import type { SongLocation, SongComment, SongPhoto } from '../types';
import { useSpotifyPlayer } from '../contexts/SpotifyPlayerContext';
import { useAuth } from '../contexts/AuthContext';
import { getComments, addComment, deleteComment, getPhotos, uploadPhoto } from '../lib/comments';

interface SongDetailPanelProps {
  song: SongLocation;
  onClose: () => void;
}

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

export function SongDetailPanel({ song, onClose }: SongDetailPanelProps) {
  const [albumImgError, setAlbumImgError] = useState(false);
  const [liked, setLiked] = useState(false);
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

  const trackId = song.spotifyUri?.replace('spotify:track:', '');
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
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
    }
  };

  const handleLike = () => {
    setLiked(!liked);
    // TODO: Persist to database
  };

  const handleSubmitComment = async () => {
    if (!user || !newComment.trim()) return;
    
    setIsSubmittingComment(true);
    const comment = await addComment(song.id, user.id, newComment);
    if (comment) {
      // Add profile info from current user
      comment.userDisplayName = profile?.display_name || user.email || 'Anonymous';
      comment.userAvatarUrl = profile?.avatar_url;
      setComments([comment, ...comments]);
      setNewComment('');
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
      {/* Backdrop with blur */}
      <div 
        onClick={onClose}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(8px)'
        }} 
      />
      
      {/* Panel - Centered Modal */}
      <div 
        ref={panelRef}
        onClick={e => e.stopPropagation()}
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '420px',
          maxHeight: '90vh',
          background: 'var(--color-dark-card)',
          borderRadius: '24px',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
          overflow: 'hidden'
        }}
      >
        {/* Dynamic gradient header based on album colors */}
        <div style={{
          position: 'relative',
          padding: '24px 24px 80px 24px',
          background: `linear-gradient(180deg, ${dominantColor} 0%, var(--color-dark-card) 100%)`
        }}>
          {/* Close button */}
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              width: '36px',
              height: '36px',
              background: 'rgba(0,0,0,0.3)',
              backdropFilter: 'blur(10px)',
              borderRadius: '50%',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              cursor: 'pointer',
              transition: 'background 0.2s'
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
            {/* Glow effect */}
            <div style={{
              position: 'absolute',
              inset: '-20px',
              background: dominantColor,
              filter: 'blur(40px)',
              opacity: 0.6,
              borderRadius: '50%'
            }} />
            
            {/* Album art */}
            <div style={{
              position: 'relative',
              width: '100%',
              height: '100%',
              borderRadius: '16px',
              overflow: 'hidden',
              boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
            }}>
              <img 
                src={albumImgError ? FALLBACK_IMAGE : song.albumArt}
                alt={song.album || song.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={() => setAlbumImgError(true)}
              />
              
              {/* Play button overlay */}
              {trackId && (
                <button
                  onClick={handlePlayPause}
                  style={{
                    position: 'absolute',
                    bottom: '12px',
                    right: '12px',
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    border: 'none',
                    background: isThisSongPlaying ? 'white' : '#1DB954',
                    color: isThisSongPlaying ? '#1DB954' : 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: '0 8px 16px rgba(0,0,0,0.3)',
                    transition: 'transform 0.2s, background 0.2s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                  {isThisSongLoading ? (
                    <Loader2 size={24} className="animate-spin" />
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

        {/* Content */}
        <div style={{ padding: '0 24px 24px', marginTop: '-40px', position: 'relative' }}>
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

          {/* Location card */}
          <div style={{
            padding: '16px',
            background: 'var(--color-dark-lighter)',
            borderRadius: '16px',
            marginBottom: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-primary)' }}>
              <MapPin size={16} />
              <span style={{ fontWeight: 600 }}>{song.locationName}</span>
            </div>
            {song.locationDescription && (
              <p style={{ 
                margin: '10px 0 0', 
                fontSize: '14px', 
                color: 'var(--color-text-muted)',
                lineHeight: 1.5
              }}>
                {song.locationDescription}
              </p>
            )}
          </div>

          {/* Tags */}
          {song.tags && song.tags.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
              {song.tags.map(tag => (
                <span 
                  key={tag}
                  style={{
                    padding: '6px 12px',
                    background: 'var(--color-dark-lighter)',
                    borderRadius: '20px',
                    fontSize: '12px',
                    color: 'var(--color-text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Tag size={12} />
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Action buttons - pill style */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            padding: '16px 0',
            borderTop: '1px solid var(--color-dark-lighter)',
            borderBottom: '1px solid var(--color-dark-lighter)',
            margin: '8px 0'
          }}>
            {/* Like button */}
            <button
              onClick={handleLike}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                background: liked ? 'rgba(239, 68, 68, 0.15)' : 'var(--color-dark-lighter)',
                border: 'none',
                borderRadius: '24px',
                color: liked ? '#ef4444' : 'var(--color-text-muted)',
                cursor: 'pointer',
                fontWeight: 500,
                fontSize: '14px',
                transition: 'all 0.2s'
              }}
            >
              <Heart size={18} fill={liked ? 'currentColor' : 'none'} />
              <span>{liked ? song.upvotes + 1 : song.upvotes}</span>
            </button>

            {/* Share button */}
            <button
              onClick={handleShare}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                background: copied ? 'rgba(16, 185, 129, 0.15)' : 'var(--color-dark-lighter)',
                border: 'none',
                borderRadius: '24px',
                color: copied ? 'var(--color-primary)' : 'var(--color-text-muted)',
                cursor: 'pointer',
                fontWeight: 500,
                fontSize: '14px',
                transition: 'all 0.2s'
              }}
            >
              <Share2 size={18} />
              <span>{copied ? 'Copied!' : 'Share'}</span>
            </button>

            {/* Spotify link */}
            {trackId && (
              <a
                href={`https://open.spotify.com/track/${trackId}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 20px',
                  background: 'var(--color-dark-lighter)',
                  border: 'none',
                  borderRadius: '24px',
                  color: '#1DB954',
                  textDecoration: 'none',
                  fontWeight: 500,
                  fontSize: '14px',
                  transition: 'all 0.2s'
                }}
              >
                <ExternalLink size={18} />
                <span>Spotify</span>
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
              <span>Submitted by <strong style={{ color: 'var(--color-text)' }}>{song.submittedBy}</strong></span>
            </div>
          )}

          {/* Tabs */}
          <div style={{
            display: 'flex',
            gap: '4px',
            marginTop: '20px',
            padding: '4px',
            background: 'var(--color-dark-lighter)',
            borderRadius: '12px'
          }}>
            {[
              { id: 'info' as const, label: 'Info', icon: Music },
              { id: 'comments' as const, label: 'Comments', icon: MessageCircle },
              { id: 'photos' as const, label: 'Photos', icon: Camera }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '10px',
                  background: activeTab === tab.id ? 'var(--color-dark-card)' : 'transparent',
                  border: 'none',
                  borderRadius: '8px',
                  color: activeTab === tab.id ? 'white' : 'var(--color-text-muted)',
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div style={{ marginTop: '16px', minHeight: '150px' }}>
            {/* Info Tab - Location details shown above */}
            {activeTab === 'info' && (
              <div style={{ 
                padding: '16px', 
                background: 'var(--color-dark-lighter)', 
                borderRadius: '12px',
                textAlign: 'center',
                color: 'var(--color-text-muted)',
                fontSize: '14px'
              }}>
                <MapPin size={24} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
                <p>Location and song details shown above</p>
              </div>
            )}

            {/* Comments Tab */}
            {activeTab === 'comments' && (
              <div>
                {/* Add comment input */}
                {user ? (
                  <div style={{ 
                    display: 'flex', 
                    gap: '8px', 
                    marginBottom: '16px',
                    padding: '12px',
                    background: 'var(--color-dark-lighter)',
                    borderRadius: '12px'
                  }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: 'var(--color-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      overflow: 'hidden'
                    }}>
                      {profile?.avatar_url ? (
                        <img src={profile.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <span style={{ fontSize: '14px', fontWeight: 600 }}>
                          {(profile?.display_name || user.email)?.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <input
                      type="text"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Add a comment..."
                      maxLength={500}
                      style={{
                        flex: 1,
                        background: 'transparent',
                        border: 'none',
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
                        background: newComment.trim() ? 'var(--color-primary)' : 'transparent',
                        border: 'none',
                        borderRadius: '50%',
                        width: '32px',
                        height: '32px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: newComment.trim() ? 'pointer' : 'default',
                        color: newComment.trim() ? 'white' : 'var(--color-text-muted)',
                        transition: 'all 0.2s'
                      }}
                    >
                      {isSubmittingComment ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                    </button>
                  </div>
                ) : (
                  <div style={{
                    padding: '16px',
                    background: 'var(--color-dark-lighter)',
                    borderRadius: '12px',
                    textAlign: 'center',
                    marginBottom: '16px'
                  }}>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>
                      Sign in to leave a comment
                    </p>
                  </div>
                )}

                {/* Comments list */}
                {loadingComments ? (
                  <div style={{ textAlign: 'center', padding: '20px' }}>
                    <Loader2 size={24} className="animate-spin" style={{ color: 'var(--color-text-muted)' }} />
                  </div>
                ) : comments.length === 0 ? (
                  <div style={{ 
                    textAlign: 'center', 
                    padding: '24px',
                    color: 'var(--color-text-muted)',
                    fontSize: '14px'
                  }}>
                    <MessageCircle size={32} style={{ margin: '0 auto 8px', opacity: 0.3 }} />
                    <p>No comments yet. Be the first!</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {comments.map(comment => (
                      <div 
                        key={comment.id}
                        style={{
                          display: 'flex',
                          gap: '10px',
                          padding: '12px',
                          background: 'var(--color-dark-lighter)',
                          borderRadius: '12px'
                        }}
                      >
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          background: 'var(--color-dark-card)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          overflow: 'hidden'
                        }}>
                          {comment.userAvatarUrl ? (
                            <img src={comment.userAvatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <User size={14} style={{ color: 'var(--color-text-muted)' }} />
                          )}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <span style={{ fontWeight: 600, fontSize: '13px' }}>{comment.userDisplayName}</span>
                            <span style={{ color: 'var(--color-text-muted)', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Clock size={10} />
                              {formatTimeAgo(comment.createdAt)}
                            </span>
                          </div>
                          <p style={{ fontSize: '14px', margin: 0, wordBreak: 'break-word' }}>{comment.content}</p>
                        </div>
                        {user?.id === comment.userId && (
                          <button
                            onClick={() => handleDeleteComment(comment.id)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'var(--color-text-muted)',
                              cursor: 'pointer',
                              padding: '4px',
                              opacity: 0.5,
                              transition: 'opacity 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                            onMouseLeave={(e) => e.currentTarget.style.opacity = '0.5'}
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
                {/* Upload photo */}
                {user && (
                  <div style={{
                    padding: '16px',
                    background: 'var(--color-dark-lighter)',
                    borderRadius: '12px',
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
                        gap: '8px',
                        padding: '12px',
                        background: 'var(--color-dark-card)',
                        border: '2px dashed var(--color-dark-lighter)',
                        borderRadius: '8px',
                        color: 'var(--color-text-muted)',
                        cursor: 'pointer',
                        fontSize: '14px',
                        transition: 'all 0.2s'
                      }}
                    >
                      {isUploadingPhoto ? (
                        <><Loader2 size={18} className="animate-spin" /> Uploading...</>
                      ) : (
                        <><Camera size={18} /> Share a photo from this location</>
                      )}
                    </button>
                    <p style={{ 
                      fontSize: '11px', 
                      color: 'var(--color-text-muted)', 
                      textAlign: 'center',
                      marginTop: '8px',
                      opacity: 0.7
                    }}>
                      Photos require admin approval before appearing
                    </p>
                  </div>
                )}

                {/* Photos grid */}
                {loadingPhotos ? (
                  <div style={{ textAlign: 'center', padding: '20px' }}>
                    <Loader2 size={24} className="animate-spin" style={{ color: 'var(--color-text-muted)' }} />
                  </div>
                ) : photos.length === 0 ? (
                  <div style={{ 
                    textAlign: 'center', 
                    padding: '24px',
                    color: 'var(--color-text-muted)',
                    fontSize: '14px'
                  }}>
                    <ImageIcon size={32} style={{ margin: '0 auto 8px', opacity: 0.3 }} />
                    <p>No photos yet. Be the first to share!</p>
                  </div>
                ) : (
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(2, 1fr)', 
                    gap: '8px' 
                  }}>
                    {photos.map(photo => (
                      <div 
                        key={photo.id}
                        style={{
                          position: 'relative',
                          paddingBottom: '100%',
                          borderRadius: '12px',
                          overflow: 'hidden',
                          background: 'var(--color-dark-lighter)'
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
                          <div style={{
                            position: 'absolute',
                            top: '8px',
                            left: '8px',
                            background: 'rgba(0,0,0,0.7)',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '10px',
                            color: 'var(--color-accent)'
                          }}>
                            Pending approval
                          </div>
                        )}
                        <div style={{
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          right: 0,
                          padding: '8px',
                          background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
                          fontSize: '11px'
                        }}>
                          <span style={{ opacity: 0.8 }}>📸 {photo.userDisplayName}</span>
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
    </div>
  );
}
