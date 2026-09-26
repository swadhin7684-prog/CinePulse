import * as dbService from './firestoreDb.js';

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
  const allMovies = await dbService.findAll('movies');

  // If no profile provided, return top popular & trending items
  if (!profileId) {
    const sorted = [...allMovies].sort(
      (a, b) => (b.popularityScore || 0) - (a.popularityScore || 0) || (b.rating || 0) - (a.rating || 0)
    );
    return sorted.slice(0, limit);
  }

  // 1. Gather signals from profile activity
  const [historyDocs, listDocs, ratingDocs] = await Promise.all([
    dbService.findAll('watchHistory', { profileId: profileId.toString() }),
    dbService.findAll('myList', { profileId: profileId.toString() }),
    dbService.findAll('ratings', { profileId: profileId.toString() }),
  ]);

  // Extract preferred genres & watched content IDs
  const genreWeights = {};
  const preferredDirectors = new Set();
  const preferredActors = new Set();
  const watchedMovieIds = new Set();

  for (const h of historyDocs) {
    if (h.contentId) {
      watchedMovieIds.add(h.contentId.toString());
      const movie = await dbService.findById('movies', h.contentId);
      if (movie) {
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
    }
  }

  for (const item of listDocs) {
    if (item.contentId) {
      const movie = await dbService.findById('movies', item.contentId);
      if (movie) {
        if (Array.isArray(movie.genres)) {
          movie.genres.forEach((g) => {
            genreWeights[g] = (genreWeights[g] || 0) + 1.5;
          });
        }
        if (movie.director) preferredDirectors.add(movie.director);
      }
    }
  }

  ratingDocs.forEach((r) => {
    if (r.score >= 4 && r.contentId) {
      watchedMovieIds.add(r.contentId.toString());
    }
  });

  // Normalize genre weights
  const maxGenreWeight = Math.max(...Object.values(genreWeights), 1);
  Object.keys(genreWeights).forEach((g) => {
    genreWeights[g] = genreWeights[g] / maxGenreWeight;
  });

  // 2. Compute hybrid scores
  const currentYear = new Date().getFullYear();

  const scoredMovies = allMovies.map((movie) => {
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

    // Hybrid formula
    let recommendationScore =
      genreScore * 0.25 +
      similarityScore * 0.20 +
      watchHistoryScore * 0.20 +
      ratingScore * 0.10 +
      popularityScore * 0.10 +
      trendingScore * 0.10 +
      recencyScore * 0.05;

    // Soft penalty if already watched
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
  const movies = await dbService.findAll('movies');
  const trendingMovies = movies.filter((m) => !!m.trending);
  trendingMovies.sort(
    (a, b) =>
      (b.popularityScore || 0) - (a.popularityScore || 0) || (b.releaseYear || 0) - (a.releaseYear || 0)
  );
  return trendingMovies.slice(0, limit);
};

export const getPopularContent = async (limit = 15) => {
  const movies = await dbService.findAll('movies');
  movies.sort(
    (a, b) =>
      (b.popularityScore || 0) - (a.popularityScore || 0) || (b.viewsCount || 0) - (a.viewsCount || 0)
  );
  return movies.slice(0, limit);
};

export const getSimilarContent = async (contentId, limit = 10) => {
  const target = await dbService.findById('movies', contentId);
  if (!target) return [];

  const targetGenres = Array.isArray(target.genres) ? target.genres : [];
  const allMovies = await dbService.findAll('movies');

  const similar = allMovies.filter((m) => {
    if (m._id.toString() === target._id.toString()) return false;
    if (!Array.isArray(m.genres)) return false;
    return m.genres.some((g) => targetGenres.includes(g));
  });

  similar.sort(
    (a, b) =>
      (b.rating || 0) - (a.rating || 0) || (b.popularityScore || 0) - (a.popularityScore || 0)
  );

  return similar.slice(0, limit);
};
