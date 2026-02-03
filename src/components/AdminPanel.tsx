import { useState, useEffect, useRef } from 'react';
import {
  X,
  Search,
  Trash2,
  CheckCircle,
  MapPin,
  Music,
  ExternalLink,
  AlertCircle,
  Loader,
  Camera,
  Check,
  XCircle,
  Image as ImageIcon,
  Eye,
  EyeOff,
  MessageSquare,
  Send,
  RefreshCw,
  User,
  Link2,
  Download,
  Upload,
  FileText,
  Zap
} from 'lucide-react';
import { SpotifySearch } from './SpotifySearch';
import type { SongLocation, SongPhoto, SongStatus, MusicProvider, ProviderLinks } from '../types';
import type { SpotifyTrack } from '../lib/spotify';
import { getTrackInfo } from '../lib/spotify';
import { getPendingPhotos, approvePhoto, rejectPhoto } from '../lib/comments';
import { setSongStatus, fetchAllSongsAdmin, addSong } from '../lib/songs';
import { detectProvider, extractProviderId } from '../lib/providers';
import { batchLookupSpotifyUris, batchVerifyMetadata, type LookupProgress, type SpotifyLookupResult, type MetadataVerifyResult } from '../lib/spotifyLookup';
import { updateSong } from '../lib/songs';

// Validation issue types
type ValidationIssue =
  | 'missing_title'
  | 'missing_artist'
  | 'missing_location'
  | 'invalid_coordinates'
  | 'suspicious_title'
  | 'suspicious_artist'
  | 'too_short'
  | 'spotify_not_found'
  | 'low_confidence_match';

const ISSUE_LABELS: Record<ValidationIssue, { label: string; severity: 'error' | 'warning' }> = {
  missing_title: { label: 'Missing title', severity: 'error' },
  missing_artist: { label: 'Missing artist', severity: 'error' },
  missing_location: { label: 'Missing location', severity: 'error' },
  invalid_coordinates: { label: 'Invalid coordinates', severity: 'error' },
  suspicious_title: { label: 'Suspicious title', severity: 'warning' },
  suspicious_artist: { label: 'Suspicious artist', severity: 'warning' },
  too_short: { label: 'Title/artist too short', severity: 'warning' },
  spotify_not_found: { label: 'Spotify lookup failed', severity: 'warning' },
  low_confidence_match: { label: 'Low confidence match', severity: 'warning' }
};

// Validate a song entry
function validateSongEntry(song: Partial<SongLocation>): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  // Required fields
  if (!song.title?.trim()) issues.push('missing_title');
  if (!song.artist?.trim()) issues.push('missing_artist');
  if (!song.locationName?.trim()) issues.push('missing_location');

  // Coordinate validation
  const lat = song.latitude ?? 0;
  const lng = song.longitude ?? 0;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180 || (lat === 0 && lng === 0)) {
    issues.push('invalid_coordinates');
  }

  // Suspicious content detection
  const title = song.title?.trim() || '';
  const artist = song.artist?.trim() || '';

  // Too short
  if (title.length > 0 && title.length < 2) issues.push('too_short');
  if (artist.length > 0 && artist.length < 2) issues.push('too_short');

  // Suspicious patterns (likely data errors)
  const suspiciousPatterns = [
    /^[^a-zA-Z0-9]+$/, // Only special characters
    /^(test|asdf|xxx|null|undefined|n\/a|tbd|placeholder)$/i,
    /^[0-9]+$/, // Only numbers
    /^\s*$/, // Only whitespace
  ];

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(title)) issues.push('suspicious_title');
    if (pattern.test(artist)) issues.push('suspicious_artist');
  }

  return [...new Set(issues)]; // Remove duplicates
}

// Extended import song type
interface ImportSongEntry extends Partial<SongLocation> {
  _importId: string;
  _duplicate?: boolean;
  _duplicateOf?: string;
  _issues?: ValidationIssue[];
  _excluded?: boolean;
}

// Provider display config
const PROVIDER_CONFIG: Record<MusicProvider, { name: string; color: string; placeholder: string }> = {
  spotify: {
    name: 'Spotify',
    color: '#1DB954',
    placeholder: 'spotify:track:xxx or open.spotify.com/track/xxx'
  },
  youtube: {
    name: 'YouTube',
    color: '#FF0000',
    placeholder: 'youtube.com/watch?v=xxx or youtu.be/xxx'
  },
  apple_music: {
    name: 'Apple Music',
    color: '#FC3C44',
    placeholder: 'music.apple.com/.../song/xxx'
  },
  soundcloud: {
    name: 'SoundCloud',
    color: '#FF5500',
    placeholder: 'soundcloud.com/artist/track'
  }
};

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  songs: SongLocation[];
  onUpdateSong: (songId: string, updates: Partial<SongLocation>) => void;
  onDeleteSong: (songId: string) => void;
  onRefreshSongs?: () => void;
}

