import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { getMemories, deleteMemory } from '../api';
import PolaroidCard from '../components/PolaroidCard';
import AddMemoryModal from '../components/AddMemoryModal';
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

  return (
    <div className="board-page">
      <div className="board-header">
        <div>
          <h1 className="board-title">📸 Memory Board</h1>
          <p className="board-subtitle">
            {memories.length > 0
              ? `${memories.length} memor${memories.length === 1 ? 'y' : 'ies'} saved`
              : 'Pin your favorite hobby experiences'}
          </p>
        </div>
        <button className="btn-primary btn-add-memory" onClick={() => setShowModal(true)}>
          + Add Memory
        </button>
      </div>

      {loading ? (
        <div className="board-loading">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            style={{ fontSize: 40, display: 'inline-block' }}
          >
            📸
          </motion.div>
          <p>Loading memories...</p>
        </div>
      ) : memories.length === 0 ? (
        <motion.div
          className="board-empty"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="empty-illustration">
            <span className="empty-icon">📷</span>
            <div className="empty-polaroids">
              <div className="mini-polaroid p1" />
              <div className="mini-polaroid p2" />
              <div className="mini-polaroid p3" />
            </div>
          </div>
          <h2>No memories yet</h2>
          <p>Try a hobby from your liked list and pin it here as a memory!</p>
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            📌 Pin Your First Memory
          </button>
        </motion.div>
      ) : (
        <div className="polaroid-grid">
          {memories.map((memory, idx) => (
            <PolaroidCard
              key={memory._id}
              memory={memory}
              index={idx}
              onClick={() => setExpanded(memory)}
            />
          ))}
        </div>
      )}

      {/* Expanded Polaroid Modal */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            className="polaroid-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setExpanded(null)}
          >
            <motion.div
              className="polaroid-expanded"
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.7, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="expanded-photo">
                <span className="expanded-emoji">{expanded.hobby_emoji || '🎯'}</span>
              </div>
              <div className="expanded-body">
                <h3>{expanded.hobby_name}</h3>
                <span className={`category-badge cat-${expanded.hobby_category}`}>
                  {expanded.hobby_category}
                </span>
                <div className="expanded-stars">
                  {'★'.repeat(expanded.rating)}{'☆'.repeat(5 - expanded.rating)}
                </div>
                {expanded.note && (
                  <p className="expanded-note">{expanded.note}</p>
                )}
                <p className="expanded-date">
                  {new Date(expanded.created_at).toLocaleDateString('en-US', {
                    month: 'long', day: 'numeric', year: 'numeric'
                  })}
                </p>
                <button
                  className="btn-delete"
                  onClick={() => handleDelete(expanded._id)}
                >
                  🗑️ Delete Memory
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Memory Modal */}
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
