import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Shield, Bell, Search, MoreVertical, Send, Paperclip, Smile, Mic, Check, CheckCheck, Upload, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import userService from '../services/userService';
import messageService from '../services/messageService';
import socketService from '../services/socketService';
import toast from 'react-hot-toast';

const useDebouncedCallback = (fn, delay=300) => {
  const t = useRef();
  return (...args) => {
    clearTimeout(t.current);
    t.current = setTimeout(() => fn(...args), delay);
  };
};

const Spinner = () => (
  <div className="flex items-center justify-center py-3"><div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div></div>
);

const TypingIndicator = ({ users }) => {
  if (!users.length) return null;
  return (
    <div className="px-4 py-2 text-xs text-gray-500 italic">
      {users.join(', ')} {users.length === 1 ? 'is' : 'are'} typing...
    </div>
  );
};

const FileUpload = ({ onUpload, onCancel, uploading, progress }) => (
  <div className="absolute bottom-12 left-0 right-0 bg-white border-t border-gray-200 p-4">
    <div className="flex items-center justify-between mb-2">
      <span className="text-sm font-medium">Upload File</span>
      <button onClick={onCancel} className="p-1"><X className="w-4 h-4" /></button>
    </div>
    <div className="flex items-center gap-3">
      <input type="file" accept="image/*,application/pdf,.txt,.doc,.docx" onChange={(e) => e.target.files[0] && onUpload(e.target.files[0])} className="flex-1 text-sm" disabled={uploading} />
      {uploading && (
        <div className="flex-1">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-blue-600 h-2 rounded-full transition-all" style={{width: `${progress}%`}}></div>
          </div>
          <p className="text-xs text-gray-500 mt-1">{progress}% uploaded</p>
        </div>
      )}
    </div>
  </div>
);

const Emoji = ({ onPick }) => {
  const emojis = ['😀','😂','😍','👍','🙏','🔥','🎉','🥳','❤️','👏','😎','🤖'];
  return (
    <div className="absolute bottom-12 left-16 bg-white border border-gray-200 rounded-lg p-2 shadow-lg grid grid-cols-6 gap-1 z-10">
      {emojis.map(e => <button key={e} className="text-xl hover:bg-gray-100 rounded p-1" onClick={()=>onPick(e)}>{e}</button>)}
    </div>
  );
};

const Sidebar = ({ users, onSelect, activeId, query, setQuery, onSearch, loading }) => (
  <aside className="sidebar">
    <div className="sidebar-head">
      <p className="text-sm font-semibold mb-2">Messages</p>
      <div className="relative">
        <input value={query} onChange={(e)=>{ setQuery(e.target.value); onSearch(e.target.value); }} placeholder="Search users..." className="search pl-8" />
        <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-gray-400" />
      </div>
    </div>
    <div className="flex-1 overflow-y-auto">
      {loading && <Spinner />}
      {users.map(u => (
        <button key={u.id} onClick={()=>onSelect(u)} className={`user-item ${activeId===u.id ? 'bg-gray-50' : ''}`}>
          <div className="avatar">{u.avatar ? <img src={u.avatar} alt={u.name} /> : (u.username?.[0] || u.name?.[0] || 'U')}</div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium truncate">{u.username || u.name}</p>
              <span className="text-[11px] text-gray-500">{u.department||''}</span>
            </div>
            <p className="text-xs text-gray-500 truncate">
              {u.status==='online' ? 'Online' : u.lastSeen ? `Last seen ${new Date(u.lastSeen).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}` : (u.status || '')}
            </p>
          </div>
          <div className={`w-2 h-2 rounded-full ${u.status==='online'?'bg-green-500':u.status==='away'?'bg-yellow-500':u.status==='busy'?'bg-red-500':'bg-gray-400'}`} />
        </button>
      ))}
    </div>
  </aside>
);

