const mongoose = require('mongoose');

const ConversationSchema = new mongoose.Schema({
  participants: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    leftAt: Date,
    isActive: {
      type: Boolean,
      default: true
    }
  }],
  type: {
    type: String,
    enum: ['direct', 'group'],
    default: 'direct'
  },
  name: {
    type: String,
    trim: true,
    maxlength: 100
  },
  avatar: String,
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },
  // Encryption keys for this conversation
  sharedSecret: String,
  keyRotationCount: {
    type: Number,
    default: 0
  },
  // Settings
  settings: {
    disappearingMessages: {
      enabled: { type: Boolean, default: false },
      duration: { type: Number, default: 604800 } // 7 days in seconds
    },
    readReceipts: { type: Boolean, default: true },
    typingIndicators: { type: Boolean, default: true }
  },
  // Message count for pagination
  messageCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for efficient participant queries
ConversationSchema.index({ 'participants.user': 1 });
ConversationSchema.index({ lastActivity: -1 });

module.exports = mongoose.model('Conversation', ConversationSchema);