class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.listeners = new Map();
  }

  connect(token = null) {
    try {
      // Try to connect, but don't break the app if it fails
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
      console.log('Connected to P2P server');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.emit('connect');
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Disconnected from server:', reason);
      this.isConnected = false;
      this.emit('disconnect', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.warn('Connection error:', error.message);
      this.isConnected = false;
      this.reconnectAttempts++;
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.warn('Max reconnection attempts reached, running in offline mode');
      }
    });

    // Message handlers
    this.socket.on('new_message', (data) => {
      this.emit('new_message', data);
    });

    this.socket.on('user_typing', (data) => {
      this.emit('user_typing', data);
    });

    this.socket.on('user_stop_typing', (data) => {
      this.emit('user_stop_typing', data);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnected = false;
    this.listeners.clear();
  }

  emit(event, data) {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in socket listener:', error);
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

  sendMessage(data) {
    if (this.socket && this.isConnected) {
      try {
        this.socket.emit('send_message', data);
        return true;
      } catch (error) {
        console.warn('Failed to send message via socket:', error);
        return false;
      }
    }
    console.warn('Socket not connected, message not sent');
    return false;
  }

  startTyping(conversationId) {
    if (this.socket && this.isConnected) {
      try {
        this.socket.emit('start_typing', { conversationId });
      } catch (error) {
        console.warn('Failed to send typing indicator:', error);
      }
    }
  }

  stopTyping(conversationId) {
    if (this.socket && this.isConnected) {
      try {
        this.socket.emit('stop_typing', { conversationId });
      } catch (error) {
        console.warn('Failed to send stop typing indicator:', error);
      }
    }
  }

  isSocketConnected() {
    return this.isConnected;
  }
}

export const socketService = new SocketService();
export default socketService;
