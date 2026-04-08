import { useState } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import './HobbyCard.css';

const SWIPE_THRESHOLD = 100;
const SWIPE_UP_THRESHOLD = 80;

export default function HobbyCard({ hobby, index, isTop, onSwipe }) {
  const [exitDir, setExitDir] = useState(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Card rotation based on drag
  const rotate = useTransform(x, [-200, 0, 200], [-15, 0, 15]);

  // Overlay opacity
  const likeOpacity = useTransform(x, [0, SWIPE_THRESHOLD], [0, 1]);
  const skipOpacity = useTransform(x, [0, -SWIPE_THRESHOLD], [0, 1]);
  const superOpacity = useTransform(y, [0, -SWIPE_UP_THRESHOLD], [0, 1]);

  // Stack positioning: cards behind are slightly smaller and offset
  const stackScale = 1 - index * 0.05;
  const stackY = index * 8;

  const handleDragEnd = (_, info) => {
    const { offset } = info;

    if (offset.y < -SWIPE_UP_THRESHOLD && Math.abs(offset.x) < SWIPE_THRESHOLD) {
      // Superlike (upward)
      setExitDir('up');
      onSwipe('superlike');
    } else if (offset.x > SWIPE_THRESHOLD) {
      // Like (right)
      setExitDir('right');
      onSwipe('like');
    } else if (offset.x < -SWIPE_THRESHOLD) {
      // Skip (left)
      setExitDir('left');
      onSwipe('skip');
    }
  };

  const exitVariants = {
    right: { x: 500, rotate: 20, opacity: 0 },
    left: { x: -500, rotate: -20, opacity: 0 },
    up: { y: -500, rotate: 0, opacity: 0 },
  };

  const getCategoryClass = (cat) => `cat-${cat}`;

  return (
    <motion.div
      className={`hobby-card ${getCategoryClass(hobby.category)} ${isTop ? 'is-top' : ''}`}
      style={{
        x: isTop ? x : 0,
        y: isTop ? y : 0,
        rotate: isTop ? rotate : 0,
        zIndex: 10 - index,
        scale: stackScale,
        translateY: stackY,
      }}
      drag={isTop}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={1}
      onDragEnd={handleDragEnd}
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{
        scale: stackScale,
        opacity: 1,
        y: stackY,
      }}
      exit={exitDir ? exitVariants[exitDir] : { opacity: 0, scale: 0.8 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      whileDrag={{ cursor: 'grabbing' }}
    >
      {/* Swipe overlays */}
      {isTop && (
        <>
          <motion.div className="swipe-overlay like-overlay" style={{ opacity: likeOpacity }}>
            <span>✓</span>
          </motion.div>
          <motion.div className="swipe-overlay skip-overlay" style={{ opacity: skipOpacity }}>
            <span>✗</span>
          </motion.div>
          <motion.div className="swipe-overlay super-overlay" style={{ opacity: superOpacity }}>
            <span>★</span>
          </motion.div>
        </>
      )}

      {/* Card content */}
      <div className="card-emoji">{hobby.emoji || '🎯'}</div>

      <div className="card-body">
        <span className={`category-badge ${getCategoryClass(hobby.category)}`}>
          {hobby.category}
        </span>
        <h2 className="card-title">{hobby.name}</h2>
        <p className="card-desc">{hobby.description}</p>

        <div className="card-tags">
          {(hobby.tags || []).map((tag) => (
            <span key={tag} className="card-tag">#{tag}</span>
          ))}
        </div>

        <div className="card-meta">
          {hobby.indoor !== undefined && (
            <span className="meta-pill">
              {hobby.indoor ? '🏠 Indoor' : '🌤️ Outdoor'}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
