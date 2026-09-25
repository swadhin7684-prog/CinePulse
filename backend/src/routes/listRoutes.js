import express from 'express';
import { getMyList, addToList, removeFromList, checkInList } from '../controllers/listController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', getMyList);
router.post('/:contentId', addToList);
router.delete('/:contentId', removeFromList);
router.get('/:contentId/status', checkInList);

export default router;
