import { useState, type ReactNode } from 'react';
import { X, Mail, Lock, LogIn, UserPlus, AlertCircle, Check } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import type { Provider } from '@supabase/supabase-js';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Social provider config
const socialProviders: { id: Provider; name: string; icon: ReactNode; color: string; bgColor: string }[] = [
  {
    id: 'google',
    name: 'Google',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
      </svg>
    ),
    color: '#1f1f1f',
    bgColor: '#ffffff'
  },
  {
    id: 'discord',
    name: 'Discord',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
      </svg>
    ),
    color: '#ffffff',
    bgColor: '#5865F2'
  },
  {
    id: 'facebook',
    name: 'Facebook',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
      </svg>
    ),
    color: '#ffffff',
    bgColor: '#1877F2'
  }
];

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingProvider, setLoadingProvider] = useState<Provider | null>(null);
  const { signInWithEmail, signUpWithEmail, signInWithProvider } = useAuth();

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const { error } = mode === 'login'
        ? await signInWithEmail(email, password)
        : await signUpWithEmail(email, password);

      if (error) {
        setError(error.message);
      } else {
        if (mode === 'signup') {
          setSuccess('Check your email to confirm your account!');
        } else {
          onClose();
        }
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }

  async function handleSocialLogin(provider: Provider) {
    setError(null);
    setSuccess(null);
    setLoadingProvider(provider);

    try {
      const { error } = await signInWithProvider(provider);
      if (error) {
        setError(error.message);
      }
      // OAuth redirects, so no need to close modal
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setLoadingProvider(null);
    }
  }

  return (
    <div className="modal">
      {/* Backdrop */}
      <div className="modal-backdrop" onClick={onClose} />

      {/* Modal Content */}
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <h2 className="modal-title">
            {mode === 'login' ? 'Welcome Back' : 'Create Account'}
          </h2>
          <button onClick={onClose} className="modal-close" aria-label="Close">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          {/* Error message */}
          {error && (
            <div className="alert alert-error" style={{ marginBottom: 'var(--space-lg)' }}>
              <AlertCircle size={18} className="alert-icon" />
              <span>{error}</span>
            </div>
          )}

          {/* Success message */}
          {success && (
            <div className="alert alert-success" style={{ marginBottom: 'var(--space-lg)' }}>
              <Check size={18} className="alert-icon" />
              <span>{success}</span>
            </div>
          )}

          {/* Social login buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
            {socialProviders.map(provider => (
              <button
                key={provider.id}
                type="button"
                onClick={() => handleSocialLogin(provider.id)}
                disabled={loadingProvider !== null}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 'var(--space-sm)',
                  padding: 'var(--space-md)',
                  background: provider.bgColor,
                  color: provider.color,
                  border: provider.id === 'google' ? '1px solid #dadce0' : 'none',
                  borderRadius: 'var(--radius-md)',
                  fontSize: 'var(--text-sm)',
                  fontWeight: 'var(--font-medium)',
                  cursor: loadingProvider ? 'wait' : 'pointer',
                  opacity: loadingProvider && loadingProvider !== provider.id ? 0.5 : 1,
                  transition: 'opacity var(--transition-fast), transform var(--transition-fast)'
                }}
                onMouseEnter={(e) => {
                  if (!loadingProvider) e.currentTarget.style.opacity = '0.9';
                }}
                onMouseLeave={(e) => {
                  if (!loadingProvider) e.currentTarget.style.opacity = '1';
                }}
              >
                {loadingProvider === provider.id ? (
                  <div className="spinner" style={{ width: '18px', height: '18px' }} />
                ) : (
                  provider.icon
                )}
                Continue with {provider.name}
              </button>
            ))}
          </div>

          {/* Divider */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-md)',
            margin: 'var(--space-lg) 0'
          }}>
            <div style={{ flex: 1, height: '1px', background: 'var(--color-dark-lighter)' }} />
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
              or use email
            </span>
            <div style={{ flex: 1, height: '1px', background: 'var(--color-dark-lighter)' }} />
          </div>

          {/* Email form */}
          <form onSubmit={handleSubmit}>
            {/* Email field */}
            <div className="form-group">
              <label className="label">Email</label>
              <div className="input-wrapper">
                <Mail size={18} className="input-icon" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input input-with-icon"
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password field */}
            <div className="form-group">
              <label className="label">Password</label>
              <div className="input-wrapper">
                <Lock size={18} className="input-icon" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input input-with-icon"
                  placeholder="••••••••"
                  required
                  minLength={6}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                />
              </div>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading || loadingProvider !== null}
              className="btn btn-primary"
              style={{ width: '100%', marginTop: 'var(--space-lg)' }}
            >
              {loading ? (
                <div className="spinner" />
              ) : mode === 'login' ? (
                <>
                  <LogIn size={18} />
                  Sign In
                </>
              ) : (
                <>
                  <UserPlus size={18} />
                  Create Account
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <span style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button
              type="button"
              onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(null); setSuccess(null); }}
              className="link"
              style={{ background: 'none', border: 'none', font: 'inherit' }}
            >
              {mode === 'login' ? 'Sign up' : 'Sign in'}
            </button>
          </span>
        </div>
      </div>
    </div>
  );
}
