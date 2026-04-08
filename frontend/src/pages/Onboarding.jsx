import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { saveOnboardingPreferences } from '../api';
import { useAuth } from '../context/AuthContext';
import Stepper, { Step } from './Stepper';
import { buildDomainProfile, matchHobbies, saveDomainProfile } from '../utils/hobbyMatch';
import { AnimatePresence } from 'framer-motion';
import DomainHobbyCard from '../components/DomainHobbyCard';
import './Onboarding.css';

const CATEGORY_OPTIONS = [
  { id: 'creative', label: 'Creative' },
  { id: 'outdoor', label: 'Outdoor' },
  { id: 'physical', label: 'Movement' },
  { id: 'social', label: 'Social' },
  { id: 'solo_mindful', label: 'Solo & mindful' },
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

const MODE_OPTIONS = [
  { id: 'low_energy', label: 'Low energy' },
  { id: 'bored', label: 'Bored' },
  { id: 'focus_mode', label: 'Focus mode' },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const { user, refreshMe } = useAuth();

  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [indoor, setIndoor] = useState(null); // indoor|outdoor|either — null until user picks (step 3)
  const [timeMinutes, setTimeMinutes] = useState(30);
  const [notes, setNotes] = useState('');
  const [mode, setMode] = useState([]);
  const [pickedIds, setPickedIds] = useState([]); // right-swiped hobby IDs
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [activeStepForHint, setActiveStepForHint] = useState(1);

  const domainProfile = useMemo(
    () => buildDomainProfile({ categories, tags, indoor: indoor ?? 'either', timeMinutes, notes, mode }),
    [categories, tags, indoor, timeMinutes, notes, mode]
  );

  const matches = useMemo(
    () => matchHobbies(domainProfile, { limit: 8 }),
    [domainProfile]
  );

  const deck = useMemo(() => matches.map((m) => m.hobby), [matches]);

  const isStepComplete = useCallback(
    (step) => {
      switch (step) {
        case 1:
          return categories.length >= 1;
        case 2:
          return tags.length >= 1;
        case 3:
          return indoor != null;
        case 4:
          return mode.length >= 1;
        case 5:
          return deck.length === 0 || pickedIds.length >= 1;
        default:
          return true;
      }
    },
    [categories, tags, indoor, mode, deck.length, pickedIds]
  );

  const canSubmit = useMemo(
    () => [1, 2, 3, 4, 5].every((s) => isStepComplete(s)),
    [isStepComplete]
  );

  const validationHint = useMemo(() => {
    if (isStepComplete(activeStepForHint)) return '';
    switch (activeStepForHint) {
      case 1:
        return 'Pick at least one interest to continue.';
      case 2:
        return 'Pick at least one style to continue.';
      case 3:
        return 'Choose indoor, outdoor, or either to continue.';
      case 4:
        return 'Pick at least one mood (how you’re feeling) to continue.';
      case 5:
        return deck.length === 0
          ? ''
          : 'Swipe right on at least one hobby you like to finish onboarding.';
      default:
        return '';
    }
  }, [activeStepForHint, isStepComplete, deck.length]);

  const toggle = (arr, id, setArr) => {
    setArr((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const persistOnboarding = async () => {
    if (!user?.id) return;
    setSaving(true);
    setError('');
    try {
      saveDomainProfile(domainProfile);
      const answers = {
        categories,
        tags,
        indoor_preference: indoor,
        time_minutes: Number(timeMinutes),
        free_text: notes,
        mode,
      };
      await saveOnboardingPreferences(answers);

      // Persist right-swiped domain hobbies so My Hobbies page can display them
      if (pickedIds.length > 0) {
        const picked = deck.filter((h) => pickedIds.includes(h.id)).map((h) => ({
          _id: `onboarding_${h.id}`,
          name: h.name,
          description: h.description,
          category: (h.interest_type || [])[0] || 'general',
          environment: h.environment,
          is_online: h.is_online,
          url: h.url,
          source: 'onboarding',
        }));
        localStorage.setItem('cc_onboarding_hobbies', JSON.stringify(picked));
      }

      await refreshMe?.();
    } catch (e) {
      setError(e?.response?.data?.error || 'Could not save preferences. Please try again.');
      throw e;
    }
    setSaving(false);
  };

  const ensureOnboardingThenGo = async (to) => {
    if (saving) return;
    if (!user?.onboarding_complete) {
      try {
        await persistOnboarding();
      } catch {
        return;
      }
    }
    navigate(to);
  };

  const handleDeckSwipe = (dir, hobby) => {
    if (dir === 'right') {
      setPickedIds((prev) => (prev.includes(hobby.id) ? prev : [...prev, hobby.id]));
    }
    // remove top card by shifting deck index via derived rendering:
    // we store removed IDs in local state by slicing an offset.
    setRemovedCount((c) => c + 1);
  };

  const [removedCount, setRemovedCount] = useState(0);
  const visibleDeck = useMemo(() => deck.slice(removedCount), [deck, removedCount]);

  const pickedHobbies = useMemo(
    () => deck.filter((h) => pickedIds.includes(h.id)),
    [pickedIds, deck]
  );

  useEffect(() => {
    // Reset deck when matches list changes (profile edits).
    setRemovedCount(0);
    setPickedIds([]);
  }, [deck]);

  return (
    <div className="page onboarding-page">
      <div className="onboarding-card">
        <h1>Quick preferences</h1>
        <p className="onboarding-subtitle">
          Answer a few questions so Buddy can suggest better hobbies from the first swipe.
        </p>

        {error && <div className="onboarding-error">{error}</div>}
        {validationHint && <div className="onboarding-validation-hint">{validationHint}</div>}

        <Stepper
          initialStep={1}
          onStepChange={setActiveStepForHint}
          isStepComplete={isStepComplete}
          onFinalStepCompleted={() => {
            if (!canSubmit || saving) return;
            persistOnboarding().then(() => navigate('/my-hobbies', { replace: true })).catch(() => { });
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
              <p className="onboarding-hint">Pick at least one — this just helps Buddy start smarter.</p>
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
              <p className="onboarding-hint">Pick at least one style.</p>
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
              <p className="onboarding-hint">Pick one option (indoor, outdoor, or either).</p>

              <div className="onboarding-section">
                <div className="onboarding-label">Time you usually have</div>
                <div className="range-row">
                  <input
                    type="range"
                    min={10}
                    max={60}
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
              <div className="onboarding-label">How are you feeling?</div>
              <div className="chip-grid" style={{ marginBottom: 12 }}>
                {MODE_OPTIONS.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    className={`chip ${mode.includes(m.id) ? 'active' : ''}`}
                    onClick={() => toggle(mode, m.id, setMode)}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
              <p className="onboarding-hint">Pick at least one mood. Notes below are optional.</p>

              <div className="onboarding-label">Anything else?</div>
              <textarea
                className="onboarding-textarea"
                placeholder="e.g. “Beginner, quiet, low budget. I like sketching and journaling.”"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={5}
              />
            </div>
          </Step>

          <Step>
            <div className="onboarding-section" style={{ marginTop: 0 }}>
              <div className="onboarding-label">Suggested hobbies</div>
              <p className="onboarding-hint" style={{ marginTop: 0 }}>
                Swipe right to keep, left to skip. When you’re done, pick any of your kept hobbies to start.
              </p>

              <div className="domain-swipe-area">
                {visibleDeck.length > 0 ? (
                  <>
                    <div className="domain-card-stack">
                      <AnimatePresence>
                        {visibleDeck.slice(0, 3).map((hobby, idx) => (
                          <DomainHobbyCard
                            key={hobby.id}
                            hobby={hobby}
                            index={idx}
                            isTop={idx === 0}
                            onSwipe={handleDeckSwipe}
                          />
                        ))}
                      </AnimatePresence>
                    </div>

                    <div className="domain-swipe-actions">
                      <button
                        type="button"
                        className="action-btn skip"
                        onClick={() => handleDeckSwipe('left', visibleDeck[0])}
                        title="Skip"
                      >
                        ✗
                      </button>
                      <button
                        type="button"
                        className="action-btn like"
                        onClick={() => handleDeckSwipe('right', visibleDeck[0])}
                        title="Keep"
                      >
                        ✓
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="deck-done">
                    <div className="onboarding-hint" style={{ marginTop: 0 }}>
                      Done swiping. You kept {pickedIds.length} hobby{pickedIds.length === 1 ? '' : 'ies'}.
                    </div>
                  </div>
                )}
              </div>

              {/* Selected list */}
              {visibleDeck.length === 0 && pickedHobbies.length > 0 && (
                <div className="match-list" style={{ marginTop: 14 }}>
                  {pickedHobbies.map((hobby) => (
                    <div key={hobby.id} className="match-card">
                      <div className="match-title-row">
                        <h3 className="match-title">{hobby.name}</h3>
                        <div className="match-badges">
                          <span className={`badge ${hobby.is_online ? 'online' : ''}`}>
                            {hobby.is_online ? 'Online' : 'Offline'}
                          </span>
                          <span className="badge">{hobby.environment}</span>
                        </div>
                      </div>
                      <p className="match-desc">{hobby.description}</p>
                      <div className="match-actions">
                        <button
                          type="button"
                          className="btn-primary"
                          onClick={() => ensureOnboardingThenGo(`/focus/${hobby.id}?minutes=${timeMinutes}`)}
                        >
                          Start focus
                        </button>
                        {hobby.is_online && hobby.url && (
                          <a className="btn-ghost link-btn" href={hobby.url} target="_blank" rel="noreferrer">
                            Open link
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {visibleDeck.length === 0 && pickedHobbies.length === 0 && (
                <div className="deck-done" style={{ marginTop: 12 }}>
                  <div className="onboarding-hint" style={{ marginTop: 0 }}>
                    You skipped everything. Hit Previous to adjust preferences, or re-swipe by refreshing the page.
                  </div>
                </div>
              )}
            </div>
          </Step>
        </Stepper>
      </div>
    </div>
  );
}

