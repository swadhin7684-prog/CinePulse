import { MyList } from '../models/MyList.js';

export const getMyList = async (profileId) => {
  const items = await MyList.find({ profileId })
    .sort({ addedAt: -1 })
    .populate('contentId');

  return items.filter((item) => item.contentId !== null);
};

export const addToList = async ({ userId, profileId, contentId, contentModel = 'Movie', contentType = 'movie' }) => {
  const existing = await MyList.findOne({ profileId, contentId });
  if (existing) {
    return existing;
  }

  const listItem = await MyList.create({
    userId,
    profileId,
    contentId,
    contentModel,
    contentType,
  });

  return listItem;
};

export const removeFromList = async (profileId, contentId) => {
  await MyList.findOneAndDelete({ profileId, contentId });
  return { message: 'Removed from My List' };
};

export const checkInList = async (profileId, contentId) => {
  const existing = await MyList.findOne({ profileId, contentId });
  return { inList: !!existing };
};
