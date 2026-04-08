import { useState, useEffect } from "react";
import PolaroidCard from "../components/PolaroidCard";
import CreateMemory from "../components/CreateMemory";
import { useAuth } from "../context/AuthContext";
import api from "../api/client";

export default function Board() {
  const { user } = useAuth();
  const [memories, setMemories] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchMemories = async () => {
    if (!user) return;
    try {
      const res = await api.get(`/api/memories?user_id=${user.id}`);
      setMemories(res.data.memories || []);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  useEffect(() => { fetchMemories(); }, [user]);

  const handleCreated = (memory) => {
    fetchMemories();
  };

  if (loading) {
    return <div className="page"><div className="empty-state"><div className="spinner" /></div></div>;
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Memory Board</h1>
        <span className="progress-badge">{memories.length} memories</span>
      </div>

      {memories.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">📷</span>
          <h2>No Memories Yet</h2>
          <p>Try a hobby you liked, then pin it here as a polaroid memory!</p>
          <button className="btn-primary" style={{ maxWidth: 200, marginTop: 8 }} onClick={() => setShowCreate(true)}>
            Create First Memory
          </button>
        </div>
      ) : (
        <div className="board-grid">
          {memories.map((m) => (
            <PolaroidCard key={m._id} memory={m} onClick={() => {}} />
          ))}
        </div>
      )}

      <button className="fab-btn" onClick={() => setShowCreate(true)}>+</button>

      {showCreate && (
        <CreateMemory onClose={() => setShowCreate(false)} onCreated={handleCreated} />
      )}
    </div>
  );
}
