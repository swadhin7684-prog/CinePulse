import * as dbService from '../services/firestoreDb.js';
import { sendSuccess } from '../utils/response.js';

export const searchContent = async (req, res, next) => {
  try {
    const { q = '', genre, year, type = 'all', page = 1, limit = 24 } = req.query;
    const trimmedQuery = q.trim().toLowerCase();
    const targetGenre = genre ? genre.trim().toLowerCase() : null;
    const targetYear = year ? Number(year) : null;
    const numLimit = Number(limit) || 24;

    const [allMovies, allShows] = await Promise.all([
      dbService.findAll('movies'),
      dbService.findAll('tvShows'),
    ]);

    // Match filter helper
    const matchesFilter = (item) => {
      // 1. Text Search across title, description, genres, cast, director
      if (trimmedQuery) {
        const titleMatch = (item.title || '').toLowerCase().includes(trimmedQuery);
        const descMatch = (item.description || '').toLowerCase().includes(trimmedQuery);
        const directorMatch = (item.director || '').toLowerCase().includes(trimmedQuery);
        const castMatch =
          Array.isArray(item.cast) &&
          item.cast.some((c) => (c || '').toLowerCase().includes(trimmedQuery));
        const genreMatch =
          Array.isArray(item.genres) &&
          item.genres.some((g) => (g || '').toLowerCase().includes(trimmedQuery));

        if (!titleMatch && !descMatch && !directorMatch && !castMatch && !genreMatch) {
          return false;
        }
      }

      // 2. Genre filter
      if (targetGenre) {
        const hasGenre =
          Array.isArray(item.genres) &&
          item.genres.some((g) => (g || '').toLowerCase() === targetGenre);
        if (!hasGenre) return false;
      }

      // 3. Year filter
      if (targetYear) {
        if (item.releaseYear !== targetYear) return false;
      }

      return true;
    };

    let results = [];

    if (type === 'movie' || type === 'all') {
      const filteredMovies = allMovies
        .filter(matchesFilter)
        .map((m) => ({ ...m, contentType: 'movie' }));
      results = results.concat(filteredMovies);
    }

    if (type === 'tv' || type === 'all') {
      const filteredShows = allShows
        .filter(matchesFilter)
        .map((s) => ({ ...s, contentType: 'tv' }));
      results = results.concat(filteredShows);
    }

    // Sort combined results by popularityScore
    results.sort((a, b) => (b.popularityScore || 0) - (a.popularityScore || 0));

    // Limit results
    const limitedResults = results.slice(0, numLimit);

    return sendSuccess(res, {
      items: limitedResults,
      total: limitedResults.length,
      query: { q, genre, year, type },
    });
  } catch (error) {
    next(error);
  }
};
