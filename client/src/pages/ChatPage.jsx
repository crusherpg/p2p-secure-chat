import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Shield, Bell, Search, MoreVertical, Send, Paperclip, Smile, Mic, Check, CheckCheck, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import userService from '../services/userService';
import messageService from '../services/messageService';
import socketService from '../services/socketService';
import { conversationService } from '../services/conversationService';
import toast from 'react-hot-toast';

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
      {loading && <div className="p-3 text-sm text-gray-500">Loading…</div>}
      {users.map(u => (
        <button key={u.id} onClick={()=>onSelect(u)} className={`user-item ${activeId===u.id ? 'bg-gray-50' : ''}`}>
          <div className="avatar">{u.username?.[0]||'U'}</div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between"><p className="text-sm font-medium truncate">{u.username||u.name}</p></div>
            <p className="text-xs text-gray-500 truncate">{u.status==='online'?'Online':'Offline'}</p>
          </div>
          <div className={`w-2 h-2 rounded-full ${u.status==='online'?'bg-green-500':'bg-gray-400'}`} />
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
  const messagesEndRef = useRef(null);

  useEffect(()=>{ userService.setAuthToken(token); messageService.setAuthToken(token); },[token]);

  // socket connect and handlers
  useEffect(()=>{
    if(!token) return;
    socketService.connect(token);

    const onNew = (msg)=>{
      if(!active?.conversationId || msg.conversationId !== active.conversationId) return;
      const normalized = { id: msg.id, from: (msg.from?.id||msg.from)===user?.id?'me':'them', text: msg.content?.encrypted?'[Encrypted Message]':(msg.content||msg.text||''), ts: new Date(msg.timestamp).getTime(), status: msg.status||'delivered' };
      setMessages(prev => prev.find(m=>m.id===normalized.id)?prev:[...prev, normalized]);
    };
    const onSent = (data)=>{ if(!data?.tempId) return; setMessages(prev => prev.map(m=> m.id===data.tempId ? { ...m, id: data.messageId, status: 'delivered' } : m)); };
    const onStatus = (d)=>{ if(!d?.messageId) return; setMessages(prev => prev.map(m=> m.id===d.messageId ? { ...m, status: d.status } : m)); };

    socketService.on('new_message', onNew);
    socketService.on('message_sent', onSent);
    socketService.on('message_status_update', onStatus);

    return ()=>{ socketService.off('new_message', onNew); socketService.off('message_sent', onSent); socketService.off('message_status_update', onStatus); };
  },[token, active?.conversationId, user?.id]);

  // users list
  useEffect(()=>{ (async()=>{ try{ const live=await userService.listOnline(50); setUsers(live.map(u=>({ id:u._id||u.id, username:u.username, status:u.status }))); } catch{} })(); },[]);

  const selectUser = async (u) => {
    const conversationId = await conversationService.ensureConversationWith(u.id);
    setActive({ ...u, conversationId });
    // history
    try{ const { messages:history } = await messageService.getHistory(conversationId); const normalized = (history||[]).map(m=>({ id:m.id||m._id, from:(m.from?.id||m.from)===user?.id?'me':'them', text:m.content?.encrypted?'[Encrypted Message]':(m.content||m.text||''), ts:new Date(m.timestamp).getTime(), status:m.status||'delivered' })); setMessages(normalized); } catch { setMessages([]); }
    socketService.joinConversation(conversationId);
  };

  const send = async () => {
    if(!text.trim() || !active?.conversationId) return;
    const localId = `m-${Date.now()}`;
    const content = text.trim(); setText('');
    setMessages(prev=>[...prev,{ id: localId, from:'me', text: content, ts: Date.now(), status:'sending' }]);
    const ok = socketService.sendMessage({ conversationId: active.conversationId, content, tempId: localId });
    if(!ok){
      const res = await messageService.sendMessage({ conversationId: active.conversationId, type:'text', encryptedContent: btoa(content), iv:'demo-iv', authTag:'demo-tag' });
      setMessages(prev=>prev.map(m=> m.id===localId ? { ...m, id: res.messageId, status:'delivered' } : m));
    } else {
      setMessages(prev=>prev.map(m=> m.id===localId ? { ...m, status:'sent' } : m));
    }
  };

  useEffect(()=>{ const t=setTimeout(()=>messagesEndRef.current?.scrollIntoView({behavior:'smooth'}),100); return()=>clearTimeout(t); },[messages]);

  return (
    <div className="app-shell">
      <div className="topbar">
        <div className="flex items-center gap-3"><div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center"><Shield className="w-5 h-5"/></div><div><p className="text-sm font-semibold">P2P Secure Chat</p><p className="text-[11px] text-gray-500">Made for Enterprise</p></div></div>
        <div className="status-pill"><span className={`w-1.5 h-1.5 rounded-full ${socketService.isSocketConnected()?'bg-green-500':'bg-yellow-500'}`}/> {socketService.isSocketConnected()?'Connected':'Connecting...'}</div>
        <div className="flex items-center gap-1"><button className="icon-btn"><Search className="w-5 h-5"/></button><button onClick={logout} className="icon-btn"><MoreVertical className="w-5 h-5"/></button><div className="avatar w-8 h-8">{user?.username?.[0]?.toUpperCase()||'U'}</div></div>
      </div>
      <div className="layout">
        <Sidebar users={users} onSelect={selectUser} activeId={active?.id} query={query} setQuery={setQuery} onSearch={()=>{}} loading={false} />
        <main className="main">
          <div className="chat-head"><div><p className="text-sm font-semibold">{active?active.username:'Select a conversation'}</p></div>{active&&<div className="status-pill">End-to-end encrypted</div>}</div>
          <div className="chat-body">
            {!active ? (
              <div className="h-full flex items-center justify-center"><div className="bg-white/90 backdrop-blur rounded-2xl border border-gray-200 p-8 text-center shadow-sm max-w-lg"><p className="text-lg font-semibold mb-2">Start a conversation</p><p className="text-sm text-gray-600">Search and select a user on the left.</p></div></div>
            ) : (
              <div className="max-w-4xl mx-auto space-y-3">
                {messages.map(m=> (
                  <div key={m.id} className={m.from==='me'?'bubble-out ml-auto':'bubble-in'}>
                    <div className="flex items-end gap-3"><p className="text-[15px] flex-1">{m.text}</p>{m.from==='me' && (m.status==='delivered'?<CheckCheck className="w-4 h-4 text-gray-400"/>:m.status==='sent'?<Check className="w-4 h-4 text-gray-400"/>:m.status==='sending'?<div className="w-4 h-4 border border-gray-400 border-t-transparent rounded-full animate-spin"/>:m.status==='failed'?<X className="w-4 h-4 text-red-500"/>:null)}</div>
                    <span className="text-[11px] opacity-70 block mt-1">{new Date(m.ts).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
          <div className="composer"><div className="composer-bar"><button className="icon-btn"><Paperclip className="w-5 h-5"/></button><input value={text} onChange={(e)=>setText(e.target.value)} onKeyDown={(e)=>{ if(e.key==='Enter'&&!e.shiftKey){ e.preventDefault(); send(); } }} placeholder="Type a message..." className="flex-1 outline-none px-1 py-2 text-[15px]" disabled={!active}/><button className="icon-btn"><Smile className="w-5 h-5"/></button><button className="icon-btn"><Mic className="w-5 h-5"/></button><button onClick={send} disabled={!text.trim()||!active} className="send-btn disabled:opacity-50 disabled:cursor-not-allowed"><Send className="w-4 h-4"/></button></div></div>
        </main>
      </div>
    </div>
  );
};

export default ChatPage;