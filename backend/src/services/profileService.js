import { Profile } from '../models/Profile.js';
import { User } from '../models/User.js';
import { WatchHistory } from '../models/WatchHistory.js';
import { MyList } from '../models/MyList.js';
import { Rating } from '../models/Rating.js';

export const getProfiles = async (userId) => {
  return await Profile.find({ userId }).sort({ createdAt: 1 });
};

export const createProfile = async (userId, data) => {
  const currentCount = await Profile.countDocuments({ userId });
  if (currentCount >= 5) {
    const error = new Error('Profile limit reached. You can have a maximum of 5 profiles per account.');
    error.statusCode = 400;
    throw error;
  }

  const profile = await Profile.create({
    userId,
    name: data.name,
    avatar: data.avatar || `avatar-${(currentCount % 6) + 1}`,
    language: data.language || 'en',
    maturityRating: data.maturityRating || 'ALL',
    isKids: data.isKids || false,
  });

  await User.findByIdAndUpdate(userId, { $push: { profiles: profile._id } });
  return profile;
};

export const updateProfile = async (userId, profileId, data) => {
  const profile = await Profile.findOneAndUpdate(
    { _id: profileId, userId },
    {
      name: data.name,
      avatar: data.avatar,
      language: data.language,
      maturityRating: data.maturityRating,
      isKids: data.isKids,
    },
    { new: true, runValidators: true }
  );

  if (!profile) {
    const error = new Error('Profile not found');
    error.statusCode = 404;
    throw error;
  }

  return profile;
};

export const deleteProfile = async (userId, profileId) => {
  const total = await Profile.countDocuments({ userId });
  if (total <= 1) {
    const error = new Error('Cannot delete profile. An account must retain at least one profile.');
    error.statusCode = 400;
    throw error;
  }

  const profile = await Profile.findOneAndDelete({ _id: profileId, userId });
  if (!profile) {
    const error = new Error('Profile not found');
    error.statusCode = 404;
    throw error;
  }

  // Remove reference from User
  await User.findByIdAndUpdate(userId, { $pull: { profiles: profileId } });

  // Clean up associated profile records
  await Promise.all([
    WatchHistory.deleteMany({ profileId }),
    MyList.deleteMany({ profileId }),
    Rating.deleteMany({ profileId }),
  ]);

  return { message: 'Profile deleted successfully' };
};
