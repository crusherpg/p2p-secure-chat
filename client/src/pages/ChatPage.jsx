import React, { useEffect, useState } from 'react';
import { Shield, Settings, LogOut } from 'lucide-react';
import SettingsModal from '../components/SettingsModal';
import MessageInput from '../components/MessageInput';
import { useAuth } from '../context/AuthContext';

const ChatHeader = ({ title }) => (
  <div className="chat-header">
    <h2 className="font-semibold">{title}</h2>
    <div className="status-badge">End-to-end encrypted</div>
  </div>
);

const ChatPage = () => {
  const { user, logout } = useAuth();
  const [showSettings,setShowSettings] = useState(false);
  const [users,setUsers] = useState([]);
  const [selected,setSelected] = useState(null);
  const [messages,setMessages] = useState([]);

  useEffect(()=>{
    // Fetch onboarded users from backend later; using demo for now
    setUsers([
      { id: 'bob', name: 'Bob Wilson' },
      { id: 'carol', name: 'Carol Davis' }
    ]);
  },[]);

  const loadConversation = (uid) => {
    setSelected(users.find(u=>u.id===uid));
    setMessages([
      { id:'1', type:'incoming', content:'Hey! How are you doing?', ts: Date.now()-300000 },
      { id:'2', type:'outgoing', content:'Everything is going well! Just finished implementing the encryption.', ts: Date.now()-120000 },
      { id:'3', type:'incoming', content:'👍 Looks great!', ts: Date.now()-60000 }
    ]);
  };

  return (
    <div className="chat-container">
      {/* Only Header (no sidebar) */}
      <div className="app-header">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center"><Shield className="w-5 h-5 text-white" /></div>
          <div>
            <h1 className="text-base font-semibold">P2P</h1>
            <p className="text-xs text-gray-500">Secure Messaging</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* User selector replaces sidebar */}
          <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm" value={selected?.id || ''} onChange={(e)=>loadConversation(e.target.value)}>
            <option value="" disabled>Select user</option>
            {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
          <button onClick={()=>setShowSettings(true)} className="btn btn-icon"><Settings className="w-5 h-5" /></button>
          <button onClick={logout} className="btn btn-icon"><LogOut className="w-5 h-5" /></button>
          <div className="avatar w-8 h-8">{user?.avatar ? <img src={user.avatar} alt="User" /> : <span className="text-sm">{user?.username?.[0]?.toUpperCase() || 'U'}</span>}</div>
        </div>
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col">
        {selected ? (
          <>
            <ChatHeader title={selected.name} />
            <div className="message-container custom-scrollbar">
              {messages.map(m => (
                <div key={m.id} className={`message-bubble ${m.type}`}>
                  <p>{m.content}</p>
                  <span className="text-xs text-gray-500 block mt-1">{new Date(m.ts).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                </div>
              ))}
            </div>
            <MessageInput onSend={(txt)=>setMessages(prev=>[...prev,{ id: `m-${Date.now()}`, type:'outgoing', content: txt, ts: Date.now() }])} />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <p className="text-gray-500">Select a user from the dropdown to start chatting.</p>
            </div>
          </div>
        )}
      </div>

      <SettingsModal isOpen={showSettings} onClose={()=>setShowSettings(false)} />
    </div>
  );
};

export default ChatPage;
