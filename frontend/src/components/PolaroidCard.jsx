<<<<<<< HEAD
import { motion } from 'framer-motion';
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
=======
export default function PolaroidCard({ memory, onClick }) {
  // Seeded random rotation per card for visual variety
  const seed = memory._id
    ? memory._id.charCodeAt(memory._id.length - 1) +
      memory._id.charCodeAt(memory._id.length - 2)
    : 0;
  const rotation = ((seed % 11) - 5) * 0.8; // -4 to +4 degrees

  const stars = "★".repeat(memory.rating) + "☆".repeat(5 - memory.rating);

  return (
    <div
      className="polaroid"
      style={{ transform: `rotate(${rotation}deg)` }}
      onClick={() => onClick?.(memory)}
>>>>>>> 1a62fd007f6a46adb16d418a975995921939f395
    >
      <div className="polaroid-photo">
        {memory.photo_url ? (
          <img src={memory.photo_url} alt={memory.hobby_name} />
        ) : (
<<<<<<< HEAD
          <span className="polaroid-emoji">{memory.hobby_emoji || '🎯'}</span>
        )}
      </div>
      <div className="polaroid-body">
        <p className="polaroid-name">{memory.hobby_name}</p>
        {memory.note && (
          <p className="polaroid-note">{memory.note}</p>
        )}
        <div className="polaroid-stars">
          {'★'.repeat(memory.rating)}{'☆'.repeat(5 - memory.rating)}
        </div>
      </div>
    </motion.div>
=======
          <span>{memory.hobby_emoji || "🎯"}</span>
        )}
      </div>
      <div className="polaroid-note">
        {memory.note || memory.hobby_name}
      </div>
      <div className="polaroid-meta">
        <span className="polaroid-stars">{stars}</span>
        <span className="polaroid-date">
          {memory.created_at
            ? new Date(memory.created_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })
            : ""}
        </span>
      </div>
    </div>
>>>>>>> 1a62fd007f6a46adb16d418a975995921939f395
  );
}
