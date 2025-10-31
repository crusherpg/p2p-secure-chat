const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  from: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  to: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  conversation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true
  },
  content: {
    encrypted: {
      type: String,
      required: true
    },
    iv: {
      type: String,
      required: true
    },
    authTag: {
      type: String,
      required: true
    }
  },
  type: {
    type: String,
    enum: ['text', 'file', 'image', 'system'],
    default: 'text'
  },
  attachment: {
    filename: String,
    originalName: String,
    mimeType: String,
    size: Number,
    encryptionKey: String,
    checksum: String
  },
  status: {
    type: String,
    enum: ['sent', 'delivered', 'read', 'failed'],
    default: 'sent'
  },
  deliveredAt: Date,
  readAt: Date,
  // Message integrity
  signature: String,
  messageHash: String,
  // Deletion
  deleted: {
    type: Boolean,
    default: false
  },
  deletedAt: Date,
  // Forward secrecy
  keyRotation: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for efficient queries
MessageSchema.index({ conversation: 1, createdAt: -1 });
MessageSchema.index({ from: 1, to: 1, createdAt: -1 });

module.exports = mongoose.model('Message', MessageSchema);