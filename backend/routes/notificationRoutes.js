import express from 'express';
import {
  dropNtifications,
  getUserNotifications,
  markNotificationAsRead,
} from '../controllers/notificationController.js';
import { auth } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/', auth, getUserNotifications);
router.put('/:id/read', auth, markNotificationAsRead);
router.delete('/delete', auth, dropNtifications);

export const notificationRouter = router;
