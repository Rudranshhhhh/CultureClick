export function createDistractionTracker({ graceMs = 10000, onBreak } = {}) {
  let hiddenAt = null;
  let breaks = 0;

  const onHidden = () => {
    if (hiddenAt) return;
    hiddenAt = Date.now();
  };

  const onVisible = () => {
    if (!hiddenAt) return { broke: false, breaks };
    const delta = Date.now() - hiddenAt;
    hiddenAt = null;
    if (delta > graceMs) {
      breaks += 1;
      onBreak?.({ breaks, deltaMs: delta, graceMs });
      return { broke: true, breaks, deltaMs: delta };
    }
    return { broke: false, breaks, deltaMs: delta };
  };

  const handleVisibilityChange = () => {
    if (document.visibilityState === 'hidden') onHidden();
    if (document.visibilityState === 'visible') onVisible();
  };

  const handleBlur = () => onHidden();
  const handleFocus = () => onVisible();

  const start = () => {
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
  };

  const stop = () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    window.removeEventListener('blur', handleBlur);
    window.removeEventListener('focus', handleFocus);
  };

  const snapshot = () => ({ breaks, hiddenAt });

  return { start, stop, snapshot, onHidden, onVisible };
}

