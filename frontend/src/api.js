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

// ── Hobbies / Swipe ──────────────────────────────────────────
export const getNextHobby = (userId) =>
  api.get(`/api/hobbies/next?user_id=${userId}`);

export const recordSwipe = (userId, hobbyId, action) =>
  api.post('/api/swipe', { user_id: userId, hobby_id: hobbyId, action });

export const getLikedHobbies = (userId) =>
  api.get(`/api/hobbies/liked?user_id=${userId}`);

// ── Buddy ────────────────────────────────────────────────────
export const getBuddySuggestion = (userId, message = '') =>
  api.post('/api/buddy/suggest', { user_id: userId, message });

export const getBuddyChatReply = (message = '') =>
  api.post('/api/buddy/chat', { message });

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