export function AdminPanel({ isOpen, onClose, songs, onUpdateSong, onDeleteSong, onRefreshSongs }: AdminPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingSong, setEditingSong] = useState<SongLocation | null>(null);
  const [showSpotifySearch, setShowSpotifySearch] = useState(false);
  const [showProviderEditor, setShowProviderEditor] = useState(false);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'songs' | 'review' | 'photos' | 'import'>('songs');
  const [pendingPhotos, setPendingPhotos] = useState<SongPhoto[]>([]);
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  const [processingPhoto, setProcessingPhoto] = useState<string | null>(null);

  // Multi-provider editing state
  const [providerInputs, setProviderInputs] = useState<Record<MusicProvider, string>>({
    spotify: '',
    youtube: '',
    apple_music: '',
    soundcloud: ''
  });
  const [providerValidation, setProviderValidation] = useState<Record<MusicProvider, 'valid' | 'invalid' | 'empty'>>({
    spotify: 'empty',
    youtube: 'empty',
    apple_music: 'empty',
    soundcloud: 'empty'
  });

  // Review state
  const [allSongs, setAllSongs] = useState<SongLocation[]>([]);
  const [loadingAllSongs, setLoadingAllSongs] = useState(false);
  const [editNotesFor, setEditNotesFor] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [processingStatus, setProcessingStatus] = useState<string | null>(null);

  // Import tab state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importedSongs, setImportedSongs] = useState<ImportSongEntry[]>([]);
  const [importStep, setImportStep] = useState<'upload' | 'preview' | 'review' | 'fetching' | 'ready'>('upload');
  const [lookupProgress, setLookupProgress] = useState<LookupProgress | null>(null);
  const [lookupResults, setLookupResults] = useState<Map<string, SpotifyLookupResult>>(new Map());
  const [importing, setImporting] = useState(false);
  const [importResults, setImportResults] = useState<{ success: number; failed: number } | null>(null);
  const [selectedForReview, setSelectedForReview] = useState<Set<string>>(new Set());
  const [reviewFilter, setReviewFilter] = useState<'all' | 'flagged' | 'clean'>('all');

  // Metadata verification state
  const [verifyingMetadata, setVerifyingMetadata] = useState(false);
  const [verifyProgress, setVerifyProgress] = useState<{ current: number; total: number; songTitle: string } | null>(null);
  const [verifyResults, setVerifyResults] = useState<Map<string, { current: { title: string; artist: string; album?: string }; spotify: MetadataVerifyResult; hasMismatch: boolean }>>(new Map());
  const [selectedForFix, setSelectedForFix] = useState<Set<string>>(new Set());
  const [applyingFixes, setApplyingFixes] = useState(false);
  const [showVerifyPanel, setShowVerifyPanel] = useState(false);

  // Load all songs for review tab
  useEffect(() => {
    if (activeTab === 'review' && allSongs.length === 0) {
      setLoadingAllSongs(true);
      fetchAllSongsAdmin().then(songs => {
        setAllSongs(songs);
        setLoadingAllSongs(false);
      });
    }
  }, [activeTab, allSongs.length]);

  // Load pending photos when tab changes
  useEffect(() => {
    if (activeTab === 'photos' && pendingPhotos.length === 0) {
      setLoadingPhotos(true);
      getPendingPhotos().then(photos => {
        setPendingPhotos(photos);
        setLoadingPhotos(false);
      });
    }
  }, [activeTab, pendingPhotos.length]);

  // Handle status change
  const handleStatusChange = async (songId: string, status: SongStatus, notes?: string) => {
    setProcessingStatus(songId);
    const success = await setSongStatus(songId, status, notes);
    if (success) {
      setAllSongs(allSongs.map(s => 
        s.id === songId ? { ...s, status, adminNotes: notes || s.adminNotes } : s
      ));
      setEditNotesFor(null);
      setAdminNotes('');
      onRefreshSongs?.();
    }
    setProcessingStatus(null);
  };

  const refreshAllSongs = async () => {
    setLoadingAllSongs(true);
    const songs = await fetchAllSongsAdmin();
    setAllSongs(songs);
    setLoadingAllSongs(false);
  };

  const handleApprovePhoto = async (photoId: string) => {
    setProcessingPhoto(photoId);
    if (await approvePhoto(photoId)) {
      setPendingPhotos(pendingPhotos.filter(p => p.id !== photoId));
    }
    setProcessingPhoto(null);
  };

  const handleRejectPhoto = async (photoId: string) => {
    setProcessingPhoto(photoId);
    if (await rejectPhoto(photoId)) {
      setPendingPhotos(pendingPhotos.filter(p => p.id !== photoId));
    }
    setProcessingPhoto(null);
  };

  if (!isOpen) return null;

  const filteredSongs = songs.filter(song => 
    song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    song.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
    song.locationName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSpotifySelect = async (track: SpotifyTrack) => {
    if (editingSong) {
      setIsUpdating(editingSong.id);
      setShowSpotifySearch(false);
      
      const trackInfo = await getTrackInfo(track.id);
      
      if (trackInfo) {
        onUpdateSong(editingSong.id, {
          title: trackInfo.title,
          artist: trackInfo.artist,
          albumArt: trackInfo.albumArt,
          spotifyUri: `spotify:track:${track.id}`
        });
      } else {
        onUpdateSong(editingSong.id, {
          spotifyUri: `spotify:track:${track.id}`
        });
      }
      
      setEditingSong(null);
      setIsUpdating(null);
    }
  };

  const getSpotifyStatus = (song: SongLocation) => {
    if (!song.spotifyUri) return 'missing';
    return 'valid';
  };

  // Open provider editor for a song
  const openProviderEditor = (song: SongLocation) => {
    setEditingSong(song);
    // Populate inputs with existing links
    const spotifyId = song.spotifyUri?.replace('spotify:track:', '') ||
                      song.providerLinks?.spotify?.replace('spotify:track:', '') || '';
    setProviderInputs({
      spotify: spotifyId ? `spotify:track:${spotifyId}` : '',
      youtube: song.providerLinks?.youtube || '',
      apple_music: song.providerLinks?.appleMusic || '',
      soundcloud: song.providerLinks?.soundcloud || ''
    });
    // Validate existing inputs
    setProviderValidation({
      spotify: spotifyId ? 'valid' : 'empty',
      youtube: song.providerLinks?.youtube ? 'valid' : 'empty',
      apple_music: song.providerLinks?.appleMusic ? 'valid' : 'empty',
      soundcloud: song.providerLinks?.soundcloud ? 'valid' : 'empty'
    });
    setShowProviderEditor(true);
  };

  // Handle provider input change with validation
  const handleProviderInputChange = (provider: MusicProvider, value: string) => {
    setProviderInputs(prev => ({ ...prev, [provider]: value }));

    if (!value.trim()) {
      setProviderValidation(prev => ({ ...prev, [provider]: 'empty' }));
      return;
    }

    // Validate by trying to extract ID
    const detected = detectProvider(value);
    if (detected === provider) {
      const extracted = extractProviderId(value);
      if (extracted) {
        setProviderValidation(prev => ({ ...prev, [provider]: 'valid' }));
        return;
      }
    }

    setProviderValidation(prev => ({ ...prev, [provider]: 'invalid' }));
  };

  // Save provider links
  const saveProviderLinks = async () => {
    if (!editingSong) return;

    setIsUpdating(editingSong.id);

    // Build provider links from inputs
    const providerLinks: ProviderLinks = {};

    // Extract IDs from validated inputs
    if (providerValidation.spotify === 'valid' && providerInputs.spotify) {
      const extracted = extractProviderId(providerInputs.spotify);
      if (extracted) providerLinks.spotify = extracted.id;
    }
    if (providerValidation.youtube === 'valid' && providerInputs.youtube) {
      const extracted = extractProviderId(providerInputs.youtube);
      if (extracted) providerLinks.youtube = extracted.id;
    }
    if (providerValidation.apple_music === 'valid' && providerInputs.apple_music) {
      const extracted = extractProviderId(providerInputs.apple_music);
      if (extracted) providerLinks.appleMusic = extracted.id;
    }
    if (providerValidation.soundcloud === 'valid' && providerInputs.soundcloud) {
      const extracted = extractProviderId(providerInputs.soundcloud);
      if (extracted) providerLinks.soundcloud = extracted.id;
    }

    // Build spotifyUri for backwards compatibility
    const spotifyUri = providerLinks.spotify ? `spotify:track:${providerLinks.spotify}` : editingSong.spotifyUri;

    onUpdateSong(editingSong.id, {
      spotifyUri,
      providerLinks: Object.keys(providerLinks).length > 0 ? providerLinks : undefined
    });

    setShowProviderEditor(false);
    setEditingSong(null);
    setIsUpdating(null);
  };

  // Count songs with any provider link
  const linkedCount = songs.filter(s => s.spotifyUri || s.providerLinks?.youtube || s.providerLinks?.appleMusic || s.providerLinks?.soundcloud).length;

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
      {/* Backdrop */}
      <div 
        onClick={onClose}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)'
        }} 
      />
      
      {/* Panel */}
      <div 
        onClick={e => e.stopPropagation()}
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '800px',
          maxHeight: '90vh',
          background: 'var(--color-dark-card)',
          borderRadius: '20px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '24px',
          borderBottom: '1px solid var(--color-dark-lighter)',
          flexShrink: 0
        }}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, margin: 0 }}>Admin Panel</h2>
            <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', margin: '4px 0 0 0' }}>
              Manage songs and approve photos
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              padding: '10px',
              background: 'none',
              border: 'none',
              borderRadius: '50%',
              cursor: 'pointer',
              color: 'var(--color-text-muted)'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          gap: '4px',
          padding: '16px 24px',
          borderBottom: '1px solid var(--color-dark-lighter)'
        }}>
          <button
            onClick={() => setActiveTab('songs')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              background: activeTab === 'songs' ? 'var(--color-dark-lighter)' : 'transparent',
              border: 'none',
              borderRadius: '8px',
              color: activeTab === 'songs' ? 'white' : 'var(--color-text-muted)',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            <Music size={16} />
            Songs
          </button>
          <button
            onClick={() => setActiveTab('review')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              background: activeTab === 'review' ? 'var(--color-dark-lighter)' : 'transparent',
              border: 'none',
              borderRadius: '8px',
              color: activeTab === 'review' ? 'white' : 'var(--color-text-muted)',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              position: 'relative'
            }}
          >
            <Eye size={16} />
            Review
            {allSongs.filter(s => s.status !== 'live').length > 0 && (
              <span style={{
                background: '#f59e0b',
                color: 'var(--color-dark)',
                fontSize: '11px',
                fontWeight: 700,
                padding: '2px 6px',
                borderRadius: '10px',
                marginLeft: '4px'
              }}>
                {allSongs.filter(s => s.status !== 'live').length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('photos')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              background: activeTab === 'photos' ? 'var(--color-dark-lighter)' : 'transparent',
              border: 'none',
              borderRadius: '8px',
              color: activeTab === 'photos' ? 'white' : 'var(--color-text-muted)',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              position: 'relative'
            }}
          >
            <Camera size={16} />
            Photos
            {pendingPhotos.length > 0 && (
              <span style={{
                background: 'var(--color-accent)',
                color: 'var(--color-dark)',
                fontSize: '11px',
                fontWeight: 700,
                padding: '2px 6px',
                borderRadius: '10px',
                marginLeft: '4px'
              }}>
                {pendingPhotos.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('import')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              background: activeTab === 'import' ? 'var(--color-dark-lighter)' : 'transparent',
              border: 'none',
              borderRadius: '8px',
              color: activeTab === 'import' ? 'white' : 'var(--color-text-muted)',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            <Upload size={16} />
            Import
          </button>
        </div>

        {/* Search - only for songs tab */}
        {activeTab === 'songs' && (
        <div style={{
          padding: '16px 24px',
          borderBottom: '1px solid var(--color-dark-lighter)',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search
                size={20}
                style={{
                  position: 'absolute',
                  left: '16px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--color-text-muted)',
                  pointerEvents: 'none'
                }}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search songs by title, artist, or location..."
                style={{
                  width: '100%',
                  height: '48px',
                  paddingLeft: '52px',
                  paddingRight: '16px',
                  fontSize: '15px',
                  background: 'var(--color-dark-lighter)',
                  border: '1px solid transparent',
                  borderRadius: '12px',
                  color: 'var(--color-text)',
                  outline: 'none'
                }}
              />
            </div>
            <button
              onClick={() => setShowVerifyPanel(!showVerifyPanel)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 16px',
                background: showVerifyPanel ? '#1DB954' : 'var(--color-dark-lighter)',
                color: showVerifyPanel ? 'white' : 'var(--color-text)',
                border: 'none',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              <RefreshCw size={16} />
              Verify Metadata
            </button>
          </div>

          {/* Metadata Verification Panel */}
          {showVerifyPanel && (
            <div style={{
              marginTop: '16px',
              padding: '16px',
              background: 'var(--color-dark-card)',
              borderRadius: '12px'
            }}>
              <div style={{ marginBottom: '12px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: 600, margin: '0 0 4px 0' }}>
                  Metadata Verification
                </h4>
                <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', margin: 0 }}>
                  Check songs with Spotify links against their actual Spotify data. Fix incorrect titles, artists, and albums.
                </p>
              </div>

              {!verifyingMetadata && verifyResults.size === 0 && (
                <button
                  onClick={async () => {
                    const songsWithSpotify = songs.filter(s => s.spotifyUri);
                    if (songsWithSpotify.length === 0) {
                      alert('No songs with Spotify links to verify');
                      return;
                    }

                    setVerifyingMetadata(true);
                    setVerifyResults(new Map());
                    setSelectedForFix(new Set());

                    const results = await batchVerifyMetadata(
                      songsWithSpotify.map(s => ({
                        id: s.id,
                        spotifyUri: s.spotifyUri!,
                        title: s.title,
                        artist: s.artist,
                        album: s.album
                      })),
                      (current, total, songTitle) => {
                        setVerifyProgress({ current, total, songTitle });
                      },
                      1500
                    );

                    setVerifyResults(results);
                    setVerifyingMetadata(false);
                    setVerifyProgress(null);

                    // Auto-select all mismatched songs
                    const mismatched = new Set<string>();
                    results.forEach((result, id) => {
                      if (result.hasMismatch) mismatched.add(id);
                    });
                    setSelectedForFix(mismatched);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 20px',
                    background: '#1DB954',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 500,
                    cursor: 'pointer'
                  }}
                >
                  <Zap size={16} />
                  Verify {songs.filter(s => s.spotifyUri).length} Songs
                </button>
              )}

              {verifyingMetadata && verifyProgress && (
                <div style={{ textAlign: 'center', padding: '16px' }}>
                  <Loader size={24} className="animate-spin" style={{ color: '#1DB954', margin: '0 auto 12px' }} />
                  <div style={{ fontSize: '14px', marginBottom: '4px' }}>
                    Checking: {verifyProgress.songTitle}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                    {verifyProgress.current} / {verifyProgress.total}
                  </div>
                  <div style={{
                    width: '100%',
                    height: '4px',
                    background: 'var(--color-dark-lighter)',
                    borderRadius: '2px',
                    marginTop: '12px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${(verifyProgress.current / verifyProgress.total) * 100}%`,
                      height: '100%',
                      background: '#1DB954',
                      transition: 'width 0.3s'
                    }} />
                  </div>
                </div>
              )}

              {!verifyingMetadata && verifyResults.size > 0 && (
                <div>
                  {/* Stats */}
                  <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                    <div style={{
                      padding: '10px 14px',
                      background: 'var(--color-dark-lighter)',
                      borderRadius: '8px',
                      flex: 1,
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '20px', fontWeight: 700, color: '#10b981' }}>
                        {Array.from(verifyResults.values()).filter(r => !r.hasMismatch).length}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Correct</div>
                    </div>
                    <div style={{
                      padding: '10px 14px',
                      background: 'var(--color-dark-lighter)',
                      borderRadius: '8px',
                      flex: 1,
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '20px', fontWeight: 700, color: '#f59e0b' }}>
                        {Array.from(verifyResults.values()).filter(r => r.hasMismatch).length}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Mismatched</div>
                    </div>
                  </div>

                  {/* Mismatched songs list */}
                  {Array.from(verifyResults.values()).filter(r => r.hasMismatch).length > 0 && (
                    <>
                      <div style={{
                        maxHeight: '200px',
                        overflowY: 'auto',
                        border: '1px solid var(--color-dark-lighter)',
                        borderRadius: '8px',
                        marginBottom: '12px'
                      }}>
                        {Array.from(verifyResults.entries())
                          .filter(([, r]) => r.hasMismatch)
                          .map(([songId, result], idx, arr) => (
                            <div
                              key={songId}
                              style={{
                                padding: '12px',
                                borderBottom: idx < arr.length - 1 ? '1px solid var(--color-dark-lighter)' : 'none',
                                background: selectedForFix.has(songId) ? 'rgba(245, 158, 11, 0.1)' : 'transparent'
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                                <input
                                  type="checkbox"
                                  checked={selectedForFix.has(songId)}
                                  onChange={() => {
                                    const newSet = new Set(selectedForFix);
                                    if (newSet.has(songId)) {
                                      newSet.delete(songId);
                                    } else {
                                      newSet.add(songId);
                                    }
                                    setSelectedForFix(newSet);
                                  }}
                                  style={{ marginTop: '3px', cursor: 'pointer' }}
                                />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  {/* Current vs Spotify comparison */}
                                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                                    <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Current:</span>
                                    <span style={{
                                      fontSize: '13px',
                                      textDecoration: result.current.title !== result.spotify.title ? 'line-through' : 'none',
                                      color: result.current.title !== result.spotify.title ? '#ef4444' : 'var(--color-text)'
                                    }}>
                                      {result.current.title}
                                    </span>
                                    <span style={{ color: 'var(--color-text-muted)' }}>by</span>
                                    <span style={{
                                      fontSize: '13px',
                                      textDecoration: result.current.artist.toLowerCase() !== result.spotify.artist.toLowerCase() ? 'line-through' : 'none',
                                      color: result.current.artist.toLowerCase() !== result.spotify.artist.toLowerCase() ? '#ef4444' : 'var(--color-text)'
                                    }}>
                                      {result.current.artist}
                                    </span>
                                  </div>
                                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px', flexWrap: 'wrap' }}>
                                    <span style={{ fontSize: '12px', color: '#1DB954' }}>Spotify:</span>
                                    <span style={{ fontSize: '13px', fontWeight: 500 }}>
                                      {result.spotify.title}
                                    </span>
                                    <span style={{ color: 'var(--color-text-muted)' }}>by</span>
                                    <span style={{ fontSize: '13px', fontWeight: 500 }}>
                                      {result.spotify.artist}
                                    </span>
                                    {result.spotify.album && (
                                      <>
                                        <span style={{ color: 'var(--color-text-muted)' }}>•</span>
                                        <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                                          {result.spotify.album}
                                        </span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>

                      {/* Bulk actions */}
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <button
                          onClick={() => {
                            const allMismatched = new Set<string>();
                            verifyResults.forEach((result, id) => {
                              if (result.hasMismatch) allMismatched.add(id);
                            });
                            setSelectedForFix(allMismatched);
                          }}
                          style={{
                            padding: '6px 12px',
                            background: 'var(--color-dark-lighter)',
                            color: 'var(--color-text)',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '12px',
                            cursor: 'pointer'
                          }}
                        >
                          Select All
                        </button>
                        <button
                          onClick={() => setSelectedForFix(new Set())}
                          style={{
                            padding: '6px 12px',
                            background: 'var(--color-dark-lighter)',
                            color: 'var(--color-text)',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '12px',
                            cursor: 'pointer'
                          }}
                        >
                          Deselect All
                        </button>
                        <button
                          onClick={async () => {
                            if (selectedForFix.size === 0) return;

                            setApplyingFixes(true);
                            let fixed = 0;

                            for (const songId of selectedForFix) {
                              const result = verifyResults.get(songId);
                              if (!result) continue;

                              const success = await updateSong(songId, {
                                title: result.spotify.title,
                                artist: result.spotify.artist,
                                album: result.spotify.album || undefined,
                                albumArt: result.spotify.albumArt || undefined
                              });

                              if (success) {
                                fixed++;
                                // Update local song list
                                onUpdateSong(songId, {
                                  title: result.spotify.title,
                                  artist: result.spotify.artist,
                                  album: result.spotify.album || undefined,
                                  albumArt: result.spotify.albumArt || undefined
                                });
                              }
                            }

                            setApplyingFixes(false);
                            alert(`Fixed ${fixed} of ${selectedForFix.size} songs`);

                            // Clear results
                            setVerifyResults(new Map());
                            setSelectedForFix(new Set());
                            onRefreshSongs?.();
                          }}
                          disabled={selectedForFix.size === 0 || applyingFixes}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '6px 12px',
                            background: selectedForFix.size > 0 ? '#1DB954' : 'var(--color-dark-lighter)',
                            color: selectedForFix.size > 0 ? 'white' : 'var(--color-text-muted)',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: 500,
                            cursor: selectedForFix.size > 0 ? 'pointer' : 'not-allowed',
                            opacity: applyingFixes ? 0.7 : 1
                          }}
                        >
                          {applyingFixes ? (
                            <>
                              <Loader size={12} className="animate-spin" />
                              Applying...
                            </>
                          ) : (
                            <>
                              <Check size={12} />
                              Apply Fixes ({selectedForFix.size})
                            </>
                          )}
                        </button>
                      </div>
                    </>
                  )}

                  {/* Reset button */}
                  <div style={{ marginTop: '12px' }}>
                    <button
                      onClick={() => {
                        setVerifyResults(new Map());
                        setSelectedForFix(new Set());
                      }}
                      style={{
                        padding: '6px 12px',
                        background: 'none',
                        color: 'var(--color-text-muted)',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}
                    >
                      Clear Results
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        )}

        {/* Songs list */}
        {activeTab === 'songs' && (
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px 24px'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filteredSongs.map(song => {
              const status = getSpotifyStatus(song);
              const trackId = song.spotifyUri?.replace('spotify:track:', '');
              
              return (
                <div 
                  key={song.id}
                  style={{
                    padding: '16px',
                    background: 'var(--color-dark-lighter)',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px'
                  }}
                >
                  {/* Album art */}
                  <div style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    flexShrink: 0,
                    background: 'var(--color-dark-card)'
                  }}>
                    <img 
                      src={song.albumArt} 
                      alt={song.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=200';
                      }}
                    />
                  </div>

                  {/* Song info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <h3 style={{ 
                        fontWeight: 500, 
                        fontSize: '15px',
                        margin: 0,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {song.title}
                      </h3>
                      {song.verified && (
                        <CheckCircle size={16} color="var(--color-primary)" style={{ flexShrink: 0 }} />
                      )}
                    </div>
                    <p style={{ 
                      fontSize: '13px', 
                      color: 'var(--color-text-muted)', 
                      margin: '2px 0 0 0',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {song.artist}
                    </p>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '4px', 
                      fontSize: '12px', 
                      color: 'var(--color-text-muted)', 
                      marginTop: '4px' 
                    }}>
                      <MapPin size={12} />
                      <span style={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {song.locationName}
                      </span>
                    </div>
                  </div>

                  {/* Spotify status */}
                  <div style={{ flexShrink: 0 }}>
                    {status === 'valid' ? (
                      <a
                        href={`https://open.spotify.com/track/${trackId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '8px 14px',
                          background: 'rgba(29, 185, 84, 0.2)',
                          color: '#1DB954',
                          borderRadius: '9999px',
                          fontSize: '13px',
                          textDecoration: 'none',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        <Music size={14} />
                        <span>Linked</span>
                        <ExternalLink size={14} />
                      </a>
                    ) : (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 14px',
                        background: 'rgba(239, 68, 68, 0.2)',
                        color: '#f87171',
                        borderRadius: '9999px',
                        fontSize: '13px',
                        whiteSpace: 'nowrap'
                      }}>
                        <AlertCircle size={14} />
                        <span>No Link</span>
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                    {isUpdating === song.id ? (
                      <div style={{ padding: '10px' }}>
                        <Loader size={18} className="animate-spin" color="var(--color-primary)" />
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => openProviderEditor(song)}
                          title="Edit music links"
                          style={{
                            padding: '10px',
                            background: 'none',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            color: 'var(--color-primary)'
                          }}
                        >
                          <Link2 size={18} />
                        </button>
                        <button
                          onClick={() => {
                            setEditingSong(song);
                            setShowSpotifySearch(true);
                          }}
                          title="Search Spotify"
                          style={{
                            padding: '10px',
                            background: 'none',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            color: '#1DB954'
                          }}
                        >
                          <Search size={18} />
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => {
                        if (confirm(`Delete "${song.title}"?`)) {
                          onDeleteSong(song.id);
                        }
                      }}
                      title="Delete song"
                      style={{
                        padding: '10px',
                        background: 'none',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        color: '#f87171'
                      }}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              );
            })}

            {filteredSongs.length === 0 && (
              <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--color-text-muted)' }}>
                No songs found matching your search.
              </div>
            )}
          </div>
        </div>
        )}

        {/* Review tab */}
        {activeTab === 'review' && (
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px 24px'
        }}>
          {/* Refresh button */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
            <button
              onClick={refreshAllSongs}
              disabled={loadingAllSongs}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                background: 'var(--color-dark-lighter)',
                border: 'none',
                borderRadius: '8px',
                color: 'var(--color-text-muted)',
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              <RefreshCw size={14} className={loadingAllSongs ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>

          {loadingAllSongs ? (
            <div style={{ textAlign: 'center', padding: '48px 0' }}>
              <Loader size={24} className="animate-spin" style={{ color: 'var(--color-text-muted)' }} />
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {allSongs.map(song => {
                const statusColor = song.status === 'live' ? '#10b981' : 
                                   song.status === 'needs_edit' ? '#f59e0b' : '#ef4444';
                const statusLabel = song.status === 'live' ? 'Live' : 
                                   song.status === 'needs_edit' ? 'Needs Edit' : 'Removed';
                
                return (
                  <div 
                    key={song.id}
                    style={{
                      padding: '16px',
                      background: 'var(--color-dark-lighter)',
                      borderRadius: '12px',
                      borderLeft: `4px solid ${statusColor}`
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                      {/* Album art */}
                      <div style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        flexShrink: 0,
                        background: 'var(--color-dark-card)'
                      }}>
                        <img 
                          src={song.albumArt} 
                          alt={song.title}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=200';
                          }}
                        />
                      </div>

                      {/* Song info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <h3 style={{ fontWeight: 500, fontSize: '15px', margin: 0 }}>
                            {song.title}
                          </h3>
                          <span style={{
                            fontSize: '11px',
                            fontWeight: 600,
                            padding: '2px 8px',
                            borderRadius: '4px',
                            background: `${statusColor}30`,
                            color: statusColor
                          }}>
                            {statusLabel}
                          </span>
                        </div>
                        <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', margin: '2px 0' }}>
                          {song.artist}
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <MapPin size={12} />
                            {song.locationName}
                          </span>
                          {song.submittedBy && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <User size={12} />
                              {song.submittedBy}
                            </span>
                          )}
                        </div>
                        
                        {/* Admin notes display */}
                        {song.adminNotes && (
                          <div style={{
                            marginTop: '8px',
                            padding: '8px 12px',
                            background: 'rgba(245, 158, 11, 0.1)',
                            borderRadius: '6px',
                            fontSize: '13px',
                            color: '#f59e0b'
                          }}>
                            <strong>Note:</strong> {song.adminNotes}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flexShrink: 0 }}>
                        {processingStatus === song.id ? (
                          <Loader size={20} className="animate-spin" style={{ color: 'var(--color-text-muted)' }} />
                        ) : (
                          <>
                            {song.status !== 'live' && (
                              <button
                                onClick={() => handleStatusChange(song.id, 'live')}
                                title="Make Live"
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  padding: '6px 12px',
                                  background: 'rgba(16, 185, 129, 0.2)',
                                  color: '#10b981',
                                  border: 'none',
                                  borderRadius: '6px',
                                  fontSize: '12px',
                                  fontWeight: 500,
                                  cursor: 'pointer'
                                }}
                              >
                                <Eye size={14} />
                                Make Live
                              </button>
                            )}
                            <button
                              onClick={() => {
                                setEditNotesFor(song.id);
                                setAdminNotes(song.adminNotes || '');
                              }}
                              title="Request Edit"
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '6px 12px',
                                background: 'rgba(245, 158, 11, 0.2)',
                                color: '#f59e0b',
                                border: 'none',
                                borderRadius: '6px',
                                fontSize: '12px',
                                fontWeight: 500,
                                cursor: 'pointer'
                              }}
                            >
                              <MessageSquare size={14} />
                              Request Edit
                            </button>
                            {song.status !== 'removed' && (
                              <button
                                onClick={() => handleStatusChange(song.id, 'removed')}
                                title="Remove"
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  padding: '6px 12px',
                                  background: 'rgba(239, 68, 68, 0.2)',
                                  color: '#f87171',
                                  border: 'none',
                                  borderRadius: '6px',
                                  fontSize: '12px',
                                  fontWeight: 500,
                                  cursor: 'pointer'
                                }}
                              >
                                <EyeOff size={14} />
                                Remove
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    {/* Edit notes input */}
                    {editNotesFor === song.id && (
                      <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                        <input
                          type="text"
                          value={adminNotes}
                          onChange={(e) => setAdminNotes(e.target.value)}
                          placeholder="Add notes for the user (e.g., 'Please fix the location')"
                          style={{
                            flex: 1,
                            padding: '10px 14px',
                            background: 'var(--color-dark-card)',
                            border: '1px solid var(--color-dark-lighter)',
                            borderRadius: '8px',
                            color: 'var(--color-text)',
                            fontSize: '14px'
                          }}
                        />
                        <button
                          onClick={() => handleStatusChange(song.id, 'needs_edit', adminNotes)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '10px 16px',
                            background: '#f59e0b',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '14px',
                            fontWeight: 500,
                            cursor: 'pointer'
                          }}
                        >
                          <Send size={14} />
                          Send
                        </button>
                        <button
                          onClick={() => {
                            setEditNotesFor(null);
                            setAdminNotes('');
                          }}
                          style={{
                            padding: '10px',
                            background: 'none',
                            border: 'none',
                            borderRadius: '8px',
                            color: 'var(--color-text-muted)',
                            cursor: 'pointer'
                          }}
                        >
                          <X size={18} />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}

              {allSongs.length === 0 && (
                <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--color-text-muted)' }}>
                  No songs to review.
                </div>
              )}
            </div>
          )}
        </div>
        )}

        {/* Photos list */}
        {activeTab === 'photos' && (
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px 24px'
        }}>
          {loadingPhotos ? (
            <div style={{ textAlign: 'center', padding: '48px 0' }}>
              <Loader size={24} className="animate-spin" style={{ color: 'var(--color-text-muted)' }} />
            </div>
          ) : pendingPhotos.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--color-text-muted)' }}>
              <ImageIcon size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
              <p>No photos pending approval</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {pendingPhotos.map(photo => (
                <div
                  key={photo.id}
                  style={{
                    display: 'flex',
                    gap: '16px',
                    padding: '16px',
                    background: 'var(--color-dark-lighter)',
                    borderRadius: '12px'
                  }}
                >
                  {/* Photo preview */}
                  <div style={{
                    width: '120px',
                    height: '120px',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    flexShrink: 0,
                    background: 'var(--color-dark-card)'
                  }}>
                    <img
                      src={photo.photoUrl}
                      alt="Pending photo"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>

                  {/* Photo info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 600, margin: '0 0 4px 0' }}>
                      Photo by {photo.userDisplayName || 'Unknown'}
                    </p>
                    {photo.caption && (
                      <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', margin: '0 0 8px 0' }}>
                        "{photo.caption}"
                      </p>
                    )}
                    <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', margin: 0 }}>
                      Submitted {photo.createdAt.toLocaleDateString()}
                    </p>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flexShrink: 0 }}>
                    {processingPhoto === photo.id ? (
                      <Loader size={20} className="animate-spin" style={{ color: 'var(--color-text-muted)' }} />
                    ) : (
                      <>
                        <button
                          onClick={() => handleApprovePhoto(photo.id)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '8px 16px',
                            background: 'rgba(16, 185, 129, 0.2)',
                            color: 'var(--color-primary)',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '13px',
                            fontWeight: 500,
                            cursor: 'pointer'
                          }}
                        >
                          <Check size={16} />
                          Approve
                        </button>
                        <button
                          onClick={() => handleRejectPhoto(photo.id)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '8px 16px',
                            background: 'rgba(239, 68, 68, 0.2)',
                            color: '#f87171',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '13px',
                            fontWeight: 500,
                            cursor: 'pointer'
                          }}
                        >
                          <XCircle size={16} />
                          Reject
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        )}

        {/* Import tab */}
        {activeTab === 'import' && (
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px 24px'
        }}>
          {/* Export section */}
          <div style={{
            padding: '16px',
            background: 'var(--color-dark-lighter)',
            borderRadius: '12px',
            marginBottom: '16px'
          }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, margin: '0 0 8px 0' }}>Export Songs</h3>
            <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', margin: '0 0 12px 0' }}>
              Download all songs as CSV for backup or editing
            </p>
            <button
              onClick={() => {
                // Generate CSV
                const headers = ['id', 'title', 'artist', 'album', 'spotify_uri', 'youtube_id', 'apple_music_id', 'soundcloud_url', 'latitude', 'longitude', 'location_name', 'location_description', 'tags', 'status'];
                const rows = songs.map(s => [
                  s.id,
                  `"${(s.title || '').replace(/"/g, '""')}"`,
                  `"${(s.artist || '').replace(/"/g, '""')}"`,
                  `"${(s.album || '').replace(/"/g, '""')}"`,
                  s.spotifyUri || '',
                  s.providerLinks?.youtube || '',
                  s.providerLinks?.appleMusic || '',
                  s.providerLinks?.soundcloud || '',
                  s.latitude,
                  s.longitude,
                  `"${(s.locationName || '').replace(/"/g, '""')}"`,
                  `"${(s.locationDescription || '').replace(/"/g, '""')}"`,
                  `"${(s.tags || []).join(',')}"`,
                  s.status || 'live'
                ].join(','));
                const csv = [headers.join(','), ...rows].join('\n');
                const blob = new Blob([csv], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `soundscape_songs_${new Date().toISOString().split('T')[0]}.csv`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                background: 'var(--color-primary)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer'
              }}
            >
              <Download size={16} />
              Export CSV
            </button>
          </div>

          {/* Import section */}
          <div style={{
            padding: '16px',
            background: 'var(--color-dark-lighter)',
            borderRadius: '12px'
          }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, margin: '0 0 8px 0' }}>Import Songs</h3>
            <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', margin: '0 0 12px 0' }}>
              CSV columns: title, artist, latitude, longitude, location_name, location_description. ID, spotify_uri, album, tags, and status are auto-populated.
            </p>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              style={{ display: 'none' }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;

                const reader = new FileReader();
                reader.onload = (event) => {
                  const text = event.target?.result as string;
                  if (!text) return;

                  // Parse CSV
                  const lines = text.split('\n');
                  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/^"|"$/g, ''));

                  const parsed: ImportSongEntry[] = [];

                  for (let i = 1; i < lines.length; i++) {
                    const line = lines[i].trim();
                    if (!line) continue;

                    // Parse CSV line with quoted fields
                    const values: string[] = [];
                    let current = '';
                    let inQuotes = false;
                    for (let j = 0; j < line.length; j++) {
                      const char = line[j];
                      if (char === '"' && !inQuotes) {
                        inQuotes = true;
                      } else if (char === '"' && inQuotes) {
                        if (line[j + 1] === '"') {
                          current += '"';
                          j++;
                        } else {
                          inQuotes = false;
                        }
                      } else if (char === ',' && !inQuotes) {
                        values.push(current);
                        current = '';
                      } else {
                        current += char;
                      }
                    }
                    values.push(current);

                    // Map to SongLocation
                    const row: Record<string, string> = {};
                    headers.forEach((h, idx) => {
                      row[h] = values[idx] || '';
                    });

                    // Don't skip entries with missing data - flag them instead
                    const song: ImportSongEntry = {
                      _importId: `import-${i}-${Date.now()}`,
                      title: row.title?.trim() || '',
                      artist: row.artist?.trim() || '',
                      album: row.album?.trim() || undefined,
                      spotifyUri: row.spotify_uri || row.spotifyuri || undefined,
                      latitude: parseFloat(row.latitude) || 0,
                      longitude: parseFloat(row.longitude) || 0,
                      locationName: row.location_name || row.locationname || '',
                      locationDescription: row.location_description || row.locationdescription || undefined,
                      tags: row.tags ? row.tags.split(',').map(t => t.trim()).filter(Boolean) : undefined,
                      providerLinks: {
                        youtube: row.youtube_id || row.youtubeid || undefined,
                        appleMusic: row.apple_music_id || row.applemusicid || undefined,
                        soundcloud: row.soundcloud_url || row.soundcloudurl || undefined
                      }
                    };

                    // Validate the entry
                    song._issues = validateSongEntry(song);

                    // Check for duplicates (by title + artist, case insensitive)
                    const normalizedTitle = song.title?.toLowerCase().trim();
                    const normalizedArtist = song.artist?.toLowerCase().trim();

                    // Check against existing songs in DB
                    const duplicate = songs.find(s =>
                      s.title.toLowerCase().trim() === normalizedTitle &&
                      s.artist.toLowerCase().trim() === normalizedArtist
                    );

                    if (duplicate) {
                      song._duplicate = true;
                      song._duplicateOf = duplicate.id;
                    }

                    // Also check for duplicates within the import itself
                    const duplicateInImport = parsed.find(s =>
                      s.title?.toLowerCase().trim() === normalizedTitle &&
                      s.artist?.toLowerCase().trim() === normalizedArtist
                    );
                    if (duplicateInImport) {
                      song._duplicate = true;
                      song._duplicateOf = duplicateInImport._importId;
                    }

                    parsed.push(song);
                  }

                  setImportedSongs(parsed);
                  setImportStep('preview');
                  setLookupResults(new Map());
                  setImportResults(null);
                  setSelectedForReview(new Set());
                };
                reader.readAsText(file);
                e.target.value = ''; // Reset input
              }}
            />

            {importStep === 'upload' && (
              <button
                onClick={() => fileInputRef.current?.click()}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 20px',
                  background: 'var(--color-dark-card)',
                  color: 'var(--color-text)',
                  border: '2px dashed var(--color-dark-lighter)',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  width: '100%',
                  justifyContent: 'center'
                }}
              >
                <FileText size={16} />
                Select CSV File
              </button>
            )}

            {importStep === 'preview' && (
              <div>
                {/* Stats */}
                <div style={{
                  display: 'flex',
                  gap: '12px',
                  marginBottom: '16px',
                  flexWrap: 'wrap'
                }}>
                  <div style={{
                    padding: '12px 16px',
                    background: 'var(--color-dark-card)',
                    borderRadius: '8px',
                    flex: 1,
                    minWidth: '100px'
                  }}>
                    <div style={{ fontSize: '24px', fontWeight: 700 }}>{importedSongs.length}</div>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Total</div>
                  </div>
                  <div style={{
                    padding: '12px 16px',
                    background: 'var(--color-dark-card)',
                    borderRadius: '8px',
                    flex: 1,
                    minWidth: '100px'
                  }}>
                    <div style={{ fontSize: '24px', fontWeight: 700, color: '#f59e0b' }}>
                      {importedSongs.filter(s => s._duplicate).length}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Duplicates</div>
                  </div>
                  <div style={{
                    padding: '12px 16px',
                    background: 'var(--color-dark-card)',
                    borderRadius: '8px',
                    flex: 1,
                    minWidth: '100px'
                  }}>
                    <div style={{ fontSize: '24px', fontWeight: 700, color: '#ef4444' }}>
                      {importedSongs.filter(s => s._issues && s._issues.length > 0 && !s._duplicate).length}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Flagged</div>
                  </div>
                  <div style={{
                    padding: '12px 16px',
                    background: 'var(--color-dark-card)',
                    borderRadius: '8px',
                    flex: 1,
                    minWidth: '100px'
                  }}>
                    <div style={{ fontSize: '24px', fontWeight: 700, color: '#10b981' }}>
                      {importedSongs.filter(s => !s._duplicate && !s._excluded && (!s._issues || s._issues.length === 0)).length}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Clean</div>
                  </div>
                </div>

                {/* Filter tabs */}
                <div style={{ display: 'flex', gap: '4px', marginBottom: '12px' }}>
                  {(['all', 'flagged', 'clean'] as const).map(filter => (
                    <button
                      key={filter}
                      onClick={() => setReviewFilter(filter)}
                      style={{
                        padding: '6px 12px',
                        background: reviewFilter === filter ? 'var(--color-dark-lighter)' : 'transparent',
                        border: 'none',
                        borderRadius: '6px',
                        color: reviewFilter === filter ? 'white' : 'var(--color-text-muted)',
                        fontSize: '13px',
                        cursor: 'pointer',
                        textTransform: 'capitalize'
                      }}
                    >
                      {filter}
                    </button>
                  ))}
                </div>

                {/* Preview list */}
                <div style={{
                  maxHeight: '280px',
                  overflowY: 'auto',
                  marginBottom: '16px',
                  border: '1px solid var(--color-dark-card)',
                  borderRadius: '8px'
                }}>
                  {importedSongs
                    .filter(song => {
                      if (reviewFilter === 'flagged') return (song._issues && song._issues.length > 0) || song._duplicate;
                      if (reviewFilter === 'clean') return !song._duplicate && (!song._issues || song._issues.length === 0);
                      return true;
                    })
                    .map((song, idx, arr) => {
                      const hasErrors = song._issues?.some(i => ISSUE_LABELS[i]?.severity === 'error');
                      const hasWarnings = song._issues?.some(i => ISSUE_LABELS[i]?.severity === 'warning');

                      return (
                        <div
                          key={song._importId}
                          style={{
                            padding: '12px',
                            borderBottom: idx < arr.length - 1 ? '1px solid var(--color-dark-card)' : 'none',
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '12px',
                            background: song._excluded ? 'rgba(239, 68, 68, 0.05)' :
                                        song._duplicate ? 'rgba(245, 158, 11, 0.1)' :
                                        hasErrors ? 'rgba(239, 68, 68, 0.1)' :
                                        hasWarnings ? 'rgba(245, 158, 11, 0.05)' : 'transparent',
                            opacity: song._excluded ? 0.5 : 1
                          }}
                        >
                          {/* Checkbox for exclusion */}
                          <input
                            type="checkbox"
                            checked={!song._excluded && !song._duplicate}
                            onChange={() => {
                              setImportedSongs(prev => prev.map(s =>
                                s._importId === song._importId
                                  ? { ...s, _excluded: !s._excluded }
                                  : s
                              ));
                            }}
                            disabled={song._duplicate}
                            style={{ marginTop: '4px', cursor: song._duplicate ? 'not-allowed' : 'pointer' }}
                          />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 500, fontSize: '14px' }}>
                              {song.title || <span style={{ color: '#ef4444', fontStyle: 'italic' }}>Missing title</span>}
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                              {song.artist || <span style={{ color: '#ef4444', fontStyle: 'italic' }}>Missing artist</span>}
                            </div>
                            {/* Issues */}
                            {song._issues && song._issues.length > 0 && (
                              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '6px' }}>
                                {song._issues.map(issue => (
                                  <span
                                    key={issue}
                                    style={{
                                      fontSize: '10px',
                                      padding: '2px 6px',
                                      borderRadius: '4px',
                                      background: ISSUE_LABELS[issue].severity === 'error'
                                        ? 'rgba(239, 68, 68, 0.2)'
                                        : 'rgba(245, 158, 11, 0.2)',
                                      color: ISSUE_LABELS[issue].severity === 'error' ? '#ef4444' : '#f59e0b'
                                    }}
                                  >
                                    {ISSUE_LABELS[issue].label}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          {song._duplicate && (
                            <span style={{
                              fontSize: '11px',
                              padding: '2px 8px',
                              background: 'rgba(245, 158, 11, 0.2)',
                              color: '#f59e0b',
                              borderRadius: '4px',
                              whiteSpace: 'nowrap'
                            }}>
                              Duplicate
                            </span>
                          )}
                          {song._excluded && (
                            <span style={{
                              fontSize: '11px',
                              padding: '2px 8px',
                              background: 'rgba(239, 68, 68, 0.2)',
                              color: '#ef4444',
                              borderRadius: '4px',
                              whiteSpace: 'nowrap'
                            }}>
                              Excluded
                            </span>
                          )}
                        </div>
                      );
                    })}
                </div>

                {/* Bulk actions */}
                <div style={{
                  display: 'flex',
                  gap: '8px',
                  marginBottom: '16px',
                  flexWrap: 'wrap'
                }}>
                  <button
                    onClick={() => {
                      // Exclude all flagged entries
                      setImportedSongs(prev => prev.map(s =>
                        (s._issues && s._issues.length > 0) ? { ...s, _excluded: true } : s
                      ));
                    }}
                    style={{
                      padding: '6px 12px',
                      background: 'rgba(239, 68, 68, 0.2)',
                      color: '#ef4444',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    Exclude All Flagged
                  </button>
                  <button
                    onClick={() => {
                      // Include all (except duplicates)
                      setImportedSongs(prev => prev.map(s => ({ ...s, _excluded: false })));
                    }}
                    style={{
                      padding: '6px 12px',
                      background: 'rgba(16, 185, 129, 0.2)',
                      color: '#10b981',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    Include All
                  </button>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => {
                      setImportStep('upload');
                      setImportedSongs([]);
                      setLookupResults(new Map());
                    }}
                    style={{
                      padding: '10px 20px',
                      background: 'var(--color-dark-card)',
                      color: 'var(--color-text)',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: 500,
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={async () => {
                      // Find songs missing Spotify URIs (excluding duplicates and excluded)
                      const needsLookup = importedSongs.filter(s =>
                        !s.spotifyUri && !s._duplicate && !s._excluded
                      );
                      if (needsLookup.length === 0) {
                        setImportStep('ready');
                        return;
                      }

                      setImportStep('fetching');

                      const results = await batchLookupSpotifyUris(
                        needsLookup.map(s => ({
                          id: s._importId,
                          title: s.title || '',
                          artist: s.artist || ''
                        })),
                        (progress) => {
                          setLookupProgress(progress);
                          // Update issues for songs that fail lookup
                          if (progress.status === 'not_found') {
                            setImportedSongs(prev => prev.map(s =>
                              s._importId === needsLookup.find(n => n.title === progress.songTitle)?._importId
                                ? { ...s, _issues: [...(s._issues || []), 'spotify_not_found'] }
                                : s
                            ));
                          }
                        },
                        1500
                      );

                      // Mark low confidence matches
                      results.forEach((result, importId) => {
                        if (result.spotifyUri && result.confidence === 'low') {
                          setImportedSongs(prev => prev.map(s =>
                            s._importId === importId
                              ? { ...s, _issues: [...(s._issues || []), 'low_confidence_match'] }
                              : s
                          ));
                        }
                      });

                      setLookupResults(results);
                      setLookupProgress(null);
                      setImportStep('review');
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 20px',
                      background: '#1DB954',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: 500,
                      cursor: 'pointer'
                    }}
                  >
                    <Zap size={16} />
                    Fetch Spotify ({importedSongs.filter(s => !s.spotifyUri && !s._duplicate && !s._excluded).length})
                  </button>
                  <button
                    onClick={() => setImportStep('ready')}
                    style={{
                      padding: '10px 20px',
                      background: 'var(--color-primary)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: 500,
                      cursor: 'pointer'
                    }}
                  >
                    Skip to Import
                  </button>
                </div>
              </div>
            )}

            {/* Review step - after Spotify lookup */}
            {importStep === 'review' && (
              <div>
                <div style={{
                  padding: '12px 16px',
                  background: 'rgba(245, 158, 11, 0.1)',
                  borderRadius: '8px',
                  marginBottom: '16px',
                  fontSize: '13px',
                  color: '#f59e0b'
                }}>
                  <strong>Review Results:</strong> Some songs may need attention. Uncheck entries you want to exclude from import.
                </div>

                {/* Stats after lookup */}
                <div style={{
                  display: 'flex',
                  gap: '12px',
                  marginBottom: '16px',
                  flexWrap: 'wrap'
                }}>
                  <div style={{
                    padding: '12px 16px',
                    background: 'var(--color-dark-card)',
                    borderRadius: '8px',
                    flex: 1,
                    minWidth: '100px'
                  }}>
                    <div style={{ fontSize: '24px', fontWeight: 700, color: '#1DB954' }}>
                      {importedSongs.filter(s => !s._duplicate && !s._excluded && (s.spotifyUri || lookupResults.get(s._importId)?.spotifyUri)).length}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>With Spotify</div>
                  </div>
                  <div style={{
                    padding: '12px 16px',
                    background: 'var(--color-dark-card)',
                    borderRadius: '8px',
                    flex: 1,
                    minWidth: '100px'
                  }}>
                    <div style={{ fontSize: '24px', fontWeight: 700, color: '#ef4444' }}>
                      {importedSongs.filter(s => !s._duplicate && !s._excluded && !s.spotifyUri && !lookupResults.get(s._importId)?.spotifyUri).length}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>No Spotify</div>
                  </div>
                  <div style={{
                    padding: '12px 16px',
                    background: 'var(--color-dark-card)',
                    borderRadius: '8px',
                    flex: 1,
                    minWidth: '100px'
                  }}>
                    <div style={{ fontSize: '24px', fontWeight: 700, color: '#f59e0b' }}>
                      {importedSongs.filter(s => {
                        const lookup = lookupResults.get(s._importId);
                        return lookup?.confidence === 'low' && lookup.spotifyUri;
                      }).length}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Low Confidence</div>
                  </div>
                </div>

                {/* Review list with lookup results */}
                <div style={{
                  maxHeight: '280px',
                  overflowY: 'auto',
                  marginBottom: '16px',
                  border: '1px solid var(--color-dark-card)',
                  borderRadius: '8px'
                }}>
                  {importedSongs
                    .filter(s => !s._duplicate)
                    .map((song, idx, arr) => {
                      const lookup = lookupResults.get(song._importId);
                      const hasSpotify = song.spotifyUri || lookup?.spotifyUri;
                      const isLowConfidence = lookup?.confidence === 'low' && lookup.spotifyUri;

                      return (
                        <div
                          key={song._importId}
                          style={{
                            padding: '12px',
                            borderBottom: idx < arr.length - 1 ? '1px solid var(--color-dark-card)' : 'none',
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '12px',
                            background: song._excluded ? 'rgba(239, 68, 68, 0.05)' :
                                        isLowConfidence ? 'rgba(245, 158, 11, 0.1)' :
                                        !hasSpotify ? 'rgba(239, 68, 68, 0.05)' : 'transparent',
                            opacity: song._excluded ? 0.5 : 1
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={!song._excluded}
                            onChange={() => {
                              setImportedSongs(prev => prev.map(s =>
                                s._importId === song._importId
                                  ? { ...s, _excluded: !s._excluded }
                                  : s
                              ));
                            }}
                            style={{ marginTop: '4px', cursor: 'pointer' }}
                          />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 500, fontSize: '14px' }}>{song.title}</div>
                            <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                              {song.artist}
                              {lookup && lookup.matchedArtist !== song.artist && (
                                <span style={{ color: '#f59e0b' }}> → matched: {lookup.matchedArtist}</span>
                              )}
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', alignItems: 'center' }}>
                            {hasSpotify ? (
                              <span style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '11px',
                                padding: '2px 8px',
                                background: isLowConfidence ? 'rgba(245, 158, 11, 0.2)' : 'rgba(29, 185, 84, 0.2)',
                                color: isLowConfidence ? '#f59e0b' : '#1DB954',
                                borderRadius: '4px'
                              }}>
                                <Check size={12} />
                                {isLowConfidence ? 'Low match' : 'Spotify'}
                              </span>
                            ) : (
                              <span style={{
                                fontSize: '11px',
                                padding: '2px 8px',
                                background: 'rgba(239, 68, 68, 0.2)',
                                color: '#ef4444',
                                borderRadius: '4px'
                              }}>
                                Not found
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>

                {/* Bulk actions */}
                <div style={{
                  display: 'flex',
                  gap: '8px',
                  marginBottom: '16px',
                  flexWrap: 'wrap'
                }}>
                  <button
                    onClick={() => {
                      // Exclude songs without Spotify
                      setImportedSongs(prev => prev.map(s => {
                        const lookup = lookupResults.get(s._importId);
                        const hasSpotify = s.spotifyUri || lookup?.spotifyUri;
                        return !hasSpotify && !s._duplicate ? { ...s, _excluded: true } : s;
                      }));
                    }}
                    style={{
                      padding: '6px 12px',
                      background: 'rgba(239, 68, 68, 0.2)',
                      color: '#ef4444',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    Exclude No Spotify
                  </button>
                  <button
                    onClick={() => {
                      // Exclude low confidence matches
                      setImportedSongs(prev => prev.map(s => {
                        const lookup = lookupResults.get(s._importId);
                        return lookup?.confidence === 'low' ? { ...s, _excluded: true } : s;
                      }));
                    }}
                    style={{
                      padding: '6px 12px',
                      background: 'rgba(245, 158, 11, 0.2)',
                      color: '#f59e0b',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    Exclude Low Confidence
                  </button>
                  <button
                    onClick={() => {
                      setImportedSongs(prev => prev.map(s => ({ ...s, _excluded: false })));
                    }}
                    style={{
                      padding: '6px 12px',
                      background: 'rgba(16, 185, 129, 0.2)',
                      color: '#10b981',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    Include All
                  </button>
                </div>

                {/* Continue */}
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    onClick={() => setImportStep('preview')}
                    style={{
                      padding: '10px 20px',
                      background: 'var(--color-dark-card)',
                      color: 'var(--color-text)',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: 500,
                      cursor: 'pointer'
                    }}
                  >
                    Back
                  </button>
                  <button
                    onClick={() => setImportStep('ready')}
                    style={{
                      padding: '10px 20px',
                      background: 'var(--color-primary)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: 500,
                      cursor: 'pointer'
                    }}
                  >
                    Continue to Import ({importedSongs.filter(s => !s._duplicate && !s._excluded).length})
                  </button>
                </div>
              </div>
            )}

            {importStep === 'fetching' && (
              <div style={{ textAlign: 'center', padding: '32px' }}>
                <Loader size={32} className="animate-spin" style={{ color: '#1DB954', margin: '0 auto 16px' }} />
                {lookupProgress && (
                  <>
                    <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: '8px' }}>
                      Looking up: {lookupProgress.songTitle}
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
                      {lookupProgress.current} / {lookupProgress.total}
                    </div>
                    <div style={{
                      width: '100%',
                      height: '4px',
                      background: 'var(--color-dark-card)',
                      borderRadius: '2px',
                      marginTop: '12px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${(lookupProgress.current / lookupProgress.total) * 100}%`,
                        height: '100%',
                        background: '#1DB954',
                        transition: 'width 0.3s'
                      }} />
                    </div>
                  </>
                )}
              </div>
            )}

            {importStep === 'ready' && (
              <div>
                {/* Results summary */}
                <div style={{
                  display: 'flex',
                  gap: '12px',
                  marginBottom: '16px',
                  flexWrap: 'wrap'
                }}>
                  <div style={{
                    padding: '12px 16px',
                    background: 'var(--color-dark-card)',
                    borderRadius: '8px',
                    flex: 1,
                    minWidth: '100px'
                  }}>
                    <div style={{ fontSize: '24px', fontWeight: 700, color: '#10b981' }}>
                      {importedSongs.filter(s => !s._duplicate && !s._excluded).length}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Ready to import</div>
                  </div>
                  <div style={{
                    padding: '12px 16px',
                    background: 'var(--color-dark-card)',
                    borderRadius: '8px',
                    flex: 1,
                    minWidth: '100px'
                  }}>
                    <div style={{ fontSize: '24px', fontWeight: 700, color: '#f59e0b' }}>
                      {importedSongs.filter(s => s._duplicate).length}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Duplicates</div>
                  </div>
                  <div style={{
                    padding: '12px 16px',
                    background: 'var(--color-dark-card)',
                    borderRadius: '8px',
                    flex: 1,
                    minWidth: '100px'
                  }}>
                    <div style={{ fontSize: '24px', fontWeight: 700, color: '#ef4444' }}>
                      {importedSongs.filter(s => s._excluded && !s._duplicate).length}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Excluded</div>
                  </div>
                </div>

                {/* Preview with lookup results - only show songs to be imported */}
                <div style={{
                  maxHeight: '300px',
                  overflowY: 'auto',
                  marginBottom: '16px',
                  border: '1px solid var(--color-dark-card)',
                  borderRadius: '8px'
                }}>
                  {importedSongs.filter(s => !s._duplicate && !s._excluded).length === 0 ? (
                    <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                      No songs to import. Go back to include some entries.
                    </div>
                  ) : (
                    importedSongs.filter(s => !s._duplicate && !s._excluded).map((song, idx, arr) => {
                      const lookup = lookupResults.get(song._importId);
                      const hasSpotify = song.spotifyUri || lookup?.spotifyUri;
                      return (
                        <div
                          key={song._importId}
                          style={{
                            padding: '12px',
                            borderBottom: idx < arr.length - 1 ? '1px solid var(--color-dark-card)' : 'none',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px'
                          }}
                        >
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 500, fontSize: '14px' }}>{song.title}</div>
                            <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                              {song.artist}
                              {lookup && lookup.matchedArtist !== song.artist && (
                                <span style={{ color: '#f59e0b' }}> → {lookup.matchedArtist}</span>
                              )}
                            </div>
                          </div>
                          {hasSpotify ? (
                            <span style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '11px',
                              padding: '2px 8px',
                              background: 'rgba(29, 185, 84, 0.2)',
                              color: '#1DB954',
                              borderRadius: '4px'
                            }}>
                              <Check size={12} />
                              Spotify
                            </span>
                          ) : (
                            <span style={{
                              fontSize: '11px',
                              padding: '2px 8px',
                              background: 'rgba(245, 158, 11, 0.2)',
                              color: '#f59e0b',
                              borderRadius: '4px'
                            }}>
                              No Spotify
                            </span>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Import results */}
                {importResults && (
                  <div style={{
                    padding: '16px',
                    background: importResults.failed > 0 ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                    borderRadius: '8px',
                    marginBottom: '16px'
                  }}>
                    <div style={{ fontWeight: 600, marginBottom: '4px' }}>
                      Import Complete
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
                      {importResults.success} songs imported successfully
                      {importResults.failed > 0 && `, ${importResults.failed} failed`}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => {
                      setImportStep('upload');
                      setImportedSongs([]);
                      setLookupResults(new Map());
                      setImportResults(null);
                    }}
                    style={{
                      padding: '10px 20px',
                      background: 'var(--color-dark-card)',
                      color: 'var(--color-text)',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: 500,
                      cursor: 'pointer'
                    }}
                  >
                    Start Over
                  </button>
                  {!importResults && (
                    <button
                      onClick={async () => {
                        setImporting(true);
                        let success = 0;
                        let failed = 0;

                        const toImport = importedSongs.filter(s => !s._duplicate && !s._excluded);

                        for (let i = 0; i < toImport.length; i++) {
                          const song = toImport[i];
                          const lookup = lookupResults.get(song._importId);

                          // Generate unique ID: user-YYYYMMDD-XXX
                          const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
                          const uniqueNum = String(Date.now() % 1000 + i).padStart(3, '0');

                          // Build the full song object with auto-populated fields
                          const fullSong: SongLocation = {
                            id: `user-${dateStr}-${uniqueNum}`,
                            title: song.title || '',
                            artist: song.artist || '',
                            // Album from lookup (iTunes/song.link)
                            album: lookup?.albumName || song.album || undefined,
                            // Album art from lookup
                            albumArt: lookup?.albumArt || '',
                            // Spotify URI from CSV or lookup
                            spotifyUri: song.spotifyUri || lookup?.spotifyUri || undefined,
                            latitude: song.latitude || 0,
                            longitude: song.longitude || 0,
                            locationName: song.locationName || '',
                            locationDescription: song.locationDescription,
                            upvotes: 0,
                            verified: true,
                            // Tags from CSV or empty
                            tags: song.tags || [],
                            // Status always 'live' for imports
                            status: 'live',
                            providerLinks: {
                              ...song.providerLinks,
                              youtube: song.providerLinks?.youtube || lookup?.youtubeId || undefined,
                              appleMusic: song.providerLinks?.appleMusic || lookup?.appleMusicId || undefined
                            }
                          };

                          const result = await addSong(fullSong);
                          if (result) {
                            success++;
                          } else {
                            failed++;
                          }
                        }

                        setImportResults({ success, failed });
                        setImporting(false);
                        onRefreshSongs?.();
                      }}
                      disabled={importing || importedSongs.filter(s => !s._duplicate && !s._excluded).length === 0}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '10px 20px',
                        background: 'var(--color-primary)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: 500,
                        cursor: (importing || importedSongs.filter(s => !s._duplicate && !s._excluded).length === 0) ? 'not-allowed' : 'pointer',
                        opacity: (importing || importedSongs.filter(s => !s._duplicate && !s._excluded).length === 0) ? 0.5 : 1
                      }}
                    >
                      {importing ? (
                        <>
                          <Loader size={16} className="animate-spin" />
                          Importing...
                        </>
                      ) : (
                        <>
                          <Upload size={16} />
                          Import {importedSongs.filter(s => !s._duplicate && !s._excluded).length} Songs
                        </>
                      )}
                    </button>
                  )}
                  {!importResults && (
                    <button
                      onClick={() => setImportStep('review')}
                      style={{
                        padding: '10px 20px',
                        background: 'var(--color-dark-card)',
                        color: 'var(--color-text)',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: 500,
                        cursor: 'pointer'
                      }}
                    >
                      Back to Review
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
        )}

        {/* Stats footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid var(--color-dark-lighter)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '14px',
          color: 'var(--color-text-muted)',
          flexShrink: 0
        }}>
          <span style={{ whiteSpace: 'nowrap' }}>{songs.length} total songs</span>
          <span style={{ whiteSpace: 'nowrap' }}>{linkedCount} with music links</span>
        </div>
      </div>

      {/* Spotify Search Modal */}
      <SpotifySearch
        isOpen={showSpotifySearch}
        onClose={() => {
          setShowSpotifySearch(false);
          setEditingSong(null);
        }}
        onSelect={handleSpotifySelect}
        initialQuery={editingSong ? `${editingSong.title} ${editingSong.artist}` : ''}
      />

      {/* Provider Links Editor Modal */}
      {showProviderEditor && editingSong && (
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
          zIndex: 10000
        }}>
          {/* Backdrop */}
          <div
            onClick={() => {
              setShowProviderEditor(false);
              setEditingSong(null);
            }}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.8)'
            }}
          />

          {/* Modal */}
          <div
            onClick={e => e.stopPropagation()}
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '500px',
              background: 'var(--color-dark-card)',
              borderRadius: '16px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
              overflow: 'hidden'
            }}
          >
            {/* Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '20px 24px',
              borderBottom: '1px solid var(--color-dark-lighter)'
            }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>
                  Edit Music Links
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', margin: '4px 0 0 0' }}>
                  {editingSong.title} - {editingSong.artist}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowProviderEditor(false);
                  setEditingSong(null);
                }}
                style={{
                  padding: '8px',
                  background: 'none',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  color: 'var(--color-text-muted)'
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Provider inputs */}
            <div style={{ padding: '20px 24px' }}>
              {(Object.keys(PROVIDER_CONFIG) as MusicProvider[]).map(provider => {
                const config = PROVIDER_CONFIG[provider];
                const validation = providerValidation[provider];
                const hasInput = providerInputs[provider].trim() !== '';

                return (
                  <div key={provider} style={{ marginBottom: '16px' }}>
                    <label style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '13px',
                      fontWeight: 500,
                      color: 'var(--color-text)',
                      marginBottom: '6px'
                    }}>
                      <span style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: config.color
                      }} />
                      {config.name}
                      {validation === 'valid' && (
                        <Check size={14} style={{ color: config.color, marginLeft: 'auto' }} />
                      )}
                      {validation === 'invalid' && hasInput && (
                        <AlertCircle size={14} style={{ color: '#ef4444', marginLeft: 'auto' }} />
                      )}
                    </label>
                    <input
                      type="text"
                      value={providerInputs[provider]}
                      onChange={(e) => handleProviderInputChange(provider, e.target.value)}
                      placeholder={config.placeholder}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        background: 'var(--color-dark-lighter)',
                        border: `1px solid ${
                          validation === 'valid' ? config.color :
                          validation === 'invalid' && hasInput ? '#ef4444' :
                          'transparent'
                        }`,
                        borderRadius: '8px',
                        color: 'var(--color-text)',
                        fontSize: '14px',
                        outline: 'none'
                      }}
                    />
                    {validation === 'invalid' && hasInput && (
                      <p style={{ fontSize: '11px', color: '#ef4444', marginTop: '4px' }}>
                        Invalid {config.name} URL or ID
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div style={{
              display: 'flex',
              gap: '12px',
              padding: '16px 24px',
              borderTop: '1px solid var(--color-dark-lighter)'
            }}>
              <button
                onClick={() => {
                  setShowProviderEditor(false);
                  setEditingSong(null);
                }}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: 'var(--color-dark-lighter)',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'var(--color-text)',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={saveProviderLinks}
                disabled={isUpdating === editingSong.id}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: 'var(--color-primary)',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                {isUpdating === editingSong.id ? (
                  <Loader size={16} className="animate-spin" />
                ) : (
                  <>
                    <Check size={16} />
                    Save Links
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
