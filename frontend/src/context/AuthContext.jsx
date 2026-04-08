<<<<<<< HEAD
import { createContext, useContext, useState, useEffect } from 'react';
import { guestLogin as apiGuestLogin, register as apiRegister, login as apiLogin, getMe } from '../api';
=======
import { createContext, useContext, useState, useEffect } from "react";
import api from "../api/client";
>>>>>>> 1a62fd007f6a46adb16d418a975995921939f395

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
<<<<<<< HEAD
  const [token, setToken] = useState(localStorage.getItem('cc_token'));
  const [loading, setLoading] = useState(true);

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
          localStorage.removeItem('cc_user');
          setToken(null);
          setUser(null);
          setLoading(false);
        });
=======
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      api
        .get("/api/auth/me")
        .then((res) => setUser(res.data))
        .catch(() => {
          localStorage.removeItem("token");
          setToken(null);
        })
        .finally(() => setLoading(false));
>>>>>>> 1a62fd007f6a46adb16d418a975995921939f395
    } else {
      setLoading(false);
    }
  }, [token]);

<<<<<<< HEAD
  const saveSession = (data) => {
    localStorage.setItem('cc_token', data.token);
    localStorage.setItem('cc_user', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
  };

  const guestLogin = async (city = 'New York') => {
    const res = await apiGuestLogin(city);
    saveSession(res.data);
=======
  const login = async (email, password) => {
    const res = await api.post("/api/auth/login", { email, password });
    localStorage.setItem("token", res.data.token);
    setToken(res.data.token);
    setUser(res.data.user);
>>>>>>> 1a62fd007f6a46adb16d418a975995921939f395
    return res.data;
  };

  const register = async (email, password, city) => {
<<<<<<< HEAD
    const res = await apiRegister(email, password, city);
    saveSession(res.data);
    return res.data;
  };

  const login = async (email, password) => {
    const res = await apiLogin(email, password);
    saveSession(res.data);
=======
    const res = await api.post("/api/auth/register", { email, password, city });
    localStorage.setItem("token", res.data.token);
    setToken(res.data.token);
    setUser(res.data.user);
    return res.data;
  };

  const guestLogin = async () => {
    const res = await api.post("/api/auth/guest");
    localStorage.setItem("token", res.data.token);
    setToken(res.data.token);
    setUser(res.data.user);
>>>>>>> 1a62fd007f6a46adb16d418a975995921939f395
    return res.data;
  };

  const logout = () => {
<<<<<<< HEAD
    localStorage.removeItem('cc_token');
    localStorage.removeItem('cc_user');
=======
    localStorage.removeItem("token");
>>>>>>> 1a62fd007f6a46adb16d418a975995921939f395
    setToken(null);
    setUser(null);
  };

  return (
<<<<<<< HEAD
    <AuthContext.Provider value={{ user, token, loading, guestLogin, register, login, logout }}>
=======
    <AuthContext.Provider
      value={{ user, token, loading, login, register, guestLogin, logout }}
    >
>>>>>>> 1a62fd007f6a46adb16d418a975995921939f395
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
<<<<<<< HEAD
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
=======
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
>>>>>>> 1a62fd007f6a46adb16d418a975995921939f395
  return ctx;
}
