import { useState } from 'react';
import { X, Mail, Lock, LogIn, UserPlus, AlertCircle, Info } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { signIn, signUp, isDemoMode } = useAuth();

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { error } = mode === 'login' 
        ? await signIn(email, password)
        : await signUp(email, password);

      if (error) {
        setError(error.message);
      } else {
        if (mode === 'signup') {
          setError('Check your email to confirm your account!');
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
        <form onSubmit={handleSubmit} className="modal-body">
          {/* Demo mode notice */}
          {isDemoMode && (
            <div className="alert alert-info" style={{ marginBottom: 'var(--space-lg)' }}>
              <Info size={18} className="alert-icon" />
              <div>
                <strong style={{ display: 'block', marginBottom: '2px' }}>Demo Mode</strong>
                <span style={{ fontSize: '12px', opacity: 0.9 }}>
                  Use any email. For admin: admin@soundscape.app
                </span>
              </div>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className={`alert ${error.includes('Check your email') ? 'alert-success' : 'alert-error'}`} style={{ marginBottom: 'var(--space-lg)' }}>
              <AlertCircle size={18} className="alert-icon" />
              <span>{error}</span>
            </div>
          )}

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
            disabled={loading}
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

        {/* Footer */}
        <div className="modal-footer">
          <span style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button
              type="button"
              onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(null); }}
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
