import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../api/client";

export default function CreateMemory({ onClose, onCreated }) {
  const { user } = useAuth();
  const [likedHobbies, setLikedHobbies] = useState([]);
  const [selectedHobby, setSelectedHobby] = useState(null);
  const [note, setNote] = useState("");
  const [rating, setRating] = useState(5);
  const [photoUrl, setPhotoUrl] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      api.get(`/api/hobbies/liked?user_id=${user.id}`)
        .then((res) => setLikedHobbies(res.data.hobbies || []))
        .catch(() => {});
    }
  }, [user]);

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPhotoUrl(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!selectedHobby || !user) return;
    setSaving(true);
    try {
      const res = await api.post("/api/memories", {
        user_id: user.id, hobby_id: selectedHobby._id,
        note, rating, photo_url: photoUrl,
      });
      onCreated?.(res.data.memory);
      onClose();
    } catch (err) { console.error("Failed to save memory:", err); }
    setSaving(false);
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content">
        <h2>📸 New Memory</h2>
        <div className="form-group">
          <label>Which hobby?</label>
          {likedHobbies.length === 0 ? (
            <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Like some hobbies first!</p>
          ) : (
            <div className="hobby-select-grid">
              {likedHobbies.map((h) => (
                <div key={h._id}
                  className={`hobby-select-item ${selectedHobby?._id === h._id ? "selected" : ""}`}
                  onClick={() => setSelectedHobby(h)}>
                  <span className="hobby-emoji">{h.emoji}</span>{h.name}
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="form-group">
          <label>Add a photo</label>
          <input type="file" accept="image/*" onChange={handlePhotoUpload} className="form-input" style={{ padding: 8 }} />
          {photoUrl && <img src={photoUrl} alt="preview" style={{ marginTop: 8, borderRadius: 8, maxHeight: 150, objectFit: "cover" }} />}
        </div>
        <div className="form-group">
          <label>How was it?</label>
          <textarea className="form-input" placeholder="Write a quick note..." value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
        <div className="form-group">
          <label>Rating</label>
          <div className="star-rating-input">
            {[1,2,3,4,5].map((n) => (
              <span key={n} onClick={() => setRating(n)} style={{ opacity: n <= rating ? 1 : 0.3 }}>★</span>
            ))}
          </div>
        </div>
        <button className="btn-primary" onClick={handleSubmit} disabled={!selectedHobby || saving}>
          {saving ? "Saving..." : "Save Memory 📌"}
        </button>
        <button className="btn-ghost" onClick={onClose} style={{ width: "100%", marginTop: 8 }}>Cancel</button>
      </div>
    </div>
  );
}
