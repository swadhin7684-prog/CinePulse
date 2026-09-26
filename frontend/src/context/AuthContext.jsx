import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth';
import { auth } from '../firebase';
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

  // Synchronize authentication state on page load and token changes
  useEffect(() => {
    let isMounted = true;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const idToken = await firebaseUser.getIdToken();
          if (!isMounted) return;

          localStorage.setItem('cinepulse_token', idToken);
          setToken(idToken);

          const response = await api.get('/auth/me', {
            headers: { Authorization: `Bearer ${idToken}` },
          });

          if (!isMounted) return;
          const userData = response.data?.user || response.data?.data?.user;
          if (userData) {
            setUser(userData);
            const userProfiles = userData.profiles || [];
            setProfiles(userProfiles);

            if (userProfiles.length > 0) {
              const currentActive = localStorage.getItem('cinepulse_active_profile');
              let parsedActive = null;
              try {
                parsedActive = currentActive ? JSON.parse(currentActive) : null;
              } catch (e) {}

              if (!parsedActive || !userProfiles.some((p) => p._id === parsedActive._id)) {
                const defaultProf = userProfiles[0];
                setActiveProfile(defaultProf);
                localStorage.setItem('cinepulse_active_profile', JSON.stringify(defaultProf));
              }
            }
          }
        } catch (err) {
          console.warn('[AuthContext] Session refresh note:', err.message);
        } finally {
          if (isMounted) setLoading(false);
        }
      } else {
        // Fallback for direct token in localStorage if Firebase Auth hasn't restored yet
        const localToken = localStorage.getItem('cinepulse_token');
        if (localToken) {
          try {
            const response = await api.get('/auth/me');
            if (!isMounted) return;
            const userData = response.data?.user || response.data?.data?.user;
            if (userData) {
              setUser(userData);
              setProfiles(userData.profiles || []);
            }
          } catch (e) {
            localStorage.removeItem('cinepulse_token');
            localStorage.removeItem('cinepulse_active_profile');
            if (isMounted) {
              setToken(null);
              setUser(null);
            }
          } finally {
            if (isMounted) setLoading(false);
          }
        } else {
          if (isMounted) {
            setUser(null);
            setToken(null);
            setLoading(false);
          }
        }
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const login = async ({ email, password }) => {
    // 1. Authenticate directly with Firebase Authentication
    const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
    const firebaseUser = userCredential.user;
    const idToken = await firebaseUser.getIdToken();

    // 2. Persist Firebase ID token
    localStorage.setItem('cinepulse_token', idToken);
    setToken(idToken);

    // 3. Sync with backend /auth/login with verified Firebase ID token
    const response = await api.post(
      '/auth/login',
      { idToken },
      {
        headers: { Authorization: `Bearer ${idToken}` },
      }
    );

    const payload = response.data || response;
    const { user: userData, activeProfile: initialProfile } = payload;

    setUser(userData);
    setProfiles(userData.profiles || []);

    const selected = initialProfile || userData.profiles?.[0] || null;
    setActiveProfile(selected);
    if (selected) {
      localStorage.setItem('cinepulse_active_profile', JSON.stringify(selected));
    }

    return payload;
  };

  const register = async ({ name, email, password, confirmPassword }) => {
    if (password !== confirmPassword) {
      throw new Error('Passwords do not match');
    }

    // 1. Create user in Firebase Authentication
    const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
    const firebaseUser = userCredential.user;

    // 2. Set Firebase Auth display name
    try {
      await updateProfile(firebaseUser, { displayName: name.trim() });
    } catch (e) {
      console.warn('Could not set displayName on Firebase Auth user:', e.message);
    }

    // 3. Obtain Firebase ID token
    const idToken = await firebaseUser.getIdToken();
    localStorage.setItem('cinepulse_token', idToken);
    setToken(idToken);

    // 4. Create/update Firestore users/{firebaseUid} via backend
    const response = await api.post(
      '/auth/register',
      {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        uid: firebaseUser.uid,
        idToken,
      },
      {
        headers: { Authorization: `Bearer ${idToken}` },
      }
    );

    const payload = response.data || response;
    const { user: userData, activeProfile: initialProfile } = payload;

    setUser(userData);
    setProfiles(userData.profiles || []);

    const selected = initialProfile || userData.profiles?.[0] || null;
    setActiveProfile(selected);
    if (selected) {
      localStorage.setItem('cinepulse_active_profile', JSON.stringify(selected));
    }

    return payload;
  };

  const logout = async () => {
    localStorage.removeItem('cinepulse_token');
    localStorage.removeItem('cinepulse_active_profile');
    setToken(null);
    setUser(null);
    setActiveProfile(null);
    setProfiles([]);

    try {
      await signOut(auth);
    } catch (e) {
      console.warn('[Firebase Auth] SignOut error:', e.message);
    }

    try {
      await api.post('/auth/logout');
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
      const loaded = response.data?.profiles || response.data || [];
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
