import * as dbService from './firestoreDb.js';
import { getAdminAuth } from '../config/firebase.js';

const FIREBASE_WEB_API_KEY = process.env.VITE_FIREBASE_API_KEY || 'AIzaSyBWMNYEGemSziwv5C3JonVT0uLXdQuUc0w';

/**
 * Helper to call Firebase Auth Identity Toolkit REST API
 */
const firebaseAuthRequest = async (endpoint, payload) => {
  const url = `https://identitytoolkit.googleapis.com/v1/accounts:${endpoint}?key=${FIREBASE_WEB_API_KEY}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...payload, returnSecureToken: true }),
  });

  const data = await response.json();
  if (!response.ok) {
    const errorMsg = data.error?.message || 'Authentication error';
    const err = new Error(errorMsg);
    err.code = data.error?.code || response.status;
    err.details = data.error;
    throw err;
  }
  return data;
};

/**
 * Register a user via Firebase Authentication & create Firestore document
 */
export const registerUser = async ({ name, email, password, uid, idToken }) => {
  const normalizedEmail = (email || '').toLowerCase().trim();
  let firebaseUid = uid;
  let activeIdToken = idToken;

  // 1. Authenticate / Create user in Firebase Authentication
  if (activeIdToken) {
    // ID token was provided by frontend (which created user with Firebase Client SDK)
    const adminAuth = getAdminAuth();
    if (adminAuth) {
      const decoded = await adminAuth.verifyIdToken(activeIdToken);
      firebaseUid = decoded.uid;
    }
  } else if (password) {
    // If password provided without token, register through Firebase Auth Identity Toolkit API
    try {
      const authResult = await firebaseAuthRequest('signUp', {
        email: normalizedEmail,
        password,
      });
      firebaseUid = authResult.localId;
      activeIdToken = authResult.idToken;
      console.log(`[Firebase Auth] Successfully registered user: ${normalizedEmail} (UID: ${firebaseUid})`);
    } catch (authErr) {
      if (authErr.message?.includes('EMAIL_EXISTS')) {
        const error = new Error('An account with this email already exists');
        error.statusCode = 400;
        throw error;
      }
      const error = new Error(authErr.message || 'Firebase Authentication registration failed');
      error.statusCode = 400;
      throw error;
    }
  } else {
    const error = new Error('Firebase ID token or password required for registration');
    error.statusCode = 400;
    throw error;
  }

  // 2. Create or verify Firestore User Document (users/{firebaseUid})
  // Requirement: Store fields: uid, name, email, role, profiles, createdAt, updatedAt.
  // NO PASSWORDS in Firestore!
  let user = await dbService.findById('users', firebaseUid);
  const now = new Date();

  if (!user) {
    const role = normalizedEmail === 'admin@cinepulse.io' ? 'admin' : 'user';
    const userDocData = {
      uid: firebaseUid,
      _id: firebaseUid,
      name: (name || 'Streamer').trim(),
      email: normalizedEmail,
      role,
      profiles: [],
      createdAt: now,
      updatedAt: now,
    };

    user = await dbService.setDoc('users', firebaseUid, userDocData, { merge: true });
    console.log(`[Firestore] Created permanent user document: users/${firebaseUid}`);
  }

  // 3. Create Default Profile if user has none
  let profiles = await dbService.findAll('profiles', { userId: firebaseUid }, ['createdAt']);
  let defaultProfile = profiles?.[0];

  if (!profiles || profiles.length === 0) {
    defaultProfile = await dbService.createDoc('profiles', {
      userId: firebaseUid,
      name: (name || user.name || 'Primary').trim().split(' ')[0],
      avatar: 'avatar-1',
      language: 'en',
      maturityRating: 'ALL',
      isKids: false,
    });

    await dbService.updateDoc('users', firebaseUid, {
      profiles: [defaultProfile._id],
    });
    profiles = [defaultProfile];
  }

  // 4. Create Default Subscription if not exists
  const existingSub = await dbService.findOne('subscriptions', { userId: firebaseUid });
  if (!existingSub) {
    await dbService.createDoc('subscriptions', {
      userId: firebaseUid,
      plan: 'premium',
      status: 'active',
      startDate: now,
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      maxProfiles: 5,
    });
  }

  return {
    user: {
      _id: firebaseUid,
      uid: firebaseUid,
      name: user.name || name || 'Streamer',
      email: normalizedEmail,
      role: user.role || 'user',
      profiles,
    },
    activeProfile: defaultProfile,
    token: activeIdToken,
  };
};

/**
 * Login user via Firebase Authentication & verify ID token
 */
export const loginUser = async ({ email, password, idToken }) => {
  const normalizedEmail = (email || '').toLowerCase().trim();
  let firebaseUid = null;
  let activeIdToken = idToken;

  // 1. Authenticate with Firebase Authentication
  if (activeIdToken) {
    // If token passed (frontend client already authenticated)
    const adminAuth = getAdminAuth();
    if (adminAuth) {
      const decoded = await adminAuth.verifyIdToken(activeIdToken);
      firebaseUid = decoded.uid;
    }
  } else if (email && password) {
    // Authenticate through Firebase Auth Identity Toolkit API
    try {
      const authResult = await firebaseAuthRequest('signInWithPassword', {
        email: normalizedEmail,
        password,
      });
      firebaseUid = authResult.localId;
      activeIdToken = authResult.idToken;
      console.log(`[Firebase Auth] Successfully authenticated user: ${normalizedEmail} (UID: ${firebaseUid})`);
    } catch (authErr) {
      console.warn(`[Firebase Auth] Login failed for ${normalizedEmail}:`, authErr.message);
      const error = new Error('Invalid email or password');
      error.statusCode = 401;
      throw error;
    }
  } else {
    const error = new Error('Please provide email and password, or a Firebase ID token');
    error.statusCode = 400;
    throw error;
  }

  // 2. Fetch User document from Firestore: users/{firebaseUid}
  let user = await dbService.findById('users', firebaseUid);

  if (!user) {
    // Auto-provision user document if created via Firebase Console
    const role = normalizedEmail === 'admin@cinepulse.io' ? 'admin' : 'user';
    const now = new Date();
    user = await dbService.setDoc(
      'users',
      firebaseUid,
      {
        uid: firebaseUid,
        _id: firebaseUid,
        name: normalizedEmail.split('@')[0],
        email: normalizedEmail,
        role,
        profiles: [],
        createdAt: now,
        updatedAt: now,
      },
      { merge: true }
    );
  }

  // 3. Fetch User Profiles
  let profiles = await dbService.findAll('profiles', { userId: firebaseUid }, ['createdAt']);

  if (!profiles || profiles.length === 0) {
    const newProfile = await dbService.createDoc('profiles', {
      userId: firebaseUid,
      name: user.name?.split(' ')[0] || 'User',
      avatar: 'avatar-1',
      language: 'en',
      maturityRating: 'ALL',
      isKids: false,
    });
    await dbService.updateDoc('users', firebaseUid, {
      profiles: [newProfile._id],
    });
    profiles = [newProfile];
  }

  return {
    user: {
      _id: firebaseUid,
      uid: firebaseUid,
      name: user.name,
      email: user.email,
      role: user.role,
      profiles,
    },
    activeProfile: profiles[0],
    token: activeIdToken,
  };
};

/**
 * Get current user by Firebase UID
 */
export const getCurrentUser = async (userId) => {
  const user = await dbService.findById('users', userId);
  if (!user) {
    const error = new Error('User not found in Firestore');
    error.statusCode = 404;
    throw error;
  }

  const profiles = await dbService.findAll('profiles', { userId: user._id || user.uid }, ['createdAt']);

  return {
    _id: user._id || user.uid,
    uid: user.uid || user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    profiles,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
};
