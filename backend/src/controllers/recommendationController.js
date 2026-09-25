import * as recommendationService from '../services/recommendationService.js';
import { sendSuccess } from '../utils/response.js';

const resolveProfileId = (req) => {
  return req.profileId || req.headers['x-profile-id'] || req.query.profileId;
};

export const getRecommendations = async (req, res, next) => {
  try {
    const profileId = resolveProfileId(req);
    const limit = parseInt(req.query.limit, 10) || 15;
    const items = await recommendationService.getPersonalizedRecommendations(profileId, limit);
    return sendSuccess(res, { items });
  } catch (error) {
    next(error);
  }
};

export const getTrending = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 15;
    const items = await recommendationService.getTrendingContent(limit);
    return sendSuccess(res, { items });
  } catch (error) {
    next(error);
  }
};

export const getPopular = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 15;
    const items = await recommendationService.getPopularContent(limit);
    return sendSuccess(res, { items });
  } catch (error) {
    next(error);
  }
};

export const getSimilar = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 10;
    const items = await recommendationService.getSimilarContent(req.params.id, limit);
    return sendSuccess(res, { items });
  } catch (error) {
    next(error);
  }
};
