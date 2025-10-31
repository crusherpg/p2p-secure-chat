/**
 * User Routes for settings (profile and privacy)
 */
import express from 'express';
import { body } from 'express-validator';
import { authenticateToken } from '../middleware/auth.js';
import { updateProfile, updatePrivacy } from '../controllers/userController.js';

const router = express.Router();

router.put('/profile', [
  authenticateToken,
  body('username').optional().isLength({ min: 2, max: 50 }).withMessage('Username must be 2-50 characters')
    .matches(/^[a-zA-Z0-9_.-]+$/).withMessage('Username can only contain letters, numbers, dots, hyphens, underscores'),
  body('preferences.theme').optional().isIn(['light','dark','auto']).withMessage('Invalid theme'),
  body('preferences.notifications').optional().isBoolean().withMessage('Invalid notifications flag')
], updateProfile);

router.put('/privacy', [
  authenticateToken,
  body('preferences.readReceipts').optional().isBoolean(),
  body('preferences.typingIndicators').optional().isBoolean(),
  body('totpEnabled').optional().isBoolean()
], updatePrivacy);

export default router;