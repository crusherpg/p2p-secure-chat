/**
 * Authentication Middleware for P2P Secure Chat
 * Updated to 2025 standards with enhanced security and error handling
 */

import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import winston from 'winston';

// Configure logger for auth middleware
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => {
      return `${timestamp} [AUTH] [${level.toUpperCase()}]: ${message}`;
    })
  ),
  transports: [new winston.transports.Console()]
});

/**
 * Validates JWT secret configuration
 * @returns {string} The JWT secret
 * @throws {Error} If JWT_SECRET is not properly configured
 */
const getJWTSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('JWT_SECRET environment variable is required and must be at least 32 characters long');
  }
  return secret;
};

/**
 * Authentication middleware to verify JWT tokens
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const authenticateToken = async (req, res, next) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : null;

    if (!token) {
      logger.warn(`Authentication failed: No token provided from ${req.ip}`);
      return res.status(401).json({
        success: false,
        message: 'Access token is required',
        code: 'TOKEN_MISSING'
      });
    }

    // Verify JWT token
    let decoded;
    try {
      const secret = getJWTSecret();
      decoded = jwt.verify(token, secret, {
        issuer: 'P2P-Secure-Chat',
        audience: 'P2P-Client',
        algorithms: ['HS256']
      });
    } catch (jwtError) {
      logger.warn(`JWT verification failed from ${req.ip}: ${jwtError.message}`);
      
      let message = 'Invalid or expired token';
      let code = 'TOKEN_INVALID';
      
      if (jwtError.name === 'TokenExpiredError') {
        message = 'Token has expired';
        code = 'TOKEN_EXPIRED';
      } else if (jwtError.name === 'JsonWebTokenError') {
        message = 'Invalid token format';
        code = 'TOKEN_MALFORMED';
      } else if (jwtError.name === 'NotBeforeError') {
        message = 'Token not active yet';
        code = 'TOKEN_NOT_ACTIVE';
      }
      
      return res.status(401).json({
        success: false,
        message,
        code
      });
    }

    // Validate token payload
    if (!decoded.userId || typeof decoded.userId !== 'string') {
      logger.warn(`Invalid token payload from ${req.ip}: Missing or invalid userId`);
      return res.status(401).json({
        success: false,
        message: 'Invalid token payload',
        code: 'TOKEN_INVALID_PAYLOAD'
      });
    }

    // Fetch user from database
    const user = await User.findById(decoded.userId)
      .select('-password -totpSecret -sessions -backupCodes')
      .lean(); // Use lean() for better performance

    if (!user) {
      logger.warn(`User not found for token from ${req.ip}: ${decoded.userId}`);
      return res.status(401).json({
        success: false,
        message: 'User account not found',
        code: 'USER_NOT_FOUND'
      });
    }

    // Check if user account is active
    if (!user.isActive) {
      logger.warn(`Inactive user attempted access from ${req.ip}: ${user.email}`);
      return res.status(403).json({
        success: false,
        message: 'User account is deactivated',
        code: 'ACCOUNT_DEACTIVATED'
      });
    }

    // Check if user account is locked
    if (user.lockUntil && user.lockUntil > new Date()) {
      logger.warn(`Locked user attempted access from ${req.ip}: ${user.email}`);
      return res.status(423).json({
        success: false,
        message: 'User account is temporarily locked',
        code: 'ACCOUNT_LOCKED',
        lockUntil: user.lockUntil
      });
    }

    // Attach user to request object
    req.user = {
      id: user._id.toString(),
      email: user.email,
      username: user.username,
      status: user.status,
      preferences: user.preferences,
      totpEnabled: user.totpEnabled
    };

    // Log successful authentication (in development only)
    if (process.env.NODE_ENV === 'development') {
      logger.info(`User authenticated successfully: ${user.username} (${user.email})`);
    }

    next();

  } catch (error) {
    logger.error(`Authentication middleware error: ${error.message}`, {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      path: req.path,
      error: error.stack
    });

    return res.status(500).json({
      success: false,
      message: 'Authentication service error',
      code: 'AUTH_SERVICE_ERROR'
    });
  }
};

/**
 * Optional authentication middleware - doesn't fail if no token provided
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') 
    ? authHeader.substring(7) 
    : null;

  if (!token) {
    return next(); // Continue without authentication
  }

  // Use the same logic as authenticateToken but don't fail
  try {
    const secret = getJWTSecret();
    const decoded = jwt.verify(token, secret, {
      issuer: 'P2P-Secure-Chat',
      audience: 'P2P-Client',
      algorithms: ['HS256']
    });

    if (decoded.userId) {
      const user = await User.findById(decoded.userId)
        .select('-password -totpSecret -sessions -backupCodes')
        .lean();

      if (user && user.isActive) {
        req.user = {
          id: user._id.toString(),
          email: user.email,
          username: user.username,
          status: user.status,
          preferences: user.preferences,
          totpEnabled: user.totpEnabled
        };
      }
    }
  } catch (error) {
    // Silently fail for optional auth
    logger.debug(`Optional auth failed: ${error.message}`);
  }

  next();
};

/**
 * Middleware to check if user has admin privileges
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
      code: 'AUTH_REQUIRED'
    });
  }

  // In a real application, you'd check user.role === 'admin'
  // For this demo, we'll check if user has admin privileges
  const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(email => email.trim());
  
  if (!adminEmails.includes(req.user.email)) {
    logger.warn(`Non-admin user attempted admin access: ${req.user.email}`);
    return res.status(403).json({
      success: false,
      message: 'Admin privileges required',
      code: 'INSUFFICIENT_PRIVILEGES'
    });
  }

  next();
};

/**
 * Middleware to check if user has verified their email
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const requireEmailVerification = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
      code: 'AUTH_REQUIRED'
    });
  }

  try {
    const user = await User.findById(req.user.id).select('emailVerified').lean();
    
    if (!user || !user.emailVerified) {
      return res.status(403).json({
        success: false,
        message: 'Email verification required',
        code: 'EMAIL_VERIFICATION_REQUIRED'
      });
    }

    next();
  } catch (error) {
    logger.error(`Email verification check error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Verification service error',
      code: 'VERIFICATION_SERVICE_ERROR'
    });
  }
};

export default {
  authenticateToken,
  optionalAuth,
  requireAdmin,
  requireEmailVerification
};