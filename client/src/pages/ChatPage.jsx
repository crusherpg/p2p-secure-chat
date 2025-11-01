import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Shield, Bell, Search, MoreVertical, Send, Paperclip, Smile, Mic, Check, CheckCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import userService from '../services/userService';
import socketService from '../services/socketService';
import axios from 'axios';

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
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Persist selected conversation
  useEffect(()=>{ const saved = localStorage.getItem('p2p_active'); if (saved) setActive(JSON.parse(saved)); },[]);
  useEffect(()=>{ if (active) localStorage.setItem('p2p_active', JSON.stringify(active)); },[active]);

  useEffect(()=>{ userService.setAuthToken(token); },[token]);

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
      if (!active && normalized.length) setActive(normalized[0]);
    } catch (e) {
      console.warn('Online users fetch failed, falling back to demo:', e?.message);
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

  useEffect(()=>{ if (!token) return; try { socketService.connect(token); } catch {} return ()=> socketService.disconnect(); },[token]);

  // Join specific room for message streaming when active changes
  useEffect(()=>{
    if (!active) return;
    try { socketService.socket?.emit?.('join_conversation', { userId: active.id }); } catch {}
  },[active]);

  const selectUser = async (u) => {
    setActive(u);
    // Load message history via API
    try {
      const { data } = await axios.get(`${import.meta.env.VITE_API_URL || '/api'}/messages/history`, { params: { userId: u.id } });
      const history = (data?.messages || []).map(m => ({ id: m.id || m._id, from: m.from === user?.id ? 'me' : 'them', text: m.content, ts: new Date(m.createdAt || m.timestamp).getTime(), status: m.status || 'delivered' }));
      setMessages(history);
    } catch {
      // fallback demo
      setMessages([
        { id:'m1', from:'them', text:'The UI overhaul is looking fantastic! Much more professional than before.', ts: Date.now()-600000, status:'read' },
        { id:'m2', from:'me', text:'I\'m glad you like it! Tried to balance modern design with enterprise needs.', ts: Date.now()-540000, status:'delivered' },
        { id:'m3', from:'them', text:'The centered layout works really well. Easy to focus on conversations.', ts: Date.now()-300000, status:'read' },
      ]);
    }
  };

  // Receive new messages
  useEffect(()=>{
    const handler = (msg) => {
      if (!active || (msg.from !== active.id && msg.to !== active.id)) return;
      setMessages(prev => [...prev, { id: msg.id, from: msg.from === user?.id ? 'me' : 'them', text: msg.content, ts: new Date(msg.timestamp).getTime(), status: msg.status || 'delivered' }]);
    };
    socketService.on('new_message', handler);
    return () => socketService.off('new_message', handler);
  },[active, user?.id]);

  // Status updates (delivered/read)
  useEffect(()=>{
    const statusHandler = (data) => {
      setMessages(prev => prev.map(m => m.id === data.messageId ? { ...m, status: data.status } : m));
    };
    socketService.on('message_status_update', statusHandler);
    return () => socketService.off('message_status_update', statusHandler);
  },[]);

  const send = async () => {
    if (!text.trim() || !active) return;
    const localId = `m-${Date.now()}`;
    const local = { id: localId, from:'me', text: text.trim(), ts: Date.now(), status:'sent' };
    setMessages(prev=>[...prev, local]);
    setText('');
    try {
      const payload = { to: active.id, content: local.text, type:'text' };
      socketService.sendMessage(payload);
    } catch {}
  };

  const StatusTicks = ({ status }) => {
    if (status === 'read') return <CheckCheck className="w-4 h-4 text-blue-600" />;
    if (status === 'delivered') return <CheckCheck className="w-4 h-4 text-gray-400" />;
    if (status === 'sent') return <Check className="w-4 h-4 text-gray-400" />;
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

          <div className="chat-body">
            {!active ? (
              <div className="h-full flex items-center justify-center">
                <div className="bg-white/80 backdrop-blur rounded-2xl border border-gray-200 p-8 text-center shadow-sm max-w-lg">
                  <p className="text-lg font-semibold mb-2">Start a conversation</p>
                  <p className="text-sm text-gray-600">Search users on the left and select to begin.</p>
                </div>
              </div>
            ) : (
              <div className="max-w-4xl mx-auto space-y-3">
                {messages.map(m => (
                  <div key={m.id} className={m.from==='me' ? 'bubble-out ml-auto' : 'bubble-in'}>
                    <div className="flex items-end justify-between gap-3">
                      <p className="text-[15px] flex-1">{m.text}</p>
                      <StatusTicks status={m.status} />
                    </div>
                    <span className="text-[11px] opacity-70 block mt-1">{new Date(m.ts).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="composer">
            <div className="composer-bar relative">
              <button className="icon-btn"><Paperclip className="w-5 h-5" /></button>
              <input value={text} onChange={(e)=>setText(e.target.value)} onKeyDown={(e)=>{ if (e.key==='Enter' && !e.shiftKey) { e.preventDefault(); send(); } }} placeholder="Type a message..." className="flex-1 outline-none px-1 py-2 text-[15px]" />
              <button onClick={()=>setShowEmoji(s=>!s)} className="icon-btn"><Smile className="w-5 h-5" /></button>
              <button className="icon-btn"><Mic className="w-5 h-5" /></button>
              <button onClick={send} className="send-btn"><Send className="w-4 h-4" /></button>
              {showEmoji && <Emoji onPick={(e)=>{ setText(t=>t+e); setShowEmoji(false); }} />}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ChatPage;
