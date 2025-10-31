/**
 * User Model for P2P Secure Chat
 * Updated to 2025 standards with modern ES modules and enhanced security
 */

import mongoose from 'mongoose';
import argon2 from 'argon2';

const { Schema } = mongoose;

/**
 * User schema with comprehensive fields for secure chat application
 */
const UserSchema = new Schema({
  email: {
    type: String,
    required: [true, 'Email address is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      'Please provide a valid email address'
    ],
    index: true
  },
  
  username: {
    type: String,
    required: [true, 'Username is required'],
    trim: true,
    minlength: [2, 'Username must be at least 2 characters long'],
    maxlength: [50, 'Username cannot exceed 50 characters'],
    match: [
      /^[a-zA-Z0-9_.-]+$/,
      'Username can only contain letters, numbers, dots, hyphens, and underscores'
    ],
    index: true
  },
  
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters long'],
    select: false // Don't include password in queries by default
  },
  
  avatar: {
    type: String,
    default: null,
    validate: {
      validator: function(v) {
        return !v || /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i.test(v);
      },
      message: 'Avatar must be a valid image URL'
    }
  },
  
  status: {
    type: String,
    enum: {
      values: ['online', 'offline', 'away', 'busy'],
      message: 'Status must be one of: online, offline, away, busy'
    },
    default: 'offline',
    index: true
  },
  
  lastSeen: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  // Two-Factor Authentication fields
  totpSecret: {
    type: String,
    default: null,
    select: false // Don't include in queries by default
  },
  
  totpEnabled: {
    type: Boolean,
    default: false,
    index: true
  },
  
  backupCodes: {
    type: [{
      code: {
        type: String,
        required: true
      },
      used: {
        type: Boolean,
        default: false
      },
      usedAt: {
        type: Date,
        default: null
      }
    }],
    default: [],
    select: false // Don't include in queries by default
  },
  
  // Encryption keys for end-to-end encryption
  publicKey: {
    type: String,
    default: null
  },
  
  keyFingerprint: {
    type: String,
    default: null,
    index: true
  },
  
  // User preferences
  preferences: {
    theme: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'dark'
    },
    notifications: {
      type: Boolean,
      default: true
    },
    readReceipts: {
      type: Boolean,
      default: true
    },
    typingIndicators: {
      type: Boolean,
      default: true
    },
    language: {
      type: String,
      default: 'en',
      match: /^[a-z]{2}(-[A-Z]{2})?$/
    }
  },
  
  // Session management
  sessions: {
    type: [{
      token: {
        type: String,
        required: true
      },
      device: {
        type: String,
        default: 'Unknown Device'
      },
      ipAddress: {
        type: String,
        validate: {
          validator: function(v) {
            return !v || /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$|^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/.test(v);
          },
          message: 'Invalid IP address format'
        }
      },
      lastActive: {
        type: Date,
        default: Date.now
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    }],
    default: [],
    select: false // Don't include in queries by default
  },
  
  // Account status and security
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  
  emailVerified: {
    type: Boolean,
    default: false
  },
  
  emailVerificationToken: {
    type: String,
    default: null,
    select: false
  },
  
  passwordResetToken: {
    type: String,
    default: null,
    select: false
  },
  
  passwordResetExpires: {
    type: Date,
    default: null,
    select: false
  },
  
  // Login attempts tracking
  loginAttempts: {
    type: Number,
    default: 0
  },
  
  lockUntil: {
    type: Date,
    default: null
  }
  
}, {
  timestamps: true,
  versionKey: false,
  toJSON: {
    transform: function(doc, ret) {
      delete ret.password;
      delete ret.totpSecret;
      delete ret.backupCodes;
      delete ret.sessions;
      delete ret.emailVerificationToken;
      delete ret.passwordResetToken;
      delete ret.passwordResetExpires;
      return ret;
    }
  }
});

// Indexes for better query performance
UserSchema.index({ email: 1, username: 1 });
UserSchema.index({ status: 1, lastSeen: -1 });
UserSchema.index({ createdAt: -1 });

// Virtual for account lock status
UserSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Pre-save middleware for password hashing
UserSchema.pre('save', async function(next) {
  // Only hash password if it's modified and not already hashed
  if (!this.isModified('password') || this.password.startsWith('$argon2')) {
    return next();
  }
  
  try {
    // Hash password with Argon2 (2025 standard)
    this.password = await argon2.hash(this.password, {
      type: argon2.argon2id,
      memoryCost: 2 ** 16, // 64 MB
      timeCost: 3,
      parallelism: 1,
      hashLength: 32
    });
    next();
  } catch (error) {
    next(error);
  }
});

// Password comparison method using Argon2
UserSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    if (!this.password) {
      throw new Error('Password not available for comparison');
    }
    return await argon2.verify(this.password, candidatePassword);
  } catch (error) {
    console.error('Password comparison error:', error);
    return false;
  }
};

// Method to clean expired sessions
UserSchema.methods.cleanExpiredSessions = function() {
  const expiredTime = new Date(Date.now() - (7 * 24 * 60 * 60 * 1000)); // 7 days
  const originalLength = this.sessions.length;
  
  this.sessions = this.sessions.filter(session => 
    session.lastActive && session.lastActive > expiredTime
  );
  
  if (this.sessions.length !== originalLength) {
    console.log(`🧹 Cleaned ${originalLength - this.sessions.length} expired sessions for user: ${this.username}`);
    return this.save();
  }
  
  return Promise.resolve(this);
};

// Method to handle failed login attempts
UserSchema.methods.incLoginAttempts = function() {
  // Max attempts before account lock
  const maxAttempts = 5;
  const lockTime = 30 * 60 * 1000; // 30 minutes
  
  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 }
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  
  // Lock account if we've reached max attempts
  if (this.loginAttempts + 1 >= maxAttempts && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + lockTime };
    console.warn(`🔒 User account locked due to too many failed attempts: ${this.email}`);
  }
  
  return this.updateOne(updates);
};

// Method to reset login attempts
UserSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $unset: {
      loginAttempts: 1,
      lockUntil: 1
    }
  });
};

// Static method to find user by email or username
UserSchema.statics.findByEmailOrUsername = function(identifier) {
  return this.findOne({
    $or: [
      { email: identifier.toLowerCase().trim() },
      { username: { $regex: new RegExp(`^${identifier.trim()}$`, 'i') } }
    ]
  });
};

// Static method to find active users
UserSchema.statics.findActiveUsers = function(limit = 50) {
  return this.find({ 
    isActive: true,
    status: { $in: ['online', 'away'] }
  })
  .select('username email avatar status lastSeen')
  .sort({ lastSeen: -1 })
  .limit(limit);
};

const User = mongoose.model('User', UserSchema);

export default User;