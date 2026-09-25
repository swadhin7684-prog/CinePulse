import express from 'express';
import {
  getUsers,
  getMovies,
  createMovie,
  updateMovie,
  deleteMovie,
  getShows,
  createShow,
  updateShow,
  deleteShow,
  addEpisode,
  getGenres,
  createGenre,
  deleteGenre,
  getAnalytics,
} from '../controllers/adminController.js';
import { protect } from '../middleware/authMiddleware.js';
import { adminOnly } from '../middleware/adminMiddleware.js';

const router = express.Router();

router.use(protect);
router.use(adminOnly);

// Analytics
router.get('/analytics', getAnalytics);

// User Management
router.get('/users', getUsers);

// Movies Management
router.route('/movies')
  .get(getMovies)
  .post(createMovie);

router.route('/movies/:id')
  .put(updateMovie)
  .delete(deleteMovie);

// TV Shows Management
router.route('/shows')
  .get(getShows)
  .post(createShow);

router.route('/shows/:id')
  .put(updateShow)
  .delete(deleteShow);

router.post('/shows/:id/episodes', addEpisode);

// Genres Management
router.route('/genres')
  .get(getGenres)
  .post(createGenre);

router.delete('/genres/:id', deleteGenre);

export default router;
