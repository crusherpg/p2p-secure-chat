/**
 * Message Model for P2P Secure Chat
 * Updated to 2025 standards with ES modules and comprehensive validation
 */

import mongoose from 'mongoose';

const { Schema } = mongoose;

/**
 * Message schema for encrypted P2P messaging
 */
const MessageSchema = new Schema({
  // Conversation reference
  conversation: {
    type: Schema.Types.ObjectId,
    ref: 'Conversation',
    required: [true, 'Conversation ID is required'],
    index: true
  },
  
  // Message sender
  from: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Sender ID is required'],
    index: true
  },
  
  // Message type
  type: {
    type: String,
    enum: {
      values: ['text', 'image', 'audio', 'video', 'file', 'emoji', 'gif', 'system'],
      message: 'Invalid message type'
    },
    default: 'text',
    index: true
  },
  
  // Encrypted message content
  content: {
    encrypted: {
      type: String,
      required: [true, 'Encrypted content is required']
    },
    iv: {
      type: String,
      required: [true, 'Initialization vector is required']
    },
    authTag: {
      type: String,
      required: [true, 'Authentication tag is required']
    }
  },
  
  // File attachment metadata (for media messages)
  attachment: {
    fileName: {
      type: String,
      trim: true,
      maxlength: 255
    },
    originalName: {
      type: String,
      trim: true,
      maxlength: 255
    },
    mimeType: {
      type: String,
      validate: {
        validator: function(v) {
          return /^[a-zA-Z0-9][a-zA-Z0-9!#$&\-\^_]*\/[a-zA-Z0-9][a-zA-Z0-9!#$&\-\^_.]*$/.test(v);
        },
        message: 'Invalid MIME type'
      }
    },
    fileSize: {
      type: Number,
      min: 0,
      max: 26214400 // 25MB limit
    },
    fileUrl: {
      type: String,
      validate: {
        validator: function(v) {
          return !v || /^https?:\/\/.+/.test(v) || /^\/uploads\/.+/.test(v);
        },
        message: 'Invalid file URL'
      }
    },
    thumbnailUrl: String,
    duration: Number, // For audio/video files (in seconds)
    dimensions: {
      width: Number,
      height: Number
    }
  },
  
  // Message status and delivery tracking
  status: {
    type: String,
    enum: {
      values: ['sent', 'delivered', 'read', 'failed'],
      message: 'Invalid message status'
    },
    default: 'sent',
    index: true
  },
  
  // Read receipts tracking
  readBy: [{
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Delivered status tracking
  deliveredTo: [{
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    deliveredAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Message metadata
  edited: {
    type: Boolean,
    default: false
  },
  
  editedAt: {
    type: Date,
    default: null
  },
  
  originalContent: {
    type: String,
    select: false // Don't include by default for privacy
  },
  
  // Reply/thread support
  replyTo: {
    type: Schema.Types.ObjectId,
    ref: 'Message',
    default: null
  },
  
  // Forward information
  forwardedFrom: {
    originalMessageId: {
      type: Schema.Types.ObjectId,
      ref: 'Message'
    },
    originalConversation: {
      type: Schema.Types.ObjectId,
      ref: 'Conversation'
    },
    originalSender: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    forwardedAt: {
      type: Date,
      default: Date.now
    }
  },
  
  // Disappearing messages
  expiresAt: {
    type: Date,
    default: null,
    index: { expireAfterSeconds: 0 } // MongoDB TTL index
  },
  
  // System message data
  systemData: {
    type: Schema.Types.Mixed,
    default: null
  },
  
  // Message reactions (future feature)
  reactions: [{
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    emoji: {
      type: String,
      required: true,
      maxlength: 10
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Delivery attempts (for reliability)
  deliveryAttempts: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  
  // Last delivery attempt
  lastDeliveryAttempt: {
    type: Date,
    default: null
  }
  
}, {
  timestamps: true,
  versionKey: false,
  toJSON: {
    transform: function(doc, ret) {
      // Convert _id to id for frontend compatibility
      ret.id = ret._id;
      delete ret._id;
      return ret;
    }
  }
});

// Compound indexes for efficient queries
MessageSchema.index({ conversation: 1, createdAt: -1 }); // Conversation messages by time
MessageSchema.index({ from: 1, createdAt: -1 }); // User's messages
MessageSchema.index({ status: 1, deliveryAttempts: 1 }); // Delivery status queries
MessageSchema.index({ expiresAt: 1 }, { sparse: true }); // TTL index for disappearing messages

// Text search index for message content (disabled by default for privacy)
// MessageSchema.index({ "content.encrypted": "text" });

// Instance methods

/**
 * Mark message as delivered to a user
 * @param {String} userId - User ID who received the message
 * @returns {Promise<Message>} Updated message
 */
MessageSchema.methods.markAsDelivered = function(userId) {
  // Check if already marked as delivered to this user
  const alreadyDelivered = this.deliveredTo.some(
    delivery => delivery.user.toString() === userId.toString()
  );
  
  if (!alreadyDelivered) {
    this.deliveredTo.push({
      user: userId,
      deliveredAt: new Date()
    });
    
    // Update overall status if not already read
    if (this.status === 'sent') {
      this.status = 'delivered';
    }
  }
  
  return this.save();
};

/**
 * Mark message as read by a user
 * @param {String} userId - User ID who read the message
 * @returns {Promise<Message>} Updated message
 */
MessageSchema.methods.markAsRead = function(userId) {
  // Check if already marked as read by this user
  const alreadyRead = this.readBy.some(
    read => read.user.toString() === userId.toString()
  );
  
  if (!alreadyRead) {
    this.readBy.push({
      user: userId,
      readAt: new Date()
    });
    
    // Update overall status
    this.status = 'read';
    
    // Also mark as delivered if not already
    this.markAsDelivered(userId);
  }
  
  return this.save();
};

/**
 * Check if message is read by all participants
 * @param {Array} participantIds - Array of participant user IDs
 * @returns {Boolean} True if read by all participants
 */
MessageSchema.methods.isReadByAll = function(participantIds) {
  const readUserIds = this.readBy.map(read => read.user.toString());
  return participantIds.every(id => 
    id.toString() === this.from.toString() || readUserIds.includes(id.toString())
  );
};

// Static methods

/**
 * Find messages in a conversation with pagination
 * @param {String} conversationId - Conversation ID
 * @param {Object} options - Pagination options
 * @returns {Promise<Array<Message>>} Array of messages
 */
MessageSchema.statics.findByConversation = function(conversationId, options = {}) {
  const {
    page = 1,
    limit = 50,
    beforeDate = null,
    messageTypes = null
  } = options;
  
  let query = { conversation: conversationId };
  
  // Filter by date if provided (for pagination)
  if (beforeDate) {
    query.createdAt = { $lt: new Date(beforeDate) };
  }
  
  // Filter by message types if provided
  if (messageTypes && Array.isArray(messageTypes)) {
    query.type = { $in: messageTypes };
  }
  
  return this.find(query)
    .populate('from', 'username email avatar status')
    .populate('replyTo', 'content type from createdAt')
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip((page - 1) * limit)
    .lean();
};

/**
 * Get unread message count for a user in a conversation
 * @param {String} conversationId - Conversation ID
 * @param {String} userId - User ID
 * @returns {Promise<Number>} Count of unread messages
 */
MessageSchema.statics.getUnreadCount = function(conversationId, userId) {
  return this.countDocuments({
    conversation: conversationId,
    from: { $ne: userId },
    'readBy.user': { $ne: userId }
  });
};

/**
 * Mark all messages in conversation as read by user
 * @param {String} conversationId - Conversation ID
 * @param {String} userId - User ID
 * @returns {Promise<Object>} Update result
 */
MessageSchema.statics.markAllAsRead = function(conversationId, userId) {
  return this.updateMany(
    {
      conversation: conversationId,
      from: { $ne: userId },
      'readBy.user': { $ne: userId }
    },
    {
      $push: {
        readBy: {
          user: userId,
          readAt: new Date()
        }
      },
      $set: {
        status: 'read'
      }
    }
  );
};

const Message = mongoose.model('Message', MessageSchema);

export default Message;