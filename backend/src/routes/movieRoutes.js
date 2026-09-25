import express from 'express';
import {
  getMovies,
  getMovieById,
  createMovie,
  updateMovie,
  deleteMovie,
  getTVShows,
  getTVShowById,
} from '../controllers/movieController.js';
import { protect } from '../middleware/authMiddleware.js';
import { adminOnly } from '../middleware/adminMiddleware.js';

const router = express.Router();

router.get('/', getMovies);
router.get('/shows', getTVShows);
router.get('/shows/:id', getTVShowById);
router.get('/:id', getMovieById);

// Admin-only mutation routes
router.post('/', protect, adminOnly, createMovie);
router.put('/:id', protect, adminOnly, updateMovie);
router.delete('/:id', protect, adminOnly, deleteMovie);

export default router;
