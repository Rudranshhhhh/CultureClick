import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Landing from './pages/Landing';
import SwipePage from './pages/SwipePage';
import BuddyChat from './pages/BuddyChat';
import Board from './pages/Board';
import './App.css';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="app-loading">
        <div className="app-loading-spinner">🎯</div>
        <p>Loading CultureClick...</p>
      </div>
    );
  }

  if (!user) return <Navigate to="/" replace />;
  return children;
}

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="app-loading">
        <div className="app-loading-spinner">🎯</div>
        <p>Loading CultureClick...</p>
      </div>
    );
  }

  return (
    <>
      <AnimatePresence mode="wait">
        <Routes>
          <Route path="/" element={user ? <Navigate to="/swipe" replace /> : <Landing />} />
          <Route path="/swipe" element={<ProtectedRoute><SwipePage /></ProtectedRoute>} />
          <Route path="/buddy" element={<ProtectedRoute><BuddyChat /></ProtectedRoute>} />
          <Route path="/board" element={<ProtectedRoute><Board /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AnimatePresence>
      <Navbar />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
