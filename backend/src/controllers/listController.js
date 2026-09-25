import * as listService from '../services/listService.js';
import { sendSuccess, sendError } from '../utils/response.js';

const resolveProfileId = (req) => {
  return req.profileId || req.headers['x-profile-id'] || req.query.profileId;
};

export const getMyList = async (req, res, next) => {
  try {
    const profileId = resolveProfileId(req);
    if (!profileId) {
      return sendError(res, 'Profile ID is required to access My List.', 400);
    }
    const items = await listService.getMyList(profileId);
    return sendSuccess(res, { items });
  } catch (error) {
    next(error);
  }
};

export const addToList = async (req, res, next) => {
  try {
    const profileId = resolveProfileId(req);
    if (!profileId) {
      return sendError(res, 'Profile ID is required to modify My List.', 400);
    }
    const { contentId } = req.params;
    const { contentModel = 'Movie', contentType = 'movie' } = req.body;

    const listItem = await listService.addToList({
      userId: req.user._id,
      profileId,
      contentId,
      contentModel,
      contentType,
    });

    return sendSuccess(res, { listItem }, 201);
  } catch (error) {
    next(error);
  }
};

export const removeFromList = async (req, res, next) => {
  try {
    const profileId = resolveProfileId(req);
    if (!profileId) {
      return sendError(res, 'Profile ID is required to modify My List.', 400);
    }
    const { contentId } = req.params;
    const result = await listService.removeFromList(profileId, contentId);
    return sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

export const checkInList = async (req, res, next) => {
  try {
    const profileId = resolveProfileId(req);
    if (!profileId) {
      return sendSuccess(res, { inList: false });
    }
    const { contentId } = req.params;
    const result = await listService.checkInList(profileId, contentId);
    return sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};
