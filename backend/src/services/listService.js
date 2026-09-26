import * as dbService from './firestoreDb.js';

export const getMyList = async (profileId) => {
  let items = await dbService.findAll('myList', { profileId: profileId.toString() });

  // Sort by addedAt desc
  items.sort((a, b) => new Date(b.addedAt || 0) - new Date(a.addedAt || 0));

  // Populate referenced contentId
  const populated = await Promise.all(
    items.map(async (item) => {
      let content = null;
      if (item.contentModel === 'TVShow' || item.contentType === 'show' || item.contentType === 'tv') {
        content = await dbService.findById('tvShows', item.contentId);
        if (!content) content = await dbService.findById('movies', item.contentId);
      } else {
        content = await dbService.findById('movies', item.contentId);
        if (!content) content = await dbService.findById('tvShows', item.contentId);
      }

      return {
        ...item,
        contentId: content,
      };
    })
  );

  return populated.filter((item) => item.contentId !== null);
};

export const addToList = async ({
  userId,
  profileId,
  contentId,
  contentModel = 'Movie',
  contentType = 'movie',
}) => {
  const existing = await dbService.findOne('myList', {
    profileId: profileId.toString(),
    contentId: contentId.toString(),
  });

  if (existing) {
    return existing;
  }

  const listItem = await dbService.createDoc('myList', {
    userId: userId.toString(),
    profileId: profileId.toString(),
    contentId: contentId.toString(),
    contentModel,
    contentType,
    addedAt: new Date(),
  });

  return listItem;
};

export const removeFromList = async (profileId, contentId) => {
  const existing = await dbService.findOne('myList', {
    profileId: profileId.toString(),
    contentId: contentId.toString(),
  });

  if (existing) {
    await dbService.deleteDoc('myList', existing._id);
  }

  return { message: 'Removed from My List' };
};

export const checkInList = async (profileId, contentId) => {
  const existing = await dbService.findOne('myList', {
    profileId: profileId.toString(),
    contentId: contentId.toString(),
  });

  return { inList: !!existing };
};
