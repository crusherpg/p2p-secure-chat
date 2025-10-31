/**
 * Socket.IO Connection Handler for P2P Secure Chat
 * Updated to 2025 standards with modern async/await patterns
 */

import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import winston from 'winston';

// Configure logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => {
      return `${timestamp} [SOCKET] [${level.toUpperCase()}]: ${message}`;
    })
  ),
  transports: [new winston.transports.Console()]
});

/**
 * Authenticate socket connection using JWT token
 * @param {Object} socket - Socket.IO socket instance
 * @param {Function} next - Next middleware function
 */
const authenticateSocket = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization;
    
    if (!token) {
      logger.warn(`Socket authentication failed: No token provided from ${socket.handshake.address}`);
      return next(new Error('Authentication token required'));
    }
    
    // Extract token from Bearer format if needed
    const cleanToken = token.startsWith('Bearer ') ? token.substring(7) : token;
    
    // Verify JWT token
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      logger.error('JWT_SECRET not configured for socket authentication');
      return next(new Error('Server configuration error'));
    }
    
    const decoded = jwt.verify(cleanToken, secret, {
      issuer: 'P2P-Secure-Chat',
      audience: 'P2P-Client',
      algorithms: ['HS256']
    });
    
    // Fetch user from database
    const user = await User.findById(decoded.userId)
      .select('-password -totpSecret -sessions -backupCodes')
      .lean();
    
    if (!user || !user.isActive) {
      logger.warn(`Socket authentication failed: User not found or inactive - ${decoded.userId}`);
      return next(new Error('User not found or inactive'));
    }
    
    // Attach user to socket
    socket.user = {
      id: user._id.toString(),
      email: user.email,
      username: user.username,
      avatar: user.avatar,
      status: user.status,
      preferences: user.preferences
    };
    
    logger.info(`Socket authenticated successfully: ${user.username} (${socket.id})`);
    next();
    
  } catch (error) {
    logger.warn(`Socket authentication error: ${error.message}`);
    
    if (error.name === 'TokenExpiredError') {
      return next(new Error('Token expired'));
    } else if (error.name === 'JsonWebTokenError') {
      return next(new Error('Invalid token'));
    }
    
    return next(new Error('Authentication failed'));
  }
};

/**
 * Handle socket connection events
 * @param {Object} io - Socket.IO server instance
 */
