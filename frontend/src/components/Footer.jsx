import { Link } from 'react-router-dom';
import { Activity, LogoGithub, LogoTwitter, LogoDiscord, ArrowRight } from '@carbon/icons-react';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-grid">
          {/* Brand */}
          <div className="footer-brand">
            <div className="footer-logo">
              <Activity size={24} className="footer-logo-icon" />
              <span className="footer-logo-text">
                CultureClick
              </span>
            </div>
            <p className="footer-desc">
              Discover hobbies that feel like you. Swipe through activities, get AI-powered
              suggestions, and build your visual memory board.
            </p>
            <div className="footer-socials">
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="social-link" title="GitHub">
                <LogoGithub size={20} />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="social-link" title="Twitter">
                <LogoTwitter size={20} />
              </a>
              <a href="https://discord.com" target="_blank" rel="noopener noreferrer" className="social-link" title="Discord">
                <LogoDiscord size={20} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="footer-col">
            <h4 className="footer-col-title">Product</h4>
            <Link to="/" className="footer-link">Home</Link>
            <a href="/#features" className="footer-link">Features</a>
            <a href="/#how-it-works" className="footer-link">How It Works</a>
          </div>

          {/* Features */}
          <div className="footer-col">
            <h4 className="footer-col-title">Capabilities</h4>
            <span className="footer-link">Hobby Swipe</span>
            <span className="footer-link">AI Buddy</span>
            <span className="footer-link">Memory Board</span>
            <span className="footer-link">Smart Learning</span>
          </div>

          {/* Account */}
          <div className="footer-col">
            <h4 className="footer-col-title">Account</h4>
            <Link to="/login" className="footer-link" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>Log In <ArrowRight size={16} /></Link>
            <Link to="/register" className="footer-link">Sign Up</Link>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} CultureClick. Powered by AI, designed with precision.</p>
        </div>
      </div>
    </footer>
  );
}
