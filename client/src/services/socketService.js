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

    this.socket.on('connect', () => { this.isConnected = true; this.emit('connect'); });
    this.socket.on('disconnect', () => { this.isConnected = false; this.emit('disconnect'); });

    // Server uses user_status_change, not user_online/offline
    this.socket.on('user_status_change', (data) => { this.emit('user_status_change', data); });

    this.socket.on('new_message', (data) => { this.emit('new_message', data); });
    this.socket.on('message_status_update', (data) => { this.emit('message_status_update', data); });
    this.socket.on('user_typing', (data) => { this.emit('user_typing', data); });
    this.socket.on('user_stop_typing', (data) => { this.emit('user_stop_typing', data); });

    // Ack of send
    this.socket.on('message_sent', (data) => { this.emit('message_sent', data); });
  }

  on(event, cb){ if (!this.listeners.has(event)) this.listeners.set(event, new Set()); this.listeners.get(event).add(cb); }
  off(event, cb){ const set=this.listeners.get(event); if (set) set.delete(cb); }

  joinConversation(conversationId){ if(this.socket&&this.isConnected) this.socket.emit('join_conversation', { conversationId }); }
  leaveConversation(conversationId){ if(this.socket&&this.isConnected) this.socket.emit('leave_conversation', { conversationId }); }

  // IMPORTANT: align payload with server contract (expects encryptedContent/iv/authTag)
  sendMessage({ conversationId, content, type='text', attachment }){
    if (!(this.socket && this.isConnected)) return false;
    try {
      const payload = {
        conversationId,
        type,
        encryptedContent: btoa(content || ''),
        iv: 'demo-iv',
        authTag: 'demo-tag',
        attachment
      };
      this.socket.emit('send_message', payload);
      return true;
    } catch (e){ console.warn('socket send failed', e); return false; }
  }

  startTyping(conversationId){ if(this.socket&&this.isConnected) this.socket.emit('typing_start',{ conversationId }); }
  stopTyping(conversationId){ if(this.socket&&this.isConnected) this.socket.emit('typing_stop',{ conversationId }); }
  updateMessageStatus(messageId, status, conversationId){ if(this.socket&&this.isConnected) this.socket.emit('message_read',{ messageId, conversationId, status }); }

  isSocketConnected(){ return this.isConnected; }
}

export const socketService = new SocketService();
export default socketService;
