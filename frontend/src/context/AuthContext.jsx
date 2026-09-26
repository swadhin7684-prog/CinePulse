import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth';
import { auth } from '../firebase';
import api from '../services/api';

const FIREBASE_API_KEY = import.meta.env?.VITE_FIREBASE_API_KEY || 'AIzaSyBWMNYEGemSziwv5C3JonVT0uLXdQuUc0w';

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
        // If user is unverified, enforce block and do NOT auto-login
        const isDemo =
          firebaseUser.email === 'admin@cinepulse.io' || firebaseUser.email === 'user@cinepulse.io';

        if (!firebaseUser.emailVerified && !isDemo) {
          try {
            await signOut(auth);
          } catch (e) {}
          if (isMounted) {
            localStorage.removeItem('cinepulse_token');
            localStorage.removeItem('cinepulse_active_profile');
            setUser(null);
            setToken(null);
            setLoading(false);
          }
          return;
        }

        try {
          const idToken = await firebaseUser.getIdToken();
          if (!isMounted) return;

          localStorage.setItem('cinepulse_token', idToken);
          setToken(idToken);

          // Construct user session object directly from Firebase Auth
          const fallbackUser = {
            _id: firebaseUser.uid,
            uid: firebaseUser.uid,
            name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
            email: firebaseUser.email,
            role: firebaseUser.email === 'admin@cinepulse.io' ? 'admin' : 'user',
            emailVerified: firebaseUser.emailVerified || isDemo,
            profiles: [
              {
                _id: 'default-profile',
                name: (firebaseUser.displayName || 'Primary').split(' ')[0],
                avatar: 'avatar-1',
                maturityRating: 'ALL',
                isKids: false,
              },
            ],
          };

          // Try optional backend profile sync without blocking if DB is unavailable
          try {
            const response = await api.get('/auth/me', {
              headers: { Authorization: `Bearer ${idToken}` },
            });
            const userData = response.data?.user || response.data?.data?.user;
            if (userData && isMounted) {
              setUser({ ...fallbackUser, ...userData });
              setProfiles(userData.profiles || fallbackUser.profiles);
            } else if (isMounted) {
              setUser(fallbackUser);
              setProfiles(fallbackUser.profiles);
            }
          } catch {
            if (isMounted) {
              setUser(fallbackUser);
              setProfiles(fallbackUser.profiles);
            }
          }

          if (isMounted) {
            const currentActive = localStorage.getItem('cinepulse_active_profile');
            let parsedActive = null;
            try {
              parsedActive = currentActive ? JSON.parse(currentActive) : null;
            } catch (e) {}

            if (!parsedActive) {
              setActiveProfile(fallbackUser.profiles[0]);
              localStorage.setItem(
                'cinepulse_active_profile',
                JSON.stringify(fallbackUser.profiles[0])
              );
            }
          }
        } catch (err) {
          console.warn('[AuthContext] Session restore note:', err.message);
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
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  /**
   * Resend Verification Email using Firebase Authentication
   */
  const resendVerification = async ({ email, password, idToken }) => {
    // Method 1: Using Firebase Identity Toolkit REST API with idToken
    if (idToken) {
      try {
        const response = await fetch(
          `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${FIREBASE_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ requestType: 'VERIFY_EMAIL', idToken }),
          }
        );
        if (response.ok) return true;
      } catch (e) {
        console.warn('REST sendOobCode attempt failed, trying SDK fallback...');
      }
    }

    // Method 2: If email & password provided, authenticate briefly to resend
    if (email && password) {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
      await sendEmailVerification(cred.user);
      await signOut(auth);
      return true;
    }

    // Method 3: If current user instance exists
    if (auth.currentUser) {
      await sendEmailVerification(auth.currentUser);
      return true;
    }

    throw new Error('Unable to resend verification email. Please try logging in again.');
  };

  /**
   * Register: Firebase Auth ONLY
   * - Create account in Firebase Auth
   * - Send verification email
   * - Do NOT auto-login
   * - Sign out immediately
   * - No Firestore / No DB required
   */
  const register = async ({ name, email, password, confirmPassword }) => {
    if (password !== confirmPassword) {
      throw new Error('Passwords do not match');
    }

    // 1. Create account in Firebase Authentication
    const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
    const firebaseUser = userCredential.user;

    // 2. Set user display name
    try {
      await updateProfile(firebaseUser, { displayName: name.trim() });
    } catch (e) {}

    // 3. Send verification email via Firebase Auth
    await sendEmailVerification(firebaseUser);
    const idToken = await firebaseUser.getIdToken();

    // 4. Do NOT auto-login! Sign out immediately as requested!
    await signOut(auth);

    // 5. Clear any active session state
    localStorage.removeItem('cinepulse_token');
    localStorage.removeItem('cinepulse_active_profile');
    setUser(null);
    setToken(null);
    setActiveProfile(null);

    return {
      email: email.trim(),
      idToken,
      verificationSent: true,
    };
  };

  /**
   * Login: Firebase Auth ONLY
   * - Check if email is verified
   * - If not verified: block + sign out + throw error with info
   * - If verified: issue session
   */
  const login = async ({ email, password }) => {
    // 1. Authenticate with Firebase Authentication
    const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
    const firebaseUser = userCredential.user;

    const isDemo =
      email.trim().toLowerCase() === 'admin@cinepulse.io' ||
      email.trim().toLowerCase() === 'user@cinepulse.io';

    // 2. Check email verification status
    if (!firebaseUser.emailVerified && !isDemo) {
      // Capture idToken for resend before signing out
      let capturedIdToken = null;
      try {
        capturedIdToken = await firebaseUser.getIdToken();
      } catch (e) {}

      // Block login and sign out immediately
      await signOut(auth);
      localStorage.removeItem('cinepulse_token');
      localStorage.removeItem('cinepulse_active_profile');
      setUser(null);
      setToken(null);
      setActiveProfile(null);

      const err = new Error('EMAIL_NOT_VERIFIED');
      err.code = 'auth/email-not-verified';
      err.email = email.trim();
      err.idToken = capturedIdToken;
      throw err;
    }

    // 3. Email is verified! Proceed with login
    const idToken = await firebaseUser.getIdToken();
    localStorage.setItem('cinepulse_token', idToken);
    setToken(idToken);

    const userData = {
      _id: firebaseUser.uid,
      uid: firebaseUser.uid,
      name: firebaseUser.displayName || email.split('@')[0],
      email: firebaseUser.email,
      role: email.toLowerCase() === 'admin@cinepulse.io' ? 'admin' : 'user',
      emailVerified: true,
      profiles: [
        {
          _id: 'default-profile',
          name: (firebaseUser.displayName || 'Primary').split(' ')[0],
          avatar: 'avatar-1',
          maturityRating: 'ALL',
          isKids: false,
        },
      ],
    };

    // Optional background sync with backend
    try {
      const response = await api.post(
        '/auth/login',
        { idToken },
        { headers: { Authorization: `Bearer ${idToken}` } }
      );
      const payload = response.data || response;
      if (payload?.user) {
        userData.profiles = payload.user.profiles || userData.profiles;
        if (payload.activeProfile) {
          userData.activeProfile = payload.activeProfile;
        }
      }
    } catch (e) {
      // No DB dependency: Proceed smoothly if backend DB is offline
    }

    setUser(userData);
    setProfiles(userData.profiles);
    const primary = userData.activeProfile || userData.profiles[0];
    setActiveProfile(primary);
    localStorage.setItem('cinepulse_active_profile', JSON.stringify(primary));

    return { user: userData, token: idToken, activeProfile: primary };
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
    } catch (e) {}

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
    } catch (err) {}
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
    resendVerification,
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
