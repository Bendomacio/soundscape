import { useState, useRef, useEffect } from 'react';
import { Plus, User, Music2, LogOut, Settings, Shield, FolderOpen, Check, Unlink, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSpotifyPlayer } from '../contexts/SpotifyPlayerContext';
import { LoadingSpinner, UserAvatar } from './ui';

interface HeaderProps {
  onSubmitClick: () => void;
  onLoginClick: () => void;
  onAdminClick: () => void;
  onMySubmissionsClick: () => void;
}

export function Header({ onSubmitClick, onLoginClick, onAdminClick, onMySubmissionsClick }: HeaderProps) {
  const { user, profile, isAdmin, signOut } = useAuth();
  const { connection, connectSpotify, disconnectSpotify } = useSpotifyPlayer();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
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

          {/* User button / menu */}
          <div className="relative" ref={menuRef}>
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
                      <div className={isAdmin ? 'badge badge-purple' : ''} style={isAdmin ? { padding: '2px 8px', fontSize: '10px' } : { fontSize: '12px', color: 'var(--color-text-muted)' }}>
                        {isAdmin ? (
                          <>
                            <Sparkles size={10} />
                            Administrator
                          </>
                        ) : user.email}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Spotify Connection Section */}
                <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--glass-border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="#1DB954">
                        <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                      </svg>
                      <span style={{ fontSize: '13px', fontWeight: 500 }}>Spotify</span>
                    </div>
                    {connection.isConnecting ? (
                      <LoadingSpinner size={16} className="text-[var(--color-text-muted)]" />
                    ) : connection.isConnected ? (
                      <div className="badge badge-spotify" style={{ padding: '2px 8px', fontSize: '10px' }}>
                        <Check size={10} />
                        {connection.isPremium ? 'Premium' : 'Free'}
                      </div>
                    ) : null}
                  </div>

                  {connection.isConnected ? (
                    <button
                      onClick={() => disconnectSpotify()}
                      className="dropdown-item"
                      style={{
                        padding: '8px 12px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        color: 'var(--color-text-muted)',
                        background: 'rgba(255, 255, 255, 0.03)'
                      }}
                    >
                      <Unlink size={14} />
                      <span>Disconnect Spotify</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => connectSpotify()}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        padding: '10px 16px',
                        background: '#1DB954',
                        borderRadius: '10px',
                        border: 'none',
                        color: 'white',
                        fontSize: '13px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 2px 10px rgba(29, 185, 84, 0.3)'
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                      </svg>
                      Connect Spotify
                    </button>
                  )}
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
