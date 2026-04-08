import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useAuth } from './context/AuthContext';
import Header from './components/Header';
import Footer from './components/Footer';
import Navbar from './components/Navbar';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import SwipePage from './pages/SwipePage';
import BuddyChat from './pages/BuddyChat';
import Board from './pages/Board';
import './App.css';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="app-loading">
        <div className="spinner"></div>
        <p>Loading CultureClick...</p>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="app-loading">
        <div className="spinner"></div>
        <p>Loading CultureClick...</p>
      </div>
    );
  }

  const isPublicRoute = ['/', '/login', '/register'].includes(location.pathname);

  // For protected routes, constrain to a mobile-like shell width so the swiping feels native
  const contentWrapperClass = isPublicRoute ? 'public-content' : 'app-shell';

  return (
    <div className={`app-wrapper ${isPublicRoute ? 'public-layout' : 'app-layout'}`} style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header />
      
      <main className="main-content" style={{ display: 'flex', flexDirection: 'column', flex: 1, paddingTop: '64px' }}>
        <div className={contentWrapperClass} style={isPublicRoute ? { flex: 1, display: 'flex', flexDirection: 'column' } : {}}>
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              {/* Public routes */}
              <Route path="/" element={user ? <Navigate to="/swipe" replace /> : <Landing />} />
              <Route path="/login" element={user ? <Navigate to="/swipe" replace /> : <Login />} />
              <Route path="/register" element={user ? <Navigate to="/swipe" replace /> : <Register />} />

              {/* Protected routes */}
              <Route path="/swipe" element={<ProtectedRoute><SwipePage /></ProtectedRoute>} />
              <Route path="/buddy" element={<ProtectedRoute><BuddyChat /></ProtectedRoute>} />
              <Route path="/board" element={<ProtectedRoute><Board /></ProtectedRoute>} />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AnimatePresence>

          {!isPublicRoute && <Navbar />}
        </div>
      </main>

      {/* Show Footer only on public pages */}
      {isPublicRoute && <Footer />}
    </div>
  );
}
