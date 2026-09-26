import * as dbService from './firestoreDb.js';

export const getProfiles = async (userId) => {
  return await dbService.findAll('profiles', { userId: userId.toString() }, ['createdAt']);
};

export const createProfile = async (userId, data) => {
  const currentCount = await dbService.count('profiles', { userId: userId.toString() });
  if (currentCount >= 5) {
    const error = new Error('Profile limit reached. You can have a maximum of 5 profiles per account.');
    error.statusCode = 400;
    throw error;
  }

  const profile = await dbService.createDoc('profiles', {
    userId: userId.toString(),
    name: data.name.trim(),
    avatar: data.avatar || `avatar-${(currentCount % 6) + 1}`,
    language: data.language || 'en',
    maturityRating: data.maturityRating || 'ALL',
    isKids: data.isKids || false,
  });

  // Update user document profiles array
  const user = await dbService.findById('users', userId);
  if (user) {
    const currentProfiles = Array.isArray(user.profiles) ? user.profiles : [];
    if (!currentProfiles.includes(profile._id)) {
      await dbService.updateDoc('users', userId, {
        profiles: [...currentProfiles, profile._id],
      });
    }
  }

  return profile;
};

export const updateProfile = async (userId, profileId, data) => {
  const profile = await dbService.findById('profiles', profileId);
  if (!profile || profile.userId.toString() !== userId.toString()) {
    const error = new Error('Profile not found');
    error.statusCode = 404;
    throw error;
  }

  const updatedProfile = await dbService.updateDoc('profiles', profileId, {
    name: data.name !== undefined ? data.name.trim() : profile.name,
    avatar: data.avatar !== undefined ? data.avatar : profile.avatar,
    language: data.language !== undefined ? data.language : profile.language,
    maturityRating: data.maturityRating !== undefined ? data.maturityRating : profile.maturityRating,
    isKids: data.isKids !== undefined ? data.isKids : profile.isKids,
  });

  return updatedProfile;
};

export const deleteProfile = async (userId, profileId) => {
  const total = await dbService.count('profiles', { userId: userId.toString() });
  if (total <= 1) {
    const error = new Error('Cannot delete profile. An account must retain at least one profile.');
    error.statusCode = 400;
    throw error;
  }

  const profile = await dbService.findById('profiles', profileId);
  if (!profile || profile.userId.toString() !== userId.toString()) {
    const error = new Error('Profile not found');
    error.statusCode = 404;
    throw error;
  }

  await dbService.deleteDoc('profiles', profileId);

  // Remove profile reference from user
  const user = await dbService.findById('users', userId);
  if (user && Array.isArray(user.profiles)) {
    const updatedProfiles = user.profiles.filter((pId) => pId.toString() !== profileId.toString());
    await dbService.updateDoc('users', userId, { profiles: updatedProfiles });
  }

  // Clean up associated profile records
  await Promise.all([
    dbService.deleteWhere('watchHistory', { profileId: profileId.toString() }),
    dbService.deleteWhere('myList', { profileId: profileId.toString() }),
    dbService.deleteWhere('ratings', { profileId: profileId.toString() }),
  ]);

  return { message: 'Profile deleted successfully' };
};
