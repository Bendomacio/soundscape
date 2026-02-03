import { useState, useRef, useEffect } from 'react';
import { Plus, User, Music2, LogOut, Settings, Shield, FolderOpen, Check, Unlink, Sparkles, Link2, ExternalLink, Crown, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useMusicPlayer } from '../contexts/MusicPlayerContext';
import { LoadingSpinner, UserAvatar } from './ui';
import type { MusicProvider } from '../types';
import { isSoundCloudConnectionPending } from '../lib/providers/auth';

// Provider icons and colors
const PROVIDER_CONFIG: Record<MusicProvider, { name: string; color: string; icon: React.ReactNode }> = {
  spotify: {
    name: 'Spotify',
    color: '#1DB954',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
      </svg>
    )
  },
  youtube: {
    name: 'YouTube',
    color: '#FF0000',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
      </svg>
    )
  },
  apple_music: {
    name: 'Apple',
    color: '#FC3C44',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M23.994 6.124a9.23 9.23 0 0 0-.24-2.19c-.317-1.31-1.062-2.31-2.18-3.043a5.022 5.022 0 0 0-1.877-.726 10.496 10.496 0 0 0-1.564-.15c-.04-.003-.083-.01-.124-.013H5.986c-.152.01-.303.017-.455.026a9.95 9.95 0 0 0-1.65.218 5.03 5.03 0 0 0-1.98.995A4.89 4.89 0 0 0 .55 3.39a6.334 6.334 0 0 0-.293.857 10.13 10.13 0 0 0-.235 1.79c-.003.042-.01.085-.013.128v11.67c.01.13.017.26.027.39a9.88 9.88 0 0 0 .194 1.49 5.037 5.037 0 0 0 1.327 2.467 5.027 5.027 0 0 0 2.088 1.218c.512.153 1.04.234 1.574.283.224.02.448.035.673.043h12.126c.323-.018.647-.03.97-.064a8.06 8.06 0 0 0 1.496-.241 5.017 5.017 0 0 0 2.417-1.426 4.87 4.87 0 0 0 1.095-1.952c.163-.52.247-1.054.295-1.593.023-.26.036-.52.048-.78l.003-.204V6.293c-.003-.055-.008-.11-.013-.166zm-6.1 10.088c0 .3-.12.478-.398.573a4.54 4.54 0 0 1-1.39.304c-.467.046-.928-.012-1.367-.18-.343-.13-.614-.356-.78-.7a1.7 1.7 0 0 1-.145-.604c-.016-.368-.02-.736-.02-1.104V9.082a1.27 1.27 0 0 1 .022-.273c.056-.277.18-.515.406-.696a1.64 1.64 0 0 1 .733-.338c.246-.053.497-.072.75-.072l.556.002c.303 0 .606.01.907.03.294.02.504.158.577.448a.78.78 0 0 1 .025.153c.004.44.006.88.006 1.32v6.538c-.001.022.001.044-.002.065-.024.285-.124.447-.376.557-.32.14-.66.21-1.006.248-.315.035-.63.03-.944-.012-.38-.05-.726-.186-.988-.492a1.54 1.54 0 0 1-.315-.714 5.254 5.254 0 0 1-.073-.69c-.007-.26-.004-.52-.004-.78V9.082c0-.092-.003-.184.008-.275.033-.278.166-.494.42-.626.247-.128.517-.174.792-.18.352-.01.705-.006 1.057.01.368.016.633.17.77.523.07.18.087.37.088.56.002.67 0 1.34 0 2.01v5.108z"/>
      </svg>
    )
  },
  soundcloud: {
    name: 'SoundCloud',
    color: '#FF5500',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M1.175 12.225c-.051 0-.094.046-.101.1l-.233 2.154.233 2.105c.007.058.05.098.101.098.05 0 .09-.04.099-.098l.255-2.105-.27-2.154c-.009-.06-.052-.1-.1-.1zm-.899.828c-.06 0-.091.037-.104.094L0 14.479l.165 1.308c.014.057.045.094.09.094s.089-.037.099-.094l.194-1.308-.194-1.332c-.01-.057-.04-.094-.09-.094h.012zm1.83-1.229c-.061 0-.104.039-.104.104l-.21 2.563.21 2.458c0 .066.043.104.104.104.062 0 .104-.038.109-.104l.226-2.458-.226-2.563c-.005-.065-.047-.104-.109-.104zm.945-.089c-.073 0-.12.044-.12.12l-.189 2.652.189 2.514c0 .075.047.12.12.12s.12-.045.12-.12l.221-2.514-.221-2.652c0-.076-.047-.12-.12-.12zm.976-.269c-.084 0-.135.051-.135.135l-.165 2.786.165 2.533c0 .084.051.135.135.135s.135-.051.135-.135l.195-2.533-.195-2.786c0-.084-.051-.135-.135-.135zm1.005-.312c-.096 0-.15.057-.15.15l-.15 2.948.15 2.545c0 .093.054.15.15.15s.15-.057.15-.15l.165-2.545-.165-2.948c0-.093-.054-.15-.15-.15zm1.02-.415c-.105 0-.165.066-.165.165l-.135 3.213.135 2.548c0 .102.06.165.165.165.104 0 .165-.063.165-.165l.15-2.548-.15-3.213c0-.099-.061-.165-.165-.165zm1.049-.419c-.117 0-.18.072-.18.18l-.12 3.467.12 2.541c0 .108.063.18.18.18.116 0 .18-.072.18-.18l.135-2.541-.135-3.467c0-.108-.064-.18-.18-.18zm1.08-.3c-.129 0-.195.078-.195.195l-.105 3.582.105 2.526c0 .117.066.195.195.195.128 0 .195-.078.195-.195l.12-2.526-.12-3.582c0-.117-.067-.195-.195-.195zm1.11-.195c-.14 0-.21.084-.21.21l-.09 3.672.09 2.52c0 .123.07.21.21.21.139 0 .21-.087.21-.21l.105-2.52-.105-3.672c0-.126-.071-.21-.21-.21zm1.14-.12c-.15 0-.225.09-.225.225l-.075 3.667.075 2.505c0 .135.075.225.225.225.149 0 .225-.09.225-.225l.09-2.505-.09-3.667c0-.135-.076-.225-.225-.225zm1.17-.105c-.162 0-.24.099-.24.24l-.06 3.668.06 2.502c0 .144.078.24.24.24.161 0 .24-.096.24-.24l.075-2.502-.075-3.668c0-.141-.079-.24-.24-.24zm1.2-.09c-.174 0-.255.105-.255.255l-.045 3.653.045 2.49c0 .15.081.255.255.255.173 0 .255-.105.255-.255l.06-2.49-.06-3.653c0-.15-.082-.255-.255-.255zm1.23-.06c-.186 0-.27.111-.27.27l-.03 3.598.03 2.475c0 .159.084.27.27.27.185 0 .27-.111.27-.27l.045-2.475-.045-3.598c0-.159-.085-.27-.27-.27zm1.26-.06c-.195 0-.285.12-.285.285l-.015 3.568.015 2.468c0 .165.09.285.285.285.194 0 .285-.12.285-.285l.03-2.468-.03-3.568c0-.165-.091-.285-.285-.285zm1.29 0c-.21 0-.3.126-.3.3v3.613l.015 2.453c0 .171.09.3.285.3.194 0 .3-.129.3-.3l.015-2.453-.015-3.613c0-.174-.106-.3-.3-.3zm1.32 0c-.21 0-.315.135-.315.315l-.015 3.568.015 2.438c0 .18.105.315.315.315.209 0 .315-.135.315-.315l.015-2.438-.015-3.568c0-.18-.106-.315-.315-.315zm1.351.059c-.222 0-.33.141-.33.33l-.015 3.494.015 2.423c0 .189.108.33.33.33.221 0 .33-.141.33-.33l.015-2.423-.015-3.494c0-.189-.109-.33-.33-.33zm1.379.09c-.233 0-.345.15-.345.345v3.464l.015 2.408c0 .195.112.345.33.345.218 0 .345-.15.345-.345l.015-2.408-.015-3.464c0-.195-.127-.345-.345-.345zm2.279 1.229c-.15 0-.27.03-.405.06-.09-2.025-1.8-3.635-3.885-3.635-1.005 0-1.92.39-2.61 1.035a.386.386 0 0 0-.135.285v6.9c0 .18.135.345.315.36.045 0 7.275.015 6.72.015a3.22 3.22 0 0 0 3.225-3.225 3.22 3.22 0 0 0-3.225-3.21v-.585z"/>
      </svg>
    )
  }
};

