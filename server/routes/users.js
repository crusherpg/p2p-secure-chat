/**
 * User Routes for P2P Secure Chat
 * Complete routes with all user management endpoints
 */
import express from 'express';
import { body, param, query } from 'express-validator';
import { authenticateToken } from '../middleware/auth.js';
import User from '../models/User.js';
import { validationResult } from 'express-validator';

const router = express.Router();

/**
 * Helper to handle validation errors
 */
const handleValidationErrors = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Invalid input data',
      errors: errors.array()
    });
  }
  return null;
};

/**
 * GET /api/users/profile
 * Get current user's profile (already available via /api/auth/profile)
 */
router.get('/profile', async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).select('-password -totpSecret -backupCodes -sessions');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get profile' });
  }
});

/**
 * PUT /api/users/profile
 * Update user profile settings
 */
router.put('/profile', [
  body('username')
    .optional({ checkFalsy: true })
    .isLength({ min: 2, max: 50 })
    .withMessage('Username must be 2-50 characters')
    .matches(/^[a-zA-Z0-9_.-]+$/)
    .withMessage('Username can only contain letters, numbers, dots, hyphens, underscores'),
  body('preferences.theme')
    .optional({ checkFalsy: true })
    .isIn(['light', 'dark', 'auto'])
    .withMessage('Invalid theme'),
  body('preferences.notifications')
    .optional({ checkFalsy: true })
    .isBoolean()
    .withMessage('Invalid notifications flag'),
  body('preferences.language')
    .optional({ checkFalsy: true })
    .matches(/^[a-z]{2}(-[A-Z]{2})?$/)
    .withMessage('Invalid language format')
], async (req, res) => {
  const validationError = handleValidationErrors(req, res);
  if (validationError) return;
  
  try {
    const userId = req.user.id;
    const { username, preferences } = req.body;
    
    // Check username uniqueness if provided
    if (username) {
      const existingUser = await User.findOne({
        username: { $regex: new RegExp(`^${username}$`, 'i') },
        _id: { $ne: userId }
      });
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'Username is already taken'
        });
      }
    }
    
    const update = {};
    if (username) update.username = username.trim();
    if (preferences) {
      if (preferences.theme) update['preferences.theme'] = preferences.theme;
      if (typeof preferences.notifications === 'boolean') {
        update['preferences.notifications'] = preferences.notifications;
      }
      if (preferences.language) update['preferences.language'] = preferences.language;
    }
    
    const user = await User.findByIdAndUpdate(
      userId,
      { $set: update },
      { new: true, runValidators: true }
    ).select('-password -totpSecret -backupCodes -sessions');
    
    res.json({ success: true, message: 'Profile updated successfully', user });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ success: false, message: 'Failed to update profile' });
  }
});

/**
 * PUT /api/users/privacy
 * Update privacy settings
 */
router.put('/privacy', [
  body('preferences.readReceipts')
    .optional({ checkFalsy: true })
    .isBoolean(),
  body('preferences.typingIndicators')
    .optional({ checkFalsy: true })
    .isBoolean(),
  body('totpEnabled')
    .optional({ checkFalsy: true })
    .isBoolean()
], async (req, res) => {
  const validationError = handleValidationErrors(req, res);
  if (validationError) return;
  
  try {
    const userId = req.user.id;
    const { preferences, totpEnabled } = req.body;
    
    const update = {};
    if (preferences) {
      if (typeof preferences.readReceipts === 'boolean') {
        update['preferences.readReceipts'] = preferences.readReceipts;
      }
      if (typeof preferences.typingIndicators === 'boolean') {
        update['preferences.typingIndicators'] = preferences.typingIndicators;
      }
    }
    
    // Note: We only update the UI state here. Full TOTP enable/disable
    // should go through the proper /api/auth/totp/* endpoints with verification
    if (typeof totpEnabled === 'boolean') {
      update.totpEnabled = totpEnabled;
    }
    
    const user = await User.findByIdAndUpdate(
      userId,
      { $set: update },
      { new: true, runValidators: true }
    ).select('-password -totpSecret -backupCodes -sessions');
    
    res.json({ success: true, message: 'Privacy settings updated', user });
  } catch (error) {
    console.error('Privacy update error:', error);
    res.status(500).json({ success: false, message: 'Failed to update privacy settings' });
  }
});

