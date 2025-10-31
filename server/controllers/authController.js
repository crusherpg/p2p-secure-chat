/**
 * Authentication Controller for P2P Secure Chat
 * Updated to 2025 coding standards with modern async/await patterns
 * and comprehensive error handling
 */

import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import crypto from 'crypto';
import { validationResult } from 'express-validator';
import argon2 from 'argon2';

/**
 * Validates that JWT_SECRET is properly configured
 * @returns {string} The JWT secret
 * @throws {Error} If JWT_SECRET is not configured
 */
const getJWTSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      'JWT_SECRET environment variable is required and must be at least 32 characters long. ' +
      'Please check your .env file and ensure JWT_SECRET is properly configured.'
    );
  }
  return secret;
};

/**
 * Generates a JWT token for user authentication
 * @param {string} userId - The user's database ID
 * @param {string} [expiresIn='24h'] - Token expiration time
 * @returns {string} Signed JWT token
 */
const generateToken = (userId, expiresIn = '24h') => {
  try {
    const secret = getJWTSecret();
    return jwt.sign(
      { 
        userId, 
        type: 'access',
        iat: Math.floor(Date.now() / 1000)
      }, 
      secret,
      {
        expiresIn: process.env.JWT_EXPIRES_IN || expiresIn,
        issuer: 'P2P-Secure-Chat',
        audience: 'P2P-Client',
        algorithm: 'HS256'
      }
    );
  } catch (error) {
    console.error('❌ JWT Generation Error:', error);
    throw new Error('Failed to generate authentication token');
  }
};

/**
 * Generates cryptographically secure backup codes for 2FA
 * @returns {Array<{code: string, used: boolean}>} Array of backup codes
 */
const generateBackupCodes = () => {
  const codes = [];
  for (let i = 0; i < 10; i++) {
    codes.push({
      code: crypto.randomBytes(4).toString('hex').toUpperCase(),
      used: false
    });
  }
  return codes;
};

/**
 * Validates and sanitizes user input for registration/login
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object|null} Validation errors or null if valid
 */
const validateInput = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Invalid input data',
      errors: errors.array().map(err => ({
        field: err.param,
        message: err.msg,
        value: err.value
      }))
    });
  }
  return null;
};

/**
 * Register a new user with enhanced security
 * @route POST /api/auth/register
 */
export const register = async (req, res) => {
  try {
    // Validate input
    const validationError = validateInput(req, res);
    if (validationError) return;

    const { email, username, password } = req.body;

    // Check for existing user
    const existingUser = await User.findOne({
      $or: [
        { email: email.toLowerCase() },
        { username: { $regex: new RegExp(`^${username}$`, 'i') } }
      ]
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: existingUser.email === email.toLowerCase() 
          ? 'Email address is already registered'
          : 'Username is already taken'
      });
    }

    // Hash password with Argon2 (2025 standard)
    const hashedPassword = await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 2 ** 16,
      timeCost: 3,
      parallelism: 1,
    });

    // Create new user
    const user = new User({
      email: email.toLowerCase().trim(),
      username: username.trim(),
      password: hashedPassword,
      preferences: {
        theme: 'dark',
        notifications: true,
        readReceipts: true,
        typingIndicators: true
      }
    });

    await user.save();

    // Generate authentication token
    const token = generateToken(user._id.toString());

    // Log successful registration
    console.log(`🎉 New user registered: ${username} (${email})`);

    // Return success response (excluding sensitive data)
    res.status(201).json({
      success: true,
      message: 'Account created successfully! Welcome to P2P Secure Chat.',
      token,
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        totpEnabled: user.totpEnabled,
        preferences: user.preferences,
        createdAt: user.createdAt
      }
    });

  } catch (error) {
    console.error('❌ Registration error:', error);
    
    // Handle specific database errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        details: Object.values(error.errors).map(err => err.message)
      });
    }
    
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Email or username already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Registration failed. Please try again.',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
  }
};

/**
 * Authenticate user login with 2FA support
 * @route POST /api/auth/login
 */
