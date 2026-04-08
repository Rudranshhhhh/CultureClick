import { useState, useEffect, useCallback } from "react";
import { AnimatePresence } from "framer-motion";
import HobbyCard from "../components/HobbyCard";
import { useAuth } from "../context/AuthContext";
import api from "../api/client";
import DoNowModal from "../components/DoNowModal";
import AddMemoryModal from "../components/AddMemoryModal";

export default function Swipe() {
  const { user } = useAuth();
  const [cards, setCards] = useState([]);
  const [progress, setProgress] = useState({ discovered: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [done, setDone] = useState(false);
  const [doNowHobby, setDoNowHobby] = useState(null);
  const [pinDraft, setPinDraft] = useState(null); // { hobby, note, rating }

  const fetchNext = useCallback(async () => {
    if (!user) return;
    try {
      const res = await api.get(`/api/hobbies/next?user_id=${user.id}`);
      setProgress(res.data.progress || { discovered: 0, total: 0 });
      if (res.data.hobby) {
        setCards((prev) => {
          const exists = prev.some((c) => c._id === res.data.hobby._id);
          if (exists) return prev;
          return [...prev, res.data.hobby];
        });
        setDone(false);
      } else {
        setDone(true);
      }
    } catch (err) {
      console.error("Failed to fetch hobby:", err);
    }
    setLoading(false);
  }, [user]);

  // Pre-load 3 cards
  useEffect(() => {
    const load = async () => {
      for (let i = 0; i < 3; i++) {
        await fetchNext();
      }
    };
    load();
  }, [fetchNext]);

  const handleSwipe = async (action) => {
    if (cards.length === 0) return;
    const current = cards[0];

    // Remove the top card
    setCards((prev) => prev.slice(1));
    setProgress((p) => ({ ...p, discovered: p.discovered + 1 }));

    // Record swipe
    try {
      await api.post("/api/swipe", {
        user_id: user.id,
        hobby_id: current._id,
        action,
      });
    } catch (err) {
      console.error("Swipe error:", err);
    }

    // Fetch next card
    fetchNext();
  };

  if (loading) {
    return (
      <div className="page">
        <div className="empty-state">
          <div className="spinner" />
          <p>Loading hobbies...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Discover</h1>
        <span className="progress-badge">
          {progress.discovered} / {progress.total} explored
        </span>
      </div>

      <div className="swipe-container">
        {done && cards.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">🎉</span>
            <h2>All Explored!</h2>
            <p>You've swiped through every hobby. Head to Buddy for personalised suggestions!</p>
          </div>
        ) : (
          <>
            <div className="card-stack">
              <AnimatePresence>
                {cards.slice(0, 3).map((hobby, i) => (
                  <HobbyCard
                    key={hobby._id}
                    hobby={hobby}
                    isTop={i === 0}
                    onSwipe={handleSwipe}
                    onDoNow={(h) => setDoNowHobby(h)}
                    style={{
                      zIndex: 3 - i,
                      scale: 1 - i * 0.05,
                      y: i * -8,
                      filter: i > 0 ? `brightness(${1 - i * 0.15})` : "none",
                    }}
                  />
                ))}
              </AnimatePresence>
            </div>

            <div className="swipe-actions">
              <button className="action-btn skip" onClick={() => handleSwipe("skip")} title="Skip">
                ✗
              </button>
              <button className="action-btn superlike" onClick={() => handleSwipe("superlike")} title="Super Like">
                ★
              </button>
              <button className="action-btn like" onClick={() => handleSwipe("like")} title="Like">
                ✓
              </button>
            </div>
          </>
        )}
      </div>

      <AnimatePresence>
        {doNowHobby && (
          <DoNowModal
            hobby={doNowHobby}
            onClose={() => setDoNowHobby(null)}
            onPinMemory={(draft) => {
              setDoNowHobby(null);
              setPinDraft(draft);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {pinDraft?.hobby && (
          <AddMemoryModal
            onClose={() => setPinDraft(null)}
            onCreated={() => setPinDraft(null)}
            initialHobby={pinDraft.hobby}
            initialNote={pinDraft.note || ""}
            initialRating={pinDraft.rating || 5}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
