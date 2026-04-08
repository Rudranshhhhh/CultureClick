import { createContext, useContext, useState, useEffect } from 'react';
import { guestLogin as apiGuestLogin, register as apiRegister, login as apiLogin, firebaseLogin as apiFirebaseLogin, getMe } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('cc_token'));
  const [loading, setLoading] = useState(true);

  const refreshMe = async () => {
    if (!token) return null;
    const res = await getMe();
    setUser(res.data);
    return res.data;
  };

  // Restore session on mount
  useEffect(() => {
    if (token) {
      getMe()
        .then((res) => {
          setUser(res.data);
          setLoading(false);
        })
        .catch(() => {
          // Token expired or invalid
          localStorage.removeItem('cc_token');
          setToken(null);
          setUser(null);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [token]);

  const saveSession = (data) => {
    localStorage.setItem('cc_token', data.token);
    setToken(data.token);
    setUser(data.user);
  };

  const guestLogin = async (city = 'New York') => {
    const res = await apiGuestLogin(city);
    saveSession(res.data);
    return res.data;
  };

  const register = async (email, password, city) => {
    const res = await apiRegister(email, password, city);
    saveSession(res.data);
    return res.data;
  };

  const login = async (email, password) => {
    const res = await apiLogin(email, password);
    saveSession(res.data);
    return res.data;
  };

  const firebaseLogin = async (idToken) => {
    const res = await apiFirebaseLogin(idToken);
    saveSession(res.data);
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('cc_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, guestLogin, register, login, firebaseLogin, logout, refreshMe }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
