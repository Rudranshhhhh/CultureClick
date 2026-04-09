import { useEffect, useState } from 'react';
import './StreakCongratsModal.css';

const CONFETTI_COLORS = ['#ff6b35', '#ffa726', '#ffcc80', '#ff4500', '#ffd54f', '#ff8c42', '#0f62fe', '#78a9ff'];

function Confetti() {
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    const items = Array.from({ length: 40 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 0.6,
      duration: 1.2 + Math.random() * 1.5,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      size: 6 + Math.random() * 6,
      rotation: Math.random() * 360,
    }));
    setParticles(items);
  }, []);

  return (
    <div className="confetti-container" aria-hidden>
      {particles.map((p) => (
        <div
          key={p.id}
          className="confetti-piece"
          style={{
            left: `${p.left}%`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            backgroundColor: p.color,
            width: `${p.size}px`,
            height: `${p.size * 0.6}px`,
            transform: `rotate(${p.rotation}deg)`,
          }}
        />
      ))}
    </div>
  );
}

export default function StreakCongratsModal({ congrats, onClose }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Delay mount animation
    const t = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(t);
  }, []);

  if (!congrats) return null;

  const { title, body, hobby_name, streak } = congrats;

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 300);
  };

  return (
    <div className={`streak-congrats-overlay ${visible ? 'visible' : ''}`} onClick={handleClose}>
      <Confetti />
      <div className={`streak-congrats-card ${visible ? 'visible' : ''}`} onClick={(e) => e.stopPropagation()}>
        <div className="streak-congrats-flame-wrap">
          <svg viewBox="0 0 64 64" width="64" height="64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M32 4C32 4 16 22 16 36C16 45.94 24.06 54 34 54C34 54 28 46 29.5 38C31 30 39 24 39 24C39 24 40.5 32 38 38C35.5 44 39 54 39 54C44.52 54 50 47 50 40C50 26 32 4 32 4Z"
              fill="url(#flame-grad)"
            />
            <defs>
              <linearGradient id="flame-grad" x1="32" y1="4" x2="32" y2="54" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#ffd54f" />
                <stop offset="40%" stopColor="#ff8c42" />
                <stop offset="100%" stopColor="#ff4500" />
              </linearGradient>
            </defs>
          </svg>
          <div className="streak-congrats-streak-num">{streak}</div>
        </div>

        <h2 className="streak-congrats-title">{title}</h2>
        <p className="streak-congrats-body">{body}</p>
        {hobby_name && (
          <p className="streak-congrats-hobby">
            Completed: <strong>{hobby_name}</strong>
          </p>
        )}
        <div className="streak-congrats-streak-label">
          {streak === 1
            ? "You've started your streak!"
            : `${streak}-day streak — keep the fire alive!`}
        </div>

        <button className="btn-primary streak-congrats-cta" onClick={handleClose}>
          Keep Going
        </button>
      </div>
    </div>
  );
}
