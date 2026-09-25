import * as profileService from '../services/profileService.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const getProfiles = async (req, res, next) => {
  try {
    const profiles = await profileService.getProfiles(req.user._id);
    return sendSuccess(res, { profiles });
  } catch (error) {
    next(error);
  }
};

export const createProfile = async (req, res, next) => {
  try {
    const { name, avatar, language, maturityRating, isKids } = req.body;
    if (!name) {
      return sendError(res, 'Profile name is required.', 400);
    }
    const profile = await profileService.createProfile(req.user._id, {
      name,
      avatar,
      language,
      maturityRating,
      isKids,
    });
    return sendSuccess(res, { profile }, 201);
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const profile = await profileService.updateProfile(req.user._id, req.params.id, req.body);
    return sendSuccess(res, { profile });
  } catch (error) {
    next(error);
  }
};

export const deleteProfile = async (req, res, next) => {
  try {
    const result = await profileService.deleteProfile(req.user._id, req.params.id);
    return sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};
