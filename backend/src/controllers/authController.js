import * as authService from '../services/authService.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const register = async (req, res, next) => {
  try {
    const bearerToken = req.headers.authorization?.startsWith('Bearer ')
      ? req.headers.authorization.split(' ')[1]
      : null;
    const idToken = req.body.idToken || bearerToken;
    const { name, email, password, confirmPassword, uid } = req.body;

    // If no Firebase ID token, validate credentials for direct registration
    if (!idToken) {
      if (!name || !email || !password) {
        return sendError(res, 'Please provide name, email, and password.', 400);
      }
      if (password.length < 6) {
        return sendError(res, 'Password must be at least 6 characters.', 400);
      }
      if (confirmPassword && password !== confirmPassword) {
        return sendError(res, 'Passwords do not match.', 400);
      }
    }

    const result = await authService.registerUser({
      name,
      email,
      password,
      uid,
      idToken,
    });

    return sendSuccess(res, result, 201);
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const bearerToken = req.headers.authorization?.startsWith('Bearer ')
      ? req.headers.authorization.split(' ')[1]
      : null;
    const idToken = req.body.idToken || bearerToken;
    const { email, password } = req.body;

    if (!idToken && (!email || !password)) {
      return sendError(res, 'Please provide email and password, or an authorized token.', 400);
    }

    const result = await authService.loginUser({ email, password, idToken });
    return sendSuccess(res, result, 200);
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res, next) => {
  try {
    const userId = req.user.uid || req.user._id;
    const user = await authService.getCurrentUser(userId);
    return sendSuccess(res, { user }, 200);
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res) => {
  return sendSuccess(res, { message: 'Logged out successfully' }, 200);
};
