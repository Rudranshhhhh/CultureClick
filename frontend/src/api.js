import axios from 'axios';

const API_BASE = 'http://localhost:5000';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('cc_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Auth ──────────────────────────────────────────────────────
export const guestLogin = (city = 'New York') =>
  api.post('/api/auth/guest', { city });

export const register = (email, password, city) =>
  api.post('/api/auth/register', { email, password, city });

export const login = (email, password) =>
  api.post('/api/auth/login', { email, password });

export const firebaseLogin = (idToken) =>
  api.post('/api/auth/firebase', { idToken });

export const getMe = () =>
  api.get('/api/auth/me');

// ── Onboarding ────────────────────────────────────────────────
export const saveOnboardingPreferences = (answers) =>
  api.post('/api/onboarding/preferences', { answers });

export const skipOnboarding = () =>
  api.post('/api/onboarding/skip');

// ── Hobbies / Swipe ──────────────────────────────────────────
export const getNextHobby = (userId) =>
  api.get(`/api/hobbies/next?user_id=${userId}`);

export const getAllHobbies = () =>
  api.get('/api/hobbies/all');

export const getHobbyById = (hobbyId) =>
  api.get(`/api/hobbies/item/${encodeURIComponent(hobbyId)}`);

export const recordSwipe = (userId, hobbyId, action) =>
  api.post('/api/swipe', { user_id: userId, hobby_id: hobbyId, action });

export const getLikedHobbies = (userId) =>
  api.get(`/api/hobbies/liked?user_id=${userId}`);

export const getSelectedHobbies = () =>
  api.get('/api/hobbies/selected');

export const addSelectedHobby = (hobbyId) =>
  api.post('/api/hobbies/selected', { hobby_id: hobbyId });

export const removeSelectedHobby = (hobbyId) =>
  api.delete(`/api/hobbies/selected/${hobbyId}`);

export const getDoNowTracks = () =>
  api.get('/api/hobbies/do-now');

export const startDoNowTrack = (hobbyId, targetDays) =>
  api.post('/api/hobbies/do-now/start', { hobby_id: hobbyId, target_days: targetDays });

export const checkinDoNowTrack = (trackId) =>
  api.post(`/api/hobbies/do-now/${trackId}/checkin`);

export const extendDoNowTrack = (trackId, extraDays) =>
  api.post(`/api/hobbies/do-now/${trackId}/extend`, { extra_days: extraDays });

export const completeDoNowTrack = (trackId) =>
  api.post(`/api/hobbies/do-now/${trackId}/complete`);

// ── Buddy ────────────────────────────────────────────────────
export const getBuddySuggestion = (userId, message = '') =>
  api.post('/api/buddy/suggest', { user_id: userId, message });

export const getBuddyChatReply = (message = '') =>
  api.post('/api/buddy/chat', { message });

export const getBuddyContext = () =>
  api.get('/api/buddy/context');

export const getBuddyFocusSetup = (hobbyName) =>
  api.post('/api/buddy/focus-setup', { hobby_name: hobbyName });

// ── Memories ─────────────────────────────────────────────────
export const getMemories = (userId) =>
  api.get(`/api/memories?user_id=${userId}`);

export const createMemory = (userId, hobbyId, note, rating, photoUrl = '', extras = {}) =>
  api.post('/api/memories', {
    user_id: userId,
    hobby_id: hobbyId,
    ...extras,
    note,
    rating,
    photo_url: photoUrl,
  });

export const deleteMemory = (memoryId) =>
  api.delete(`/api/memories/${memoryId}`);

export default api;
