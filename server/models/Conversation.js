/**
 * Conversation Model for P2P Secure Chat
 * Updated to ES Modules (2025 standards)
 */

import mongoose from 'mongoose';

const { Schema } = mongoose;

const ConversationSchema = new Schema({
  participants: [{
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    joinedAt: { type: Date, default: Date.now },
    leftAt: Date,
    isActive: { type: Boolean, default: true }
  }],
  type: { type: String, enum: ['direct', 'group'], default: 'direct' },
  name: { type: String, trim: true, maxlength: 100 },
  avatar: String,
  lastMessage: { type: Schema.Types.ObjectId, ref: 'Message' },
  lastActivity: { type: Date, default: Date.now },
  sharedSecret: String,
  keyRotationCount: { type: Number, default: 0 },
  settings: {
    disappearingMessages: {
      enabled: { type: Boolean, default: false },
      duration: { type: Number, default: 604800 }
    },
    readReceipts: { type: Boolean, default: true },
    typingIndicators: { type: Boolean, default: true }
  },
  messageCount: { type: Number, default: 0 }
}, { timestamps: true });

ConversationSchema.index({ 'participants.user': 1 });
ConversationSchema.index({ lastActivity: -1 });

const Conversation = mongoose.model('Conversation', ConversationSchema);
export default Conversation;
