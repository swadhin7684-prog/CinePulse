import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { Profile } from '../models/Profile.js';
import { sendError } from '../utils/response.js';

export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return sendError(res, 'Not authorized. No authentication token provided.', 401);
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'cinepulse_super_secret_jwt_key_2026_production_grade');
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return sendError(res, 'The user belonging to this token no longer exists.', 401);
    }

    req.user = user;

    // Optional active profile header
    const profileId = req.headers['x-profile-id'] || req.query.profileId;
    if (profileId) {
      const profile = await Profile.findOne({ _id: profileId, userId: user._id });
      if (profile) {
        req.profile = profile;
        req.profileId = profile._id;
      }
    }

    next();
  } catch (error) {
    return sendError(res, 'Not authorized. Invalid or expired token.', 401);
  }
};
