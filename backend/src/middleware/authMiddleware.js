import { getAdminAuth } from '../config/firebase.js';
import * as dbService from '../services/firestoreDb.js';
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
    const adminAuth = getAdminAuth();
    if (!adminAuth) {
      return sendError(res, 'Authentication service currently unavailable.', 500);
    }

    const decoded = await adminAuth.verifyIdToken(token);
    const uid = decoded.uid;

    let user = await dbService.findById('users', uid);

    if (!user) {
      // Auto-provision user in Firestore if authenticated in Firebase Auth
      const role = (decoded.email || '').toLowerCase() === 'admin@cinepulse.io' ? 'admin' : 'user';
      const now = new Date();
      user = await dbService.setDoc(
        'users',
        uid,
        {
          uid,
          _id: uid,
          name: decoded.name || (decoded.email || 'User').split('@')[0],
          email: (decoded.email || '').toLowerCase(),
          role,
          profiles: [],
          createdAt: now,
          updatedAt: now,
        },
        { merge: true }
      );
    }

    req.user = {
      ...user,
      _id: uid,
      uid,
    };

    // Optional active profile header
    const profileId = req.headers['x-profile-id'] || req.query.profileId;
    if (profileId) {
      const profile = await dbService.findById('profiles', profileId);
      if (profile && (profile.userId?.toString() === uid || profile.userId?.toString() === user._id?.toString())) {
        req.profile = profile;
        req.profileId = profile._id;
      }
    }

    next();
  } catch (error) {
    return sendError(res, 'Not authorized. Invalid or expired Firebase ID token.', 401);
  }
};
