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

    // Prefer explicit VITE_SOCKET_URL; fallback to same-origin (http://localhost:5173) but point to :3000 server
    const serverURL = import.meta.env.VITE_SOCKET_URL || `${window.location.protocol}//${window.location.hostname}:3000`;

    this.socket = io(serverURL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      upgrade: true,
      rememberUpgrade: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 500,
      timeout: 10000
    });

    this.socket.on('connect', () => {
      console.log('🔗 Connected to P2P server', { url: serverURL, id: this.socket.id });
      this.isConnected = true;
    });

    this.socket.on('connect_error', (err) => {
      console.error('🚨 Socket connect_error:', err?.message || err);
    });

    this.socket.on('error', (error) => {
      console.error('🚨 Socket error:', error);
    });

    this.socket.on('disconnect', (reason) => {
      console.warn('📡 Disconnected from P2P server', { reason });
      this.isConnected = false;
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
