import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login, guestLogin } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/swipe");
    } catch (err) {
      setError(err.response?.data?.error || "Login failed");
    }
    setLoading(false);
  };

  const handleGuest = async () => {
    setLoading(true);
    try {
      await guestLogin();
      navigate("/swipe");
    } catch (err) {
      setError("Failed to create guest session");
    }
    setLoading(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="logo-icon">✨</div>
          <h1>CultureClick</h1>
          <p>Discover hobbies you'll love</p>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input type="email" className="form-input" placeholder="you@example.com"
              value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" className="form-input" placeholder="••••••••"
              value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="auth-divider">or</div>

        <button className="btn-primary" onClick={handleGuest} disabled={loading}
          style={{ background: "var(--gradient-buddy)" }}>
          ⚡ Try as Guest
        </button>

        <div className="auth-footer">
          Don't have an account? <Link to="/register">Sign up</Link>
        </div>
      </div>
    </div>
  );
}
