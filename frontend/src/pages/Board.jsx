import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { getMemories, deleteMemory } from '../api';
import AchievementCard from '../components/AchievementCard';
import AddMemoryModal from '../components/AddMemoryModal';
import { TrophyFilled, Add, TrashCan, Activity, StarFilled, Star, ChartLine } from '@carbon/icons-react';
import './Board.css';

export default function Board() {
  const { user } = useAuth();
  const [memories, setMemories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [expanded, setExpanded] = useState(null);

  const fetchMemories = async () => {
    if (!user?.id) return;
    try {
      const res = await getMemories(user.id);
      setMemories(res.data.memories || []);
    } catch (err) {
      console.error('Failed to load memories:', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMemories();
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDelete = async (memoryId) => {
    try {
      await deleteMemory(memoryId);
      setMemories((prev) => prev.filter((m) => m._id !== memoryId));
      setExpanded(null);
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const handleCreated = (newMemory) => {
    setMemories((prev) => [newMemory, ...prev]);
    setShowModal(false);
  };

  // Compute metrics
  const totalHours = Math.round(memories.length * 0.5); // Estimate 30 min per session
  const totalScore = memories.reduce((acc, m) => acc + (m.rating || 0), 0);

  return (
    <div className="board-page">
      <div className="board-header">
        <div>
          <h1 className="board-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrophyFilled size={32} style={{ fill: 'var(--gold)' }} /> My Achievements
          </h1>
          <p className="board-subtitle">
            A showcase of your learning milestones and completed focus sessions.
          </p>
        </div>
        <button className="btn-primary btn-add-memory" onClick={() => setShowModal(true)}>
          <Add size={16} /> Log Milestone
        </button>
      </div>

      {memories.length > 0 && (
        <div className="achievements-metrics">
          <div className="metric-box">
            <span className="metric-val">{memories.length}</span>
            <span className="metric-lbl">Milestones Unlocked</span>
          </div>
          <div className="metric-box">
            <span className="metric-val">{totalHours}h</span>
            <span className="metric-lbl">Time Invested (Est.)</span>
          </div>
          <div className="metric-box">
            <span className="metric-val">{totalScore}</span>
            <span className="metric-lbl">Experience Points</span>
          </div>
        </div>
      )}

      {loading ? (
        <div className="board-loading">
          <div className="spinner"></div>
          <p>Loading achievements...</p>
        </div>
      ) : memories.length === 0 ? (
        <motion.div
          className="board-empty"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="empty-illustration">
            <ChartLine size={64} className="empty-icon" style={{ fill: 'var(--text-muted)' }} />
          </div>
          <h2>No Achievements Yet</h2>
          <p>Complete a Focus Session or Do It Now track and it will appear here as a milestone on your journey.</p>
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            <Add size={16} /> Manual Log
          </button>
        </motion.div>
      ) : (
        <div className="achievement-grid">
          {memories.map((memory, idx) => (
            <AchievementCard
              key={memory._id}
              memory={memory}
              index={idx}
              onClick={() => setExpanded(memory)}
            />
          ))}
        </div>
      )}

      {/* Expanded Modal */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            className="achievement-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setExpanded(null)}
          >
            <motion.div
              className="achievement-expanded"
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="expanded-photo">
                <Activity size={84} style={{ fill: 'var(--text-secondary)', margin: 'auto' }} />
              </div>
              <div className="expanded-body">
                <h3>{expanded.hobby_name}</h3>
                {expanded.hobby_category && (
                  <span className={`category-badge cat-${expanded.hobby_category}`}>
                    {expanded.hobby_category.replace(/_/g, ' ')}
                  </span>
                )}
                <div className="expanded-stars" style={{ display: 'flex', gap: '4px', fill: 'var(--warning)', marginTop: '12px', marginBottom: '12px' }}>
                  {[...Array(5)].map((_, i) => i < expanded.rating ? <StarFilled size={24} key={i} /> : <Star size={24} key={i} />)}
                </div>
                {expanded.note && (
                  <p className="expanded-note">{expanded.note}</p>
                )}
                <p className="expanded-date">
                  Achieved: {new Date(expanded.created_at).toLocaleDateString('en-US', {
                    month: 'long', day: 'numeric', year: 'numeric'
                  })}
                </p>
                <button
                  className="btn-delete"
                  onClick={() => handleDelete(expanded._id)}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '24px' }}
                >
                  <TrashCan size={16} /> Remove Record
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showModal && (
          <AddMemoryModal
            onClose={() => setShowModal(false)}
            onCreated={handleCreated}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
