import express from 'express';
import { rateContent, getRating } from '../controllers/ratingController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/:contentId', getRating);
router.post('/', protect, rateContent);

export default router;
