import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { saveOnboardingPreferences } from '../api';
import { useAuth } from '../context/AuthContext';
import Stepper, { Step } from './Stepper';
import './Onboarding.css';

const CATEGORY_OPTIONS = [
  { id: 'creative', label: 'Creative' },
  { id: 'outdoor', label: 'Outdoor' },
  { id: 'physical', label: 'Movement' },
  { id: 'social', label: 'Social' },
  { id: 'solo', label: 'Solo & mindful' },
  { id: 'digital', label: 'Digital' },
];

const TAG_OPTIONS = [
  { id: 'beginner-friendly', label: 'Beginner friendly' },
  { id: 'evidence-based', label: 'Evidence-based' },
  { id: 'tactile-calming', label: 'Tactile & calming' },
  { id: 'cognitive-gains', label: 'Cognitive gains' },
  { id: 'grounding', label: 'Grounding' },
  { id: 'science-backed-focus', label: 'Science-backed focus' },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const { user, refreshMe } = useAuth();

  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [indoor, setIndoor] = useState('either'); // indoor|outdoor|either
  const [timeMinutes, setTimeMinutes] = useState(30);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const canSubmit = useMemo(() => categories.length > 0 || tags.length > 0 || notes.trim().length > 0, [categories, tags, notes]);

  const toggle = (arr, id, setArr) => {
    setArr((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleSubmit = async () => {
    if (!user?.id) return;
    setSaving(true);
    setError('');
    try {
      const answers = {
        categories,
        tags,
        indoor_preference: indoor,
        time_minutes: Number(timeMinutes),
        free_text: notes,
      };
      await saveOnboardingPreferences(answers);
      await refreshMe?.();
      navigate('/swipe', { replace: true });
    } catch (e) {
      setError(e?.response?.data?.error || 'Could not save preferences. Please try again.');
    }
    setSaving(false);
  };

  return (
    <div className="page onboarding-page">
      <div className="onboarding-card">
        <h1>Quick preferences</h1>
        <p className="onboarding-subtitle">
          Answer a few questions so Buddy can suggest better hobbies from the first swipe.
        </p>

        {error && <div className="onboarding-error">{error}</div>}

        <Stepper
          initialStep={1}
          onStepChange={() => {}}
          onFinalStepCompleted={() => {
            if (!canSubmit || saving) return;
            handleSubmit();
          }}
          backButtonText="Previous"
          nextButtonText="Next"
        >
          <Step>
            <div className="onboarding-section" style={{ marginTop: 0 }}>
              <div className="onboarding-label">What are you into?</div>
              <div className="chip-grid">
                {CATEGORY_OPTIONS.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className={`chip ${categories.includes(c.id) ? 'active' : ''}`}
                    onClick={() => toggle(categories, c.id, setCategories)}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
              <p className="onboarding-hint">Pick a few — this just helps Buddy start smarter.</p>
            </div>
          </Step>

          <Step>
            <div className="onboarding-section" style={{ marginTop: 0 }}>
              <div className="onboarding-label">What style fits you?</div>
              <div className="chip-grid">
                {TAG_OPTIONS.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    className={`chip ${tags.includes(t.id) ? 'active' : ''}`}
                    onClick={() => toggle(tags, t.id, setTags)}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          </Step>

          <Step>
            <div className="onboarding-section" style={{ marginTop: 0 }}>
              <div className="onboarding-label">Indoor / outdoor?</div>
              <div className="segmented">
                {[
                  { id: 'indoor', label: 'Indoor' },
                  { id: 'outdoor', label: 'Outdoor' },
                  { id: 'either', label: 'Either' },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    className={`seg-btn ${indoor === opt.id ? 'active' : ''}`}
                    onClick={() => setIndoor(opt.id)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              <div className="onboarding-section">
                <div className="onboarding-label">Time you usually have</div>
                <div className="range-row">
                  <input
                    type="range"
                    min={5}
                    max={120}
                    step={5}
                    value={timeMinutes}
                    onChange={(e) => setTimeMinutes(e.target.value)}
                  />
                  <span className="range-pill">{timeMinutes} min</span>
                </div>
              </div>
            </div>
          </Step>

          <Step>
            <div className="onboarding-section" style={{ marginTop: 0 }}>
              <div className="onboarding-label">Anything else?</div>
              <textarea
                className="onboarding-textarea"
                placeholder="e.g. “Beginner, quiet, low budget. I like sketching and journaling.”"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={5}
              />
              <div className="onboarding-final-actions">
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => navigate('/swipe')}
                  disabled={saving}
                  style={{ width: '100%' }}
                >
                  Skip for now
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  disabled={!canSubmit || saving}
                  onClick={handleSubmit}
                  style={{ width: '100%' }}
                >
                  {saving ? 'Saving…' : 'Save preferences'}
                </button>
              </div>
            </div>
          </Step>
        </Stepper>
      </div>
    </div>
  );
}

