import * as dbService from './firestoreDb.js';

export const rateContent = async ({
  userId,
  profileId,
  contentId,
  contentModel = 'Movie',
  score,
  review = '',
}) => {
  const numScore = Number(score);

  const existing = await dbService.findOne('ratings', {
    profileId: profileId.toString(),
    contentId: contentId.toString(),
  });

  const payload = {
    userId: userId.toString(),
    profileId: profileId.toString(),
    contentId: contentId.toString(),
    contentModel,
    score: numScore,
    review: review ? review.trim() : '',
  };

  let rating;
  if (existing) {
    rating = await dbService.updateDoc('ratings', existing._id, payload);
  } else {
    rating = await dbService.createDoc('ratings', payload);
  }

  // Recalculate average rating for the movie or tv show
  const allRatings = await dbService.findAll('ratings', { contentId: contentId.toString() });
  if (allRatings.length > 0) {
    const avg = allRatings.reduce((acc, curr) => acc + (curr.score || 0), 0) / allRatings.length;
    const roundedAvg = Math.round(avg * 10) / 10;

    if (contentModel === 'Movie') {
      await dbService.updateDoc('movies', contentId, { rating: roundedAvg });
    } else if (contentModel === 'TVShow') {
      await dbService.updateDoc('tvShows', contentId, { rating: roundedAvg });
    }
  }

  return rating;
};

export const getContentRating = async (profileId, contentId) => {
  const allRatings = await dbService.findAll('ratings', { contentId: contentId.toString() });

  let userRatingDoc = null;
  if (profileId) {
    userRatingDoc = await dbService.findOne('ratings', {
      profileId: profileId.toString(),
      contentId: contentId.toString(),
    });
  }

  const total = allRatings.length;
  const avg =
    total > 0
      ? (allRatings.reduce((acc, curr) => acc + (curr.score || 0), 0) / total).toFixed(1)
      : null;

  return {
    averageRating: avg ? parseFloat(avg) : null,
    totalRatings: total,
    userRating: userRatingDoc ? userRatingDoc.score : null,
    userReview: userRatingDoc ? userRatingDoc.review : '',
  };
};
