import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Activity } from "@carbon/icons-react";
import { signInWithPopup, signInWithRedirect, getRedirectResult } from "firebase/auth";
import { firebaseAuth, googleProvider } from "../firebase";

export default function Login() {
  const { login, firebaseLogin } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // If user completed Google sign-in via redirect, finalize session here.
  // (Mobile browsers often block popups; redirect is the reliable fallback.)
  useEffect(() => {
    getRedirectResult(firebaseAuth)
      .then(async (result) => {
        if (!result?.user) return;
        const idToken = await result.user.getIdToken();
        const res = await firebaseLogin(idToken);
        const onboarded = Boolean(res?.user?.onboarding_complete);
        navigate(onboarded ? "/swipe" : "/onboarding");
      })
      .catch(() => {
        // ignore; user likely didn't come from redirect
      });
  }, [firebaseLogin, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await login(email, password);
      const onboarded = Boolean(res?.user?.onboarding_complete);
      navigate(onboarded ? "/swipe" : "/onboarding");
    } catch (err) {
      setError(err.response?.data?.error || "Login failed");
    }
    setLoading(false);
  };



  const handleGoogleLogin = async () => {
    setLoading(true);
    setError("");
    try {
      // Prefer popup on desktop, but fall back to redirect (esp. mobile / popup-blocked).
      const cred = await signInWithPopup(firebaseAuth, googleProvider);
      const idToken = await cred.user.getIdToken();
      const res = await firebaseLogin(idToken);
      const onboarded = Boolean(res?.user?.onboarding_complete);
      navigate(onboarded ? "/swipe" : "/onboarding");
    } catch (err) {
      const code = err?.code || "";
      // Popup not supported/blocked → use redirect
      if (code === "auth/popup-blocked" || code === "auth/popup-closed-by-user" || code === "auth/operation-not-supported-in-this-environment") {
        try {
          await signInWithRedirect(firebaseAuth, googleProvider);
          return; // redirect will navigate away
        } catch (e) {
          setError("Google sign-in failed (redirect).");
          setLoading(false);
          return;
        }
      }
      setError(err?.message || "Google sign-in failed");
    }
    setLoading(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <Activity size={32} className="logo-icon" style={{ fill: 'var(--accent-primary)', marginBottom: '16px' }} />
          <h1>CultureClick</h1>
          <p>System Authentication</p>
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

        <button className="btn-secondary" onClick={handleGoogleLogin} disabled={loading} style={{ justifyContent: 'center' }}>
          Login with Google
        </button>


        <div className="auth-footer">
          Don't have an account? <Link to="/register">Sign up</Link>
        </div>
      </div>
    </div>
  );
}
