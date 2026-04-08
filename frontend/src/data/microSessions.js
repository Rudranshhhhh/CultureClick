// Lightweight, frontend-only micro-sessions.
// Can be replaced later by API-driven templates.

function normalizeKey(s) {
  return String(s || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

export function getMicroSessionForHobby(hobby) {
  const name = hobby?.name || '';
  const key = normalizeKey(name);
  const category = hobby?.category || '';
  const tags = hobby?.tags || [];

  const sessionsByName = {
    'zentangle patterns': {
      title: 'Zentangle (10 min)',
      minutes: 10,
      steps: [
        'Grab paper + a pen/marker. Set a 10 minute timer.',
        'Draw a light border and one simple “string” line to divide the page.',
        'Fill one section with dots (vary spacing).',
        'Fill another section with parallel lines; add a second layer crossing at an angle.',
        'Pick one section and repeat a tiny shape (leaf / teardrop / triangle).',
        'Add 30 seconds of shading on one edge of each section.',
        'Take a quick photo of your page (optional).',
      ],
      tags: ['tactile', 'calming', 'beginner-friendly'],
      indoor: true,
      weather: ['any'],
    },
    'micro-essays (daily 100 words)': {
      title: 'Micro-essay (8 min)',
      minutes: 8,
      steps: [
        'Pick a prompt: “Today I noticed…”, “A small win…”, or “One thing I’m avoiding…”',
        'Write 100 words without stopping (spelling doesn’t matter).',
        'Underline 1 sentence you like.',
        'Give it a title (3–5 words).',
        'Optional: write 1 next action you can do in 2 minutes.',
      ],
      tags: ['streak-ready', 'writing'],
      indoor: true,
      weather: ['any'],
    },
    'breathwork (pranayama)': {
      title: 'Breath reset (6 min)',
      minutes: 6,
      steps: [
        'Sit comfortably. Set a 6 minute timer.',
        'Breathe in through the nose for 4 counts, out for 6 counts (repeat 10 breaths).',
        'Relax shoulders + jaw. Keep exhale longer than inhale.',
        'Last minute: scan body (forehead, eyes, throat, chest) and soften.',
        'Drink a glass of water when done.',
      ],
      tags: ['evidence-based', 'mindfulness', 'grounding'],
      indoor: true,
      weather: ['any'],
    },
    'photography basics': {
      title: 'Photo walk (12 min)',
      minutes: 12,
      steps: [
        'Set a 12 minute timer. Use your phone camera.',
        'Take 3 photos of “lines” (stairs, shadows, rails).',
        'Take 3 photos of “texture” (wood, fabric, leaves).',
        'Take 3 photos of “light” (window light / golden hour / reflections).',
        'Pick your favorite and crop it slightly.',
      ],
      tags: ['beginner-friendly', 'outdoor-optional'],
      indoor: false,
      weather: ['clear', 'clouds', 'any'],
    },
    'origami': {
      title: 'Origami: paper crane warm-up (15 min)',
      minutes: 15,
      steps: [
        'Find a square sheet of paper (or cut one).',
        'Make 2 diagonal folds, then unfold to show creases.',
        'Fold into a triangle base (waterbomb base) slowly and sharply.',
        'Do one “reverse fold” carefully; repeat on the other side.',
        'Form the head and tail with small reverse folds.',
        'Gently pull the wings down.',
        'Write the date on the back and keep it somewhere visible.',
      ],
      tags: ['tactile', 'calming', 'beginner-friendly'],
      indoor: true,
      weather: ['any'],
    },
  };

  if (sessionsByName[key]) return sessionsByName[key];

  // Generic fallback so "Do this now" works for any hobby.
  const genericMinutes = 10;
  const indoorGuess =
    hobby?.indoor !== undefined ? Boolean(hobby.indoor) : category.toLowerCase().includes('nature') ? false : true;

  return {
    title: `${name || 'Mini session'} (${genericMinutes} min)`,
    minutes: genericMinutes,
    steps: [
      'Set a 10 minute timer.',
      `Do a tiny, beginner version of “${name || 'this hobby'}” for 8 minutes.`,
      'Last 2 minutes: write 1 thing you enjoyed + 1 thing to try next time.',
    ],
    tags,
    indoor: indoorGuess,
    weather: ['any'],
  };
}

