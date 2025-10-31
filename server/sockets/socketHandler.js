const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');

// Store connected users
const connectedUsers = new Map();

// Socket authentication middleware
const authenticateSocket = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password -totpSecret');
    
    if (!user) {
      return next(new Error('User not found'));
    }

    socket.userId = user._id.toString();
    socket.user = user;
    next();
  } catch (error) {
    next(new Error('Authentication error'));
  }
};

const handleConnection = (io) => {
  // Apply authentication middleware
  io.use(authenticateSocket);

  io.on('connection', async (socket) => {
    console.log(`🔗 User connected: ${socket.user.username} (${socket.userId})`);

    // Store user connection
    connectedUsers.set(socket.userId, {
      socketId: socket.id,
      user: socket.user
    });

    // Update user status to online
    await User.findByIdAndUpdate(socket.userId, {
      status: 'online',
      lastSeen: new Date()
    });

    // Notify other users that this user is online
    socket.broadcast.emit('user_status_change', {
      userId: socket.userId,
      status: 'online'
    });

    // Join user to their conversation rooms
    const conversations = await Conversation.find({
      'participants.user': socket.userId,
      'participants.isActive': true
    });

    conversations.forEach(conv => {
      socket.join(conv._id.toString());
    });

    // Handle typing indicators
    socket.on('typing_start', (data) => {
      socket.to(data.conversationId).emit('user_typing', {
        userId: socket.userId,
        username: socket.user.username,
        conversationId: data.conversationId
      });
    });

    socket.on('typing_stop', (data) => {
      socket.to(data.conversationId).emit('user_stop_typing', {
        userId: socket.userId,
        conversationId: data.conversationId
      });
    });

    // Handle message sending
    socket.on('send_message', async (data) => {
      try {
        const { conversationId, encryptedContent, iv, authTag, type, attachment } = data;

        // Verify user is part of conversation
        const conversation = await Conversation.findOne({
          _id: conversationId,
          'participants.user': socket.userId,
          'participants.isActive': true
        });

        if (!conversation) {
          socket.emit('error', { message: 'Unauthorized conversation access' });
          return;
        }

        // Get the other participant for direct messages
        const otherParticipant = conversation.participants.find(
          p => p.user.toString() !== socket.userId
        );

        // Create message
        const message = new Message({
          from: socket.userId,
          to: otherParticipant.user,
          conversation: conversationId,
          content: {
            encrypted: encryptedContent,
            iv: iv,
            authTag: authTag
          },
          type: type || 'text',
          attachment: attachment
        });

        await message.save();

        // Update conversation last activity
        conversation.lastMessage = message._id;
        conversation.lastActivity = new Date();
        conversation.messageCount += 1;
        await conversation.save();

        // Populate sender info
        await message.populate('from', 'username avatar');

        // Send message to all participants in the conversation
        io.to(conversationId).emit('new_message', {
          id: message._id,
          from: {
            id: message.from._id,
            username: message.from.username,
            avatar: message.from.avatar
          },
          conversationId: conversationId,
          content: message.content,
          type: message.type,
          attachment: message.attachment,
          timestamp: message.createdAt,
          status: 'sent'
        });

        // Send delivery confirmation to sender
        socket.emit('message_delivered', {
          messageId: message._id,
          timestamp: new Date()
        });

        console.log(`💬 Message sent from ${socket.user.username} in conversation ${conversationId}`);

      } catch (error) {
        console.error('❌ Send message error:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle message status updates
    socket.on('message_read', async (data) => {
      try {
        const { messageId, conversationId } = data;

        await Message.findByIdAndUpdate(messageId, {
          status: 'read',
          readAt: new Date()
        });

        // Notify sender that message was read
        socket.to(conversationId).emit('message_status_update', {
          messageId: messageId,
          status: 'read',
          readBy: socket.userId,
          timestamp: new Date()
        });

      } catch (error) {
        console.error('❌ Message read error:', error);
      }
    });

    // Handle conversation creation
    socket.on('create_conversation', async (data) => {
      try {
        const { participantId, type = 'direct' } = data;

        // Check if conversation already exists
        let conversation = await Conversation.findOne({
          type: 'direct',
          'participants.user': { $all: [socket.userId, participantId] }
        });

        if (conversation) {
          socket.emit('conversation_created', { conversation });
          return;
        }

        // Create new conversation
        conversation = new Conversation({
          type: type,
          participants: [
            { user: socket.userId },
            { user: participantId }
          ]
        });

        await conversation.save();
        await conversation.populate('participants.user', 'username avatar status');

        // Join both users to the conversation room
        socket.join(conversation._id.toString());
        const participantSocket = connectedUsers.get(participantId);
        if (participantSocket) {
          io.to(participantSocket.socketId).socketsJoin(conversation._id.toString());
        }

        // Notify both users
        io.to(conversation._id.toString()).emit('conversation_created', {
          conversation: conversation
        });

        console.log(`💬 New conversation created between ${socket.user.username} and participant ${participantId}`);

      } catch (error) {
        console.error('❌ Create conversation error:', error);
        socket.emit('error', { message: 'Failed to create conversation' });
      }
    });

    // Handle file upload notification
    socket.on('file_uploaded', (data) => {
      socket.to(data.conversationId).emit('file_upload_notification', {
        from: socket.userId,
        filename: data.filename,
        conversationId: data.conversationId
      });
    });

    // Handle disconnect
    socket.on('disconnect', async () => {
      console.log(`👋 User disconnected: ${socket.user.username} (${socket.userId})`);

      // Remove from connected users
      connectedUsers.delete(socket.userId);

      // Update user status
      await User.findByIdAndUpdate(socket.userId, {
        status: 'offline',
        lastSeen: new Date()
      });

      // Notify other users that this user is offline
      socket.broadcast.emit('user_status_change', {
        userId: socket.userId,
        status: 'offline',
        lastSeen: new Date()
      });
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error('🚨 Socket error:', error);
    });
  });
};

module.exports = handleConnection;