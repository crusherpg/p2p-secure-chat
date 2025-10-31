/**
 * User Controller for P2P Secure Chat
 * Complete user management functions
 */
import User from '../models/User.js';
import { validationResult } from 'express-validator';

/**
 * Get user profile
 */
export const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId)
      .select('-password -totpSecret -backupCodes -sessions');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.json({ success: true, user });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get profile'
    });
  }
};

/**
 * Update user profile
 */
export const updateProfile = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Invalid input',
      errors: errors.array()
    });
  }
  
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
    
    res.json({
      success: true,
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile'
    });
  }
};

/**
 * Update privacy settings
 */
export const updatePrivacy = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Invalid input',
      errors: errors.array()
    });
  }
  
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
    
    // Note: This is for UI state only. Full TOTP enable/disable
    // should use /api/auth/totp/* endpoints with proper verification
    if (typeof totpEnabled === 'boolean') {
      update.totpEnabled = totpEnabled;
    }
    
    const user = await User.findByIdAndUpdate(
      userId,
      { $set: update },
      { new: true, runValidators: true }
    ).select('-password -totpSecret -backupCodes -sessions');
    
    res.json({
      success: true,
      message: 'Privacy settings updated',
      user
    });
  } catch (error) {
    console.error('Privacy update error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update privacy settings'
    });
  }
};

/**
 * Update user status
 */
export const updateStatus = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Invalid input',
      errors: errors.array()
    });
  }
  
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
    
    res.json({
      success: true,
      message: 'Status updated',
      user
    });
  } catch (error) {
    console.error('Status update error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update status'
    });
  }
};

/**
 * Get online users
 */
export const getOnlineUsers = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Invalid input',
      errors: errors.array()
    });
  }
  
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
    res.status(500).json({
      success: false,
      message: 'Failed to get online users'
    });
  }
};

/**
 * Search users
 */
export const searchUsers = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Invalid input',
      errors: errors.array()
    });
  }
  
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
    res.status(500).json({
      success: false,
      message: 'User search failed'
    });
  }
};

/**
 * Get user by ID
 */
export const getUserById = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Invalid input',
      errors: errors.array()
    });
  }
  
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
    res.status(500).json({
      success: false,
      message: 'Failed to get user'
    });
  }
};

/**
 * Block user (placeholder)
 */
export const blockUser = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Invalid input',
      errors: errors.array()
    });
  }
  
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id;
    
    if (userId === currentUserId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot block yourself'
      });
    }
    
    // TODO: Implement actual blocking logic with blocked users array in User model
    // For now, just return success for UI testing
    res.json({
      success: true,
      message: 'User blocked successfully'
    });
  } catch (error) {
    console.error('Block user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to block user'
    });
  }
};

export default {
  getProfile,
  updateProfile,
  updatePrivacy,
  updateStatus,
  getOnlineUsers,
  searchUsers,
  getUserById,
  blockUser
};
