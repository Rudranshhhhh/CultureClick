import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Compass, ChatBot, Catalog } from '@carbon/icons-react';
import './Navbar.css';

const NAV_ITEMS = [
  { to: '/swipe', icon: <Compass size={20} />, label: 'Discover' },
  { to: '/buddy', icon: <ChatBot size={20} />, label: 'Buddy' },
  { to: '/board', icon: <Catalog size={20} />, label: 'Board' },
];

export default function Navbar() {
  const location = useLocation();

  // Hide on landing and auth pages
  if (['/', '/login', '/register', '/onboarding'].includes(location.pathname)) return null;

  return (
    <nav className="navbar" style={{ background: 'var(--bg-secondary)', borderTop: '1px solid var(--border)' }}>
      <div className="nav-inner">
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname === item.to;
          return (
            <NavLink key={item.to} to={item.to} className={`nav-item ${isActive ? 'active' : ''}`}>
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
              {isActive && (
                <motion.div
                  className="nav-indicator"
                  layoutId="nav-indicator"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
