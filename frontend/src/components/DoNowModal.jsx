import { useMemo, useState } from 'react';
import { getMicroSessionForHobby } from '../data/microSessions';
import './DoNowModal.css';

export default function DoNowModal({ hobby, onClose, onPinMemory }) {
  const session = useMemo(() => getMicroSessionForHobby(hobby), [hobby]);
  const [started, setStarted] = useState(false);
  const [done, setDone] = useState(false);

  const suggestedNote = useMemo(() => {
    const title = session?.title ? `Session: ${session.title}` : 'Quick session';
    const steps = (session?.steps || []).slice(0, 3).map((s) => `- ${s}`).join('\n');
    return `${title}\n\nWhat I did:\n${steps}\n\nOne takeaway: `;
  }, [session]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass do-now-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <h2>Do this now</h2>
            <span className="do-now-subtitle">
              {hobby?.name ? `${hobby.name} • ` : ''}
              {session.minutes} min
            </span>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="do-now-body">
          <div className="do-now-card">
            <div className="do-now-title">{session.title}</div>
            <div className="do-now-meta">
              <span className="pill">{session.indoor ? 'Indoor-friendly' : 'Outdoor-friendly'}</span>
              {(session.tags || []).slice(0, 3).map((t) => (
                <span key={t} className="pill muted">#{t}</span>
              ))}
            </div>
          </div>

          <ol className={`do-now-steps ${started ? 'started' : ''}`}>
            {(session.steps || []).map((step, idx) => (
              <li key={idx}>{step}</li>
            ))}
          </ol>

          {!started ? (
            <button className="btn-primary" style={{ width: '100%' }} onClick={() => setStarted(true)}>
              Start {session.minutes} min session
            </button>
          ) : !done ? (
            <div className="do-now-actions">
              <button className="btn-ghost" onClick={() => setStarted(false)}>Restart</button>
              <button className="btn-primary" onClick={() => setDone(true)}>Done</button>
            </div>
          ) : (
            <div className="do-now-done">
              <div className="do-now-done-text">
                Nice — want to pin this as a memory?
              </div>
              <div className="do-now-actions">
                <button className="btn-ghost" onClick={onClose}>Not now</button>
                <button
                  className="btn-primary"
                  onClick={() => onPinMemory?.({ hobby, note: suggestedNote, rating: 5 })}
                >
                  Pin memory
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

