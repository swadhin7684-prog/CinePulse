import * as dbService from './firestoreDb.js';

export const saveProgress = async ({
  userId,
  profileId,
  contentId,
  contentModel = 'Movie',
  contentType = 'movie',
  currentTime = 0,
  duration = 0,
}) => {
  const numCurrentTime = Number(currentTime) || 0;
  const numDuration = Number(duration) || 0;
  const completionPercentage =
    numDuration > 0 ? Math.min(100, Math.round((numCurrentTime / numDuration) * 100)) : 0;
  // If watched more than 92%, consider completed and remove from Continue Watching
  const isCompleted = completionPercentage >= 92;

  // Find existing record for this profile and content
  const existing = await dbService.findOne('watchHistory', {
    profileId: profileId.toString(),
    contentId: contentId.toString(),
  });

  const payload = {
    userId: userId.toString(),
    profileId: profileId.toString(),
    contentId: contentId.toString(),
    contentModel,
    contentType,
    currentTime: numCurrentTime,
    duration: numDuration,
    completionPercentage,
    isCompleted,
    lastWatchedAt: new Date(),
  };

  let history;
  if (existing) {
    history = await dbService.updateDoc('watchHistory', existing._id, payload);
  } else {
    history = await dbService.createDoc('watchHistory', payload);
  }

  return history;
};

// Helper to populate contentId on history items
const populateContent = async (items) => {
  if (!items || items.length === 0) return [];

  const populated = await Promise.all(
    items.map(async (item) => {
      let content = null;
      if (item.contentModel === 'Episode') {
        content = await dbService.findById('episodes', item.contentId);
      } else {
        content = await dbService.findById('movies', item.contentId);
        // Fallback to tvShows if not in movies
        if (!content) {
          content = await dbService.findById('tvShows', item.contentId);
        }
      }
      return {
        ...item,
        contentId: content,
      };
    })
  );

  return populated.filter((item) => item.contentId !== null);
};

export const getContinueWatching = async (profileId) => {
  let items = await dbService.findAll('watchHistory', {
    profileId: profileId.toString(),
    isCompleted: false,
  });

  // Only show if watched more than 5 seconds
  items = items.filter((item) => (item.currentTime || 0) > 5);

  // Sort by lastWatchedAt desc
  items.sort((a, b) => new Date(b.lastWatchedAt || 0) - new Date(a.lastWatchedAt || 0));

  items = items.slice(0, 15);

  return await populateContent(items);
};

export const getWatchHistory = async (profileId, page = 1, limit = 20) => {
  let items = await dbService.findAll('watchHistory', { profileId: profileId.toString() });

  // Sort by lastWatchedAt desc
  items.sort((a, b) => new Date(b.lastWatchedAt || 0) - new Date(a.lastWatchedAt || 0));

  const populatedItems = await populateContent(items);

  const total = populatedItems.length;
  const numPage = parseInt(page, 10) || 1;
  const numLimit = parseInt(limit, 10) || 20;
  const skip = (numPage - 1) * numLimit;

  const paginated = populatedItems.slice(skip, skip + numLimit);

  return {
    items: paginated,
    pagination: {
      total,
      page: numPage,
      limit: numLimit,
      totalPages: Math.ceil(total / numLimit) || 1,
    },
  };
};

export const removeFromHistory = async (profileId, contentId) => {
  const existing = await dbService.findOne('watchHistory', {
    profileId: profileId.toString(),
    contentId: contentId.toString(),
  });

  if (existing) {
    await dbService.deleteDoc('watchHistory', existing._id);
  }

  return { message: 'Removed from watch history' };
};
