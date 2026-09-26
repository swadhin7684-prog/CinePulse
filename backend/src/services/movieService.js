import * as dbService from './firestoreDb.js';

export const getMovies = async (filters = {}) => {
  // Fetch all movies from Firestore
  let movies = await dbService.findAll('movies');

  // Apply filters
  if (filters.genre) {
    const genreLower = filters.genre.toLowerCase();
    movies = movies.filter((m) =>
      Array.isArray(m.genres) && m.genres.some((g) => g.toLowerCase() === genreLower)
    );
  }

  if (filters.year) {
    const numYear = Number(filters.year);
    movies = movies.filter((m) => m.releaseYear === numYear);
  }

  if (filters.maturityRating) {
    movies = movies.filter((m) => m.maturityRating === filters.maturityRating);
  }

  if (filters.featured !== undefined) {
    const isFeatured = filters.featured === 'true' || filters.featured === true;
    movies = movies.filter((m) => !!m.featured === isFeatured);
  }

  if (filters.trending !== undefined) {
    const isTrending = filters.trending === 'true' || filters.trending === true;
    movies = movies.filter((m) => !!m.trending === isTrending);
  }

  // Apply Sorting
  if (filters.sort === 'rating') {
    movies.sort((a, b) => (b.rating || 0) - (a.rating || 0));
  } else if (filters.sort === 'latest') {
    movies.sort((a, b) => (b.releaseYear || 0) - (a.releaseYear || 0));
  } else if (filters.sort === 'views') {
    movies.sort((a, b) => (b.viewsCount || 0) - (a.viewsCount || 0));
  } else {
    // Default sort: popularityScore desc, then createdAt desc
    movies.sort((a, b) => {
      const popDiff = (b.popularityScore || 0) - (a.popularityScore || 0);
      if (popDiff !== 0) return popDiff;
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      return dateB - dateA;
    });
  }

  const total = movies.length;
  const page = parseInt(filters.page, 10) || 1;
  const limit = parseInt(filters.limit, 10) || 20;
  const skip = (page - 1) * limit;

  const paginatedMovies = movies.slice(skip, skip + limit);

  return {
    items: paginatedMovies,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
};

export const getMovieById = async (id) => {
  const movie = await dbService.findById('movies', id);
  if (!movie) {
    const error = new Error('Movie not found');
    error.statusCode = 404;
    throw error;
  }

  const newViews = (movie.viewsCount || 0) + 1;
  await dbService.updateDoc('movies', id, { viewsCount: newViews });
  movie.viewsCount = newViews;

  return movie;
};

export const createMovie = async (data) => {
  return await dbService.createDoc('movies', {
    ...data,
    popularityScore: data.popularityScore !== undefined ? Number(data.popularityScore) : 50,
    viewsCount: data.viewsCount !== undefined ? Number(data.viewsCount) : 0,
    rating: data.rating !== undefined ? Number(data.rating) : 7.5,
    releaseYear: data.releaseYear !== undefined ? Number(data.releaseYear) : new Date().getFullYear(),
  });
};

export const updateMovie = async (id, data) => {
  const existing = await dbService.findById('movies', id);
  if (!existing) {
    const error = new Error('Movie not found');
    error.statusCode = 404;
    throw error;
  }
  return await dbService.updateDoc('movies', id, data);
};

export const deleteMovie = async (id) => {
  const existing = await dbService.findById('movies', id);
  if (!existing) {
    const error = new Error('Movie not found');
    error.statusCode = 404;
    throw error;
  }
  await dbService.deleteDoc('movies', id);
  return { message: 'Movie deleted successfully' };
};

export const getTVShows = async (filters = {}) => {
  let shows = await dbService.findAll('tvShows');

  if (filters.genre) {
    const genreLower = filters.genre.toLowerCase();
    shows = shows.filter((s) =>
      Array.isArray(s.genres) && s.genres.some((g) => g.toLowerCase() === genreLower)
    );
  }

  if (filters.year) {
    const numYear = Number(filters.year);
    shows = shows.filter((s) => s.releaseYear === numYear);
  }

  if (filters.featured !== undefined) {
    const isFeatured = filters.featured === 'true' || filters.featured === true;
    shows = shows.filter((s) => !!s.featured === isFeatured);
  }

  if (filters.trending !== undefined) {
    const isTrending = filters.trending === 'true' || filters.trending === true;
    shows = shows.filter((s) => !!s.trending === isTrending);
  }

  shows.sort((a, b) => (b.popularityScore || 0) - (a.popularityScore || 0));

  const total = shows.length;
  const page = parseInt(filters.page, 10) || 1;
  const limit = parseInt(filters.limit, 10) || 20;
  const skip = (page - 1) * limit;

  const paginatedShows = shows.slice(skip, skip + limit);

  return {
    items: paginatedShows,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
};

export const getTVShowById = async (id) => {
  const show = await dbService.findById('tvShows', id);
  if (!show) {
    const error = new Error('TV Show not found');
    error.statusCode = 404;
    throw error;
  }

  let episodes = await dbService.findAll('episodes', { showId: id.toString() });
  episodes.sort((a, b) => {
    const seasonDiff = (a.seasonNumber || 1) - (b.seasonNumber || 1);
    if (seasonDiff !== 0) return seasonDiff;
    return (a.episodeNumber || 1) - (b.episodeNumber || 1);
  });

  return {
    ...show,
    episodes,
  };
};

export const createTVShow = async (data) => {
  return await dbService.createDoc('tvShows', {
    ...data,
    popularityScore: data.popularityScore !== undefined ? Number(data.popularityScore) : 50,
    rating: data.rating !== undefined ? Number(data.rating) : 8.0,
    seasonsCount: data.seasonsCount !== undefined ? Number(data.seasonsCount) : 1,
    releaseYear: data.releaseYear !== undefined ? Number(data.releaseYear) : new Date().getFullYear(),
  });
};

export const updateTVShow = async (id, data) => {
  const existing = await dbService.findById('tvShows', id);
  if (!existing) {
    const error = new Error('TV Show not found');
    error.statusCode = 404;
    throw error;
  }
  return await dbService.updateDoc('tvShows', id, data);
};

export const deleteTVShow = async (id) => {
  const existing = await dbService.findById('tvShows', id);
  if (!existing) {
    const error = new Error('TV Show not found');
    error.statusCode = 404;
    throw error;
  }

  await dbService.deleteDoc('tvShows', id);
  await dbService.deleteWhere('episodes', { showId: id.toString() });

  return { message: 'TV Show and associated episodes deleted successfully' };
};

export const addEpisode = async (showId, data) => {
  const show = await dbService.findById('tvShows', showId);
  if (!show) {
    const error = new Error('TV Show not found');
    error.statusCode = 404;
    throw error;
  }

  return await dbService.createDoc('episodes', {
    ...data,
    showId: showId.toString(),
    seasonNumber: data.seasonNumber !== undefined ? Number(data.seasonNumber) : 1,
    episodeNumber: data.episodeNumber !== undefined ? Number(data.episodeNumber) : 1,
    duration: data.duration !== undefined ? Number(data.duration) : 45,
  });
};
