const express = require('express');
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Get conversations for a user
router.get('/conversations', authenticate, async (req, res) => {
  try {
    const conversations = await Conversation.find({
      'participants.user': req.user._id,
      'participants.isActive': true
    })
    .populate('participants.user', 'username avatar status lastSeen')
    .populate('lastMessage')
    .sort({ lastActivity: -1 })
    .limit(50);

    res.json({
      success: true,
      conversations
    });
  } catch (error) {
    console.error('❌ Get conversations error:', error);
    res.status(500).json({ message: 'Server error getting conversations' });
  }
});

// Get messages for a conversation
router.get('/conversation/:conversationId', authenticate, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    // Verify user is part of conversation
    const conversation = await Conversation.findOne({
      _id: conversationId,
      'participants.user': req.user._id,
      'participants.isActive': true
    });

    if (!conversation) {
      return res.status(403).json({ message: 'Unauthorized access to conversation' });
    }

    const messages = await Message.find({
      conversation: conversationId,
      deleted: false
    })
    .populate('from', 'username avatar')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

    res.json({
      success: true,
      messages: messages.reverse(), // Reverse to show oldest first
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        hasMore: messages.length === parseInt(limit)
      }
    });
  } catch (error) {
    console.error('❌ Get messages error:', error);
    res.status(500).json({ message: 'Server error getting messages' });
  }
});

// Mark messages as read
router.put('/conversation/:conversationId/read', authenticate, async (req, res) => {
  try {
    const { conversationId } = req.params;

    // Verify user is part of conversation
    const conversation = await Conversation.findOne({
      _id: conversationId,
      'participants.user': req.user._id,
      'participants.isActive': true
    });

    if (!conversation) {
      return res.status(403).json({ message: 'Unauthorized access to conversation' });
    }

    // Mark all unread messages as read
    await Message.updateMany({
      conversation: conversationId,
      to: req.user._id,
      status: { $ne: 'read' }
    }, {
      status: 'read',
      readAt: new Date()
    });

    res.json({
      success: true,
      message: 'Messages marked as read'
    });
  } catch (error) {
    console.error('❌ Mark messages read error:', error);
    res.status(500).json({ message: 'Server error marking messages as read' });
  }
});

module.exports = router;