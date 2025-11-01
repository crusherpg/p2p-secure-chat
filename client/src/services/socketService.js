class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.listeners = new Map();
    this.typingTimer = null;
  }

  connect(token = null) {
    try {
      const url = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';
      
      if (typeof window !== 'undefined' && window.io) {
        this.socket = window.io(url, {
          auth: token ? { token } : {},
          transports: ['websocket', 'polling'],
          timeout: 5000,
          reconnection: true,
          reconnectionAttempts: this.maxReconnectAttempts,
          reconnectionDelay: 1000
        });

        this.setupEventHandlers();
      } else {
        console.warn('Socket.IO not available, running in offline mode');
        this.isConnected = false;
      }
    } catch (error) {
      console.warn('Socket connection failed:', error.message);
      this.isConnected = false;
    }

    return this.socket;
  }

  setupEventHandlers() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('🟢 Connected to P2P server');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.emit('connect');
    });

    this.socket.on('disconnect', (reason) => {
      console.log('🔴 Disconnected from server:', reason);
      this.isConnected = false;
      this.emit('disconnect', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.warn('🟡 Connection error:', error.message);
      this.isConnected = false;
      this.reconnectAttempts++;
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.warn('❌ Max reconnection attempts reached, running in offline mode');
      }
    });

    // Message handlers
    this.socket.on('new_message', (data) => {
      console.log('📨 New message received:', data);
      this.emit('new_message', data);
    });

    this.socket.on('message_status_update', (data) => {
      console.log('✅ Message status update:', data);
      this.emit('message_status_update', data);
    });

    // Typing handlers
    this.socket.on('user_typing', (data) => {
      this.emit('user_typing', data);
    });

    this.socket.on('user_stop_typing', (data) => {
      this.emit('user_stop_typing', data);
    });

    // Presence handlers
    this.socket.on('user_online', (data) => {
      this.emit('user_online', data);
    });

    this.socket.on('user_offline', (data) => {
      this.emit('user_offline', data);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnected = false;
    this.listeners.clear();
    if (this.typingTimer) {
      clearTimeout(this.typingTimer);
    }
  }

  emit(event, data) {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('❌ Error in socket listener:', error);
        }
      });
    }
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
  }

  off(event, callback) {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.delete(callback);
    }
  }

  // Join specific conversation room
  joinConversation(conversationId) {
    if (this.socket && this.isConnected) {
      try {
        this.socket.emit('join_conversation', { conversationId });
        console.log(`🏠 Joined conversation: ${conversationId}`);
      } catch (error) {
        console.warn('❌ Failed to join conversation:', error);
      }
    }
  }

  // Leave conversation room
  leaveConversation(conversationId) {
    if (this.socket && this.isConnected) {
      try {
        this.socket.emit('leave_conversation', { conversationId });
        console.log(`🚪 Left conversation: ${conversationId}`);
      } catch (error) {
        console.warn('❌ Failed to leave conversation:', error);
      }
    }
  }

  // Send message via socket
  sendMessage(data) {
    if (this.socket && this.isConnected) {
      try {
        this.socket.emit('send_message', data);
        console.log('📤 Message sent via socket:', data);
        return true;
      } catch (error) {
        console.warn('❌ Failed to send message via socket:', error);
        return false;
      }
    }
    console.warn('⚠️ Socket not connected, message not sent');
    return false;
  }

  // Typing indicators
  startTyping(conversationId) {
    if (this.socket && this.isConnected) {
      try {
        this.socket.emit('start_typing', { conversationId });
        
        // Auto-stop typing after 3 seconds
        if (this.typingTimer) clearTimeout(this.typingTimer);
        this.typingTimer = setTimeout(() => {
          this.stopTyping(conversationId);
        }, 3000);
      } catch (error) {
        console.warn('❌ Failed to send typing indicator:', error);
      }
    }
  }

  stopTyping(conversationId) {
    if (this.socket && this.isConnected) {
      try {
        this.socket.emit('stop_typing', { conversationId });
        if (this.typingTimer) {
          clearTimeout(this.typingTimer);
          this.typingTimer = null;
        }
      } catch (error) {
        console.warn('❌ Failed to send stop typing indicator:', error);
      }
    }
  }

  // Update message status
  updateMessageStatus(messageId, status) {
    if (this.socket && this.isConnected) {
      try {
        this.socket.emit('message_status', { messageId, status });
      } catch (error) {
        console.warn('❌ Failed to update message status:', error);
      }
    }
  }

  // Update user status
  updateUserStatus(status) {
    if (this.socket && this.isConnected) {
      try {
        this.socket.emit('user_status', { status });
      } catch (error) {
        console.warn('❌ Failed to update user status:', error);
      }
    }
  }

  isSocketConnected() {
    return this.isConnected;
  }
}

export const socketService = new SocketService();
export default socketService;
