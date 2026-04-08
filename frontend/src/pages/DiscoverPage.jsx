import { useEffect, useMemo, useState } from 'react';
import { addSelectedHobby, getAllHobbies, removeSelectedHobby } from '../api';
import { Close } from '@carbon/icons-react';
import './DiscoverPage.css';

export default function DiscoverPage() {
  const [hobbies, setHobbies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [detailHobby, setDetailHobby] = useState(null);
  const [addPending, setAddPending] = useState(false);

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

  useEffect(() => {
    if (!detailHobby) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => {
      if (e.key === 'Escape') setDetailHobby(null);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [detailHobby]);

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
        const raw = localStorage.getItem('cc_selected_hobbies') || '[]';
        const prevIds = JSON.parse(raw);
        if (!prevIds.includes(hobby._id)) {
          localStorage.setItem('cc_selected_hobbies', JSON.stringify([...prevIds, hobby._id]));
        }
      }
      return true;
    } catch {
      setHobbies((prev) =>
        prev.map((h) => (h._id === hobby._id ? { ...h, selected: wasSelected } : h))
      );
      return false;
    }
  };

  const handleAddFromModal = async () => {
    if (!detailHobby || detailHobby.selected || addPending) return;
    setAddPending(true);
    try {
      const ok = await toggleSelect(detailHobby);
      if (ok) setDetailHobby(null);
    } finally {
      setAddPending(false);
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
      ) : filtered.length === 0 ? (
        <div className="discover-empty">No hobbies match your filters. Try another category or search.</div>
      ) : (
        <div className="discover-grid">
          {filtered.map((h) => (
            <button
              key={h._id}
              type="button"
              className="discover-card discover-card--tile"
              onClick={() => setDetailHobby(h)}
            >
              <span className="discover-cat">{h.category}</span>
              <h3 className="discover-card-title">{h.name}</h3>
              <p className="discover-card-preview">{h.description}</p>
              <span className="discover-card-cta">View details</span>
            </button>
          ))}
        </div>
      )}

      {detailHobby && (
        <div className="discover-modal-root">
          <button
            type="button"
            className="discover-modal-backdrop"
            aria-label="Close details"
            onClick={() => setDetailHobby(null)}
          />
          <div
            className="discover-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="discover-modal-title"
          >
            <div className="discover-modal-header">
              <span className="discover-cat">{detailHobby.category}</span>
              <button
                type="button"
                className="discover-modal-close"
                onClick={() => setDetailHobby(null)}
                aria-label="Close"
              >
                <Close size={20} />
              </button>
            </div>
            <h2 id="discover-modal-title" className="discover-modal-title">
              {detailHobby.name}
            </h2>
            <p className="discover-modal-desc">{detailHobby.description}</p>

            {(detailHobby.tags || []).length > 0 && (
              <div className="discover-modal-tags">
                {(detailHobby.tags || []).map((t) => (
                  <span key={t} className="discover-tag-pill">
                    {t}
                  </span>
                ))}
              </div>
            )}

            {detailHobby.do_it_now && (
              <div className="discover-modal-extra">
                <h3 className="discover-modal-subhead">Get started</h3>
                {detailHobby.do_it_now.session_minutes != null && (
                  <p className="discover-modal-meta">
                    Suggested session: ~{detailHobby.do_it_now.session_minutes} min
                  </p>
                )}
                {(detailHobby.do_it_now.quick_start_steps || []).length > 0 && (
                  <ol className="discover-modal-steps">
                    {detailHobby.do_it_now.quick_start_steps.map((step, i) => (
                      <li key={i}>{step}</li>
                    ))}
                  </ol>
                )}
                {detailHobby.do_it_now.success_metric && (
                  <p className="discover-modal-metric">{detailHobby.do_it_now.success_metric}</p>
                )}
              </div>
            )}

            <div className="discover-modal-actions">
              <button
                type="button"
                className="btn-primary discover-modal-add"
                disabled={!!detailHobby.selected || addPending}
                onClick={handleAddFromModal}
              >
                {addPending ? 'Adding…' : detailHobby.selected ? 'In My Hobbies' : 'Add to My Hobbies'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

