import { Movie } from '../models/Movie.js';
import { TVShow } from '../models/TVShow.js';
import { Episode } from '../models/Episode.js';

export const getMovies = async (filters = {}) => {
  const query = {};

  if (filters.genre) {
    query.genres = { $regex: new RegExp(`^${filters.genre}$`, 'i') };
  }
  if (filters.year) {
    query.releaseYear = Number(filters.year);
  }
  if (filters.maturityRating) {
    query.maturityRating = filters.maturityRating;
  }
  if (filters.featured !== undefined) {
    query.featured = filters.featured === 'true' || filters.featured === true;
  }
  if (filters.trending !== undefined) {
    query.trending = filters.trending === 'true' || filters.trending === true;
  }

  let sort = { popularityScore: -1, createdAt: -1 };
  if (filters.sort === 'rating') sort = { rating: -1 };
  if (filters.sort === 'latest') sort = { releaseYear: -1, createdAt: -1 };
  if (filters.sort === 'views') sort = { viewsCount: -1 };

  const page = parseInt(filters.page, 10) || 1;
  const limit = parseInt(filters.limit, 10) || 20;
  const skip = (page - 1) * limit;

  const [movies, total] = await Promise.all([
    Movie.find(query).sort(sort).skip(skip).limit(limit),
    Movie.countDocuments(query),
  ]);

  return {
    items: movies,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getMovieById = async (id) => {
  const movie = await Movie.findByIdAndUpdate(
    id,
    { $inc: { viewsCount: 1 } },
    { new: true }
  );
  if (!movie) {
    const error = new Error('Movie not found');
    error.statusCode = 404;
    throw error;
  }
  return movie;
};

export const createMovie = async (data) => {
  return await Movie.create(data);
};

export const updateMovie = async (id, data) => {
  const movie = await Movie.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!movie) {
    const error = new Error('Movie not found');
    error.statusCode = 404;
    throw error;
  }
  return movie;
};

export const deleteMovie = async (id) => {
  const movie = await Movie.findByIdAndDelete(id);
  if (!movie) {
    const error = new Error('Movie not found');
    error.statusCode = 404;
    throw error;
  }
  return { message: 'Movie deleted successfully' };
};

export const getTVShows = async (filters = {}) => {
  const query = {};
  if (filters.genre) {
    query.genres = { $regex: new RegExp(`^${filters.genre}$`, 'i') };
  }
  if (filters.year) {
    query.releaseYear = Number(filters.year);
  }
  if (filters.featured !== undefined) {
    query.featured = filters.featured === 'true' || filters.featured === true;
  }
  if (filters.trending !== undefined) {
    query.trending = filters.trending === 'true' || filters.trending === true;
  }

  const page = parseInt(filters.page, 10) || 1;
  const limit = parseInt(filters.limit, 10) || 20;
  const skip = (page - 1) * limit;

  const [shows, total] = await Promise.all([
    TVShow.find(query).sort({ popularityScore: -1 }).skip(skip).limit(limit),
    TVShow.countDocuments(query),
  ]);

  return {
    items: shows,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getTVShowById = async (id) => {
  const show = await TVShow.findById(id);
  if (!show) {
    const error = new Error('TV Show not found');
    error.statusCode = 404;
    throw error;
  }

  const episodes = await Episode.find({ showId: id }).sort({ seasonNumber: 1, episodeNumber: 1 });
  return {
    ...show.toObject(),
    episodes,
  };
};

export const createTVShow = async (data) => {
  return await TVShow.create(data);
};

export const updateTVShow = async (id, data) => {
  const show = await TVShow.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!show) {
    const error = new Error('TV Show not found');
    error.statusCode = 404;
    throw error;
  }
  return show;
};

export const deleteTVShow = async (id) => {
  const show = await TVShow.findByIdAndDelete(id);
  if (!show) {
    const error = new Error('TV Show not found');
    error.statusCode = 404;
    throw error;
  }
  await Episode.deleteMany({ showId: id });
  return { message: 'TV Show and associated episodes deleted successfully' };
};

export const addEpisode = async (showId, data) => {
  const show = await TVShow.findById(showId);
  if (!show) {
    const error = new Error('TV Show not found');
    error.statusCode = 404;
    throw error;
  }
  return await Episode.create({ ...data, showId });
};
