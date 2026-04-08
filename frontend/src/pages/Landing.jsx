import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Play, ArrowRight, UserAvatar, UserProfile, Recommendation, ImageSearch, DataRegular } from '@carbon/icons-react';
import './Landing.css';

const FEATURES = [
  {
    icon: <UserProfile size={32} />,
    title: 'Discover Interests',
    desc: 'Browse activities efficiently. Our algorithm learns your implicit preferences in real time.',
  },
  {
    icon: <Recommendation size={32} />,
    title: 'AI Advisor',
    desc: "Get personalized suggestions based on your historical data and real-time local weather.",
  },
  {
    icon: <ImageSearch size={32} />,
    title: 'Visual Board',
    desc: 'Systematically catalog your completed activities. Build a reliable record of your time.',
  },
  {
    icon: <DataRegular size={32} />,
    title: 'Smart Learning',
    desc: 'Continuous model improvement means recommendations become more accurate with every interaction.',
  },
];

const STEPS = [
  { num: '01', title: 'Authenticate', desc: 'Securely create your profile.' },
  { num: '02', title: 'Evaluate', desc: 'Process 60+ categorized activities.' },
  { num: '03', title: 'Consult AI', desc: 'Retrieve contextual recommendations.' },
  { num: '04', title: 'Catalog', desc: 'Store formatted visual records.' },
];

const STATS = [
  { value: '60+', label: 'Activities' },
  { value: '6', label: 'Categories' },
  { value: '100%', label: 'AI Driven' },
  { value: '24/7', label: 'Weather Context' },
];

export default function Landing() {
  const { guestLogin } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGuest = async () => {
    setLoading(true);
    setError('');
    try {
      await guestLogin('New York');
      navigate('/swipe');
    } catch {
      setError('Connection refused. Ensure backend service is operational.');
    }
    setLoading(false);
  };

  return (
    <div className="landing-page">
      {/* ── Hero Section ─────────────────────────────────── */}
      <section className="hero-section">
        <div className="hero-container">
          <motion.div
            className="hero-content"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          >
            <h1 className="hero-title">
              Optimize Your<br />
              Downtime Data.
            </h1>
            <p className="hero-subtitle">
              Evaluate activities, receive contextual AI recommendations, and catalog your experiences using CultureClick's advanced discovery engine.
            </p>
            
            <div className="hero-actions">
              <Link to="/register" className="btn-primary">
                Create Account <ArrowRight size={16} />
              </Link>
              <button className="btn-secondary" onClick={handleGuest} disabled={loading}>
                {loading ? 'Initializing...' : 'Guest Access'} <UserAvatar size={16} />
              </button>
            </div>
            {error && <p className="hero-error">{error}</p>}
          </motion.div>

          <motion.div
            className="hero-visual"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="hero-dataviz">
              <div className="viz-line" style={{ width: '80%' }}></div>
              <div className="viz-line" style={{ width: '60%' }}></div>
              <div className="viz-line" style={{ width: '90%' }}></div>
              <div className="viz-line" style={{ width: '40%' }}></div>
              <div className="viz-box">
                <Play size={48} className="viz-icon" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Stats bar */}
        <div className="stats-bar">
          <div className="stats-inner">
            {STATS.map((s, i) => (
              <div key={i} className="stat-item">
                <span className="stat-value">{s.value}</span>
                <span className="stat-label">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Capabilities Section ─────────────────────────────── */}
      <section className="features-section" id="features">
        <div className="section-container">
          <div className="section-header">
            <h2>System Capabilities</h2>
            <p>CultureClick provides a structured environment for activity discovery and analysis.</p>
          </div>

          <div className="features-grid">
            {FEATURES.map((f, i) => (
              <div key={i} className="feature-card">
                <div className="feature-icon">
                  {f.icon}
                </div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Process ─────────────────────────────────── */}
      <section className="steps-section" id="how-it-works">
        <div className="section-container">
          <div className="section-header">
            <h2>Operational Process</h2>
          </div>

          <div className="steps-grid">
            {STEPS.map((s, i) => (
              <div key={i} className="step-card">
                <span className="step-num">{s.num}</span>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Section ──────────────────────────────────── */}
      <section className="cta-section">
        <div className="section-container">
          <div className="cta-card">
            <h2>Initialize Your Profile</h2>
            <p>Deploy CultureClick today to optimize your leisure parameters.</p>
            <div className="cta-actions">
              <Link to="/register" className="btn-primary">Commence Setup <ArrowRight size={16} /></Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
