class SocketService {
  constructor(){ this.socket=null; this.isConnected=false; this.listeners=new Map(); }
  connect(token){ const url=import.meta.env.VITE_SOCKET_URL||'http://localhost:3000'; this.socket=window.io(url,{auth:{token}}); this.socket.on('connect',()=>{this.isConnected=true; this.emit('connect');}); this.socket.on('disconnect',()=>{this.isConnected=false;}); ['new_message','message_status_update','user_typing','user_stop_typing','message_sent'].forEach(e=>this.socket.on(e,(d)=>this.emit(e,d))); }
  on(e,cb){ if(!this.listeners.has(e)) this.listeners.set(e,new Set()); this.listeners.get(e).add(cb); }
  off(e,cb){ const s=this.listeners.get(e); if(s) s.delete(cb); }
  emit(e,d){ const s=this.listeners.get(e); if(s) s.forEach(cb=>cb(d)); }
  joinConversation(conversationId){ if(this.socket) this.socket.emit('join_conversation',{conversationId}); }
  leaveConversation(conversationId){ if(this.socket) this.socket.emit('leave_conversation',{conversationId}); }
  sendMessage({conversationId, content, type='text', tempId}){ if(!this.socket) return false; const payload={conversationId, type, encryptedContent:btoa(content||''), iv:'demo-iv', authTag:'demo-tag', tempId}; this.socket.emit('send_message', payload); return true; }
  startTyping(conversationId){ if(this.socket) this.socket.emit('typing_start',{conversationId}); }
  stopTyping(conversationId){ if(this.socket) this.socket.emit('typing_stop',{conversationId}); }
  updateMessageStatus(messageId,status,conversationId){ if(this.socket) this.socket.emit('message_read',{messageId,conversationId,status}); }
  isSocketConnected(){ return this.isConnected; }
}
export const socketService=new SocketService();
export default socketService;