/**
 * PUT /api/users/status
 * Update user online status
 */
router.put('/status', [
  body('status')
    .isIn(['online', 'offline', 'away', 'busy'])
    .withMessage('Invalid status')
], async (req, res) => {
  const validationError = handleValidationErrors(req, res);
  if (validationError) return;
  
  try {
    const userId = req.user.id;
    const { status } = req.body;
    
    const user = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          status,
          lastSeen: new Date()
        }
      },
      { new: true }
    ).select('id username status lastSeen');
    
    res.json({ success: true, message: 'Status updated', user });
  } catch (error) {
    console.error('Status update error:', error);
    res.status(500).json({ success: false, message: 'Failed to update status' });
  }
});

/**
 * GET /api/users/online
 * Get list of online users
 */
router.get('/online', [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
], async (req, res) => {
  const validationError = handleValidationErrors(req, res);
  if (validationError) return;
  
  try {
    const limit = parseInt(req.query.limit) || 50;
    const currentUserId = req.user.id;
    
    // Find users who are online and not the current user
    const onlineUsers = await User.find({
      _id: { $ne: currentUserId },
      status: { $in: ['online', 'away'] },
      isActive: true,
      lastSeen: {
        $gte: new Date(Date.now() - 5 * 60 * 1000) // Within last 5 minutes
      }
    })
    .select('id username email avatar status lastSeen')
    .sort({ lastSeen: -1 })
    .limit(limit);
    
    res.json({
      success: true,
      users: onlineUsers,
      count: onlineUsers.length
    });
  } catch (error) {
    console.error('Get online users error:', error);
    res.status(500).json({ success: false, message: 'Failed to get online users' });
  }
});

/**
 * GET /api/users/search
 * Search users by username or email
 */
router.get('/search', [
  query('q')
    .notEmpty()
    .isLength({ min: 2, max: 50 })
    .withMessage('Search query must be 2-50 characters'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50')
], async (req, res) => {
  const validationError = handleValidationErrors(req, res);
  if (validationError) return;
  
  try {
    const { q: query, limit = 20 } = req.query;
    const currentUserId = req.user.id;
    
    const searchRegex = new RegExp(query.trim(), 'i');
    
    const users = await User.find({
      _id: { $ne: currentUserId },
      isActive: true,
      $or: [
        { username: { $regex: searchRegex } },
        { email: { $regex: searchRegex } }
      ]
    })
    .select('id username email avatar status lastSeen')
    .sort({ username: 1 })
    .limit(parseInt(limit));
    
    res.json({
      success: true,
      users,
      query,
      count: users.length
    });
  } catch (error) {
    console.error('User search error:', error);
    res.status(500).json({ success: false, message: 'User search failed' });
  }
});

/**
 * GET /api/users/:userId
 * Get public profile of a specific user
 */
router.get('/:userId', [
  param('userId')
    .isMongoId()
    .withMessage('Invalid user ID')
], async (req, res) => {
  const validationError = handleValidationErrors(req, res);
  if (validationError) return;
  
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id;
    
    if (userId === currentUserId) {
      return res.status(400).json({
        success: false,
        message: 'Use /profile endpoint for your own profile'
      });
    }
    
    const user = await User.findOne({
      _id: userId,
      isActive: true
    }).select('id username avatar status lastSeen createdAt');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.json({ success: true, user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ success: false, message: 'Failed to get user' });
  }
});

/**
 * POST /api/users/:userId/block
 * Block a user (placeholder for future implementation)
 */
router.post('/:userId/block', [
  param('userId')
    .isMongoId()
    .withMessage('Invalid user ID')
], async (req, res) => {
  const validationError = handleValidationErrors(req, res);
  if (validationError) return;
  
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id;
    
    if (userId === currentUserId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot block yourself'
      });
    }
    
    // TODO: Implement user blocking logic
    // For now, just return success for UI testing
    res.json({
      success: true,
      message: 'User blocked successfully'
    });
  } catch (error) {
    console.error('Block user error:', error);
    res.status(500).json({ success: false, message: 'Failed to block user' });
  }
});

export default router;