const ChatPage = () => {
  const { user, token, logout } = useAuth();
  const [users, setUsers] = useState([]);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Persist selected conversation
  useEffect(()=>{ const saved = localStorage.getItem('p2p_active'); if (saved) { try { setActive(JSON.parse(saved)); } catch {} } },[]);
  useEffect(()=>{ if (active) localStorage.setItem('p2p_active', JSON.stringify(active)); },[active]);

  // Initialize services
  useEffect(()=>{ 
    userService.setAuthToken(token);
    messageService.setAuthToken(token);
  },[token]);

  const normalizeUser = (u) => ({
    id: u._id || u.id,
    username: u.username || u.name,
    name: u.username || u.name,
    avatar: u.avatar,
    status: u.status || (u.lastSeen ? 'offline' : 'online'),
    department: u.department,
    lastSeen: u.lastSeen
  });

  const fetchOnline = async () => {
    setLoadingUsers(true);
    try {
      const live = await userService.listOnline(100);
      const normalized = live.map(normalizeUser);
      setUsers(normalized);
      if (!active && normalized.length && !localStorage.getItem('p2p_active')) setActive(normalized[0]);
    } catch (e) {
      console.warn('Online users fetch failed, using demo:', e?.message);
      setUsers([
        normalizeUser({ id:'alice', name:'Alice Cooper', status:'online', department:'Engineering' }),
        normalizeUser({ id:'bob', name:'Bob Wilson', status:'away', department:'Design' }),
        normalizeUser({ id:'carol', name:'Carol Davis', status:'online', department:'Marketing' }),
        normalizeUser({ id:'david', name:'David Chen', status:'busy', department:'Sales' }),
      ]);
    } finally { setLoadingUsers(false); }
  };

  useEffect(()=>{ fetchOnline(); const t = setInterval(fetchOnline, 15000); return ()=>clearInterval(t); },[]);

  const debouncedSearch = useDebouncedCallback(async (q) => {
    if (!q) { fetchOnline(); return; }
    try {
      const res = await userService.searchUsers(q, 20);
      setUsers(res.map(normalizeUser));
    } catch {}
  }, 300);

  // Socket setup
  useEffect(()=>{
    if (!token) return;
    try { socketService.connect(token); } catch {}
    return () => socketService.disconnect();
  },[token]);

  // Join/leave conversation rooms
  useEffect(()=>{
    if (!active) return;
    socketService.joinConversation(active.id);
    return () => socketService.leaveConversation(active.id);
  },[active]);

  // Socket event handlers
  useEffect(()=>{
    const newMessageHandler = (msg) => {
      if (!active || (msg.conversationId !== active.id && msg.from !== active.id && msg.to !== active.id)) return;
      const normalized = {
        id: msg.id,
        from: msg.from === user?.id ? 'me' : 'them',
        text: msg.content || msg.text,
        ts: new Date(msg.timestamp).getTime(),
        status: msg.status || 'delivered',
        type: msg.type || 'text',
        attachment: msg.attachment
      };
      setMessages(prev => [...prev, normalized]);
      
      // Mark as read if chat is active
      if (document.visibilityState === 'visible' && msg.from !== user?.id) {
        setTimeout(() => {
          try { messageService.updateStatus(msg.id, 'read'); } catch {}
        }, 1000);
      }
    };

    const statusHandler = (data) => {
      setMessages(prev => prev.map(m => m.id === data.messageId ? { ...m, status: data.status } : m));
    };

    const typingHandler = (data) => {
      if (data.conversationId === active?.id && data.userId !== user?.id) {
        setTypingUsers(prev => [...new Set([...prev, data.username || 'Someone'])]);
      }
    };

    const stopTypingHandler = (data) => {
      if (data.conversationId === active?.id) {
        setTypingUsers(prev => prev.filter(u => u !== (data.username || 'Someone')));
      }
    };

    socketService.on('new_message', newMessageHandler);
    socketService.on('message_status_update', statusHandler);
    socketService.on('user_typing', typingHandler);
    socketService.on('user_stop_typing', stopTypingHandler);

    return () => {
      socketService.off('new_message', newMessageHandler);
      socketService.off('message_status_update', statusHandler);
      socketService.off('user_typing', typingHandler);
      socketService.off('user_stop_typing', stopTypingHandler);
    };
  },[active, user?.id]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const selectUser = async (u) => {
    setActive(u);
    setLoadingMessages(true);
    try {
      const { messages: history } = await messageService.getHistory(u.id);
      const normalized = history.map(m => ({
        id: m.id || m._id,
        from: m.from?.id === user?.id ? 'me' : 'them',
        text: m.content?.encrypted ? '[Encrypted Message]' : (m.content || m.text || ''),
        ts: new Date(m.timestamp).getTime(),
        status: m.status || 'delivered',
        type: m.type || 'text',
        attachment: m.attachment
      }));
      setMessages(normalized);
    } catch {
      // Fallback demo messages
      setMessages([
        { id:'m1', from:'them', text:'The UI overhaul is looking fantastic! Much more professional than before.', ts: Date.now()-600000, status:'read' },
        { id:'m2', from:'me', text:'I\'m glad you like it! Tried to balance modern design with enterprise needs.', ts: Date.now()-540000, status:'delivered' },
        { id:'m3', from:'them', text:'The centered layout works really well. Easy to focus on conversations.', ts: Date.now()-300000, status:'read' },
      ]);
    } finally {
      setLoadingMessages(false);
    }
  };

  const send = async () => {
    if (!text.trim() || !active) return;
    const localId = `m-${Date.now()}`;
    const localMsg = { id: localId, from:'me', text: text.trim(), ts: Date.now(), status:'sending' };
    setMessages(prev=>[...prev, localMsg]);
    setText('');
    
    try {
      // Try socket first, fallback to REST
      const socketSent = socketService.sendMessage({
        conversationId: active.id,
        content: localMsg.text,
        type: 'text'
      });
      
      if (!socketSent) {
        // Fallback to REST API
        await messageService.sendMessage({
          conversationId: active.id,
          type: 'text',
          encryptedContent: btoa(localMsg.text), // Simple base64 for demo
          iv: 'demo-iv',
          authTag: 'demo-tag'
        });
      }
      
      // Update status to sent
      setMessages(prev => prev.map(m => m.id === localId ? { ...m, status: 'sent' } : m));
      
    } catch (error) {
      console.error('Send failed:', error);
      setMessages(prev => prev.map(m => m.id === localId ? { ...m, status: 'failed' } : m));
      toast.error('Failed to send message');
    }
  };

  const handleFileUpload = async (file) => {
    setUploading(true);
    setUploadProgress(0);
    
    try {
      const result = await messageService.uploadFile(file, (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded * 100) / event.total);
          setUploadProgress(progress);
        }
      });
      
      // Send file message
      const fileMsg = {
        id: `f-${Date.now()}`,
        from: 'me',
        text: file.name,
        ts: Date.now(),
        status: 'sent',
        type: 'file',
        attachment: {
          filename: result.file.filename,
          originalName: file.name,
          size: file.size,
          mimeType: file.type
        }
      };
      
      setMessages(prev => [...prev, fileMsg]);
      toast.success('File uploaded successfully');
      
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error('Failed to upload file');
    } finally {
      setUploading(false);
      setShowUpload(false);
      setUploadProgress(0);
    }
  };

  const handleTyping = () => {
    if (active) {
      socketService.startTyping(active.id);
    }
  };

  const StatusTicks = ({ status }) => {
    if (status === 'read') return <CheckCheck className="w-4 h-4 text-blue-600" />;
    if (status === 'delivered') return <CheckCheck className="w-4 h-4 text-gray-400" />;
    if (status === 'sent') return <Check className="w-4 h-4 text-gray-400" />;
    if (status === 'sending') return <div className="w-4 h-4 border border-gray-400 border-t-transparent rounded-full animate-spin" />;
    if (status === 'failed') return <X className="w-4 h-4 text-red-500" />;
    return null;
  };

  return (
    <div className="app-shell">
      <div className="topbar">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center"><Shield className="w-5 h-5" /></div>
          <div>
            <p className="text-sm font-semibold">P2P Secure Chat</p>
            <p className="text-[11px] text-gray-500">Made for Enterprise</p>
          </div>
        </div>
        <div className="status-pill"><span className="w-1.5 h-1.5 rounded-full bg-green-500" /> Online</div>
        <div className="flex items-center gap-1">
          <button className="icon-btn"><Search className="w-5 h-5" /></button>
          <button className="icon-btn relative"><Bell className="w-5 h-5" /><span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-red-500" /></button>
          <button onClick={logout} className="icon-btn"><MoreVertical className="w-5 h-5" /></button>
          <div className="avatar w-8 h-8">{user?.username?.[0]?.toUpperCase()||'U'}</div>
        </div>
      </div>

      <div className="layout">
        <Sidebar users={users} onSelect={selectUser} activeId={active?.id} query={query} setQuery={setQuery} onSearch={debouncedSearch} loading={loadingUsers} />
        <main className="main">
          <div className="chat-head">
            <div>
              <p className="text-sm font-semibold">{active ? (active.username || active.name) : 'Select a conversation'}</p>
              {active && <p className="text-xs text-gray-500">{active.status==='online' ? 'Online' : active.lastSeen ? `Last seen ${new Date(active.lastSeen).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}` : (active.status || '')}</p>}
            </div>
            {active && <div className="status-pill">End-to-end encrypted</div>}
          </div>

          <div className="chat-body relative">
            {!active ? (
              <div className="h-full flex items-center justify-center">
                <div className="bg-white/80 backdrop-blur rounded-2xl border border-gray-200 p-8 text-center shadow-sm max-w-lg">
                  <p className="text-lg font-semibold mb-2">Start a conversation</p>
                  <p className="text-sm text-gray-600">Search users on the left and select to begin.</p>
                </div>
              </div>
            ) : (
              <>
                {loadingMessages && (
                  <div className="flex justify-center py-4"><Spinner /></div>
                )}
                <div className="max-w-4xl mx-auto space-y-3">
                  {messages.map(m => (
                    <div key={m.id} className={m.from==='me' ? 'bubble-out ml-auto' : 'bubble-in'}>
                      <div className="flex items-end justify-between gap-3">
                        <div className="flex-1">
                          {m.type === 'file' ? (
                            <div className="flex items-center gap-2">
                              <Paperclip className="w-4 h-4" />
                              <span className="text-sm">{m.attachment?.originalName || m.text}</span>
                            </div>
                          ) : (
                            <p className="text-[15px]">{m.text}</p>
                          )}
                        </div>
                        {m.from === 'me' && <StatusTicks status={m.status} />}
                      </div>
                      <span className="text-[11px] opacity-70 block mt-1">{new Date(m.ts).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
                <TypingIndicator users={typingUsers} />
              </>
            )}
            
            {showUpload && (
              <FileUpload 
                onUpload={handleFileUpload}
                onCancel={() => setShowUpload(false)}
                uploading={uploading}
                progress={uploadProgress}
              />
            )}
          </div>

          <div className="composer relative">
            <div className="composer-bar">
              <button onClick={() => setShowUpload(true)} className="icon-btn"><Paperclip className="w-5 h-5" /></button>
              <input 
                ref={inputRef}
                value={text} 
                onChange={(e) => {
                  setText(e.target.value);
                  handleTyping();
                }} 
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }} 
                placeholder="Type a message..." 
                className="flex-1 outline-none px-1 py-2 text-[15px]" 
              />
              <button onClick={() => setShowEmoji(s => !s)} className="icon-btn"><Smile className="w-5 h-5" /></button>
              <button className="icon-btn"><Mic className="w-5 h-5" /></button>
              <button onClick={send} className="send-btn"><Send className="w-4 h-4" /></button>
              {showEmoji && <Emoji onPick={(e) => { setText(t => t + e); setShowEmoji(false); inputRef.current?.focus(); }} />}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ChatPage;
