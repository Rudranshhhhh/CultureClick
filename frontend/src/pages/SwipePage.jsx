import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { getNextHobby, recordSwipe, getDoNowTracks, startDoNowTrack, checkinDoNowTrack, extendDoNowTrack, completeDoNowTrack } from '../api';
import HobbyCard from '../components/HobbyCard';
import { Compass, CheckmarkOutline, FavoriteFilled, SkipForwardFilled, StarFilled } from '@carbon/icons-react';
import './SwipePage.css';

export default function SwipePage() {
  const { user } = useAuth();
  const [cards, setCards] = useState([]);
  const [progress, setProgress] = useState({ discovered: 0, total: 60 });
  const [loading, setLoading] = useState(true);
  const [allDone, setAllDone] = useState(false);
  const [lastAction, setLastAction] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [activeCount, setActiveCount] = useState(0);
  const [showDoNowModal, setShowDoNowModal] = useState(false);
  const [selectedHobby, setSelectedHobby] = useState(null);
  const [targetDays, setTargetDays] = useState(7);
  const [doNowError, setDoNowError] = useState('');

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

  const refreshTracks = useCallback(async () => {
    if (!user?.id) return;
    try {
      const res = await getDoNowTracks();
      setTracks(res.data?.tracks || []);
      setActiveCount(res.data?.active_count || 0);
    } catch {
      setTracks([]);
      setActiveCount(0);
    }
  }, [user?.id]);

  useEffect(() => {
    refreshTracks();
  }, [refreshTracks]);

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
    } catch { }
  };

  const handleOpenDoNow = (hobby) => {
    setSelectedHobby(hobby);
    setTargetDays(hobby?.do_it_now?.default_streak_days || 7);
    setDoNowError('');
    setShowDoNowModal(true);
  };

  const handleStartDoNow = async () => {
    if (!selectedHobby?._id) return;
    setDoNowError('');
    try {
      await startDoNowTrack(selectedHobby._id, targetDays);
      setLastAction({ action: 'superlike', hobbyName: `${selectedHobby.name} started` });
      setShowDoNowModal(false);
      setSelectedHobby(null);
      await refreshTracks();
      setTimeout(() => setLastAction(null), 1200);
    } catch (err) {
      setDoNowError(err?.response?.data?.error || 'Unable to start this plan.');
    }
  };

  const handleCheckin = async (trackId) => {
    try {
      await checkinDoNowTrack(trackId);
      await refreshTracks();
    } catch { }
  };

  const handleExtend = async (trackId, extraDays = 7) => {
    try {
      await extendDoNowTrack(trackId, extraDays);
      await refreshTracks();
    } catch { }
  };

  const handleComplete = async (trackId) => {
    try {
      await completeDoNowTrack(trackId);
      await refreshTracks();
    } catch { }
  };

  return (
    <div className="swipe-page">
      {/* Progress indicator */}
      <div className="swipe-header">
        <div className="progress-info">
          <Compass size={20} className="progress-emoji" style={{ fill: 'var(--accent-primary)' }} />
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
        <div className="do-now-strip">
          <span className="do-now-title">Do It Now tracks</span>
          <span className="do-now-count">{activeCount} / 4 active</span>
        </div>
      </div>

      {tracks.length > 0 && (
        <div className="do-now-list">
          {tracks.slice(0, 4).map((t) => (
            <div key={t._id} className="do-now-item">
              <div>
                <strong>{t.hobby_name || 'Hobby'}</strong>
                <div className="do-now-meta">
                  {t.completed_days}/{t.target_days} days • {t.status}
                </div>
                {t.plan?.session_minutes ? (
                  <div className="do-now-plan">
                    {t.plan.session_minutes} min/day
                    {Array.isArray(t.plan.quick_start_steps) && t.plan.quick_start_steps[0] ? ` • ${t.plan.quick_start_steps[0]}` : ''}
                  </div>
                ) : null}
              </div>
              <div className="do-now-actions">
                {t.status === 'active' && (
                  <>
                    <button className="mini-btn" onClick={() => handleCheckin(t._id)}>Check in</button>
                    <button className="mini-btn ghost" onClick={() => handleComplete(t._id)}>Complete</button>
                  </>
                )}
                {t.status === 'completed' && (
                  <button className="mini-btn" onClick={() => handleExtend(t._id, 7)}>+7 days</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Card stack */}
      <div className="card-stack-area">
        {loading && !cards.length && (
          <div className="swipe-loading">
            <div className="spinner"></div>
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
            <CheckmarkOutline size={48} className="done-emoji" style={{ fill: 'var(--success)', marginBottom: '16px' }} />
            <h2>Catalog exhausted.</h2>
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
                onDoNow={handleOpenDoNow}
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
              {lastAction.action === 'like' && <><FavoriteFilled size={20} style={{ fill: 'var(--success)' }} /> Liked</>}
              {lastAction.action === 'skip' && <><SkipForwardFilled size={20} style={{ fill: 'var(--danger)' }} /> Skipped</>}
              {lastAction.action === 'superlike' && <><StarFilled size={20} style={{ fill: 'var(--warning)' }} /> Superliked</>}
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

      {showDoNowModal && selectedHobby && (
        <div className="do-now-modal-backdrop" onClick={() => setShowDoNowModal(false)}>
          <div className="do-now-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Start "{selectedHobby.name}"</h3>
            <p>Pick your target streak length before you begin.</p>
            {selectedHobby.do_it_now && (
              <div className="do-now-content">
                <div className="do-now-session">
                  Suggested session: {selectedHobby.do_it_now.session_minutes || 25} min/day
                </div>
                <ul>
                  {(selectedHobby.do_it_now.quick_start_steps || []).map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ul>
              </div>
            )}
            <div className="day-options">
              {(selectedHobby.do_it_now?.streak_options_days || [3, 7, 14, 21, 30]).map((d) => (
                <button
                  key={d}
                  className={`day-btn ${targetDays === d ? 'active' : ''}`}
                  onClick={() => setTargetDays(d)}
                >
                  {d} days
                </button>
              ))}
            </div>
            {doNowError && <div className="do-now-error">{doNowError}</div>}
            <div className="do-now-modal-actions">
              <button className="mini-btn ghost" onClick={() => setShowDoNowModal(false)}>Cancel</button>
              <button className="mini-btn" onClick={handleStartDoNow}>Start learning</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
