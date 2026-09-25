import express from 'express';
import {
  getHistory,
  saveProgress,
  getContinueWatching,
  updateProgress,
  removeFromHistory,
} from '../controllers/historyController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', getHistory);
router.get('/continue', getContinueWatching);
router.post('/', saveProgress);
router.put('/:contentId', updateProgress);
router.delete('/:contentId', removeFromHistory);

export default router;
