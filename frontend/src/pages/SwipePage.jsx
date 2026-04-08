import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { getNextHobby, recordSwipe } from '../api';
import HobbyCard from '../components/HobbyCard';
import './SwipePage.css';

export default function SwipePage() {
  const { user } = useAuth();
  const [cards, setCards] = useState([]);
  const [progress, setProgress] = useState({ discovered: 0, total: 60 });
  const [loading, setLoading] = useState(true);
  const [allDone, setAllDone] = useState(false);
  const [lastAction, setLastAction] = useState(null);

  const fetchCards = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      // Fetch up to 3 cards for the stack
      const fetched = [];
      for (let i = 0; i < 3; i++) {
        const res = await getNextHobby(user.id);
        if (res.data.hobby) {
          // Avoid duplicates
          if (!fetched.find(c => c._id === res.data.hobby._id)) {
            fetched.push(res.data.hobby);
          }
          setProgress(res.data.progress);
        } else {
          setAllDone(true);
          setProgress(res.data.progress);
          break;
        }
      }
      setCards(fetched);
    } catch (err) {
      console.error('Failed to fetch hobbies:', err);
    }
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  const handleSwipe = async (action) => {
    if (!cards.length) return;
    const current = cards[0];
    setLastAction({ action, hobbyName: current.name });

    try {
      await recordSwipe(user.id, current._id, action);
    } catch (err) {
      console.error('Swipe failed:', err);
    }

    // Remove the top card and fetch a replacement
    setCards((prev) => prev.slice(1));

    // Clear action indicator after animation
    setTimeout(() => setLastAction(null), 800);

    // Fetch replacement card
    try {
      const res = await getNextHobby(user.id);
      if (res.data.hobby) {
        setCards((prev) => {
          if (prev.find(c => c._id === res.data.hobby._id)) return prev;
          return [...prev, res.data.hobby];
        });
        setProgress(res.data.progress);
      } else if (cards.length <= 1) {
        setAllDone(true);
        setProgress(res.data.progress);
      }
    } catch {}
  };

  return (
    <div className="swipe-page">
      {/* Progress indicator */}
      <div className="swipe-header">
        <div className="progress-info">
          <span className="progress-emoji">🧭</span>
          <span className="progress-text">
            {progress.discovered} / {progress.total} hobbies discovered
          </span>
        </div>
        <div className="progress-bar">
          <motion.div
            className="progress-fill"
            initial={{ width: 0 }}
            animate={{ width: `${(progress.discovered / Math.max(progress.total, 1)) * 100}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Card stack */}
      <div className="card-stack-area">
        {loading && !cards.length && (
          <div className="swipe-loading">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="loading-spinner"
            >
              🎯
            </motion.div>
            <p>Finding your next hobby...</p>
          </div>
        )}

        {allDone && !cards.length && (
          <motion.div
            className="all-done"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
          >
            <span className="done-emoji">🎉</span>
            <h2>You've explored all hobbies!</h2>
            <p>Check out your Buddy for personalized suggestions, or visit your Board to save memories.</p>
          </motion.div>
        )}

        <div className="card-stack">
          <AnimatePresence>
            {cards.map((hobby, idx) => (
              <HobbyCard
                key={hobby._id}
                hobby={hobby}
                index={idx}
                isTop={idx === 0}
                onSwipe={handleSwipe}
              />
            ))}
          </AnimatePresence>
        </div>

        {/* Action feedback */}
        <AnimatePresence>
          {lastAction && (
            <motion.div
              className={`action-toast ${lastAction.action}`}
              initial={{ opacity: 0, y: 20, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.9 }}
              transition={{ duration: 0.3 }}
            >
              {lastAction.action === 'like' && '💚 Liked'}
              {lastAction.action === 'skip' && '⏭️ Skipped'}
              {lastAction.action === 'superlike' && '⭐ Superliked'}
              <span className="action-hobby-name">{lastAction.hobbyName}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Action hint */}
      {cards.length > 0 && (
        <div className="swipe-hints">
          <span className="hint hint-skip">← Skip</span>
          <span className="hint hint-super">↑ Superlike</span>
          <span className="hint hint-like">Like →</span>
        </div>
      )}
    </div>
  );
}
