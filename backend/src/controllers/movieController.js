import * as movieService from '../services/movieService.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const getMovies = async (req, res, next) => {
  try {
    const result = await movieService.getMovies(req.query);
    return sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

export const getMovieById = async (req, res, next) => {
  try {
    const movie = await movieService.getMovieById(req.params.id);
    return sendSuccess(res, { movie });
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

export const getTVShows = async (req, res, next) => {
  try {
    const result = await movieService.getTVShows(req.query);
    return sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

export const getTVShowById = async (req, res, next) => {
  try {
    const show = await movieService.getTVShowById(req.params.id);
    return sendSuccess(res, { show });
  } catch (error) {
    next(error);
  }
};
