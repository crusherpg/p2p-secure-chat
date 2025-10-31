const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  username: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 50
  },
  password: {
    type: String,
    required: true,
    minlength: 8
  },
  avatar: {
    type: String,
    default: null
  },
  status: {
    type: String,
    enum: ['online', 'offline', 'away'],
    default: 'offline'
  },
  lastSeen: {
    type: Date,
    default: Date.now
  },
  // 2FA/TOTP fields
  totpSecret: {
    type: String,
    default: null
  },
  totpEnabled: {
    type: Boolean,
    default: false
  },
  backupCodes: [{
    code: String,
    used: { type: Boolean, default: false }
  }],
  // Security settings
  publicKey: {
    type: String,
    default: null
  },
  keyFingerprint: {
    type: String,
    default: null
  },
  preferences: {
    theme: { type: String, enum: ['light', 'dark'], default: 'dark' },
    notifications: { type: Boolean, default: true },
    readReceipts: { type: Boolean, default: true },
    typingIndicators: { type: Boolean, default: true }
  },
  sessions: [{
    token: String,
    device: String,
    ipAddress: String,
    lastActive: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true
});

// Password hashing middleware
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
UserSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Clean expired sessions
UserSchema.methods.cleanExpiredSessions = function() {
  const expiredTime = new Date(Date.now() - (24 * 60 * 60 * 1000)); // 24 hours
  this.sessions = this.sessions.filter(session => session.lastActive > expiredTime);
  return this.save();
};

module.exports = mongoose.model('User', UserSchema);