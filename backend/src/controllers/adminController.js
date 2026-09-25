import { User } from '../models/User.js';
import { Movie } from '../models/Movie.js';
import { TVShow } from '../models/TVShow.js';
import { Episode } from '../models/Episode.js';
import { Genre } from '../models/Genre.js';
import { WatchHistory } from '../models/WatchHistory.js';
import * as movieService from '../services/movieService.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const getUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('-password').populate('profiles').sort({ createdAt: -1 });
    return sendSuccess(res, { users, total: users.length });
  } catch (error) {
    next(error);
  }
};

export const getMovies = async (req, res, next) => {
  try {
    const result = await movieService.getMovies({ limit: 100 });
    return sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

export const createMovie = async (req, res, next) => {
  try {
    const movie = await movieService.createMovie(req.body);
    return sendSuccess(res, { movie }, 201);
  } catch (error) {
    next(error);
  }
};

export const updateMovie = async (req, res, next) => {
  try {
    const movie = await movieService.updateMovie(req.params.id, req.body);
    return sendSuccess(res, { movie });
  } catch (error) {
    next(error);
  }
};

export const deleteMovie = async (req, res, next) => {
  try {
    const result = await movieService.deleteMovie(req.params.id);
    return sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

export const getShows = async (req, res, next) => {
  try {
    const result = await movieService.getTVShows({ limit: 100 });
    return sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

export const createShow = async (req, res, next) => {
  try {
    const show = await movieService.createTVShow(req.body);
    return sendSuccess(res, { show }, 201);
  } catch (error) {
    next(error);
  }
};

export const updateShow = async (req, res, next) => {
  try {
    const show = await movieService.updateTVShow(req.params.id, req.body);
    return sendSuccess(res, { show });
  } catch (error) {
    next(error);
  }
};

export const deleteShow = async (req, res, next) => {
  try {
    const result = await movieService.deleteTVShow(req.params.id);
    return sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

export const addEpisode = async (req, res, next) => {
  try {
    const episode = await movieService.addEpisode(req.params.id, req.body);
    return sendSuccess(res, { episode }, 201);
  } catch (error) {
    next(error);
  }
};

export const getGenres = async (req, res, next) => {
  try {
    const genres = await Genre.find().sort({ name: 1 });
    return sendSuccess(res, { genres });
  } catch (error) {
    next(error);
  }
};

export const createGenre = async (req, res, next) => {
  try {
    const { name, icon, description } = req.body;
    if (!name) {
      return sendError(res, 'Genre name is required.', 400);
    }
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const genre = await Genre.create({ name, slug, icon, description });
    return sendSuccess(res, { genre }, 201);
  } catch (error) {
    next(error);
  }
};

export const deleteGenre = async (req, res, next) => {
  try {
    await Genre.findByIdAndDelete(req.params.id);
    return sendSuccess(res, { message: 'Genre deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const getAnalytics = async (req, res, next) => {
  try {
    const [totalUsers, totalMovies, totalShows, totalEpisodes, totalStreams] = await Promise.all([
      User.countDocuments(),
      Movie.countDocuments(),
      TVShow.countDocuments(),
      Episode.countDocuments(),
      WatchHistory.countDocuments(),
    ]);

    const topMovies = await Movie.find().sort({ viewsCount: -1 }).limit(5).select('title viewsCount rating');

    return sendSuccess(res, {
      totalUsers,
      totalMovies,
      totalShows,
      totalEpisodes,
      totalStreams,
      topMovies,
    });
  } catch (error) {
    next(error);
  }
};
