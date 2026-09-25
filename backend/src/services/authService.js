import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { Profile } from '../models/Profile.js';
import { Subscription } from '../models/Subscription.js';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'cinepulse_super_secret_jwt_key_2026_production_grade', {
    expiresIn: '30d',
  });
};

export const registerUser = async ({ name, email, password }) => {
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    const error = new Error('An account with this email already exists');
    error.statusCode = 400;
    throw error;
  }

  // Create user
  const user = await User.create({
    name,
    email,
    password,
  });

  // Create default primary profile
  const defaultProfile = await Profile.create({
    userId: user._id,
    name: name.split(' ')[0] || 'Primary',
    avatar: 'avatar-1',
    maturityRating: 'ALL',
    isKids: false,
  });

  user.profiles.push(defaultProfile._id);
  await user.save();

  // Create default subscription
  await Subscription.create({
    userId: user._id,
    plan: 'premium',
    status: 'active',
  });

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
  const user = await User.findOne({ email }).select('+password').populate('profiles');

  if (!user || !(await user.matchPassword(password))) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  // Ensure user has at least one profile
  if (!user.profiles || user.profiles.length === 0) {
    const newProfile = await Profile.create({
      userId: user._id,
      name: user.name.split(' ')[0] || 'User',
      avatar: 'avatar-1',
    });
    user.profiles.push(newProfile._id);
    await user.save();
    user.profiles = [newProfile];
  }

  const token = generateToken(user._id);

  return {
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      profiles: user.profiles,
    },
    activeProfile: user.profiles[0],
    token,
  };
};

export const getCurrentUser = async (userId) => {
  const user = await User.findById(userId).populate('profiles');
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }
  return user;
};