interface HeaderProps {
  onSubmitClick: () => void;
  onLoginClick: () => void;
  onAdminClick: () => void;
  onMySubmissionsClick: () => void;
}

export function Header({ onSubmitClick, onLoginClick, onAdminClick, onMySubmissionsClick }: HeaderProps) {
  const { user, profile, isAdmin, signOut, isDevMode, isDevSession, devLogin } = useAuth();
  const {
    connection,
    providerConnections,
    connectSpotify,
    disconnectSpotify,
    connectProvider,
    disconnectProvider,
    confirmSoundCloud,
    setSoundCloudPremiumStatus,
    userPreference,
    setProviderPreference
  } = useMusicPlayer();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showDevMenu, setShowDevMenu] = useState(false);
  const [showSoundCloudConfirm, setShowSoundCloudConfirm] = useState(false);
  const [soundCloudPremiumToggle, setSoundCloudPremiumToggle] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const devMenuRef = useRef<HTMLDivElement>(null);

  // Check for pending SoundCloud confirmation
  useEffect(() => {
    const checkPending = () => {
      if (isSoundCloudConnectionPending()) {
        setShowSoundCloudConfirm(true);
      }
    };
    checkPending();
    // Check periodically in case user returns from SoundCloud
    const interval = setInterval(checkPending, 1000);
    return () => clearInterval(interval);
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
      if (devMenuRef.current && !devMenuRef.current.contains(event.target as Node)) {
        setShowDevMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-30 pointer-events-none">
      <div className="flex items-center justify-between p-4">
        {/* Logo - Glassmorphism card */}
        <div className="pointer-events-auto glass-light" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '10px 16px',
          borderRadius: '16px',
          boxShadow: 'var(--shadow-lg)'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            background: 'var(--gradient-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow-glow-primary)'
          }}>
            <Music2 className="w-5 h-5 text-white" />
          </div>
          <div className="hidden sm:block">
            <h1 style={{
              fontSize: '17px',
              fontWeight: 700,
              lineHeight: 1.2,
              letterSpacing: '-0.02em',
              background: 'linear-gradient(135deg, var(--color-text), var(--color-primary))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              SoundScape
            </h1>
            <p style={{
              fontSize: '11px',
              color: 'var(--color-text-muted)',
              lineHeight: 1.3,
              letterSpacing: '0.02em'
            }}>
              Discover music in places
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pointer-events-auto">
          {/* Admin button - premium glass style */}
          {isAdmin && (
            <button
              onClick={onAdminClick}
              className="btn-glass mobile-responsive-btn"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 16px',
                fontSize: '13px',
                fontWeight: 600,
                borderRadius: '12px',
                color: 'var(--color-primary)',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              title="Admin Panel"
            >
              <Shield size={16} />
              <span className="hidden sm:inline">Admin</span>
            </button>
          )}

          {/* Submit button - gradient with glow */}
          <button
            onClick={onSubmitClick}
            className="btn-gradient mobile-responsive-btn"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              background: 'linear-gradient(135deg, #F43F5E 0%, #EC4899 50%, #F43F5E 100%)',
              backgroundSize: '200% 200%',
              color: 'white',
              fontWeight: 600,
              fontSize: '13px',
              borderRadius: '12px',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(244, 63, 94, 0.4)',
              transition: 'all 0.2s ease'
            }}
            title="Submit Song"
          >
            <Plus size={18} strokeWidth={2.5} />
            <span className="hidden sm:inline">Submit Song</span>
          </button>

          {/* Dev Login Menu (only in dev mode when not logged in) */}
          {isDevMode && !user && (
            <div className="relative" ref={devMenuRef}>
              <button
                onClick={() => setShowDevMenu(!showDevMenu)}
                className="glass-light"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 12px',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 500,
                  color: '#F59E0B',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  background: 'rgba(245, 158, 11, 0.1)'
                }}
                title="Dev Login Options"
              >
                <Shield size={14} />
                <span className="hidden sm:inline">Dev Login</span>
              </button>

              {showDevMenu && (
                <div
                  className="dropdown-menu animate-slide-down"
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: 'calc(100% + 8px)',
                    width: '200px'
                  }}
                >
                  <div style={{ padding: '8px' }}>
                    <p style={{
                      fontSize: '10px',
                      color: 'var(--color-text-muted)',
                      padding: '8px 12px',
                      marginBottom: '4px'
                    }}>
                      Development Mode Only
                    </p>
                    <button
                      onClick={() => {
                        devLogin('admin');
                        setShowDevMenu(false);
                      }}
                      className="dropdown-item"
                      style={{
                        borderRadius: '10px',
                        color: '#8B5CF6'
                      }}
                    >
                      <Shield size={16} style={{ color: '#8B5CF6' }} />
                      <span>Login as Admin</span>
                    </button>
                    <button
                      onClick={() => {
                        devLogin('user');
                        setShowDevMenu(false);
                      }}
                      className="dropdown-item"
                      style={{ borderRadius: '10px' }}
                    >
                      <User size={16} />
                      <span>Login as User</span>
                    </button>
                    <div className="dropdown-divider" />
                    <button
                      onClick={() => {
                        setShowDevMenu(false);
                        onLoginClick();
                      }}
                      className="dropdown-item"
                      style={{ borderRadius: '10px' }}
                    >
                      <User size={16} />
                      <span>Real Login...</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* User button / menu (hidden in dev mode when not logged in) */}
          <div className="relative" ref={menuRef} style={{ display: isDevMode && !user ? 'none' : 'block' }}>
            <button
              onClick={() => user ? setShowUserMenu(!showUserMenu) : onLoginClick()}
              className="glass-light"
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                overflow: 'hidden',
                padding: user ? '3px' : '0',
                transition: 'all 0.2s ease'
              }}
            >
              {user ? (
                <UserAvatar
                  avatarUrl={profile?.avatar_url}
                  displayName={profile?.display_name}
                  email={user.email}
                  size={38}
                />
              ) : (
                <User className="w-5 h-5 text-[var(--color-text-muted)]" />
              )}
            </button>

            {/* User dropdown menu - Modern glass dropdown */}
            {showUserMenu && user && (
              <div
                className="dropdown-menu animate-slide-down"
                style={{
                  position: 'absolute',
                  right: 0,
                  top: 'calc(100% + 8px)',
                  width: '280px',
                  maxHeight: '80vh',
                  overflowY: 'auto'
                }}
              >
                {/* User info header */}
                <div style={{
                  padding: '16px',
                  borderBottom: '1px solid var(--glass-border)',
                  background: 'rgba(255, 255, 255, 0.02)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      flexShrink: 0
                    }}>
                      <UserAvatar
                        avatarUrl={profile?.avatar_url}
                        displayName={profile?.display_name}
                        email={user.email}
                        size={44}
                      />
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <p style={{
                        fontWeight: 600,
                        fontSize: '14px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        marginBottom: '2px'
                      }}>
                        {profile?.display_name || user.email}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        {isAdmin && (
                          <div className="badge badge-purple" style={{ padding: '2px 8px', fontSize: '10px' }}>
                            <Sparkles size={10} />
                            Administrator
                          </div>
                        )}
                        {isDevSession && (
                          <div style={{
                            padding: '2px 8px',
                            fontSize: '10px',
                            background: 'rgba(245, 158, 11, 0.2)',
                            color: '#F59E0B',
                            borderRadius: '4px',
                            fontWeight: 500
                          }}>
                            Dev Mode
                          </div>
                        )}
                        {!isAdmin && !isDevSession && (
                          <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                            {user.email}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Connected Accounts Section */}
                <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--glass-border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <Link2 size={16} style={{ color: 'var(--color-text-muted)' }} />
                    <span style={{ fontSize: '13px', fontWeight: 500 }}>Connected Accounts</span>
                  </div>
                  <p style={{ fontSize: '10px', color: 'var(--color-text-muted)', marginBottom: '12px', lineHeight: 1.4 }}>
                    Link your music accounts for premium playback features
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {(Object.keys(PROVIDER_CONFIG) as MusicProvider[]).map(provider => {
                      const config = PROVIDER_CONFIG[provider];
                      const conn = providerConnections[provider];
                      const isSpotify = provider === 'spotify';
                      const isSoundCloud = provider === 'soundcloud';

                      return (
                        <div
                          key={provider}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '10px 12px',
                            background: conn.isConnected ? `${config.color}10` : 'rgba(255, 255, 255, 0.03)',
                            borderRadius: '10px',
                            border: conn.isConnected ? `1px solid ${config.color}40` : '1px solid transparent'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                            <span style={{ color: conn.isConnected ? config.color : 'var(--color-text-muted)', flexShrink: 0 }}>
                              {config.icon}
                            </span>
                            <div style={{ minWidth: 0, flex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{
                                  fontSize: '12px',
                                  fontWeight: 500,
                                  color: conn.isConnected ? 'var(--color-text)' : 'var(--color-text-muted)'
                                }}>
                                  {config.name}
                                </span>
                                {conn.isConnected && (
                                  <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    padding: '2px 6px',
                                    background: conn.isPremium ? `${config.color}30` : 'rgba(255, 255, 255, 0.1)',
                                    borderRadius: '4px',
                                    fontSize: '9px',
                                    fontWeight: 600,
                                    color: conn.isPremium ? config.color : 'var(--color-text-muted)'
                                  }}>
                                    {conn.isPremium && <Crown size={8} />}
                                    {conn.isPremium ? 'Premium' : 'Connected'}
                                  </div>
                                )}
                              </div>
                              {conn.isConnected && conn.userName && (
                                <span style={{
                                  fontSize: '10px',
                                  color: 'var(--color-text-muted)',
                                  display: 'block',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap'
                                }}>
                                  {conn.userName}
                                </span>
                              )}
                              {conn.error && (
                                <span style={{
                                  fontSize: '10px',
                                  color: '#ef4444',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}>
                                  <AlertCircle size={10} />
                                  {conn.error}
                                </span>
                              )}
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                            {/* SoundCloud Premium toggle */}
                            {isSoundCloud && conn.isConnected && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSoundCloudPremiumStatus(!conn.isPremium);
                                }}
                                style={{
                                  padding: '4px 8px',
                                  background: conn.isPremium ? `${config.color}20` : 'transparent',
                                  border: `1px solid ${conn.isPremium ? config.color : 'var(--glass-border)'}`,
                                  borderRadius: '6px',
                                  fontSize: '9px',
                                  fontWeight: 500,
                                  color: conn.isPremium ? config.color : 'var(--color-text-muted)',
                                  cursor: 'pointer',
                                  transition: 'all 0.15s ease'
                                }}
                                title="Toggle SoundCloud Go status"
                              >
                                Go+
                              </button>
                            )}

                            {conn.isConnecting ? (
                              <LoadingSpinner size={14} className="text-[var(--color-text-muted)]" />
                            ) : conn.isConnected ? (
                              <button
                                onClick={() => isSpotify ? disconnectSpotify() : disconnectProvider(provider)}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  padding: '4px 8px',
                                  background: 'transparent',
                                  border: '1px solid var(--glass-border)',
                                  borderRadius: '6px',
                                  fontSize: '10px',
                                  color: 'var(--color-text-muted)',
                                  cursor: 'pointer',
                                  transition: 'all 0.15s ease'
                                }}
                              >
                                <Unlink size={10} />
                                Unlink
                              </button>
                            ) : (
                              <button
                                onClick={() => isSpotify ? connectSpotify() : connectProvider(provider)}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  padding: '4px 10px',
                                  background: config.color,
                                  border: 'none',
                                  borderRadius: '6px',
                                  fontSize: '10px',
                                  fontWeight: 600,
                                  color: 'white',
                                  cursor: 'pointer',
                                  transition: 'all 0.15s ease',
                                  boxShadow: `0 2px 8px ${config.color}40`
                                }}
                              >
                                <ExternalLink size={10} />
                                Link
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* SoundCloud Confirmation Modal */}
                {showSoundCloudConfirm && (
                  <div style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(0, 0, 0, 0.6)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                  }}>
                    <div style={{
                      background: 'var(--color-dark-lighter)',
                      borderRadius: '16px',
                      padding: '24px',
                      maxWidth: '320px',
                      width: '90%',
                      border: '1px solid var(--glass-border)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '10px',
                          background: '#FF550020',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          {PROVIDER_CONFIG.soundcloud.icon}
                        </div>
                        <div>
                          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Link SoundCloud</h3>
                          <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-text-muted)' }}>
                            Confirm your connection
                          </p>
                        </div>
                      </div>

                      <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '16px', lineHeight: 1.5 }}>
                        Did you sign in to SoundCloud? If you have SoundCloud Go or Go+, toggle it on for ad-free playback.
                      </p>

                      <label style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '12px',
                        background: soundCloudPremiumToggle ? '#FF550020' : 'rgba(255, 255, 255, 0.03)',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        marginBottom: '16px',
                        border: soundCloudPremiumToggle ? '1px solid #FF550060' : '1px solid transparent'
                      }}>
                        <input
                          type="checkbox"
                          checked={soundCloudPremiumToggle}
                          onChange={(e) => setSoundCloudPremiumToggle(e.target.checked)}
                          style={{ width: '16px', height: '16px', accentColor: '#FF5500' }}
                        />
                        <div>
                          <span style={{ fontSize: '13px', fontWeight: 500 }}>I have SoundCloud Go/Go+</span>
                          <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', display: 'block' }}>
                            Enables full playback & no ads
                          </span>
                        </div>
                      </label>

                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => {
                            setShowSoundCloudConfirm(false);
                            sessionStorage.removeItem('soundcloud_connect_pending');
                          }}
                          style={{
                            flex: 1,
                            padding: '10px',
                            background: 'transparent',
                            border: '1px solid var(--glass-border)',
                            borderRadius: '8px',
                            fontSize: '13px',
                            color: 'var(--color-text-muted)',
                            cursor: 'pointer'
                          }}
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => {
                            confirmSoundCloud(soundCloudPremiumToggle);
                            setShowSoundCloudConfirm(false);
                          }}
                          style={{
                            flex: 1,
                            padding: '10px',
                            background: '#FF5500',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '13px',
                            fontWeight: 600,
                            color: 'white',
                            cursor: 'pointer',
                            boxShadow: '0 2px 10px rgba(255, 85, 0, 0.3)'
                          }}
                        >
                          Confirm
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Default Player Section */}
                <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--glass-border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                    <Music2 size={16} style={{ color: 'var(--color-text-muted)' }} />
                    <span style={{ fontSize: '13px', fontWeight: 500 }}>Default Player</span>
                  </div>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {(Object.keys(PROVIDER_CONFIG) as MusicProvider[]).map(provider => {
                      const config = PROVIDER_CONFIG[provider];
                      const isSelected = userPreference === provider;
                      return (
                        <button
                          key={provider}
                          onClick={() => setProviderPreference(provider)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '6px 10px',
                            background: isSelected ? `${config.color}20` : 'rgba(255, 255, 255, 0.03)',
                            border: isSelected ? `1px solid ${config.color}` : '1px solid transparent',
                            borderRadius: '8px',
                            color: isSelected ? config.color : 'var(--color-text-muted)',
                            fontSize: '11px',
                            fontWeight: 500,
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                          title={`Use ${config.name} as default player`}
                        >
                          <span style={{ color: isSelected ? config.color : 'var(--color-text-muted)' }}>
                            {config.icon}
                          </span>
                          <span>{config.name}</span>
                          {isSelected && <Check size={12} />}
                        </button>
                      );
                    })}
                  </div>
                  <p style={{ fontSize: '10px', color: 'var(--color-text-muted)', marginTop: '8px', lineHeight: 1.4 }}>
                    Choose your preferred music service. We'll use this when a song has multiple links.
                  </p>
                </div>

                {/* Menu items */}
                <div style={{ padding: '8px' }}>
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      onMySubmissionsClick();
                    }}
                    className="dropdown-item"
                    style={{ borderRadius: '10px' }}
                  >
                    <FolderOpen size={18} style={{ opacity: 0.7 }} />
                    <span>My Submissions</span>
                  </button>

                  {isAdmin && (
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        onAdminClick();
                      }}
                      className="dropdown-item"
                      style={{ borderRadius: '10px' }}
                    >
                      <Settings size={18} style={{ opacity: 0.7 }} />
                      <span>Admin Panel</span>
                    </button>
                  )}

                  <div className="dropdown-divider" />

                  <button
                    onClick={async () => {
                      setShowUserMenu(false);
                      await signOut();
                    }}
                    className="dropdown-item dropdown-item-danger"
                    style={{ borderRadius: '10px' }}
                  >
                    <LogOut size={18} />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
