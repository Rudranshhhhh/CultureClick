import { useEffect, useState } from 'react';
import { getStreakStatus } from '../api';
import './StreakBadge.css';

export default function StreakBadge() {
  const [streak, setStreak] = useState(null);
  const [animate, setAnimate] = useState(false);

  const fetchStreak = async () => {
    try {
      const res = await getStreakStatus();
      const newStreak = res.data?.streak ?? 0;
      setStreak((prev) => {
        if (prev !== null && newStreak > prev) {
          setAnimate(true);
          setTimeout(() => setAnimate(false), 800);
        }
        return newStreak;
      });
    } catch {
      // fail silently
    }
  };

  useEffect(() => {
    fetchStreak();
    // Poll every 60s so the badge stays fresh after navigation
    const interval = setInterval(fetchStreak, 60000);

    // Also listen to custom event triggered after a successful checkin
    const handler = () => fetchStreak();
    window.addEventListener('streak-updated', handler);

    return () => {
      clearInterval(interval);
      window.removeEventListener('streak-updated', handler);
    };
  }, []);

  if (streak === null) return null;

  const flameColor =
    streak >= 30 ? '#ff4500' :
    streak >= 14 ? '#ff6b35' :
    streak >= 7  ? '#ff8c42' :
    streak >= 3  ? '#ffa726' :
                   '#ffcc80';

  return (
    <div
      className={`streak-badge ${streak > 0 ? 'streak-active' : ''} ${animate ? 'streak-pop' : ''}`}
      title={`${streak} day streak`}
    >
      <svg
        className="streak-flame-icon"
        viewBox="0 0 24 24"
        width="20"
        height="20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M12 2C12 2 6.5 8.5 6.5 13.5C6.5 17.09 9.41 20 13 20C13 20 11 17 11.5 14C12 11 15 9 15 9C15 9 15.5 12 14.5 14.5C13.5 17 15 20 15 20C17.21 20 19 17.5 19 15C19 10 12 2 12 2Z"
          fill={streak > 0 ? flameColor : 'var(--text-muted)'}
        />
        {streak >= 7 && (
          <path
            d="M12 22C9.5 22 7.5 20 7.5 17.5C7.5 15 10 12 10 12C10 12 11 14 11 15.5C11 17 12 18 12 18C12 18 13 17 13 15.5C13 14 14 12 14 12C14 12 16.5 15 16.5 17.5C16.5 20 14.5 22 12 22Z"
            fill={flameColor}
            opacity="0.6"
          />
        )}
      </svg>
      <span className="streak-count">{streak}</span>
    </div>
  );
}
