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
    </nav>
  );
}
