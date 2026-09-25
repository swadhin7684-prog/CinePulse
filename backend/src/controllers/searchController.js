import { Movie } from '../models/Movie.js';
import { TVShow } from '../models/TVShow.js';
import { sendSuccess } from '../utils/response.js';

export const searchContent = async (req, res, next) => {
  try {
    const { q = '', genre, year, type = 'all', page = 1, limit = 24 } = req.query;
    const trimmedQuery = q.trim();

    const movieConditions = [];
    const showConditions = [];

    if (trimmedQuery) {
      const regex = new RegExp(trimmedQuery, 'i');
      const textMatch = [
        { title: { $regex: regex } },
        { genres: { $regex: regex } },
        { cast: { $regex: regex } },
        { director: { $regex: regex } },
        { description: { $regex: regex } },
      ];
      movieConditions.push({ $or: textMatch });
      showConditions.push({ $or: textMatch });
    }

    if (genre) {
      const genreRegex = new RegExp(`^${genre}$`, 'i');
      movieConditions.push({ genres: { $regex: genreRegex } });
      showConditions.push({ genres: { $regex: genreRegex } });
    }

    if (year) {
      const numYear = Number(year);
      movieConditions.push({ releaseYear: numYear });
      showConditions.push({ releaseYear: numYear });
    }

    const movieFilter = movieConditions.length > 0 ? { $and: movieConditions } : {};
    const showFilter = showConditions.length > 0 ? { $and: showConditions } : {};

    let results = [];

    if (type === 'movie' || type === 'all') {
      const movies = await Movie.find(movieFilter)
        .sort({ popularityScore: -1 })
        .limit(Number(limit));
      results = results.concat(
        movies.map((m) => ({ ...m.toObject(), contentType: 'movie' }))
      );
    }

    if (type === 'tv' || type === 'all') {
      const shows = await TVShow.find(showFilter)
        .sort({ popularityScore: -1 })
        .limit(Number(limit));
      results = results.concat(
        shows.map((s) => ({ ...s.toObject(), contentType: 'tv' }))
      );
    }

    // Sort combined results by popularityScore
    results.sort((a, b) => (b.popularityScore || 0) - (a.popularityScore || 0));

    return sendSuccess(res, {
      items: results,
      total: results.length,
      query: { q, genre, year, type },
    });
  } catch (error) {
    next(error);
  }
};
