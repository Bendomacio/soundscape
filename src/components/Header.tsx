import { useState, useRef, useEffect } from 'react';
import { Plus, User, Music2, LogOut, Settings, Shield, FolderOpen, Loader2, Check, Unlink } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSpotifyPlayer } from '../contexts/SpotifyPlayerContext';

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
        {/* Logo */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)] flex items-center justify-center shadow-lg">
            <Music2 className="w-5 h-5 text-white" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-lg font-bold leading-tight">SoundScape</h1>
            <p className="text-xs text-[var(--color-text-muted)] leading-tight">Discover music in places</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Admin button - only show for admins */}
          {isAdmin && (
            <button
              onClick={onAdminClick}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '10px 14px',
                background: 'var(--color-dark-card)',
                color: 'var(--color-primary)',
                fontWeight: 500,
                fontSize: '14px',
                borderRadius: '9999px',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                cursor: 'pointer',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap'
              }}
              className="mobile-responsive-btn"
              title="Admin Panel"
            >
              <Shield size={16} />
              <span className="hidden sm:inline">Admin</span>
            </button>
          )}

          <button
            onClick={onSubmitClick}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 16px',
              background: 'linear-gradient(135deg, var(--color-accent), var(--color-accent-secondary))',
              color: 'var(--color-dark)',
              fontWeight: 600,
              fontSize: '14px',
              borderRadius: '9999px',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              transition: 'all 0.2s',
              whiteSpace: 'nowrap'
            }}
            className="mobile-responsive-btn"
            title="Submit Song"
          >
            <Plus size={18} />
            <span className="hidden sm:inline">Submit Song</span>
          </button>
          
          {/* User button / menu */}
          <div className="relative" ref={menuRef}>
            <button 
              onClick={() => user ? setShowUserMenu(!showUserMenu) : onLoginClick()}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors overflow-hidden ${
                user 
                  ? 'bg-[var(--color-primary)] text-white'
                  : 'bg-[var(--color-dark-card)] border border-[var(--color-dark-lighter)] hover:bg-[var(--color-dark-lighter)]'
              }`}
            >
              {user ? (
                profile?.avatar_url ? (
                  <img 
                    src={profile.avatar_url} 
                    alt="" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-sm font-bold">
                    {(profile?.display_name || user.email)?.charAt(0).toUpperCase()}
                  </span>
                )
              ) : (
                <User className="w-5 h-5 text-[var(--color-text-muted)]" />
              )}
            </button>

            {/* User dropdown menu */}
            {showUserMenu && user && (
              <div className="absolute right-0 top-full mt-2 w-64 sm:w-56 max-h-[80vh] overflow-y-auto bg-[var(--color-dark-card)] border border-[var(--color-dark-lighter)] rounded-xl shadow-xl overflow-hidden">
                <div className="p-3 sm:p-4 border-b border-[var(--color-dark-lighter)]">
                  <p className="font-medium truncate text-sm sm:text-base">{profile?.display_name || user.email}</p>
                  <p className="text-xs text-[var(--color-text-muted)] truncate mt-0.5">
                    {isAdmin ? 'Administrator' : user.email}
                  </p>
                </div>
                
                <div className="p-2">
                  {/* Spotify Connection */}
                  <div className="px-3 py-2 mb-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="#1DB954">
                          <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                        </svg>
                        <span className="text-sm text-[var(--color-text-muted)]">Spotify</span>
                      </div>
                      {connection.isConnecting ? (
                        <Loader2 className="w-4 h-4 animate-spin text-[var(--color-text-muted)]" />
                      ) : connection.isConnected ? (
                        <div className="flex items-center gap-1">
                          <Check className="w-3 h-3 text-[#1DB954]" />
                          <span className="text-xs text-[#1DB954]">
                            {connection.isPremium ? 'Premium' : 'Free'}
                          </span>
                        </div>
                      ) : null}
                    </div>
                    
                    {connection.isConnected ? (
                      <button
                        onClick={() => {
                          disconnectSpotify();
                        }}
                        className="mt-2 w-full flex items-center justify-center gap-2 px-3 py-1.5 bg-[var(--color-dark-lighter)] hover:bg-[var(--color-dark)] rounded-lg transition-colors text-xs text-[var(--color-text-muted)]"
                      >
                        <Unlink className="w-3 h-3" />
                        <span>Disconnect Spotify</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          connectSpotify();
                        }}
                        className="mt-2 w-full flex items-center justify-center gap-2 px-3 py-1.5 bg-[#1DB954] hover:bg-[#1ed760] rounded-lg transition-colors text-xs text-white font-medium"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                        </svg>
                        <span>Connect Spotify</span>
                      </button>
                    )}
                  </div>
                  
                  <div className="border-t border-[var(--color-dark-lighter)] my-1" />

                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      onMySubmissionsClick();
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 hover:bg-[var(--color-dark-lighter)] rounded-lg transition-colors text-left"
                  >
                    <FolderOpen className="w-4 h-4 text-[var(--color-text-muted)]" />
                    <span>My Submissions</span>
                  </button>

                  {isAdmin && (
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        onAdminClick();
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 hover:bg-[var(--color-dark-lighter)] rounded-lg transition-colors text-left"
                    >
                      <Settings className="w-4 h-4 text-[var(--color-text-muted)]" />
                      <span>Admin Panel</span>
                    </button>
                  )}
                  
                  <button
                    onClick={async () => {
                      setShowUserMenu(false);
                      await signOut();
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 hover:bg-[var(--color-dark-lighter)] rounded-lg transition-colors text-left text-red-400"
                  >
                    <LogOut className="w-4 h-4" />
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