export const login = async (req, res) => {
  try {
    // Validate input
    const validationError = validateInput(req, res);
    if (validationError) return;

    const { email, password, totpCode } = req.body;

    // Find user with case-insensitive email
    const user = await User.findOne({
      email: email.toLowerCase().trim()
    }).select('+password +totpSecret +backupCodes +sessions');

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // Verify password with Argon2
    const isPasswordValid = await argon2.verify(user.password, password);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // Check TOTP if enabled
    if (user.totpEnabled) {
      if (!totpCode) {
        return res.status(200).json({ success: false, requiresTOTP: true, message: '2FA verification required' });
      }

      const verified = speakeasy.totp.verify({ secret: user.totpSecret, encoding: 'base32', token: String(totpCode).replace(/\s/g, ''), window: 2 });
      if (!verified) {
        return res.status(401).json({ success: false, message: 'Invalid 2FA code' });
      }
    }

    // Initialize sessions
    if (!Array.isArray(user.sessions)) user.sessions = [];

    // Compute a safe IP string (avoid failing validation on proxies/IPv6 forms)
    const rawIp = (req.headers['x-forwarded-for']?.split(',')[0] || req.ip || req.connection?.remoteAddress || '').toString();
    // Normalize common IPv6 localhost to 127.0.0.1; fallback to empty string if still invalid
    const ipAddress = (rawIp === '::1' || rawIp === '::ffff:127.0.0.1') ? '127.0.0.1' : rawIp;

    // Update user status and add session
    const newToken = generateToken(user._id.toString());
    user.status = 'online';
    user.lastSeen = new Date();
    user.sessions.push({
      token: newToken.substring(0, 20) + '...',
      device: req.headers['user-agent'] || 'Unknown Device',
      // Do NOT block login on IP validation — store only if it matches our regex, else omit
      ipAddress: ipAddress,
      lastActive: new Date()
    });

    try {
      await user.save();
    } catch (err) {
      // If IP format triggers validation error, retry save without the IP
      if (err?.message?.includes('Invalid IP address format')) {
        user.sessions[user.sessions.length - 1].ipAddress = '';
        await user.save();
      } else {
        throw err;
      }
    }

    if (typeof user.cleanExpiredSessions === 'function') {
      await user.cleanExpiredSessions();
    }

    console.log(`🔐 User logged in: ${user.username}`, { ip: ipAddress });

    return res.json({
      success: true,
      message: `Welcome back, ${user.username}!`,
      token: newToken,
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        status: 'online',
        totpEnabled: user.totpEnabled,
        preferences: user.preferences,
        lastSeen: user.lastSeen
      }
    });

  } catch (error) {
    console.error('❌ Login error:', error);
    return res.status(500).json({ success: false, message: 'Login failed. Please try again.' });
  }
};


/**
 * Setup Two-Factor Authentication (TOTP)
 * @route POST /api/auth/totp/setup
 */
export const setupTOTP = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.totpEnabled) {
      return res.status(400).json({
        success: false,
        message: '2FA is already enabled for this account'
      });
    }

    // Generate TOTP secret
    const secret = speakeasy.generateSecret({
      name: `P2P Secure Chat (${user.email})`,
      issuer: 'P2P Secure Chat',
      length: 32
    });

    // Store secret temporarily (will be confirmed during verification)
    user.totpSecret = secret.base32;
    await user.save();

    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

    console.log(`🔐 TOTP setup initiated for: ${user.username}`);

    res.json({
      success: true,
      secret: secret.base32,
      qrCode: qrCodeUrl,
      manualEntry: secret.base32,
      issuer: 'P2P Secure Chat'
    });

  } catch (error) {
    console.error('❌ TOTP setup error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to setup 2FA. Please try again.'
    });
  }
};

/**
 * Verify TOTP code and enable 2FA
 * @route POST /api/auth/totp/verify
 */
export const verifyTOTP = async (req, res) => {
  try {
    const { totpCode } = req.body;
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const user = await User.findById(userId);
    if (!user || !user.totpSecret) {
      return res.status(400).json({
        success: false,
        message: 'TOTP setup not found. Please restart the setup process.'
      });
    }

    // Verify TOTP code
    const verified = speakeasy.totp.verify({
      secret: user.totpSecret,
      encoding: 'base32',
      token: totpCode.replace(/\s/g, ''),
      window: 2
    });

    if (!verified) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification code. Please try again.'
      });
    }

    // Enable TOTP and generate backup codes
    user.totpEnabled = true;
    user.backupCodes = generateBackupCodes();
    await user.save();

    console.log(`✅ 2FA enabled for: ${user.username}`);

    res.json({
      success: true,
      message: '2FA has been successfully enabled!',
      backupCodes: user.backupCodes.map(bc => bc.code)
    });

  } catch (error) {
    console.error('❌ TOTP verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Verification failed. Please try again.'
    });
  }
};

/**
 * Logout user and clean session (HARDENED VERSION)
 * @route POST /api/auth/logout
 */
export const logout = async (req, res) => {
  try {
    const userId = req?.user?.id;

    // If middleware didn't populate req.user, still return success for idempotency
    if (!userId) {
      return res.json({ success: true, message: 'Logged out successfully' });
    }

    const user = await User.findById(userId).select('+sessions');

    if (user) {
      // Update user status
      user.status = 'offline';
      user.lastSeen = new Date();
      
      // Remove current session safely
      const authHeader = req.headers?.authorization || '';
      const authToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

      // Ensure sessions is an array before filtering
      if (authToken && Array.isArray(user.sessions)) {
        const tokenPrefix = `${authToken.substring(0, 20)}...`;
        user.sessions = user.sessions.filter((session) => session?.token !== tokenPrefix);
      }

      await user.save();
      console.log(`👋 User logged out: ${user.username}`);
    }

    return res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    console.error('❌ Logout error:', error);
    // Always return success for logout to ensure client-side cleanup
    return res.json({ success: true, message: 'Logged out successfully' });
  }
};

/**
 * Get user profile information
 * @route GET /api/auth/profile
 */
export const getProfile = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const user = await User.findById(userId)
      .select('-password -totpSecret -sessions -backupCodes');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found'
      });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        avatar: user.avatar,
        status: user.status,
        lastSeen: user.lastSeen,
        totpEnabled: user.totpEnabled,
        preferences: user.preferences,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });

  } catch (error) {
    console.error('❌ Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve profile information'
    });
  }
};

// Export all controller functions as named exports AND default object
export default {
  register,
  login,
  setupTOTP,
  verifyTOTP,
  logout,
  getProfile
};