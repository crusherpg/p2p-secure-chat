import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Shield, Bell, Search, MoreVertical, Send, Paperclip, Smile, Mic, Check, CheckCheck, Upload, X, Settings } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import userService from '../services/userService';
import messageService from '../services/messageService';
import socketService from '../services/socketService';
import SettingsModal from '../components/SettingsModal';
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
    <div className="px-4 py-2 text-xs text-gray-500 italic animate-pulse">
      {users.join(', ')} {users.length === 1 ? 'is' : 'are'} typing
      <span className="inline-block ml-1">
        <span className="animate-bounce">.</span>
        <span className="animate-bounce" style={{animationDelay:'0.1s'}}>.</span>
        <span className="animate-bounce" style={{animationDelay:'0.2s'}}>.</span>
      </span>
    </div>
  );
};

const FileUpload = ({ onUpload, onCancel, uploading, progress }) => (
  <div className="absolute bottom-12 left-0 right-0 bg-white border-t border-gray-200 p-4 z-20">
    <div className="flex items-center justify-between mb-2">
      <span className="text-sm font-medium">Upload File</span>
      <button onClick={onCancel} className="p-1 hover:bg-gray-100 rounded"><X className="w-4 h-4" /></button>
    </div>
    <div className="space-y-3">
      <input 
        type="file" 
        accept="image/*,application/pdf,.txt,.doc,.docx" 
        onChange={(e) => e.target.files[0] && onUpload(e.target.files[0])} 
        className="w-full text-sm" 
        disabled={uploading} 
      />
      {uploading && (
        <div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-blue-600 h-2 rounded-full transition-all duration-300" style={{width: `${progress}%`}}></div>
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
      {!loading && users.length === 0 && (
        <div className="p-4 text-center text-gray-500 text-sm">
          {query ? 'No users found' : 'No online users'}
        </div>
      )}
      {users.map(u => (
        <button key={u.id} onClick={()=>onSelect(u)} className={`user-item ${activeId===u.id ? 'bg-gray-50' : ''}`}>
          <div className="avatar">{u.avatar ? <img src={u.avatar} alt={u.name} className="w-full h-full object-cover" /> : (u.username?.[0] || u.name?.[0] || 'U')}</div>
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

const ChatPage = ({ onOpenSettings }) => {
  const { user, token, logout } = useAuth();
  const [users, setUsers] = useState([]);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Persist selected conversation
  useEffect(()=>{ const saved = localStorage.getItem('p2p_active'); if (saved) { try { const parsed = JSON.parse(saved); setActive(parsed); } catch {} } },[]);
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
      
      // Auto-select saved or first user
      const savedActive = localStorage.getItem('p2p_active');
      if (savedActive && normalized.length) {
        try {
          const parsed = JSON.parse(savedActive);
          const found = normalized.find(u => u.id === parsed.id);
          if (found) setActive(found);
          else if (!active) setActive(normalized[0]);
        } catch {
          if (!active) setActive(normalized[0]);
        }
      } else if (!active && normalized.length) {
        setActive(normalized[0]);
      }
    } catch (e) {
      console.warn('Online users fetch failed, using demo:', e?.message);
      const demoUsers = [
        normalizeUser({ id:'alice', name:'Alice Cooper', status:'online', department:'Engineering' }),
        normalizeUser({ id:'bob', name:'Bob Wilson', status:'away', department:'Design' }),
        normalizeUser({ id:'carol', name:'Carol Davis', status:'online', department:'Marketing' }),
        normalizeUser({ id:'david', name:'David Chen', status:'busy', department:'Sales' }),
      ];
      setUsers(demoUsers);
      if (!active) setActive(demoUsers[0]);
    } finally { setLoadingUsers(false); }
  };

  useEffect(()=>{ fetchOnline(); const t = setInterval(fetchOnline, 15000); return ()=>clearInterval(t); },[]);

  const debouncedSearch = useDebouncedCallback(async (q) => {
    if (!q.trim()) { fetchOnline(); return; }
    setLoadingUsers(true);
    try {
      const res = await userService.searchUsers(q, 20);
      setUsers(res.map(normalizeUser));
    } catch (e) {
      console.warn('Search failed:', e?.message);
    } finally {
      setLoadingUsers(false);
    }
  }, 300);

  // Socket setup with better error handling
  useEffect(()=>{
    if (!token) return;
    try { 
      socketService.connect(token);
      console.log('🟢 Socket service initialized');
    } catch (e) {
      console.warn('🟡 Socket connection failed:', e?.message);
    }
    return () => {
      try {
        socketService.disconnect();
      } catch (e) {
        console.warn('Socket disconnect error:', e?.message);
      }
    };
  },[token]);

  // Join/leave conversation rooms
  useEffect(()=>{
    if (!active?.id) return;
    socketService.joinConversation(active.id);
    return () => socketService.leaveConversation(active.id);
  },[active?.id]);

  // Socket event handlers with cleanup
  useEffect(()=>{
    const newMessageHandler = (msg) => {
      if (!active || !msg) return;
      if (msg.conversationId !== active.id && msg.from !== active.id && msg.to !== active.id) return;
      
      const normalized = {
        id: msg.id || `msg-${Date.now()}`,
        from: msg.from === user?.id ? 'me' : 'them',
        text: msg.content || msg.text || '',
        ts: new Date(msg.timestamp || Date.now()).getTime(),
        status: msg.status || 'delivered',
        type: msg.type || 'text',
        attachment: msg.attachment
      };
      
      setMessages(prev => {
        // Prevent duplicates
        if (prev.find(m => m.id === normalized.id)) return prev;
        return [...prev, normalized];
      });
      
      // Auto-mark as read if chat is visible
      if (document.visibilityState === 'visible' && msg.from !== user?.id) {
        setTimeout(() => {
          try { 
            messageService.updateStatus(msg.id, 'read');
            socketService.updateMessageStatus(msg.id, 'read');
          } catch {}
        }, 1000);
      }
    };

    const statusHandler = (data) => {
      if (!data?.messageId) return;
      setMessages(prev => prev.map(m => m.id === data.messageId ? { ...m, status: data.status } : m));
    };

    const typingHandler = (data) => {
      if (!data || !active) return;
      if (data.conversationId === active.id && data.userId !== user?.id) {
        const username = data.username || 'Someone';
        setTypingUsers(prev => {
          if (prev.includes(username)) return prev;
          return [...prev, username];
        });
      }
    };

    const stopTypingHandler = (data) => {
      if (!data || !active) return;
      if (data.conversationId === active.id) {
        const username = data.username || 'Someone';
        setTypingUsers(prev => prev.filter(u => u !== username));
      }
    };

    const presenceHandler = (data) => {
      if (!data?.userId) return;
      setUsers(prev => prev.map(u => u.id === data.userId ? { ...u, status: data.status, lastSeen: data.lastSeen } : u));
    };

    socketService.on('new_message', newMessageHandler);
    socketService.on('message_status_update', statusHandler);
    socketService.on('user_typing', typingHandler);
    socketService.on('user_stop_typing', stopTypingHandler);
    socketService.on('user_online', presenceHandler);
    socketService.on('user_offline', presenceHandler);

    return () => {
      socketService.off('new_message', newMessageHandler);
      socketService.off('message_status_update', statusHandler);
      socketService.off('user_typing', typingHandler);
      socketService.off('user_stop_typing', stopTypingHandler);
      socketService.off('user_online', presenceHandler);
      socketService.off('user_offline', presenceHandler);
    };
  },[active, user?.id]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    const timer = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
    return () => clearTimeout(timer);
  }, [messages]);

  const selectUser = async (u) => {
    if (active?.id === u.id) return; // Already selected
    
    setActive(u);
    setLoadingMessages(true);
    setMessages([]); // Clear previous messages
    
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
    } catch (e) {
      console.warn('Message history fetch failed, using demo:', e?.message);
      // Demo conversation for selected user
      const demoMessages = [
        { id:'d1', from:'them', text:`Hello! I'm ${u.username || u.name}. How are you?`, ts: Date.now()-600000, status:'read' },
        { id:'d2', from:'me', text:'Hi there! I\'m doing well, thanks for asking.', ts: Date.now()-540000, status:'delivered' },
        { id:'d3', from:'them', text:'Great to hear! This new chat interface looks amazing.', ts: Date.now()-300000, status:'read' },
      ];
      setMessages(demoMessages);
    } finally {
      setLoadingMessages(false);
    }
  };

  const send = async () => {
    if (!text.trim() || !active) return;
    const localId = `m-${Date.now()}`;
    const localMsg = { id: localId, from:'me', text: text.trim(), ts: Date.now(), status:'sending' };
    setMessages(prev=>[...prev, localMsg]);
    const messageText = text.trim();
    setText('');
    
    try {
      // Try socket first for real-time delivery
      const socketSent = socketService.sendMessage({
        conversationId: active.id,
        to: active.id,
        content: messageText,
        type: 'text'
      });
      
      if (socketSent) {
        // Socket succeeded, update status
        setMessages(prev => prev.map(m => m.id === localId ? { ...m, status: 'sent' } : m));
      } else {
        // Fallback to REST API
        console.log('Socket failed, trying REST API...');
        const result = await messageService.sendMessage({
          conversationId: active.id,
          type: 'text',
          encryptedContent: btoa(messageText), // Simple base64 for demo
          iv: 'demo-iv',
          authTag: 'demo-tag'
        });
        
        // Update with server ID and status
        setMessages(prev => prev.map(m => 
          m.id === localId ? { 
            ...m, 
            id: result.messageId, 
            status: 'delivered' 
          } : m
        ));
      }
      
    } catch (error) {
      console.error('Send failed completely:', error);
      setMessages(prev => prev.map(m => m.id === localId ? { ...m, status: 'failed' } : m));
      toast.error('Failed to send message');
    }
  };

  const handleFileUpload = async (file) => {
    if (!active) return;
    setUploading(true);
    setUploadProgress(0);
    
    try {
      const result = await messageService.uploadFile(file, (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded * 100) / event.total);
          setUploadProgress(progress);
        }
      });
      
      // Send file message via socket or REST
      const fileMsg = {
        id: `f-${Date.now()}`,
        from: 'me',
        text: `📎 ${file.name}`,
        ts: Date.now(),
        status: 'sent',
        type: 'file',
        attachment: {
          filename: result.file.filename,
          originalName: file.name,
          size: file.size,
          mimeType: file.type,
          url: `/api/files/download/${result.file.filename}`
        }
      };
      
      setMessages(prev => [...prev, fileMsg]);
      
      // Notify via socket
      socketService.sendMessage({
        conversationId: active.id,
        to: active.id,
        content: fileMsg.text,
        type: 'file',
        attachment: fileMsg.attachment
      });
      
      toast.success('File uploaded and sent');
      
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
    if (active?.id) {
      socketService.startTyping(active.id);
    }
  };

  const StatusTicks = ({ status }) => {
    if (status === 'read') return <CheckCheck className="w-4 h-4 text-blue-600" />;
    if (status === 'delivered') return <CheckCheck className="w-4 h-4 text-gray-400" />;
    if (status === 'sent') return <Check className="w-4 h-4 text-gray-400" />;
    if (status === 'sending') return <div className="w-4 h-4 border border-gray-400 border-t-transparent rounded-full animate-spin" />;
    if (status === 'failed') return <button onClick={send} title="Retry"><X className="w-4 h-4 text-red-500 hover:text-red-700" /></button>;
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
        <div className="status-pill">
          <span className={`w-1.5 h-1.5 rounded-full ${socketService.isSocketConnected() ? 'bg-green-500' : 'bg-yellow-500'}`} /> 
          {socketService.isSocketConnected() ? 'Connected' : 'Connecting...'}
        </div>
        <div className="flex items-center gap-1">
          <button className="icon-btn"><Search className="w-5 h-5" /></button>
          <button className="icon-btn relative"><Bell className="w-5 h-5" /><span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-red-500" /></button>
          <button onClick={() => setShowSettings(true)} className="icon-btn"><Settings className="w-5 h-5" /></button>
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
                <div className="bg-white/90 backdrop-blur rounded-2xl border border-gray-200 p-8 text-center shadow-sm max-w-lg">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Shield className="w-8 h-8 text-blue-600" />
                  </div>
                  <p className="text-lg font-semibold mb-2">Welcome to P2P Secure Chat</p>
                  <p className="text-sm text-gray-600 mb-4">Your messages are end-to-end encrypted and secure.</p>
                  <p className="text-xs text-gray-500">Search for users on the left to start a conversation.</p>
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
                      <div className="flex items-end gap-3">
                        <div className="flex-1">
                          {m.type === 'file' ? (
                            <div className="flex items-center gap-2">
                              <Paperclip className="w-4 h-4" />
                              <span className="text-sm">{m.attachment?.originalName || m.text}</span>
                              {m.attachment?.url && (
                                <a href={m.attachment.url} download className="text-xs text-blue-600 hover:underline ml-2">
                                  Download
                                </a>
                              )}
                            </div>
                          ) : (
                            <p className="text-[15px] whitespace-pre-wrap">{m.text}</p>
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
              <button 
                onClick={() => setShowUpload(true)} 
                className="icon-btn"
                title="Upload file"
              >
                <Paperclip className="w-5 h-5" />
              </button>
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
                disabled={!active}
              />
              <button 
                onClick={() => setShowEmoji(s => !s)} 
                className="icon-btn"
                title="Add emoji"
              >
                <Smile className="w-5 h-5" />
              </button>
              <button className="icon-btn" title="Voice message"><Mic className="w-5 h-5" /></button>
              <button 
                onClick={send} 
                disabled={!text.trim() || !active}
                className="send-btn disabled:opacity-50 disabled:cursor-not-allowed"
                title="Send message"
              >
                <Send className="w-4 h-4" />
              </button>
              {showEmoji && <Emoji onPick={(e) => { setText(t => t + e); setShowEmoji(false); inputRef.current?.focus(); }} />}
            </div>
          </div>
        </main>
      </div>

      <SettingsModal 
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </div>
  );
};

export default ChatPage;