const handleSocketConnection = (io) => {
  // Authentication middleware
  io.use(authenticateSocket);
  
  // Handle connections
  io.on('connection', async (socket) => {
    const user = socket.user;
    
    try {
      // Update user status to online
      await User.findByIdAndUpdate(user.id, {
        status: 'online',
        lastSeen: new Date()
      });
      
      logger.info(`🔗 User connected: ${user.username} (${socket.id})`);
      
      // Join user to their personal room
      socket.join(`user:${user.id}`);
      
      // Broadcast user online status
      socket.broadcast.emit('user_status_change', {
        userId: user.id,
        username: user.username,
        status: 'online',
        timestamp: new Date().toISOString()
      });
      
      // Handle incoming message
      socket.on('send_message', async (data) => {
        try {
          const {
            conversationId,
            encryptedContent,
            iv,
            authTag,
            type = 'text',
            attachment
          } = data;
          
          if (!conversationId || !encryptedContent) {
            socket.emit('error', { message: 'Invalid message data' });
            return;
          }
          
          // Create message object
          const messageData = {
            id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            conversationId,
            from: {
              id: user.id,
              username: user.username,
              avatar: user.avatar
            },
            type,
            content: {
              encrypted: encryptedContent,
              iv,
              authTag
            },
            attachment,
            timestamp: new Date().toISOString(),
            status: 'sent'
          };
          
          // Emit to conversation participants (demo implementation)
          socket.to(`conversation:${conversationId}`).emit('new_message', messageData);
          
          // Confirm message sent
          socket.emit('message_sent', {
            tempId: data.tempId,
            messageId: messageData.id,
            timestamp: messageData.timestamp
          });
          
          logger.info(`Message sent by ${user.username} in conversation ${conversationId}`);
          
        } catch (error) {
          logger.error(`Error handling send_message: ${error.message}`);
          socket.emit('error', { message: 'Failed to send message' });
        }
      });
      
      // Handle typing indicators
      socket.on('typing_start', (data) => {
        try {
          const { conversationId } = data;
          if (conversationId) {
            socket.to(`conversation:${conversationId}`).emit('user_typing', {
              userId: user.id,
              username: user.username,
              conversationId,
              timestamp: new Date().toISOString()
            });
          }
        } catch (error) {
          logger.error(`Error handling typing_start: ${error.message}`);
        }
      });
      
      socket.on('typing_stop', (data) => {
        try {
          const { conversationId } = data;
          if (conversationId) {
            socket.to(`conversation:${conversationId}`).emit('user_stop_typing', {
              userId: user.id,
              username: user.username,
              conversationId,
              timestamp: new Date().toISOString()
            });
          }
        } catch (error) {
          logger.error(`Error handling typing_stop: ${error.message}`);
        }
      });
      
      // Handle message read receipts
      socket.on('message_read', (data) => {
        try {
          const { messageId, conversationId } = data;
          if (messageId && conversationId) {
            socket.to(`conversation:${conversationId}`).emit('message_status_update', {
              messageId,
              status: 'read',
              readBy: user.id,
              timestamp: new Date().toISOString()
            });
            
            logger.debug(`Message ${messageId} marked as read by ${user.username}`);
          }
        } catch (error) {
          logger.error(`Error handling message_read: ${error.message}`);
        }
      });
      
      // Handle joining conversations
      socket.on('join_conversation', (data) => {
        try {
          const { conversationId } = data;
          if (conversationId) {
            socket.join(`conversation:${conversationId}`);
            logger.info(`User ${user.username} joined conversation ${conversationId}`);
          }
        } catch (error) {
          logger.error(`Error handling join_conversation: ${error.message}`);
        }
      });
      
      // Handle leaving conversations
      socket.on('leave_conversation', (data) => {
        try {
          const { conversationId } = data;
          if (conversationId) {
            socket.leave(`conversation:${conversationId}`);
            logger.info(`User ${user.username} left conversation ${conversationId}`);
          }
        } catch (error) {
          logger.error(`Error handling leave_conversation: ${error.message}`);
        }
      });
      
      // Handle file upload notifications
      socket.on('file_uploaded', (data) => {
        try {
          const { conversationId, filename, fileType, fileSize } = data;
          if (conversationId) {
            socket.to(`conversation:${conversationId}`).emit('file_upload_notification', {
              from: user.id,
              username: user.username,
              filename,
              fileType,
              fileSize,
              timestamp: new Date().toISOString()
            });
          }
        } catch (error) {
          logger.error(`Error handling file_uploaded: ${error.message}`);
        }
      });
      
      // Handle disconnection
      socket.on('disconnect', async (reason) => {
        try {
          // Update user status to offline
          await User.findByIdAndUpdate(user.id, {
            status: 'offline',
            lastSeen: new Date()
          });
          
          // Broadcast user offline status
          socket.broadcast.emit('user_status_change', {
            userId: user.id,
            username: user.username,
            status: 'offline',
            lastSeen: new Date().toISOString(),
            timestamp: new Date().toISOString()
          });
          
          logger.info(`📡 User disconnected: ${user.username} (${reason})`);
          
        } catch (error) {
          logger.error(`Error handling disconnect: ${error.message}`);
        }
      });
      
      // Handle connection errors
      socket.on('error', (error) => {
        logger.error(`Socket error for user ${user.username}: ${error.message}`);
      });
      
    } catch (error) {
      logger.error(`Error in socket connection handler: ${error.message}`);
      socket.disconnect(true);
    }
  });
  
  // Handle connection errors
  io.on('connection_error', (error) => {
    logger.error(`Socket.IO connection error: ${error.message}`);
  });
  
  logger.info('🔗 Socket.IO server initialized and ready for connections');
};

export default handleSocketConnection;