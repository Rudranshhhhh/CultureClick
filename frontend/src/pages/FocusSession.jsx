import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { getAllDomainHobbies } from '../utils/hobbyMatch';
import { createDistractionTracker } from '../utils/focusSession';
import AddMemoryModal from '../components/AddMemoryModal';
import './FocusSession.css';

const MOTIVATION = [
  'Stay focused. Small steps count.',
  'You’re building momentum. Keep going.',
  'Just this session. Be here, now.',
  'Progress over perfection.',
];

const EMBED_ALLOWLIST = [
  'www.youtube.com',
  'youtube.com',
  'youtu.be',
  'codesandbox.io',
];

function canEmbedUrl(url) {
  try {
    if (!url) return false;
    const u = new URL(url);
    return EMBED_ALLOWLIST.includes(u.hostname);
  } catch {
    return false;
  }
}

function useQueryMinutes(defaultMinutes = 30) {
  const location = useLocation();
  return useMemo(() => {
    const params = new URLSearchParams(location.search);
    const m = Number(params.get('minutes') || defaultMinutes);
    if (!Number.isFinite(m) || m <= 0) return defaultMinutes;
    return Math.min(Math.max(m, 5), 180);
  }, [location.search, defaultMinutes]);
}

export default function FocusSession() {
  const { hobbyId } = useParams();
  const navigate = useNavigate();
  const minutesFromQuery = useQueryMinutes(30);

  const hobby = useMemo(() => getAllDomainHobbies().find((h) => h.id === hobbyId), [hobbyId]);
  const [durationMin, setDurationMin] = useState(minutesFromQuery);
  const [running, setRunning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(minutesFromQuery * 60);
  const [breaks, setBreaks] = useState(0);
  const [lastBreakMs, setLastBreakMs] = useState(null);
  const [ended, setEnded] = useState(false);
  const [showMemory, setShowMemory] = useState(false);
  const [showFocusBroken, setShowFocusBroken] = useState(false);
  const [journal, setJournal] = useState('');
  const [motivation] = useState(() => MOTIVATION[Math.floor(Math.random() * MOTIVATION.length)]);
  const [resourceUrl, setResourceUrl] = useState('');
  const [embedWanted, setEmbedWanted] = useState(true);

  const timerRef = useRef(null);
  const trackerRef = useRef(null);
  const startedAtRef = useRef(null);
  const endAtRef = useRef(null);

  useEffect(() => {
    if (!lastBreakMs) return;
    const t = setTimeout(() => setLastBreakMs(null), 5000);
    return () => clearTimeout(t);
  }, [lastBreakMs]);

  useEffect(() => {
    setDurationMin(minutesFromQuery);
    setSecondsLeft(minutesFromQuery * 60);
  }, [minutesFromQuery]);

  useEffect(() => {
    setResourceUrl(hobby?.url || '');
  }, [hobby?.url]);

  useEffect(() => {
    // Recreate tracker when hobby type changes, so callback logic stays correct.
    trackerRef.current?.stop();
    trackerRef.current = createDistractionTracker({
      graceMs: 10000,
      onBreak: ({ breaks: b, deltaMs }) => {
        setBreaks(b);
        setLastBreakMs(deltaMs || null);
        if (!hobby?.is_online) {
          setRunning(false);
          setShowFocusBroken(true);
        }
      },
    });
    trackerRef.current.start();

    return () => {
      trackerRef.current?.stop();
    };
  }, [hobby?.is_online]);

  useEffect(() => {
    if (!running) return;
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      const endAt = endAtRef.current;
      if (!endAt) return;
      const remaining = Math.max(0, Math.round((endAt - Date.now()) / 1000));
      setSecondsLeft(remaining);
      if (remaining <= 0) {
        clearInterval(timerRef.current);
        timerRef.current = null;
        setRunning(false);
        setEnded(true);
        setShowMemory(true);
      }
    }, 500);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
    };
  }, [running]);

  // Note: distraction tracking is handled inside `createDistractionTracker` via `onBreak`.

  const fmt = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const requestFullscreen = async () => {
    try {
      if (document.fullscreenElement) return;
      await document.documentElement.requestFullscreen();
    } catch {
      // ignore; browser may block without user gesture
    }
  };

  const startSession = async () => {
    setEnded(false);
    const total = durationMin * 60;
    setSecondsLeft(total);
    await requestFullscreen();
    startedAtRef.current = Date.now();
    endAtRef.current = Date.now() + total * 1000;
    setRunning(true);
  };

  const endSession = () => {
    setRunning(false);
    setEnded(true);
    setShowMemory(true);
  };

  const resumeSession = () => {
    endAtRef.current = Date.now() + secondsLeft * 1000;
    setRunning(true);
  };

  if (!hobby) {
    return (
      <div className="page focus-page">
        <div className="focus-card">
          <h1>Session not found</h1>
          <p className="muted">That hobby doesn’t exist in the domain catalog.</p>
          <button className="btn-primary" onClick={() => navigate('/onboarding')}>Back</button>
        </div>
      </div>
    );
  }

  const domainHobbyForMemory = {
    _id: hobby.id,
    name: hobby.name,
    emoji: hobby.is_online ? '🌐' : '🎯',
    category: (hobby.interest_type || [])[0] || '',
  };

  const suggestedNote =
    `Focus session: ${hobby.name}\n` +
    `Duration: ${durationMin} min\n` +
    `Distractions: ${breaks}\n\n` +
    (journal ? `Journal:\n${journal}\n\n` : '') +
    `What I did:\n- \n\nOne takeaway: `;

  const totalSeconds = durationMin * 60;
  const elapsedSeconds = Math.max(0, totalSeconds - secondsLeft);
  const progressPct = totalSeconds > 0 ? Math.min(100, Math.round((elapsedSeconds / totalSeconds) * 100)) : 0;

  return (
    <div className="page focus-page">
      <div className={`focus-card ${hobby.is_online ? 'focus-split' : ''}`}>
        <div className="focus-left">
        <div className="focus-header">
          <div>
            <h1 className="focus-title">{hobby.name}</h1>
            <div className="focus-sub">
              <span className="focus-pill">{hobby.is_online ? 'Online' : 'Offline'}</span>
              <span className="focus-pill">{hobby.environment}</span>
              <span className="focus-pill">Breaks: {breaks}</span>
            </div>
          </div>
          <button className="btn-ghost" onClick={() => navigate(-1)}>Close</button>
        </div>

        {running && (
          <div className="stay-focused-banner">
            <strong>Stay Focused</strong>
            <span className="stay-focused-sub">{motivation}</span>
          </div>
        )}

        {lastBreakMs && (
          <div className="focus-banner">
            Welcome back. You were away for {Math.round(lastBreakMs / 1000)}s — focus break recorded.
          </div>
        )}

        <div className="focus-timer">
          <div className="focus-time">{fmt(secondsLeft)}</div>
          <div className="focus-progress">
            <div className="focus-progress-bar">
              <div className="focus-progress-fill" style={{ width: `${progressPct}%` }} />
            </div>
            <div className="focus-progress-meta">
              <span>{progressPct}%</span>
              <span>{Math.ceil(secondsLeft / 60)} min left</span>
            </div>
          </div>
          <div className="focus-controls">
            <label className="focus-label">
              Minutes
              <input
                type="number"
                min={5}
                max={180}
                value={durationMin}
                disabled={running}
                onChange={(e) => setDurationMin(Number(e.target.value || 30))}
              />
            </label>
            <button className="btn-ghost" onClick={requestFullscreen}>Enter fullscreen</button>
          </div>
        </div>

        <div className="focus-journal">
          <div className="focus-journal-title">Quick journal (optional)</div>
          <textarea
            value={journal}
            onChange={(e) => setJournal(e.target.value)}
            placeholder="What are you working on? What’s one small win you want from this session?"
            rows={3}
            disabled={false}
          />
        </div>

        <div className="focus-actions">
          {!running ? (
            <>
              <button className="btn-primary" onClick={startSession}>
                {ended ? 'Start again' : 'Start focused session'}
              </button>
              {hobby.is_online && resourceUrl && (
                <a className="btn-secondary" href={resourceUrl} target="_blank" rel="noreferrer">
                  Open hobby site
                </a>
              )}
            </>
          ) : (
            <>
              <button className="btn-secondary" onClick={() => setRunning(false)}>Pause</button>
              <button className="btn-primary" onClick={endSession}>End session</button>
            </>
          )}
        </div>

        <div className="focus-foot muted">
          Switching tabs is allowed, but it will count as a distraction if you’re away longer than 10 seconds.
        </div>
        </div>

        {hobby.is_online && (
          <div className="focus-right">
            <div className="focus-right-title">Online hobby</div>
            <div className="focus-right-sub">Open your tool/site, and keep CultureClick running as your focus timer.</div>

            <div className="focus-link-row">
              <input
                value={resourceUrl}
                onChange={(e) => setResourceUrl(e.target.value)}
                placeholder="Paste a link (optional)"
              />
              <a className={`btn-primary ${!resourceUrl ? 'disabled-link' : ''}`} href={resourceUrl || '#'} target="_blank" rel="noreferrer">
                Open Hobby Site
              </a>
            </div>

            <label className="focus-embed-toggle">
              <input
                type="checkbox"
                checked={embedWanted}
                onChange={(e) => setEmbedWanted(e.target.checked)}
              />
              Try embedding (only some sites work)
            </label>

            {embedWanted && resourceUrl && canEmbedUrl(resourceUrl) ? (
              <div className="focus-embed">
                <iframe title="Hobby resource" src={resourceUrl} />
              </div>
            ) : (
              <div className="focus-embed-hint muted">
                Some sites block embedding. If embed doesn’t work, use “Open Hobby Site”.
              </div>
            )}
          </div>
        )}
      </div>

      {showFocusBroken && (
        <div className="focusbroken-overlay" onClick={() => {}}>
          <div className="focusbroken-card">
            <div className="focusbroken-title">Focus broken</div>
            <div className="focusbroken-sub">
              You left the session for a while. Do you want to continue or restart?
            </div>
            <div className="focusbroken-actions">
              <button
                className="btn-ghost"
                onClick={() => {
                  setShowFocusBroken(false);
                  setSecondsLeft(durationMin * 60);
                  startedAtRef.current = Date.now();
                  endAtRef.current = Date.now() + durationMin * 60 * 1000;
                  setRunning(true);
                }}
              >
                Restart timer
              </button>
              <button
                className="btn-secondary"
                onClick={() => {
                  setShowFocusBroken(false);
                  resumeSession();
                }}
              >
                Resume
              </button>
              <button
                className="btn-primary"
                onClick={() => {
                  setShowFocusBroken(false);
                  endSession();
                }}
              >
                End & pin memory
              </button>
            </div>
          </div>
        </div>
      )}

      {showMemory && (
        <AddMemoryModal
          onClose={() => setShowMemory(false)}
          onCreated={() => setShowMemory(false)}
          initialHobby={domainHobbyForMemory}
          initialNote={suggestedNote}
          initialRating={5}
        />
      )}
    </div>
  );
}

