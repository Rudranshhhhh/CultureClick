import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import './Navbar.css';

const NAV_ITEMS = [
  { to: '/swipe', icon: '🃏', label: 'Discover' },
  { to: '/buddy', icon: '🤖', label: 'Buddy' },
  { to: '/board', icon: '📸', label: 'Board' },
];

export default function Navbar() {
  const location = useLocation();

  // Hide on landing page
  if (location.pathname === '/') return null;

  return (
    <nav className="navbar glass-heavy">
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
