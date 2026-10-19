import { useState } from 'react';
import type { AuthUser } from '../types/auth';
import { loginApi, registerApi } from '../services/authApi';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: AuthUser) => void;
  initialMode?: 'login' | 'register';
  message?: string;
}

export const AuthModal = ({
  isOpen,
  onClose,
  onSuccess,
  initialMode = 'login',
  message,
}: AuthModalProps) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        const res = await loginApi({ email, password });
        onSuccess(res.user);
        onClose();
      } else {
        const res = await registerApi({ email, password, full_name: fullName });
        onSuccess(res.user);
        onClose();
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Authentication request failed. Please check your network.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemo = (type: 'sarah' | 'new') => {
    if (type === 'sarah') {
      setEmail('sarah.connor@cinema.org');
      setPassword('SecurePassword123!');
      setMode('login');
    } else {
      const rand = Math.floor(100 + Math.random() * 900);
      setEmail(`moviegoer${rand}@yozigo.com`);
      setPassword('YozigoSecret2026!');
      setFullName(`Cinema Fan #${rand}`);
      setMode('register');
    }
  };

  return (
    <div className="auth-modal-overlay" role="dialog" aria-modal="true">
      <div className="auth-modal-card">
        <button
          type="button"
          className="auth-modal-close"
          onClick={onClose}
          aria-label="Close dialog"
        >
          ✕
        </button>

        <div className="auth-modal-header">
          <div className="auth-brand-logo">
            <span className="logo-icon">🎟️</span>
            <span className="logo-text">
              YOZI<span className="logo-accent">GO</span>
            </span>
          </div>
          <h2 className="auth-title">
            {mode === 'login' ? 'Welcome Back!' : 'Create Your Account'}
          </h2>
          <p className="auth-subtitle">
            {message ||
              (mode === 'login'
                ? 'Sign in to access your movie tickets and fast-track booking'
                : 'Join millions of movie lovers booking prime seats across India')}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="auth-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'login'}
            className={`auth-tab-btn ${mode === 'login' ? 'active' : ''}`}
            onClick={() => {
              setMode('login');
              setError(null);
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'register'}
            className={`auth-tab-btn ${mode === 'register' ? 'active' : ''}`}
            onClick={() => {
              setMode('register');
              setError(null);
            }}
          >
            Register
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="auth-error-banner" role="alert">
            <span className="error-icon">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          {mode === 'register' && (
            <div className="form-group">
              <label htmlFor="auth-full-name">Full Name</label>
              <input
                id="auth-full-name"
                type="text"
                required
                placeholder="e.g. Alex Morgan"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={loading}
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="auth-email">Email Address</label>
            <input
              id="auth-email"
              type="email"
              required
              placeholder="e.g. you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="auth-password">Password</label>
            <input
              id="auth-password"
              type="password"
              required
              minLength={8}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block auth-submit-btn"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="loading-spinner" />
                <span>Authenticating...</span>
              </>
            ) : mode === 'login' ? (
              'Sign In →'
            ) : (
              'Create Account & Continue →'
            )}
          </button>
        </form>

        {/* Quick Demo Credentials Helper */}
        <div className="auth-quick-fill">
          <span className="quick-fill-label">Instant Demo Fill:</span>
          <div className="quick-fill-buttons">
            <button
              type="button"
              className="quick-btn"
              onClick={() => handleFillDemo('sarah')}
            >
              👤 Existing User (Sarah)
            </button>
            <button
              type="button"
              className="quick-btn"
              onClick={() => handleFillDemo('new')}
            >
              ✨ Fresh New User
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
