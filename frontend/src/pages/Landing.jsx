import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import './Landing.css';

const FLOATING_EMOJIS = ['🎨', '🏄', '🧘', '🎮', '📸', '🎵', '🧗', '🍞', '📚', '🎭', '🛹', '🎸', '🌱', '🔭', '🥊'];

export default function Landing() {
  const { guestLogin, login, register } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState('landing'); // 'landing' | 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [city, setCity] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleGuest = async () => {
    setIsLoading(true);
    try {
      await guestLogin(city || 'New York');
      navigate('/swipe');
    } catch {
      setError('Could not connect. Is the backend running?');
    }
    setIsLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register(email, password, city || 'New York');
      }
      navigate('/swipe');
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
    }
    setIsLoading(false);
  };

  return (
    <div className="landing-page">
      {/* Floating emoji background */}
      <div className="emoji-field">
        {FLOATING_EMOJIS.map((emoji, i) => (
          <span
            key={i}
            className="floating-emoji"
            style={{
              left: `${(i * 17 + 5) % 90}%`,
              top: `${(i * 13 + 10) % 80}%`,
              animationDelay: `${i * 0.4}s`,
              animationDuration: `${3 + (i % 4)}s`,
              fontSize: `${24 + (i % 3) * 8}px`,
            }}
          >
            {emoji}
          </span>
        ))}
      </div>

      {/* Gradient orbs */}
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />

      <motion.div
        className="landing-content"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      >
        {/* Logo & tagline */}
        <div className="landing-hero">
          <motion.div
            className="logo-icon"
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          >
            🎯
          </motion.div>
          <h1 className="landing-title">
            Culture<span className="gradient-text">Click</span>
          </h1>
          <p className="landing-subtitle">
            Discover hobbies that feel like <em>you</em>
          </p>
          <p className="landing-desc">
            Swipe through activities, get AI-powered suggestions, and build your visual memory board.
          </p>
        </div>

        <AnimatePresence mode="wait">
          {mode === 'landing' && (
            <motion.div
              key="landing-buttons"
              className="landing-actions"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <button className="btn-primary btn-lg" onClick={handleGuest} disabled={isLoading}>
                {isLoading ? '⏳ Starting...' : '🚀 Start Exploring'}
              </button>
              <div className="landing-divider">
                <span>or</span>
              </div>
              <div className="auth-links">
                <button className="btn-secondary" onClick={() => setMode('login')}>
                  Sign In
                </button>
                <button className="btn-secondary" onClick={() => setMode('register')}>
                  Create Account
                </button>
              </div>
            </motion.div>
          )}

          {(mode === 'login' || mode === 'register') && (
            <motion.form
              key="auth-form"
              className="auth-form"
              onSubmit={handleSubmit}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <h2>{mode === 'login' ? 'Welcome back' : 'Join CultureClick'}</h2>

              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={4}
              />
              {mode === 'register' && (
                <input
                  type="text"
                  placeholder="Your city (for weather-based suggestions)"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
              )}

              {error && <p className="auth-error">{error}</p>}

              <button className="btn-primary btn-lg" type="submit" disabled={isLoading}>
                {isLoading ? '⏳' : mode === 'login' ? 'Sign In' : 'Create Account'}
              </button>

              <button type="button" className="btn-back" onClick={() => { setMode('landing'); setError(''); }}>
                ← Back
              </button>
            </motion.form>
          )}
        </AnimatePresence>

        {error && mode === 'landing' && <p className="auth-error">{error}</p>}
      </motion.div>
    </div>
  );
}
