/**
 * User Routes for settings (profile and privacy)
 * Notes:
 * - Authenticate once at the router root in server/server.js (already applied),
 *   so we DO NOT re-apply authenticateToken here to avoid double-middleware issues.
 * - Validation trimmed and consistent with express-validator best practices.
 */
import express from 'express';
import { body } from 'express-validator';
import { updateProfile, updatePrivacy } from '../controllers/userController.js';

const router = express.Router();

router.put('/profile', [
  body('username')
    .optional({ nullable: true, checkFalsy: true })
    .isLength({ min: 2, max: 50 }).withMessage('Username must be 2-50 characters')
    .matches(/^[a-zA-Z0-9_.-]+$/).withMessage('Username can only contain letters, numbers, dots, hyphens, underscores'),
  body('preferences.theme')
    .optional({ nullable: true, checkFalsy: true })
    .isIn(['light','dark','auto']).withMessage('Invalid theme'),
  body('preferences.notifications')
    .optional({ nullable: true })
    .isBoolean().withMessage('Invalid notifications flag')
], updateProfile);

router.put('/privacy', [
  body('preferences.readReceipts')
    .optional({ nullable: true })
    .isBoolean(),
  body('preferences.typingIndicators')
    .optional({ nullable: true })
    .isBoolean(),
  body('totpEnabled')
    .optional({ nullable: true })
    .isBoolean()
], updatePrivacy);

export default router;
