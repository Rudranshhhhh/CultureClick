import hobbiesData from '../data/hobbies.json';

export function getAllDomainHobbies() {
  return hobbiesData?.hobbies || [];
}

/**
 * Shape used by FocusSession: stable `id`, online/offline flags, environment.
 * Accepts a domain JSON hobby (`id`) or an API hobby (`_id`).
 */
export function normalizeHobbyForFocus(raw) {
  if (!raw) return null;
  if (raw.id && !raw._id) {
    return {
      id: raw.id,
      name: raw.name || 'Hobby',
      description: raw.description || '',
      url: raw.url || '',
      is_online: !!raw.is_online,
      environment: raw.environment || 'either',
      interest_type: Array.isArray(raw.interest_type) ? raw.interest_type : [],
    };
  }
  const id = String(raw._id ?? '');
  return {
    id,
    name: raw.name || 'Hobby',
    description: raw.description || '',
    url: raw.url || '',
    is_online: !!raw.is_online,
    environment: raw.environment || 'either',
    interest_type: Array.isArray(raw.interest_type)
      ? raw.interest_type
      : raw.category
        ? [raw.category]
        : [],
  };
}

export function buildDomainProfile({ categories = [], tags = [], indoor = 'either', timeMinutes = 30, notes = '', mode = [] }) {
  return {
    categories,
    tags,
    indoor,
    timeMinutes: Number(timeMinutes),
    notes,
    mode,
    createdAt: new Date().toISOString(),
  };
}

export function scoreHobby(hobby, profile) {
  let score = 0;

  const hobbyInterests = hobby.interest_type || [];
  const hobbyStyles = hobby.style || [];
  const hobbyMode = hobby.mode || [];

  // Category overlap (strong)
  for (const c of profile.categories || []) {
    if (hobbyInterests.includes(c)) score += 6;
  }

  // Environment match
  if (profile.indoor && profile.indoor !== 'either') {
    if (hobby.environment === profile.indoor) score += 4;
    if (hobby.environment === 'either') score += 2;
  }

  // Style overlap
  for (const t of profile.tags || []) {
    if (hobbyStyles.includes(t)) score += 3;
  }

  // Mode overlap
  for (const m of profile.mode || []) {
    if (hobbyMode.includes(m)) score += 2;
  }

  // Time fit
  const range = hobby.time_minutes || [];
  if (range.length === 2) {
    const [min, max] = range;
    const tm = Number(profile.timeMinutes);
    if (tm >= min && tm <= max) score += 5;
    else if (Math.abs(tm - min) <= 10 || Math.abs(tm - max) <= 10) score += 2;
  }

  // Free-text hinting: very lightweight keyword bump (optional)
  const notes = String(profile.notes || '').toLowerCase();
  if (notes) {
    const name = String(hobby.name || '').toLowerCase();
    if (name && notes.includes(name.split(' ')[0])) score += 1;
    if (hobby.goal && notes.includes(String(hobby.goal).toLowerCase().split(' ')[0])) score += 1;
  }

  return score;
}

export function matchHobbies(profile, { limit = 8 } = {}) {
  const hobbies = getAllDomainHobbies();
  const scored = hobbies.map((h) => ({ hobby: h, score: scoreHobby(h, profile) }));
  scored.sort((a, b) => b.score - a.score);

  // If all are 0, still return a reasonable default ordering (keep stable)
  const best = scored[0]?.score || 0;
  const finalList = best > 0 ? scored : scored.map((x) => ({ ...x, score: 1 }));

  return finalList.slice(0, limit);
}

export function saveDomainProfile(profile) {
  localStorage.setItem('cc_domain_profile', JSON.stringify(profile));
}

export function loadDomainProfile() {
  try {
    const raw = localStorage.getItem('cc_domain_profile');
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

