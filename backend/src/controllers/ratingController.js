import * as ratingService from '../services/ratingService.js';
import { sendSuccess, sendError } from '../utils/response.js';

const resolveProfileId = (req) => {
  return req.profileId || req.headers['x-profile-id'] || req.query.profileId;
};

export const rateContent = async (req, res, next) => {
  try {
    const profileId = resolveProfileId(req);
    if (!profileId) {
      return sendError(res, 'Profile ID is required to submit a rating.', 400);
    }
    const { contentId, contentModel = 'Movie', score, review } = req.body;

    if (!contentId || score === undefined) {
      return sendError(res, 'contentId and score (1-5) are required.', 400);
    }

    const numScore = Number(score);
    if (isNaN(numScore) || numScore < 1 || numScore > 5) {
      return sendError(res, 'Score must be a number between 1 and 5.', 400);
    }

    const rating = await ratingService.rateContent({
      userId: req.user._id,
      profileId,
      contentId,
      contentModel,
      score: numScore,
      review: review || '',
    });

    return sendSuccess(res, { rating }, 201);
  } catch (error) {
    next(error);
  }
};

export const getRating = async (req, res, next) => {
  try {
    const profileId = resolveProfileId(req);
    const { contentId } = req.params;
    const result = await ratingService.getContentRating(profileId, contentId);
    return sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};
