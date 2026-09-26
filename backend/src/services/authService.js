import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import * as dbService from './firestoreDb.js';
import { getAdminAuth } from '../config/firebase.js';

const generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET || 'cinepulse_super_secret_jwt_key_2026_production_grade',
    { expiresIn: '30d' }
  );
};

export const registerUser = async ({ name, email, password }) => {
  const normalizedEmail = email ? email.toLowerCase().trim() : '';

  // Check if email already exists
  const existingUser = await dbService.findOne('users', { email: normalizedEmail });
  if (existingUser) {
    const error = new Error('An account with this email already exists');
    error.statusCode = 400;
    throw error;
  }

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // 1. Create User
  const user = await dbService.createDoc('users', {
    name: name.trim(),
    email: normalizedEmail,
    password: hashedPassword,
    role: 'user',
    profiles: [],
  });

  // 2. Create Default Profile
  const defaultProfile = await dbService.createDoc('profiles', {
    userId: user._id,
    name: name.trim().split(' ')[0] || 'Primary',
    avatar: 'avatar-1',
    language: 'en',
    maturityRating: 'ALL',
    isKids: false,
  });

  // Update user with profile id
  await dbService.updateDoc('users', user._id, {
    profiles: [defaultProfile._id],
  });

  // 3. Create Default Subscription
  await dbService.createDoc('subscriptions', {
    userId: user._id,
    plan: 'premium',
    status: 'active',
    startDate: new Date(),
    endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    maxProfiles: 5,
  });

  // 4. Optionally sync to Firebase Authentication (so it shows in Firebase Console Users tab)
  const adminAuth = getAdminAuth();
  if (adminAuth) {
    try {
      await adminAuth.createUser({
        uid: user._id,
        email: normalizedEmail,
        password: password,
        displayName: name.trim(),
      });
      console.log('[Firebase Auth] User synced to Firebase Console:', normalizedEmail);
    } catch (authErr) {
      console.warn('[Firebase Auth] Notice:', authErr.message);
    }
  }

  const token = generateToken(user._id);

  return {
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      profiles: [defaultProfile],
    },
    activeProfile: defaultProfile,
    token,
  };
};

export const loginUser = async ({ email, password }) => {
  const normalizedEmail = email ? email.toLowerCase().trim() : '';
  const user = await dbService.findOne('users', { email: normalizedEmail });

  if (!user || !user.password) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  // Fetch user profiles
  let profiles = await dbService.findAll('profiles', { userId: user._id }, ['createdAt']);

  if (!profiles || profiles.length === 0) {
    const newProfile = await dbService.createDoc('profiles', {
      userId: user._id,
      name: user.name.split(' ')[0] || 'User',
      avatar: 'avatar-1',
      language: 'en',
      maturityRating: 'ALL',
      isKids: false,
    });
    await dbService.updateDoc('users', user._id, {
      profiles: [newProfile._id],
    });
    profiles = [newProfile];
  }

  const token = generateToken(user._id);

  // Strip password from returned user object
  const { password: _, ...userSafe } = user;

  return {
    user: {
      ...userSafe,
      profiles,
    },
    activeProfile: profiles[0],
    token,
  };
};

export const getCurrentUser = async (userId) => {
  const user = await dbService.findById('users', userId);
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  const profiles = await dbService.findAll('profiles', { userId: user._id }, ['createdAt']);
  const { password: _, ...userSafe } = user;

  return {
    ...userSafe,
    profiles,
  };
};
