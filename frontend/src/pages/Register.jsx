import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Activity } from "@carbon/icons-react";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [city, setCity] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(email, password, city || "New York");
      navigate("/swipe");
    } catch (err) {
      setError(err.response?.data?.error || "Registration failed");
    }
    setLoading(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <Activity size={32} className="logo-icon" style={{ fill: 'var(--accent-primary)', marginBottom: '16px' }} />
          <h1>CultureClick</h1>
          <p>Create Profile</p>
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
            <input type="password" className="form-input" placeholder="At least 6 characters"
              value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
          </div>
          <div className="form-group">
            <label>City (for weather-based suggestions)</label>
            <input type="text" className="form-input" placeholder="e.g. Mumbai, New York"
              value={city} onChange={(e) => setCity(e.target.value)} />
          </div>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
