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
    >
      <div className="polaroid-photo">
        {memory.photo_url ? (
          <img src={memory.photo_url} alt={memory.hobby_name} />
        ) : (
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
  );
}
