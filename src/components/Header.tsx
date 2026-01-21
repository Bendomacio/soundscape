import { useState, useRef, useEffect } from 'react';
import { Plus, User, Music2, LogOut, Settings, Shield } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface HeaderProps {
  onSubmitClick: () => void;
  onLoginClick: () => void;
  onAdminClick: () => void;
}

export function Header({ onSubmitClick, onLoginClick, onAdminClick }: HeaderProps) {
  const { user, profile, isAdmin, signOut } = useAuth();
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
                whiteSpace: 'nowrap'
              }}
            >
              <Shield size={16} />
              <span>Admin</span>
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
              whiteSpace: 'nowrap',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
            }}
          >
            <Plus size={16} />
            <span>Submit Song</span>
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
              <div className="absolute right-0 top-full mt-2 w-56 bg-[var(--color-dark-card)] border border-[var(--color-dark-lighter)] rounded-xl shadow-xl overflow-hidden">
                <div className="p-4 border-b border-[var(--color-dark-lighter)]">
                  <p className="font-medium truncate">{profile?.display_name || user.email}</p>
                  <p className="text-xs text-[var(--color-text-muted)] truncate">
                    {isAdmin ? 'Administrator' : user.email}
                  </p>
                </div>
                
                <div className="p-2">
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
