import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { socketService } from '../services/socketService';
import UserList from '../components/UserList';
import ConversationList from '../components/ConversationList';
import MessageBubble from '../components/MessageBubble';
import MessageInput from '../components/MessageInput';
import { Menu, X, Users, MessageCircle, Settings } from 'lucide-react';
import { encryptionService } from '../utils/encryption';
import toast from 'react-hot-toast';
import ConversationHeader from '../components/ConversationHeader';

const ChatPage = () => {
  const { user, token } = useAuth();
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [users, setUsers] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [showSidebar, setShowSidebar] = useState(false);
  const [activeTab, setActiveTab] = useState('conversations');
  const [encryptionKey, setEncryptionKey] = useState(null);

  useEffect(() => {
    if (!token) return;
    socketService.connect(token);
    initializeEncryption();
    loadConversations();
    loadUsers();
    setupSocketListeners();
    return () => socketService.disconnect();
  }, [token]);

  const initializeEncryption = async () => {
    try {
      const keyExchange = await encryptionService.simulateKeyExchange(user?.id || 'self', 'peer');
      setEncryptionKey(keyExchange.key);
    } catch (e) { console.error(e); }
  };

  const setupSocketListeners = () => {
    socketService.on('new_message', (messageData) => {
      if (selectedConversation && messageData.conversationId === selectedConversation.id) {
        setMessages(prev => [...prev, {
          id: messageData.id,
          from: messageData.from,
          content: messageData.content,
          type: messageData.type || 'text',
          attachment: messageData.attachment,
          timestamp: messageData.timestamp,
          status: 'delivered'
        }]);
      }
    });
  };

  const loadConversations = () => {
    const demo = [
      {
        id: 'conv1',
        participants: [
          { id: 'alice', username: 'Alice Cooper', avatar: null, status: 'online' },
          { id: user?.id || 'me', username: user?.username || 'You', avatar: user?.avatar || null }
        ],
        lastMessage: { content: 'Hey! How are you doing?', timestamp: new Date().toISOString() },
        unreadCount: 2,
        encryption: { enabled: true }
      }
    ];
    setConversations(demo);
  };

  const loadUsers = () => {
    const demoUsers = [
      { id: 'alice', username: 'Alice Cooper', email: 'alice@example.com', status: 'online', avatar: null },
      { id: 'bob', username: 'Bob Wilson', email: 'bob@example.com', status: 'away', avatar: null }
    ];
    setUsers(demoUsers);
    setOnlineUsers(new Set(['alice']));
  };

  const loadMessages = (conversationId) => {
    const demo = [
      { id: 'm1', from: { id: 'alice', username: 'Alice Cooper' }, content: 'Hello!', type: 'text', timestamp: new Date().toISOString(), status: 'read' },
      { id: 'm2', from: { id: user?.id || 'me', username: user?.username || 'You' }, content: 'Hi!', type: 'text', timestamp: new Date().toISOString(), status: 'delivered' }
    ];
    setMessages(demo);
  };

  const selectConversation = (conversation) => {
    setSelectedConversation(conversation);
    loadMessages(conversation.id);
    setShowSidebar(false);
    setConversations(prev => prev.map(c => c.id === conversation.id ? { ...c, unreadCount: 0 } : c));
  };

  const sendMessage = async (messageData) => {
    if (!selectedConversation || !encryptionKey) { toast.error('Unable to send'); return; }
    try {
      const encrypted = messageData.type === 'text' ? await encryptionService.encryptMessage(messageData.content, encryptionKey) : messageData.content;
      socketService.sendMessage({ conversationId: selectedConversation.id, content: encrypted, type: messageData.type || 'text', attachment: messageData.attachment });
      const local = { id: `temp-${Date.now()}`, from: { id: user?.id || 'me', username: user?.username || 'You', avatar: user?.avatar }, content: messageData.content, type: messageData.type || 'text', attachment: messageData.attachment, timestamp: new Date().toISOString(), status: 'sent' };
      setMessages(prev => [...prev, local]);
      setConversations(prev => prev.map(c => c.id === selectedConversation.id ? { ...c, lastMessage: { content: messageData.content, timestamp: local.timestamp } } : c));
    } catch (e) { console.error(e); toast.error('Failed to send'); }
  };

  const decryptMessageContent = async (encryptedContent) => {
    if (!encryptionKey) return 'Decryption unavailable';
    try {
      if (typeof encryptedContent === 'string') return encryptedContent;
      return await encryptionService.decryptMessage(encryptedContent, encryptionKey);
    } catch {
      return 'Failed to decrypt';
    }
  };

  const getOtherParticipant = (conversation) =>
    conversation.participants.find(p => p.id !== user?.id) || { username: 'Unknown', id: 'unknown' };

  return (
    <div className="h-[calc(100vh-56px)] flex bg-gray-50">
      {/* Sidebar */}
      <div className={`fixed lg:relative inset-y-0 left-0 z-40 w-80 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${showSidebar ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="px-4 py-3 border-b border-gray-200"><p className="text-[13px] font-semibold text-gray-600">Messages</p></div>
        <ConversationList conversations={conversations} selectedConversation={selectedConversation} onSelectConversation={selectConversation} currentUserId={user?.id} />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {selectedConversation ? (
          <>
            <ConversationHeader title={getOtherParticipant(selectedConversation).username} encrypted={!!selectedConversation.encryption?.enabled} />
            <div className="flex-1 overflow-y-auto px-4 py-4">
              <div className="max-w-4xl mx-auto space-y-3">
                {messages.map((message) => (
                  <MessageBubble key={message.id} message={message} isOwn={message.from.id === (user?.id || 'me')} onDecrypt={decryptMessageContent} />
                ))}
              </div>
            </div>
            <div className="border-t border-gray-200 bg-white">
              <MessageInput onSendMessage={sendMessage} onStartTyping={() => selectedConversation && socketService.startTyping(selectedConversation.id)} onStopTyping={() => selectedConversation && socketService.stopTyping(selectedConversation.id)} />
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-6"><MessageCircle className="w-8 h-8 text-blue-600" /></div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Welcome to P2P Secure Chat</h2>
              <p className="text-gray-600 mb-8 max-w-md">Select a conversation to start chatting</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPage;
