import express from 'express';
import { getProfiles, createProfile, updateProfile, deleteProfile } from '../controllers/profileController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect); // All profile routes require authentication

router.route('/')
  .get(getProfiles)
  .post(createProfile);

router.route('/:id')
  .put(updateProfile)
  .delete(deleteProfile);

export default router;
