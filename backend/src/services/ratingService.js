import { Rating } from '../models/Rating.js';
import { Movie } from '../models/Movie.js';
import { TVShow } from '../models/TVShow.js';

export const rateContent = async ({
  userId,
  profileId,
  contentId,
  contentModel = 'Movie',
  score,
  review = '',
}) => {
  const rating = await Rating.findOneAndUpdate(
    { profileId, contentId },
    {
      userId,
      profileId,
      contentId,
      contentModel,
      score,
      review,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  // Recalculate average rating for the movie or tv show
  const allRatings = await Rating.find({ contentId });
  if (allRatings.length > 0) {
    const avg = allRatings.reduce((acc, curr) => acc + curr.score, 0) / allRatings.length;
    const roundedAvg = Math.round(avg * 10) / 10;

    if (contentModel === 'Movie') {
      await Movie.findByIdAndUpdate(contentId, { rating: roundedAvg });
    } else if (contentModel === 'TVShow') {
      await TVShow.findByIdAndUpdate(contentId, { rating: roundedAvg });
    }
  }

  return rating;
};

export const getContentRating = async (profileId, contentId) => {
  const [allRatings, userRatingDoc] = await Promise.all([
    Rating.find({ contentId }),
    profileId ? Rating.findOne({ profileId, contentId }) : null,
  ]);

  const total = allRatings.length;
  const avg = total > 0 ? (allRatings.reduce((acc, curr) => acc + curr.score, 0) / total).toFixed(1) : null;

  return {
    averageRating: avg ? parseFloat(avg) : null,
    totalRatings: total,
    userRating: userRatingDoc ? userRatingDoc.score : null,
    userReview: userRatingDoc ? userRatingDoc.review : '',
  };
};
