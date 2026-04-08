import { motion, useMotionValue, useTransform } from "framer-motion";

export default function HobbyCard({ hobby, onSwipe, isTop, style }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotate = useTransform(x, [-300, 300], [-18, 18]);
  const likeOpacity = useTransform(x, [0, 100], [0, 1]);
  const nopeOpacity = useTransform(x, [-100, 0], [1, 0]);
  const superOpacity = useTransform(y, [-100, 0], [1, 0]);

  const handleDragEnd = (_, info) => {
    const xOff = info.offset.x;
    const yOff = info.offset.y;
    if (xOff > 100) {
      onSwipe("like");
    } else if (xOff < -100) {
      onSwipe("skip");
    } else if (yOff < -100) {
      onSwipe("superlike");
    }
  };

  if (!hobby) return null;

  return (
    <motion.div
      className="hobby-card"
      style={{ ...style, x: isTop ? x : 0, y: isTop ? y : 0, rotate: isTop ? rotate : 0 }}
      drag={isTop}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={0.9}
      onDragEnd={handleDragEnd}
      whileTap={isTop ? { cursor: "grabbing" } : {}}
      exit={{ x: 500, opacity: 0, transition: { duration: 0.3 } }}
    >
      {/* Swipe overlays - only on top card */}
      {isTop && (
        <>
          <motion.div className="swipe-overlay like" style={{ opacity: likeOpacity }}>
            LIKE ✓
          </motion.div>
          <motion.div className="swipe-overlay nope" style={{ opacity: nopeOpacity }}>
            NOPE ✗
          </motion.div>
          <motion.div className="swipe-overlay super" style={{ opacity: superOpacity }}>
            SUPER ★
          </motion.div>
        </>
      )}

      <div className={`card-header ${hobby.category}`}>
        <span className={`category-badge ${hobby.category}`}>{hobby.category}</span>
        <span className="card-emoji">{hobby.emoji}</span>
      </div>

      <div className="card-body">
        <h2 className="card-name">{hobby.name}</h2>
        <p className="card-desc">{hobby.description}</p>
        <div className="card-tags">
          {hobby.tags?.map((tag) => (
            <span key={tag} className="tag">#{tag}</span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
