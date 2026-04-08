import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import Swipe from "./pages/Swipe";
import Buddy from "./pages/Buddy";
import Board from "./pages/Board";

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="app-shell">
        <div className="page">
          <div className="empty-state">
            <div className="spinner" />
          </div>
        </div>
      </div>
    );
  }

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
