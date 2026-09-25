import * as historyService from '../services/historyService.js';
import { sendSuccess, sendError } from '../utils/response.js';

const resolveProfileId = (req) => {
  return req.profileId || req.headers['x-profile-id'] || req.query.profileId;
};

export const getHistory = async (req, res, next) => {
  try {
    const profileId = resolveProfileId(req);
    if (!profileId) {
      return sendError(res, 'Profile ID is required to fetch watch history.', 400);
    }
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;

    const result = await historyService.getWatchHistory(profileId, page, limit);
    return sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

export const getContinueWatching = async (req, res, next) => {
  try {
    const profileId = resolveProfileId(req);
    if (!profileId) {
      return sendSuccess(res, { items: [] });
    }
    const items = await historyService.getContinueWatching(profileId);
    return sendSuccess(res, { items });
  } catch (error) {
    next(error);
  }
};

export const saveProgress = async (req, res, next) => {
  try {
    const profileId = resolveProfileId(req);
    if (!profileId) {
      return sendError(res, 'Profile ID is required to record playback progress.', 400);
    }
    const { contentId, contentModel = 'Movie', contentType = 'movie', currentTime = 0, duration = 0 } = req.body;

    if (!contentId) {
      return sendError(res, 'contentId is required.', 400);
    }

    const history = await historyService.saveProgress({
      userId: req.user._id,
      profileId,
      contentId,
      contentModel,
      contentType,
      currentTime: Number(currentTime),
      duration: Number(duration),
    });

    return sendSuccess(res, { history });
  } catch (error) {
    next(error);
  }
};

export const updateProgress = async (req, res, next) => {
  try {
    const profileId = resolveProfileId(req);
    if (!profileId) {
      return sendError(res, 'Profile ID is required to record playback progress.', 400);
    }
    const { contentId } = req.params;
    const { contentModel = 'Movie', contentType = 'movie', currentTime = 0, duration = 0 } = req.body;

    const history = await historyService.saveProgress({
      userId: req.user._id,
      profileId,
      contentId,
      contentModel,
      contentType,
      currentTime: Number(currentTime),
      duration: Number(duration),
    });

    return sendSuccess(res, { history });
  } catch (error) {
    next(error);
  }
};

export const removeFromHistory = async (req, res, next) => {
  try {
    const profileId = resolveProfileId(req);
    if (!profileId) {
      return sendError(res, 'Profile ID is required.', 400);
    }
    const { contentId } = req.params;
    const result = await historyService.removeFromHistory(profileId, contentId);
    return sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};
