import { motion } from 'framer-motion';
import { Activity, StarFilled, Star } from '@carbon/icons-react';
import './PolaroidCard.css';

function seededRandom(seed) {
  let s = 0;
  for (let i = 0; i < seed.length; i++) {
    s = ((s << 5) - s + seed.charCodeAt(i)) | 0;
  }
  return ((s % 100) / 100) * 8 - 4; // -4 to 4 degrees
}

export default function PolaroidCard({ memory, index, onClick }) {
  const rotation = seededRandom(memory._id || String(index));

  return (
    <motion.div
      className="polaroid"
      style={{ '--rotation': `${rotation}deg` }}
      initial={{ opacity: 0, y: 30, rotate: rotation }}
      animate={{ opacity: 1, y: 0, rotate: rotation }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      whileHover={{ scale: 1.05, rotate: 0, y: -8, zIndex: 10 }}
      onClick={onClick}
    >
      <div className="polaroid-photo">
        {memory.photo_url ? (
          <img src={memory.photo_url} alt={memory.hobby_name} />
        ) : (
          <Activity size={48} className="polaroid-icon" style={{ fill: 'var(--text-secondary)' }} />
        )}
      </div>
      <div className="polaroid-body">
        <p className="polaroid-name">{memory.hobby_name}</p>
        {memory.note && (
          <p className="polaroid-note">{memory.note}</p>
        )}
        <div className="polaroid-footer">
          <span className="polaroid-stars" style={{ display: 'flex', gap: '2px', fill: 'var(--warning)' }}>
            {[...Array(5)].map((_, i) => i < memory.rating ? <StarFilled size={12} key={i} /> : <Star size={12} key={i} />)}
          </span>
          {memory.created_at && (
            <span className="polaroid-date">
              {new Date(memory.created_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
