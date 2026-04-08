<<<<<<< HEAD
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
=======
import { NavLink } from "react-router-dom";

export default function Navbar() {
  return (
    <nav className="bottom-nav">
      <NavLink to="/swipe" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
        <span className="nav-icon">🧭</span>
        <span className="nav-label">Explore</span>
      </NavLink>
      <NavLink to="/buddy" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
        <span className="nav-icon">🤖</span>
        <span className="nav-label">Buddy</span>
      </NavLink>
      <NavLink to="/board" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
        <span className="nav-icon">📸</span>
        <span className="nav-label">Board</span>
      </NavLink>
>>>>>>> 1a62fd007f6a46adb16d418a975995921939f395
    </nav>
  );
}
