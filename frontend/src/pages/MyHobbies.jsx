import { useEffect, useState } from 'react';
import { getAllHobbies, getSelectedHobbies, removeSelectedHobby } from '../api';
import './MyHobbies.css';

export default function MyHobbies() {
  const [hobbies, setHobbies] = useState([]);
  const [loading, setLoading] = useState(true);

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
      setHobbies(merged);
    } catch {
      setHobbies([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSelected();
  }, []);

  const removeOne = async (hobbyId) => {
    const prev = hobbies;
    setHobbies((p) => p.filter((h) => h._id !== hobbyId));
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
              <button type="button" onClick={() => removeOne(h._id)}>Remove</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

