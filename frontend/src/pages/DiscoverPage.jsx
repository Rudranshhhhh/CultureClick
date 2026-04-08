import { useEffect, useMemo, useState } from 'react';
import { addSelectedHobby, getAllHobbies, removeSelectedHobby } from '../api';
import './DiscoverPage.css';

export default function DiscoverPage() {
  const [hobbies, setHobbies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');

  const fetchAll = async () => {
    setLoading(true);
    try {
      const res = await getAllHobbies();
      setHobbies(res.data?.hobbies || []);
    } catch {
      setHobbies([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const categories = useMemo(
    () => ['all', ...Array.from(new Set(hobbies.map((h) => h.category).filter(Boolean)))],
    [hobbies]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return hobbies.filter((h) => {
      // Anything already selected belongs in My Hobbies, not Discover.
      if (h.selected) return false;
      if (category !== 'all' && h.category !== category) return false;
      if (!q) return true;
      return (
        h.name?.toLowerCase().includes(q) ||
        h.description?.toLowerCase().includes(q) ||
        (h.tags || []).some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [hobbies, query, category]);

  const toggleSelect = async (hobby) => {
    const wasSelected = !!hobby.selected;
    setHobbies((prev) =>
      prev.map((h) => (h._id === hobby._id ? { ...h, selected: !wasSelected } : h))
    );
    try {
      if (wasSelected) {
        await removeSelectedHobby(hobby._id);
      } else {
        await addSelectedHobby(hobby._id);
        // Mirror on device so My Hobbies can show immediately.
        const raw = localStorage.getItem('cc_selected_hobbies') || '[]';
        const prevIds = JSON.parse(raw);
        if (!prevIds.includes(hobby._id)) {
          localStorage.setItem('cc_selected_hobbies', JSON.stringify([...prevIds, hobby._id]));
        }
      }
    } catch {
      setHobbies((prev) =>
        prev.map((h) => (h._id === hobby._id ? { ...h, selected: wasSelected } : h))
      );
    }
  };

  return (
    <div className="discover-page">
      <div className="discover-header">
        <h1>Discover hobbies</h1>
        <p>Explore all hobbies in the database and add what you want to learn.</p>
      </div>

      <div className="discover-filters">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search hobbies..."
        />
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c === 'all' ? 'All categories' : c}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="discover-loading">Loading hobbies...</div>
      ) : (
        <div className="discover-grid">
          {filtered.map((h) => (
            <div key={h._id} className="discover-card">
              <div className="discover-card-top">
                <span className="discover-cat">{h.category}</span>
                <button
                  type="button"
                  className="select-btn"
                  onClick={() => toggleSelect(h)}
                >
                  Add to My Hobbies
                </button>
              </div>
              <h3>{h.name}</h3>
              <p>{h.description}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

