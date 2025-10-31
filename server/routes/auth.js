/**
 * Authentication Routes for P2P Secure Chat
 * Updated to 2025 standards with comprehensive validation and security
 */

import express from 'express';
import { body } from 'express-validator';
import {
  register,
  login,
  setupTOTP,
  verifyTOTP,
  logout,
  getProfile
} from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * Input validation rules following 2025 security standards
 */

// Email validation
const emailValidation = body('email')
  .isEmail()
  .normalizeEmail()
  .withMessage('Please provide a valid email address')
  .isLength({ max: 254 })
  .withMessage('Email address is too long');

// Password validation (2025 NIST guidelines)
const passwordValidation = body('password')
  .isLength({ min: 8, max: 128 })
  .withMessage('Password must be between 8 and 128 characters long')
  .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 'i')
  .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character');

// Username validation
const usernameValidation = body('username')
  .isLength({ min: 2, max: 50 })
  .withMessage('Username must be between 2 and 50 characters long')
  .matches(/^[a-zA-Z0-9_.-]+$/)
  .withMessage('Username can only contain letters, numbers, dots, hyphens, and underscores')
  .custom((value) => {
    // Reserved usernames
    const reserved = [
      'admin', 'root', 'system', 'api', 'www', 'mail', 'ftp',
      'support', 'help', 'info', 'news', 'test', 'demo'
    ];
    if (reserved.includes(value.toLowerCase())) {
      throw new Error('Username is reserved and cannot be used');
    }
    return true;
  });

// TOTP code validation (conditional)
// checkFalsy allows empty string to be treated as "not provided"
const totpValidation = body('totpCode')
  .optional({ nullable: true, checkFalsy: true })
  .isLength({ min: 6, max: 6 })
  .withMessage('TOTP code must be exactly 6 digits')
  .isNumeric()
  .withMessage('TOTP code must contain only numbers');

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user account
 * @access  Public
 * @body    { email, username, password }
 */
router.post('/register', [
  emailValidation,
  usernameValidation,
  passwordValidation
], register);

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user login
 * @access  Public
 * @body    { email, password, totpCode? }
 */
router.post('/login', [
  emailValidation,
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ max: 128 })
    .withMessage('Password is too long'),
  totpValidation
], login);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user and clean session
 * @access  Private
 */
router.post('/logout', authenticateToken, logout);

/**
 * @route   GET /api/auth/profile
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/profile', authenticateToken, getProfile);

/**
 * @route   POST /api/auth/totp/setup
 * @desc    Setup Two-Factor Authentication
 * @access  Private
 */
router.post('/totp/setup', authenticateToken, setupTOTP);

/**
 * @route   POST /api/auth/totp/verify
 * @desc    Verify TOTP code and enable 2FA
 * @access  Private
 * @body    { totpCode }
 */
router.post('/totp/verify', [
  authenticateToken,
  body('totpCode')
    .isLength({ min: 6, max: 6 })
    .withMessage('TOTP code must be exactly 6 digits')
    .isNumeric()
    .withMessage('TOTP code must contain only numbers')
], verifyTOTP);

/**
 * @route   GET /api/auth/check
 * @desc    Check if authentication token is valid
 * @access  Private
 */
router.get('/check', authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: 'Token is valid',
    user: {
      id: req.user.id,
      email: req.user.email,
      username: req.user.username,
      status: req.user.status,
      totpEnabled: req.user.totpEnabled
    }
  });
});

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh authentication token
 * @access  Private
 */
router.post('/refresh', authenticateToken, async (req, res) => {
  try {
    const jwt = await import('jsonwebtoken');
    const secret = process.env.JWT_SECRET;
    
    const token = jwt.sign(
      { 
        userId: req.user.id,
        type: 'access',
        iat: Math.floor(Date.now() / 1000)
      },
      secret,
      {
        expiresIn: process.env.JWT_EXPIRES_IN || '24h',
        issuer: 'P2P-Secure-Chat',
        audience: 'P2P-Client',
        algorithm: 'HS256'
      }
    );

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      token
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to refresh token'
    });
  }
});

export default router;