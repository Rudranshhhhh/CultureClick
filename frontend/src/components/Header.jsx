import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Activity, Compass, Chat, Catalog, Menu, Close, UserAvatar } from '@carbon/icons-react';
import './Header.css';

export default function Header() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMenuOpen(false);
    setAccountOpen(false);
  };

  useEffect(() => {
    if (!accountOpen) return;
    const onKey = (e) => {
      if (e.key === 'Escape') setAccountOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [accountOpen]);

  useEffect(() => {
    setAccountOpen(false);
  }, [location.pathname]);

  const isActive = (path) => location.pathname === path;

  return (
    <header className="site-header">
      <div className="header-inner">
        {/* Logo */}
        <Link to="/" className="header-logo" onClick={() => setMenuOpen(false)}>
          <Activity size={24} className="logo-icon" />
          <span className="logo-text">
            CultureClick
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="header-nav-desktop">
          {user ? (
            <>
              <Link to="/swipe" className={`header-link ${isActive('/swipe') ? 'active' : ''}`}>
                <Compass size={16} /> Discover
              </Link>
              <Link to="/buddy" className={`header-link ${isActive('/buddy') ? 'active' : ''}`}>
                <Chat size={16} /> Buddy
              </Link>
              <Link to="/board" className={`header-link ${isActive('/board') ? 'active' : ''}`}>
                <Catalog size={16} /> Board
              </Link>
            </>
          ) : (
            <>
              <a href="/#features" className="header-link">Features</a>
              <a href="/#how-it-works" className="header-link">How It Works</a>
            </>
          )}
        </nav>

        {/* Auth Buttons */}
        <div className={`header-actions ${user ? 'header-actions--user' : ''}`}>
          {user ? (
            <button
              type="button"
              className="header-account-trigger"
              onClick={() => setAccountOpen(true)}
              aria-expanded={accountOpen}
              aria-haspopup="dialog"
            >
              <span className="header-user-avatar" aria-hidden>
                {user.email?.charAt(0).toUpperCase()}
              </span>
              <span className="header-account-label">Account</span>
            </button>
          ) : (
            <>
              <Link to="/login" className="btn-secondary" style={{ padding: '8px 16px', fontSize: '14px' }}>Log In</Link>
              <Link to="/register" className="btn-primary" style={{ padding: '8px 16px', fontSize: '14px' }}>Sign Up</Link>
            </>
          )}
        </div>

        {/* Mobile menu toggle */}
        <button className="header-hamburger" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <Close size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="mobile-menu">
          {user ? (
            <>
              <Link to="/swipe" className="mobile-link" onClick={() => setMenuOpen(false)}>Discover</Link>
              <Link to="/buddy" className="mobile-link" onClick={() => setMenuOpen(false)}>Buddy</Link>
              <Link to="/board" className="mobile-link" onClick={() => setMenuOpen(false)}>Board</Link>
              <div className="mobile-divider" />
              <button
                type="button"
                className="mobile-link"
                onClick={() => {
                  setMenuOpen(false);
                  setAccountOpen(true);
                }}
              >
                Account
              </button>
            </>
          ) : (
            <>
              <a href="/#features" className="mobile-link" onClick={() => setMenuOpen(false)}>Features</a>
              <a href="/#how-it-works" className="mobile-link" onClick={() => setMenuOpen(false)}>How It Works</a>
              <div className="mobile-divider" />
              <Link to="/login" className="mobile-link" onClick={() => setMenuOpen(false)}>Log In</Link>
              <Link to="/register" className="mobile-link highlight" onClick={() => setMenuOpen(false)}>Sign Up Free</Link>
            </>
          )}
        </div>
      )}

      {user && accountOpen && (
        <>
          <button
            type="button"
            className="account-sidebar-backdrop"
            aria-label="Close account menu"
            onClick={() => setAccountOpen(false)}
          />
          <aside className="account-sidebar" role="dialog" aria-modal="true" aria-labelledby="account-sidebar-title">
            <div className="account-sidebar-header">
              <h2 id="account-sidebar-title" className="account-sidebar-title">
                Account
              </h2>
              <button
                type="button"
                className="account-sidebar-close"
                onClick={() => setAccountOpen(false)}
                aria-label="Close"
              >
                <Close size={20} />
              </button>
            </div>
            <p className="account-sidebar-email">
              {user.is_guest ? 'Guest' : user.email}
            </p>
            <nav className="account-sidebar-nav">
              <Link
                to="/my-hobbies"
                className="account-sidebar-link"
                onClick={() => setAccountOpen(false)}
              >
                <UserAvatar size={18} />
                Profile
              </Link>
              <button type="button" className="account-sidebar-link account-sidebar-link--danger" onClick={handleLogout}>
                Log out
              </button>
            </nav>
          </aside>
        </>
      )}
    </header>
  );
}
