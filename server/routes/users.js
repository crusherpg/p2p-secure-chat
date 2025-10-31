/**
 * User Routes for P2P Secure Chat
 * Updated to 2025 standards with modern async/await patterns
 */

import express from 'express';
import { body, query, param } from 'express-validator';
import { validationResult } from 'express-validator';
import User from '../models/User.js';
import winston from 'winston';

const router = express.Router();

// Configure logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => {
      return `${timestamp} [USERS] [${level.toUpperCase()}]: ${message}`;
    })
  ),
  transports: [new winston.transports.Console()]
});

/**
 * Validation middleware
 */
const validateInput = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Invalid input data',
      errors: errors.array()
    });
  }
  next();
};

/**
 * @route   GET /api/users
 * @desc    Get list of active users
 * @access  Private
 * @query   { search?, status?, limit?, page? }
 */
router.get('/', [
  query('search').optional().isLength({ max: 100 }).withMessage('Search query too long'),
  query('status').optional().isIn(['online', 'offline', 'away', 'busy']).withMessage('Invalid status'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  validateInput
], async (req, res) => {
  try {
    const { search, status, limit = 20, page = 1 } = req.query;
    const currentUserId = req.user.id;
    
    // Build query
    let query = {
      _id: { $ne: currentUserId }, // Exclude current user
      isActive: true
    };
    
    // Add status filter
    if (status) {
      query.status = status;
    }
    
    // Add search filter
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Execute query with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const users = await User.find(query)
      .select('username email avatar status lastSeen createdAt')
      .sort({ lastSeen: -1, username: 1 })
      .limit(parseInt(limit))
      .skip(skip)
      .lean();
    
    // Get total count for pagination
    const totalUsers = await User.countDocuments(query);
    const totalPages = Math.ceil(totalUsers / parseInt(limit));
    
    logger.info(`User list requested by ${req.user.username}: ${users.length} users found`);
    
    res.json({
      success: true,
      users: users.map(user => ({
        id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        status: user.status,
        lastSeen: user.lastSeen,
        isOnline: user.status === 'online',
        joinedAt: user.createdAt
      })),
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalUsers,
        hasNextPage: parseInt(page) < totalPages,
        hasPreviousPage: parseInt(page) > 1
      }
    });
    
  } catch (error) {
    logger.error(`Error fetching users: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users'
    });
  }
});

/**
 * @route   GET /api/users/online
 * @desc    Get list of online users
 * @access  Private
 */
router.get('/online', async (req, res) => {
  try {
    const currentUserId = req.user.id;
    
    const onlineUsers = await User.find({
      _id: { $ne: currentUserId },
      status: 'online',
      isActive: true
    })
    .select('username email avatar lastSeen')
    .sort({ username: 1 })
    .limit(50)
    .lean();
    
    res.json({
      success: true,
      users: onlineUsers.map(user => ({
        id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        lastSeen: user.lastSeen
      })),
      count: onlineUsers.length
    });
    
  } catch (error) {
    logger.error(`Error fetching online users: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch online users'
    });
  }
});

/**
 * @route   GET /api/users/:id
 * @desc    Get user profile by ID
 * @access  Private
 */
router.get('/:id', [
  param('id').isMongoId().withMessage('Invalid user ID'),
  validateInput
], async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findOne({
      _id: id,
      isActive: true
    })
    .select('username email avatar status lastSeen createdAt preferences')
    .lean();
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        status: user.status,
        lastSeen: user.lastSeen,
        joinedAt: user.createdAt,
        isOnline: user.status === 'online',
        preferences: {
          theme: user.preferences?.theme || 'dark'
        }
      }
    });
    
  } catch (error) {
    logger.error(`Error fetching user profile: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user profile'
    });
  }
});

/**
 * @route   PUT /api/users/profile
 * @desc    Update current user profile
 * @access  Private
 * @body    { username?, avatar?, preferences? }
 */
router.put('/profile', [
  body('username')
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('Username must be between 2 and 50 characters')
    .matches(/^[a-zA-Z0-9_.-]+$/)
    .withMessage('Username can only contain letters, numbers, dots, hyphens, and underscores'),
  body('avatar')
    .optional()
    .isURL()
    .withMessage('Avatar must be a valid URL'),
  body('preferences.theme')
    .optional()
    .isIn(['light', 'dark', 'auto'])
    .withMessage('Theme must be light, dark, or auto'),
  body('preferences.notifications')
    .optional()
    .isBoolean()
    .withMessage('Notifications must be a boolean'),
  validateInput
], async (req, res) => {
  try {
    const userId = req.user.id;
    const updateData = {};
    
    // Validate and prepare update data
    if (req.body.username) {
      // Check if username is already taken
      const existingUser = await User.findOne({
        username: { $regex: new RegExp(`^${req.body.username}$`, 'i') },
        _id: { $ne: userId }
      });
      
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'Username is already taken'
        });
      }
      
      updateData.username = req.body.username.trim();
    }
    
    if (req.body.avatar !== undefined) {
      updateData.avatar = req.body.avatar;
    }
    
    if (req.body.preferences) {
      updateData.preferences = {
        ...req.user.preferences,
        ...req.body.preferences
      };
    }
    
    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password -totpSecret -sessions -backupCodes');
    
    logger.info(`Profile updated by user: ${updatedUser.username}`);
    
    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: updatedUser._id,
        username: updatedUser.username,
        email: updatedUser.email,
        avatar: updatedUser.avatar,
        status: updatedUser.status,
        preferences: updatedUser.preferences,
        updatedAt: updatedUser.updatedAt
      }
    });
    
  } catch (error) {
    logger.error(`Error updating profile: ${error.message}`);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to update profile'
    });
  }
});

/**
 * @route   PUT /api/users/status
 * @desc    Update user online status
 * @access  Private
 * @body    { status }
 */
router.put('/status', [
  body('status')
    .isIn(['online', 'offline', 'away', 'busy'])
    .withMessage('Status must be one of: online, offline, away, busy'),
  validateInput
], async (req, res) => {
  try {
    const userId = req.user.id;
    const { status } = req.body;
    
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { 
        status,
        lastSeen: new Date()
      },
      { new: true }
    ).select('status lastSeen');
    
    logger.info(`Status updated by ${req.user.username}: ${status}`);
    
    res.json({
      success: true,
      message: 'Status updated successfully',
      status: updatedUser.status,
      lastSeen: updatedUser.lastSeen
    });
    
  } catch (error) {
    logger.error(`Error updating status: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to update status'
    });
  }
});

export default router;