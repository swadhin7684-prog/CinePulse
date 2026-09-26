import * as dbService from '../services/firestoreDb.js';
import * as movieService from '../services/movieService.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const getUsers = async (req, res, next) => {
  try {
    const rawUsers = await dbService.findAll('users');
    rawUsers.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    // Populate profiles and exclude password
    const users = await Promise.all(
      rawUsers.map(async (u) => {
        const profiles = await dbService.findAll('profiles', { userId: u._id.toString() });
        const { password: _, ...userSafe } = u;
        return {
          ...userSafe,
          profiles,
        };
      })
    );

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
    const genres = await dbService.findAll('genres');
    genres.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
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
    const genre = await dbService.createDoc('genres', {
      name: name.trim(),
      slug,
      icon: icon || 'Film',
      description: description || '',
    });
    return sendSuccess(res, { genre }, 201);
  } catch (error) {
    next(error);
  }
};

export const deleteGenre = async (req, res, next) => {
  try {
    await dbService.deleteDoc('genres', req.params.id);
    return sendSuccess(res, { message: 'Genre deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const getAnalytics = async (req, res, next) => {
  try {
    const [totalUsers, totalMovies, totalShows, totalEpisodes, totalStreams, movies] =
      await Promise.all([
        dbService.count('users'),
        dbService.count('movies'),
        dbService.count('tvShows'),
        dbService.count('episodes'),
        dbService.count('watchHistory'),
        dbService.findAll('movies'),
      ]);

    const topMovies = [...movies]
      .sort((a, b) => (b.viewsCount || 0) - (a.viewsCount || 0))
      .slice(0, 5)
      .map((m) => ({
        _id: m._id,
        id: m.id,
        title: m.title,
        viewsCount: m.viewsCount || 0,
        rating: m.rating || 0,
      }));

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
