<<<<<<< HEAD
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
=======
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import Swipe from "./pages/Swipe";
import Buddy from "./pages/Buddy";
import Board from "./pages/Board";

export default function App() {
>>>>>>> 1a62fd007f6a46adb16d418a975995921939f395
  const { user, loading } = useAuth();

  if (loading) {
    return (
<<<<<<< HEAD
      <div className="app-loading">
        <div className="app-loading-spinner">🎯</div>
        <p>Loading CultureClick...</p>
=======
      <div className="app-shell">
        <div className="page">
          <div className="empty-state">
            <div className="spinner" />
          </div>
        </div>
>>>>>>> 1a62fd007f6a46adb16d418a975995921939f395
      </div>
    );
  }

<<<<<<< HEAD
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
=======
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="app-shell">
      <Routes>
        <Route path="/swipe" element={<Swipe />} />
        <Route path="/buddy" element={<Buddy />} />
        <Route path="/board" element={<Board />} />
        <Route path="*" element={<Navigate to="/swipe" replace />} />
      </Routes>
      <Navbar />
    </div>
  );
}
>>>>>>> 1a62fd007f6a46adb16d418a975995921939f395
