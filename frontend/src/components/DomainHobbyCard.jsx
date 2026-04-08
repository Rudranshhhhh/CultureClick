import { useState } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { CheckmarkOutline, CloseOutline, Activity } from '@carbon/icons-react';
import './DomainHobbyCard.css';

const SWIPE_THRESHOLD = 100;

export default function DomainHobbyCard({ hobby, index, isTop, onSwipe }) {
  const [exitDir, setExitDir] = useState(null);
  const x = useMotionValue(0);

  const rotate = useTransform(x, [-200, 0, 200], [-12, 0, 12]);
  const likeOpacity = useTransform(x, [0, SWIPE_THRESHOLD], [0, 1]);
  const skipOpacity = useTransform(x, [0, -SWIPE_THRESHOLD], [0, 1]);

  const stackScale = 1 - index * 0.05;
  const stackY = index * 8;

  const exitVariants = {
    right: { x: 500, rotate: 16, opacity: 0 },
    left: { x: -500, rotate: -16, opacity: 0 },
  };

  const handleDragEnd = (_, info) => {
    const { offset } = info;
    if (offset.x > SWIPE_THRESHOLD) {
      setExitDir('right');
      onSwipe('right', hobby);
    } else if (offset.x < -SWIPE_THRESHOLD) {
      setExitDir('left');
      onSwipe('left', hobby);
    }
  };

  return (
    <motion.div
      className={`domain-card ${isTop ? 'is-top' : ''}`}
      style={{
        x: isTop ? x : 0,
        rotate: isTop ? rotate : 0,
        zIndex: 10 - index,
        scale: stackScale,
        translateY: stackY,
      }}
      drag={isTop ? 'x' : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={1}
      onDragEnd={handleDragEnd}
      initial={{ scale: 0.92, opacity: 0 }}
      animate={{ scale: stackScale, opacity: 1, y: stackY }}
      exit={exitDir ? exitVariants[exitDir] : { opacity: 0, scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 320, damping: 26 }}
      whileDrag={{ cursor: 'grabbing' }}
    >
      {isTop && (
        <>
          <motion.div className="domain-swipe-overlay like" style={{ opacity: likeOpacity }}>
            <CheckmarkOutline size={120} style={{ color: 'var(--success)' }} />
          </motion.div>
          <motion.div className="domain-swipe-overlay skip" style={{ opacity: skipOpacity }}>
            <CloseOutline size={120} style={{ color: 'var(--danger)' }} />
          </motion.div>
        </>
      )}

      <div className="domain-card-visual">
        <Activity size={64} style={{ color: 'var(--text-secondary)' }} />
      </div>

      <div className="domain-card-body">
        <div className="domain-card-badges">
          <span className={`badge ${hobby.is_online ? 'online' : ''}`}>{hobby.is_online ? 'Online' : 'Offline'}</span>
          <span className="badge">{hobby.environment}</span>
        </div>
        <h2 className="domain-card-title">{hobby.name}</h2>
        <p className="domain-card-desc">{hobby.description}</p>

        <div className="domain-card-tags">
          {(hobby.style || []).slice(0, 4).map((t) => (
            <span key={t} className="domain-tag">#{t}</span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

