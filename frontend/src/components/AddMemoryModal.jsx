import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { getLikedHobbies, createMemory } from '../api';
import './AddMemoryModal.css';

export default function AddMemoryModal({
  onClose,
  onCreated,
  initialHobby = null,
  initialNote = '',
  initialRating = 5,
}) {
  const { user } = useAuth();
  const [likedHobbies, setLikedHobbies] = useState([]);
  const [selectedHobby, setSelectedHobby] = useState(initialHobby?._id || '');
  const [note, setNote] = useState(initialNote);
  const [rating, setRating] = useState(initialRating);
  const [loading, setLoading] = useState(false);
  const [fetchingHobbies, setFetchingHobbies] = useState(true);

  useEffect(() => {
    const fetchLiked = async () => {
      try {
        const res = await getLikedHobbies(user.id);
        const liked = res.data.hobbies || [];
        if (initialHobby && !liked.some((h) => h._id === initialHobby._id)) {
          setLikedHobbies([initialHobby, ...liked]);
        } else {
          setLikedHobbies(liked);
        }
      } catch (err) {
        console.error('Failed to fetch liked hobbies:', err);
        // If this is opened from "Do this now", we still want it usable.
        if (initialHobby) setLikedHobbies([initialHobby]);
      }
      setFetchingHobbies(false);
    };
    fetchLiked();
  }, [user?.id, initialHobby]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedHobby) return;
    setLoading(true);

    try {
      const selected = likedHobbies.find((h) => h._id === selectedHobby) || initialHobby;
      const extras =
        selected && initialHobby && selected._id === initialHobby._id
          ? {
              hobby_name: initialHobby?.name || '',
              hobby_category: initialHobby?.category || '',
              hobby_emoji: initialHobby?.emoji || '',
            }
          : {};

      const res = await createMemory(user.id, selectedHobby, note, rating, '', extras);
      // Attach hobby info for immediate display
      const hobby = selected || initialHobby;
      const memory = {
        ...res.data.memory,
        hobby_name: hobby?.name || 'Unknown',
        hobby_emoji: hobby?.emoji || '🎯',
        hobby_category: hobby?.category || '',
      };
      onCreated(memory);
    } catch (err) {
      console.error('Create memory failed:', err);
    }
    setLoading(false);
  };

  return (
    <motion.div
      className="modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="modal-content glass"
        initial={{ scale: 0.8, y: 40, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.8, y: 40, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>📌 Pin a Memory</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {/* Hobby selector */}
          <div className="form-group">
            <label>Which hobby?</label>
            {fetchingHobbies ? (
              <p className="form-hint">Loading your liked hobbies...</p>
            ) : likedHobbies.length === 0 ? (
              <p className="form-hint">Like some hobbies first by swiping right! 👉</p>
            ) : (
              <select
                value={selectedHobby}
                onChange={(e) => setSelectedHobby(e.target.value)}
                required
              >
                <option value="">Select a hobby</option>
                {likedHobbies.map((h) => (
                  <option key={h._id} value={h._id}>
                    {h.emoji} {h.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Note */}
          <div className="form-group">
            <label>Your note</label>
            <textarea
              placeholder="How was the experience? ✍️"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
            />
          </div>

          {/* Rating */}
          <div className="form-group">
            <label>Rating</label>
            <div className="star-picker">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className={`star-btn ${star <= rating ? 'active' : ''}`}
                  onClick={() => setRating(star)}
                >
                  {star <= rating ? '★' : '☆'}
                </button>
              ))}
            </div>
          </div>

          <button
            className="btn-primary"
            type="submit"
            disabled={loading || !selectedHobby}
            style={{ width: '100%' }}
          >
            {loading ? '⏳ Saving...' : '📸 Save Memory'}
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
}
