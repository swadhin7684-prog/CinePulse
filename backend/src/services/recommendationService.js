import { Movie } from '../models/Movie.js';
import { WatchHistory } from '../models/WatchHistory.js';
import { MyList } from '../models/MyList.js';
import { Rating } from '../models/Rating.js';

/**
 * CinePulse Hybrid Recommendation Scoring Service
 *
 * recommendationScore =
 *     genreMatch * 0.25
 *   + contentSimilarity * 0.20
 *   + watchHistorySimilarity * 0.20
 *   + ratingPreference * 0.10
 *   + popularity * 0.10
 *   + trending * 0.10
 *   + recency * 0.05
 */

export const getPersonalizedRecommendations = async (profileId, limit = 15) => {
  // If no profile provided, return top popular & trending items
  if (!profileId) {
    return await Movie.find().sort({ popularityScore: -1, rating: -1 }).limit(limit);
  }

  // 1. Gather signals from profile activity
  const [historyDocs, listDocs, ratingDocs] = await Promise.all([
    WatchHistory.find({ profileId }).populate('contentId'),
    MyList.find({ profileId }).populate('contentId'),
    Rating.find({ profileId }),
  ]);

  // Extract preferred genres & watched content IDs
  const genreWeights = {};
  const preferredDirectors = new Set();
  const preferredActors = new Set();
  const watchedMovieIds = new Set();

  historyDocs.forEach((h) => {
    if (h.contentId && h.contentId._id) {
      watchedMovieIds.add(h.contentId._id.toString());
      const movie = h.contentId;
      const weight = (h.completionPercentage || 50) / 100;

      if (Array.isArray(movie.genres)) {
        movie.genres.forEach((g) => {
          genreWeights[g] = (genreWeights[g] || 0) + weight * 2;
        });
      }
      if (movie.director) preferredDirectors.add(movie.director);
      if (Array.isArray(movie.cast)) {
        movie.cast.forEach((actor) => preferredActors.add(actor));
      }
    }
  });

  listDocs.forEach((item) => {
    if (item.contentId && item.contentId._id) {
      const movie = item.contentId;
      if (Array.isArray(movie.genres)) {
        movie.genres.forEach((g) => {
          genreWeights[g] = (genreWeights[g] || 0) + 1.5;
        });
      }
      if (movie.director) preferredDirectors.add(movie.director);
    }
  });

  ratingDocs.forEach((r) => {
    if (r.score >= 4) {
      // High score boosts preference
      watchedMovieIds.add(r.contentId.toString());
    }
  });

  // Normalize genre weights
  const maxGenreWeight = Math.max(...Object.values(genreWeights), 1);
  Object.keys(genreWeights).forEach((g) => {
    genreWeights[g] = genreWeights[g] / maxGenreWeight;
  });

  // 2. Query candidate movies
  const candidateMovies = await Movie.find();
  const currentYear = new Date().getFullYear();

  // 3. Compute hybrid scores
  const scoredMovies = candidateMovies.map((movie) => {
    // Already completely watched? Lower priority but don't completely hide
    const isWatched = watchedMovieIds.has(movie._id.toString());

    // Signal 1: Genre Match (0.0 - 1.0)
    let genreScore = 0;
    if (Array.isArray(movie.genres) && movie.genres.length > 0) {
      const matched = movie.genres.map((g) => genreWeights[g] || 0);
      genreScore = matched.reduce((a, b) => a + b, 0) / movie.genres.length;
    }

    // Signal 2: Content Similarity (director/cast overlap) (0.0 - 1.0)
    let similarityScore = 0;
    if (movie.director && preferredDirectors.has(movie.director)) {
      similarityScore += 0.5;
    }
    if (Array.isArray(movie.cast)) {
      const actorMatches = movie.cast.filter((actor) => preferredActors.has(actor)).length;
      similarityScore += Math.min(0.5, actorMatches * 0.25);
    }

    // Signal 3: Watch History Affinity (0.0 - 1.0)
    // If genres align with recent favorites
    const watchHistoryScore = genreScore > 0 ? (genreScore + similarityScore) / 2 : 0.1;

    // Signal 4: Rating Preference (0.0 - 1.0)
    const ratingScore = Math.min(1.0, (movie.rating || 5) / 10);

    // Signal 5: Popularity Score (0.0 - 1.0)
    const popularityScore = Math.min(1.0, (movie.popularityScore || 50) / 100);

    // Signal 6: Trending Momentum (0.0 - 1.0)
    const trendingScore = movie.trending ? 1.0 : 0.2;

    // Signal 7: Recency Bonus (0.0 - 1.0)
    const age = Math.max(0, currentYear - (movie.releaseYear || currentYear));
    const recencyScore = Math.max(0.2, 1 - age * 0.1);

    // Hybrid formula with specified coefficients
    let recommendationScore =
      genreScore * 0.25 +
      similarityScore * 0.20 +
      watchHistoryScore * 0.20 +
      ratingScore * 0.10 +
      popularityScore * 0.10 +
      trendingScore * 0.10 +
      recencyScore * 0.05;

    // Apply soft penalty if already fully watched
    if (isWatched) {
      recommendationScore *= 0.6;
    }

    return {
      movie,
      score: recommendationScore,
    };
  });

  // Sort descending by calculated score
  scoredMovies.sort((a, b) => b.score - a.score);

  return scoredMovies.slice(0, limit).map((item) => item.movie);
};

export const getTrendingContent = async (limit = 15) => {
  return await Movie.find({ trending: true })
    .sort({ popularityScore: -1, releaseYear: -1 })
    .limit(limit);
};

export const getPopularContent = async (limit = 15) => {
  return await Movie.find()
    .sort({ popularityScore: -1, viewsCount: -1 })
    .limit(limit);
};

export const getSimilarContent = async (contentId, limit = 10) => {
  const target = await Movie.findById(contentId);
  if (!target) return [];

  const similar = await Movie.find({
    _id: { $ne: target._id },
    genres: { $in: target.genres },
  })
    .sort({ rating: -1, popularityScore: -1 })
    .limit(limit);

  return similar;
};
