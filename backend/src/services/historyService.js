import { WatchHistory } from '../models/WatchHistory.js';
import { Movie } from '../models/Movie.js';

export const saveProgress = async ({
  userId,
  profileId,
  contentId,
  contentModel = 'Movie',
  contentType = 'movie',
  currentTime = 0,
  duration = 0,
}) => {
  const completionPercentage = duration > 0 ? Math.min(100, Math.round((currentTime / duration) * 100)) : 0;
  // If watched more than 92%, consider completed and remove from Continue Watching
  const isCompleted = completionPercentage >= 92;

  const history = await WatchHistory.findOneAndUpdate(
    { profileId, contentId },
    {
      userId,
      profileId,
      contentId,
      contentModel,
      contentType,
      currentTime,
      duration,
      completionPercentage,
      isCompleted,
      lastWatchedAt: new Date(),
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  return history;
};

export const getContinueWatching = async (profileId) => {
  const items = await WatchHistory.find({
    profileId,
    isCompleted: false,
    currentTime: { $gt: 5 }, // Only show if watched more than 5 seconds
  })
    .sort({ lastWatchedAt: -1 })
    .limit(15)
    .populate('contentId');

  // Filter out any where referenced content might have been deleted
  return items.filter((item) => item.contentId !== null);
};

export const getWatchHistory = async (profileId, page = 1, limit = 20) => {
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    WatchHistory.find({ profileId })
      .sort({ lastWatchedAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('contentId'),
    WatchHistory.countDocuments({ profileId }),
  ]);

  return {
    items: items.filter((item) => item.contentId !== null),
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const removeFromHistory = async (profileId, contentId) => {
  await WatchHistory.findOneAndDelete({ profileId, contentId });
  return { message: 'Removed from watch history' };
};
