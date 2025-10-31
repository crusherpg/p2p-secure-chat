/**
 * Message Routes for P2P Secure Chat
 * Updated to 2025 standards with modern async/await patterns
 */

import express from 'express';
import { body, query, param } from 'express-validator';
import { validationResult } from 'express-validator';
import Message from '../models/Message.js';
import Conversation from '../models/Conversation.js';
import User from '../models/User.js';
import winston from 'winston';

const router = express.Router();

// Configure logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => {
      return `${timestamp} [MESSAGES] [${level.toUpperCase()}]: ${message}`;
    })
  ),
  transports: [new winston.transports.Console()]
});

/**
 * Validation middleware
 */
const validateInput = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Invalid input data',
      errors: errors.array()
    });
  }
  next();
};

/**
 * @route   GET /api/messages/conversations
 * @desc    Get user's conversations
 * @access  Private
 */
router.get('/conversations', async (req, res) => {
  try {
    const userId = req.user.id;
    
    // For demo purposes, return mock conversations
    const conversations = [
      {
        id: 'conv1',
        participants: [
          {
            id: 'user1',
            username: 'Alice Cooper',
            avatar: null,
            status: 'online'
          },
          {
            id: userId,
            username: req.user.username,
            avatar: null,
            status: 'online'
          }
        ],
        lastMessage: {
          id: 'msg1',
          content: 'Hey! How are you doing?',
          type: 'text',
          from: 'user1',
          timestamp: new Date().toISOString(),
          status: 'delivered'
        },
        unreadCount: 0,
        updatedAt: new Date().toISOString()
      }
    ];
    
    res.json({
      success: true,
      conversations,
      count: conversations.length
    });
    
  } catch (error) {
    logger.error(`Error fetching conversations: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch conversations'
    });
  }
});

/**
 * @route   GET /api/messages/conversation/:conversationId
 * @desc    Get messages for a specific conversation
 * @access  Private
 */
router.get('/conversation/:conversationId', [
  param('conversationId').notEmpty().withMessage('Conversation ID is required'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  validateInput
], async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const userId = req.user.id;
    
    // For demo purposes, return mock messages
    const messages = [
      {
        id: 'msg1',
        conversationId,
        from: {
          id: 'user1',
          username: 'Alice Cooper',
          avatar: null
        },
        type: 'text',
        content: {
          encrypted: 'SGV5ISBIb3cgYXJlIHlvdSBkb2luZz8=', // "Hey! How are you doing?" in base64
          iv: 'demo-iv-123',
          authTag: 'demo-auth-tag-123'
        },
        timestamp: new Date(Date.now() - 300000).toISOString(),
        status: 'read',
        edited: false
      },
      {
        id: 'msg2',
        conversationId,
        from: {
          id: userId,
          username: req.user.username,
          avatar: null
        },
        type: 'text',
        content: {
          encrypted: 'SSdtIGRvaW5nIGdyZWF0ISBUaGFua3MgZm9yIGFza2luZyE=', // "I'm doing great! Thanks for asking!" in base64
          iv: 'demo-iv-456',
          authTag: 'demo-auth-tag-456'
        },
        timestamp: new Date(Date.now() - 180000).toISOString(),
        status: 'delivered',
        edited: false
      }
    ];
    
    res.json({
      success: true,
      messages,
      pagination: {
        currentPage: parseInt(page),
        totalPages: 1,
        totalMessages: messages.length,
        hasNextPage: false,
        hasPreviousPage: false
      }
    });
    
  } catch (error) {
    logger.error(`Error fetching messages: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch messages'
    });
  }
});

/**
 * @route   POST /api/messages/send
 * @desc    Send a new message
 * @access  Private
 */
router.post('/send', [
  body('conversationId').notEmpty().withMessage('Conversation ID is required'),
  body('type').isIn(['text', 'image', 'audio', 'file', 'emoji', 'gif']).withMessage('Invalid message type'),
  body('encryptedContent').notEmpty().withMessage('Encrypted content is required'),
  body('iv').notEmpty().withMessage('IV is required for encryption'),
  body('authTag').notEmpty().withMessage('Auth tag is required for encryption'),
  validateInput
], async (req, res) => {
  try {
    const { conversationId, type, encryptedContent, iv, authTag, attachment } = req.body;
    const userId = req.user.id;
    
    // Create new message object (in real implementation, save to database)
    const newMessage = {
      id: `msg_${Date.now()}`,
      conversationId,
      from: {
        id: userId,
        username: req.user.username,
        avatar: null
      },
      type,
      content: {
        encrypted: encryptedContent,
        iv,
        authTag
      },
      attachment,
      timestamp: new Date().toISOString(),
      status: 'sent',
      edited: false
    };
    
    logger.info(`Message sent by ${req.user.username} in conversation ${conversationId}`);
    
    // In real implementation, emit to socket.io and save to database
    // For demo, just return success
    
    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      messageId: newMessage.id,
      timestamp: newMessage.timestamp
    });
    
  } catch (error) {
    logger.error(`Error sending message: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to send message'
    });
  }
});

/**
 * @route   PUT /api/messages/:messageId/status
 * @desc    Update message status (read, delivered, etc.)
 * @access  Private
 */
router.put('/:messageId/status', [
  param('messageId').notEmpty().withMessage('Message ID is required'),
  body('status').isIn(['delivered', 'read']).withMessage('Invalid status'),
  validateInput
], async (req, res) => {
  try {
    const { messageId } = req.params;
    const { status } = req.body;
    const userId = req.user.id;
    
    logger.info(`Message ${messageId} marked as ${status} by user ${req.user.username}`);
    
    res.json({
      success: true,
      message: `Message marked as ${status}`,
      messageId,
      status,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error(`Error updating message status: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to update message status'
    });
  }
});

/**
 * @route   DELETE /api/messages/:messageId
 * @desc    Delete a message
 * @access  Private
 */
router.delete('/:messageId', [
  param('messageId').notEmpty().withMessage('Message ID is required'),
  validateInput
], async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;
    
    logger.info(`Message ${messageId} deleted by user ${req.user.username}`);
    
    res.json({
      success: true,
      message: 'Message deleted successfully',
      messageId
    });
    
  } catch (error) {
    logger.error(`Error deleting message: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to delete message'
    });
  }
});

export default router;