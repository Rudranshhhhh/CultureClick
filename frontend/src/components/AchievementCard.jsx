import { motion } from 'framer-motion';
import { Activity, StarFilled, Star, Trophy } from '@carbon/icons-react';
import './AchievementCard.css';

export default function AchievementCard({ memory, index, onClick }) {
  return (
    <motion.div
      className="achievement-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      whileHover={{ y: -4, scale: 1.02 }}
      onClick={onClick}
    >
      <div className="achievement-photo">
        {memory.photo_url ? (
          <img src={memory.photo_url} alt={memory.hobby_name} />
        ) : (
          <Trophy size={48} className="achievement-icon" />
        )}
      </div>
      <div className="achievement-body">
        <h3 className="achievement-name">{memory.hobby_name || 'Hobby'}</h3>
        
        {memory.hobby_category && (
          <span className={`achievement-badge cat-${memory.hobby_category}`}>
            {memory.hobby_category.replace(/_/g, ' ')}
          </span>
        )}

        <div className="achievement-footer">
          <span className="achievement-stars">
            {[...Array(5)].map((_, i) => i < (memory.rating || 0) ? <StarFilled size={14} key={i} /> : <Star size={14} key={i} />)}
          </span>
          {memory.created_at && (
            <span className="achievement-date">
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
