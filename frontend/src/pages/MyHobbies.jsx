import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllHobbies, getSelectedHobbies, removeSelectedHobby, startDoNowTrack } from '../api';
import './MyHobbies.css';

export default function MyHobbies() {
  const [hobbies, setHobbies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTargetModal, setShowTargetModal] = useState(false);
  const [selectedHobby, setSelectedHobby] = useState(null);
  const [targetDays, setTargetDays] = useState(7);
  const navigate = useNavigate();

  const fetchSelected = async () => {
    setLoading(true);
    try {
      const [selectedRes, allRes] = await Promise.all([getSelectedHobbies(), getAllHobbies()]);
      const serverSelected = selectedRes.data?.hobbies || [];

      // Client-side fallback for "just selected" items.
      const localIds = JSON.parse(localStorage.getItem('cc_selected_hobbies') || '[]');
      const all = allRes.data?.hobbies || [];
      const localSelected = all.filter((h) => localIds.includes(h._id));

      const merged = [...serverSelected];
      const seen = new Set(serverSelected.map((h) => h._id));
      for (const h of localSelected) {
        if (!seen.has(h._id)) merged.push(h);
      }

      // Also include hobbies picked during onboarding (stored as full objects)
      const onboardingHobbies = JSON.parse(localStorage.getItem('cc_onboarding_hobbies') || '[]');
      for (const h of onboardingHobbies) {
        if (!seen.has(h._id)) {
          merged.push(h);
          seen.add(h._id);
        }
      }

      setHobbies(merged);
    } catch {
      // If API fails, still show onboarding hobbies
      const onboardingHobbies = JSON.parse(localStorage.getItem('cc_onboarding_hobbies') || '[]');
      setHobbies(onboardingHobbies);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSelected();
  }, []);

  const removeOne = async (hobbyId) => {
    const prev = hobbies;
    setHobbies((p) => p.filter((h) => h._id !== hobbyId));

    // If it's an onboarding hobby (stored in localStorage), remove it from there
    if (hobbyId.startsWith('onboarding_')) {
      const onboardingHobbies = JSON.parse(localStorage.getItem('cc_onboarding_hobbies') || '[]');
      localStorage.setItem(
        'cc_onboarding_hobbies',
        JSON.stringify(onboardingHobbies.filter((h) => h._id !== hobbyId))
      );
      return;
    }

    // Otherwise remove from backend
    try {
      await removeSelectedHobby(hobbyId);
      const localIds = JSON.parse(localStorage.getItem('cc_selected_hobbies') || '[]');
      localStorage.setItem(
        'cc_selected_hobbies',
        JSON.stringify(localIds.filter((id) => id !== hobbyId))
      );
    } catch {
      setHobbies(prev);
    }
  };

  const openTargetModal = (hobby) => {
    setSelectedHobby(hobby);
    setTargetDays(7);
    setShowTargetModal(true);
  };

  const startFocusSession = async () => {
    if (!selectedHobby) return;
    try {
      // Optional: Start a backend track if they want
      await startDoNowTrack(selectedHobby._id, targetDays);
    } catch {
      // Proceed even if track fails (e.g. offline or dup)
    }
    
    // For onboarding hobbies, strip the 'onboarding_' prefix to get the domain hobby id
    const focusId = selectedHobby._id.startsWith('onboarding_')
      ? selectedHobby._id.replace('onboarding_', '')
      : selectedHobby._id;
    
    setShowTargetModal(false);
    navigate(`/focus/${focusId}?targetDays=${targetDays}`);
  };

  return (
    <div className="my-hobbies-page">
      <div className="my-hobbies-header">
        <h1>My Hobbies</h1>
        <p>Hobbies you selected from onboarding/discovery.</p>
      </div>

      {loading ? (
        <div className="my-hobbies-empty">Loading...</div>
      ) : hobbies.length === 0 ? (
        <div className="my-hobbies-empty">No hobbies selected yet. Go to Discover and add some.</div>
      ) : (
        <div className="my-hobbies-grid">
          {hobbies.map((h) => (
            <div className="my-hobby-card" key={h._id}>
              <span className="my-hobby-cat">{h.category}</span>
              <h3>{h.name}</h3>
              <p>{h.description}</p>
              <div className="my-hobby-actions">
                <button
                  type="button"
                  className="focus-btn"
                  onClick={() => openTargetModal(h)}
                >
                  🎯 Start Focus
                </button>
                <button
                  type="button"
                  className="remove-btn"
                  onClick={() => removeOne(h._id)}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      {showTargetModal && selectedHobby && (
        <div className="target-modal-backdrop" onClick={() => setShowTargetModal(false)}>
          <div className="target-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Set Your Goal</h3>
            <p>How many days do you want to build this streak for <strong>{selectedHobby.name}</strong>?</p>
            
            <div className="target-days-options">
              {[7, 14, 21].map((days) => (
                <button
                  key={days}
                  className={`day-option-btn ${targetDays === days ? 'active' : ''}`}
                  onClick={() => setTargetDays(days)}
                >
                  {days} Days
                </button>
              ))}
            </div>

            <div className="target-modal-actions">
              <button className="cancel-btn" onClick={() => setShowTargetModal(false)}>Cancel</button>
              <button className="start-btn" onClick={startFocusSession}>Start Timer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
