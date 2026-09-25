import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('cinepulse_token') || null);
  const [activeProfile, setActiveProfile] = useState(() => {
    const saved = localStorage.getItem('cinepulse_active_profile');
    try {
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showProfileSelector, setShowProfileSelector] = useState(false);

  // Load user data if token exists
  const loadUser = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const response = await api.get('/auth/me');
      const userData = response.data.user;
      setUser(userData);
      const userProfiles = userData.profiles || [];
      setProfiles(userProfiles);

      // Verify or assign active profile
      if (userProfiles.length > 0) {
        if (!activeProfile || !userProfiles.some((p) => p._id === activeProfile._id)) {
          const defaultProf = userProfiles[0];
          setActiveProfile(defaultProf);
          localStorage.setItem('cinepulse_active_profile', JSON.stringify(defaultProf));
        }
      }
    } catch (err) {
      console.warn('Failed to load user with current token:', err.message);
      logout();
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = async ({ email, password }) => {
    const response = await api.post('/auth/login', { email, password });
    const { token: newToken, user: userData, activeProfile: initialProfile } = response.data;

    localStorage.setItem('cinepulse_token', newToken);
    setToken(newToken);
    setUser(userData);
    setProfiles(userData.profiles || []);

    const selected = initialProfile || userData.profiles?.[0] || null;
    setActiveProfile(selected);
    if (selected) {
      localStorage.setItem('cinepulse_active_profile', JSON.stringify(selected));
    }

    return response.data;
  };

  const register = async ({ name, email, password, confirmPassword }) => {
    const response = await api.post('/auth/register', { name, email, password, confirmPassword });
    const { token: newToken, user: userData, activeProfile: initialProfile } = response.data;

    localStorage.setItem('cinepulse_token', newToken);
    setToken(newToken);
    setUser(userData);
    setProfiles(userData.profiles || []);

    const selected = initialProfile || userData.profiles?.[0] || null;
    setActiveProfile(selected);
    if (selected) {
      localStorage.setItem('cinepulse_active_profile', JSON.stringify(selected));
    }

    return response.data;
  };

  const logout = () => {
    localStorage.removeItem('cinepulse_token');
    localStorage.removeItem('cinepulse_active_profile');
    setToken(null);
    setUser(null);
    setActiveProfile(null);
    setProfiles([]);
    try {
      api.post('/auth/logout').catch(() => {});
    } catch (e) {}
  };

  const switchProfile = (profile) => {
    setActiveProfile(profile);
    localStorage.setItem('cinepulse_active_profile', JSON.stringify(profile));
    setShowProfileSelector(false);
  };

  const refreshProfiles = async () => {
    try {
      const response = await api.get('/profiles');
      const loaded = response.data.profiles || [];
      setProfiles(loaded);
      if (activeProfile) {
        const updated = loaded.find((p) => p._id === activeProfile._id);
        if (updated) {
          switchProfile(updated);
        } else if (loaded.length > 0) {
          switchProfile(loaded[0]);
        }
      }
      return loaded;
    } catch (err) {
      console.error('Failed to refresh profiles:', err);
    }
  };

  const value = {
    user,
    token,
    activeProfile,
    profiles,
    loading,
    isAuthenticated: !!token && !!user,
    isAdmin: user?.role === 'admin',
    showProfileSelector,
    setShowProfileSelector,
    login,
    register,
    logout,
    switchProfile,
    refreshProfiles,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
