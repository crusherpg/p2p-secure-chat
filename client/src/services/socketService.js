import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
    this.isConnected = false;
  }

  connect(token) {
    if (this.socket) {
      this.disconnect();
    }

    const serverURL = import.meta.env.VITE_SOCKET_URL || window.location.origin;
    
    this.socket = io(serverURL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      upgrade: true,
      rememberUpgrade: true
    });

    this.socket.on('connect', () => {
      console.log('🔗 Connected to P2P server');
      this.isConnected = true;
    });

    this.socket.on('disconnect', () => {
      console.log('📡 Disconnected from P2P server');
      this.isConnected = false;
    });

    this.socket.on('error', (error) => {
      console.error('🚨 Socket error:', error);
    });

    // Re-attach existing listeners
    this.listeners.forEach((callback, event) => {
      this.socket.on(event, callback);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  on(event, callback) {
    this.listeners.set(event, callback);
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event) {
    this.listeners.delete(event);
    if (this.socket) {
      this.socket.off(event);
    }
  }

  emit(event, data) {
    if (this.socket && this.isConnected) {
      this.socket.emit(event, data);
    } else {
      console.warn('⚠️ Socket not connected, cannot emit:', event);
    }
  }

  // Typing indicators
  startTyping(conversationId) {
    this.emit('typing_start', { conversationId });
  }

  stopTyping(conversationId) {
    this.emit('typing_stop', { conversationId });
  }

  // Send message
  sendMessage(messageData) {
    this.emit('send_message', messageData);
  }

  // Mark message as read
  markMessageRead(messageId, conversationId) {
    this.emit('message_read', { messageId, conversationId });
  }

  // Create conversation
  createConversation(participantId) {
    this.emit('create_conversation', { participantId });
  }

  // File upload notification
  notifyFileUpload(conversationId, filename) {
    this.emit('file_uploaded', { conversationId, filename });
  }

  getSocket() {
    return this.socket;
  }

  isSocketConnected() {
    return this.isConnected;
  }
}

export const socketService = new SocketService();