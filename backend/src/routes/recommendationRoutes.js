import express from 'express';
import {
  getRecommendations,
  getTrending,
  getPopular,
  getSimilar,
} from '../controllers/recommendationController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/trending', getTrending);
router.get('/popular', getPopular);
router.get('/similar/:id', getSimilar);
// Personalized recommendations optionally accept authentication and x-profile-id
router.get('/', (req, res, next) => {
  // If authorization header exists, protect
  if (req.headers.authorization) {
    return protect(req, res, next);
  }
  next();
}, getRecommendations);

export default router;
