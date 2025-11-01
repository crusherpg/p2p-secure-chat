import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { socketService } from '../services/socketService';
import { Shield, Settings, LogOut, MessageCircle, Send, Paperclip, Smile } from 'lucide-react';
import SettingsModal from '../components/SettingsModal';
import toast from 'react-hot-toast';

const ChatPage = () => {
  const { user, logout } = useAuth();
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  // Demo data
  useEffect(() => {
    const demoConversations = [
      {
        id: 'conv1',
        name: 'Bob Wilson',
        avatar: null,
        lastMessage: '👍 Looks great!',
        timestamp: '20:00',
        unreadCount: 0,
        encrypted: true
      },
      {
        id: 'conv2', 
        name: 'Carol Davis',
        avatar: null,
        lastMessage: 'https://media.giphy.com/...',
        timestamp: '19:45',
        unreadCount: 1,
        encrypted: true
      }
    ];
    setConversations(demoConversations);

    // Auto-select first conversation
    if (demoConversations[0]) {
      setSelectedConversation(demoConversations[0]);
      loadMessages(demoConversations[0].id);
    }
  }, []);

  // Socket connection
  useEffect(() => {
    if (user) {
      try {
        socketService.connect();
        setIsConnected(true);
        console.log('Connected to P2P server');
      } catch (error) {
        console.warn('Socket connection failed (using demo mode)');
        setIsConnected(false);
      }
    }
    return () => {
      try {
        socketService.disconnect();
      } catch (error) {
        console.warn('Socket disconnect error');
      }
    };
  }, [user]);

  const loadMessages = (conversationId) => {
    const demoMessages = [
      {
        id: 'msg1',
        from: { id: 'bob', name: 'Bob Wilson' },
        content: 'Hey! How are you doing?',
        timestamp: new Date(Date.now() - 300000).toISOString(),
        type: 'incoming'
      },
      {
        id: 'msg2',
        from: { id: user?.id || 'me', name: 'You' },
        content: 'Everything is going well! Just finished implementing the encryption.',
        timestamp: new Date(Date.now() - 120000).toISOString(),
        type: 'outgoing'
      },
      {
        id: 'msg3',
        from: { id: 'bob', name: 'Bob Wilson' },
        content: '👍 Looks great!',
        timestamp: new Date(Date.now() - 60000).toISOString(),
        type: 'incoming'
      }
    ];
    setMessages(demoMessages);
  };

  const selectConversation = (conversation) => {
    setSelectedConversation(conversation);
    loadMessages(conversation.id);
    
    // Mark as read
    setConversations(prev => 
      prev.map(conv => 
        conv.id === conversation.id 
          ? { ...conv, unreadCount: 0 }
          : conv
      )
    );
  };

  const sendMessage = () => {
    if (!messageText.trim() || !selectedConversation) return;

    const newMessage = {
      id: `msg-${Date.now()}`,
      from: { id: user?.id || 'me', name: user?.username || 'You' },
      content: messageText,
      timestamp: new Date().toISOString(),
      type: 'outgoing'
    };

    setMessages(prev => [...prev, newMessage]);
    
    // Update conversation last message
    setConversations(prev => 
      prev.map(conv => 
        conv.id === selectedConversation.id
          ? { ...conv, lastMessage: messageText, timestamp: new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) }
          : conv
      )
    );

    setMessageText('');

    // Try to send via socket if connected
    try {
      if (isConnected) {
        socketService.sendMessage({
          conversationId: selectedConversation.id,
          content: messageText,
          type: 'text'
        });
      }
    } catch (error) {
      console.warn('Failed to send via socket, message sent locally');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
  };

  return (
    <div className="chat-container">
      {/* Header */}
      <div className="app-header">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-semibold">P2P</h1>
            <p className="text-xs text-gray-500">Secure Messaging</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowSettings(true)} className="btn btn-icon">
            <Settings className="w-5 h-5" />
          </button>
          <button onClick={logout} className="btn btn-icon">
            <LogOut className="w-5 h-5" />
          </button>
          <div className="avatar w-8 h-8">
            {user?.avatar ? (
              <img src={user.avatar} alt="User" />
            ) : (
              <span className="text-sm">{user?.username?.[0]?.toUpperCase() || 'U'}</span>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-1">
        {/* Sidebar */}
        <div className="sidebar">
          <div className="messages-header">
            <h2 className="text-sm font-semibold text-gray-600">Messages</h2>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {conversations.map(conversation => (
              <div
                key={conversation.id}
                className={`conversation-item ${
                  selectedConversation?.id === conversation.id ? 'active' : ''
                }`}
                onClick={() => selectConversation(conversation)}
              >
                <div className="avatar">
                  {conversation.avatar ? (
                    <img src={conversation.avatar} alt={conversation.name} />
                  ) : (
                    <span>{conversation.name[0]}</span>
                  )}
                </div>
                
                <div className="flex-1 min-w-0 ml-3">
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium text-sm truncate">{conversation.name}</h3>
                    <span className="text-xs text-gray-500">{conversation.timestamp}</span>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <p className="text-xs text-gray-500 truncate">{conversation.lastMessage}</p>
                    {conversation.unreadCount > 0 && (
                      <span className="bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center ml-2">
                        {conversation.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="main-chat">
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="chat-header">
                <h2 className="font-semibold">{selectedConversation.name}</h2>
                {selectedConversation.encrypted && (
                  <div className="status-badge flex items-center gap-1">
                    <Shield className="w-3 h-3" />
                    End-to-end encrypted
                  </div>
                )}
              </div>

              {/* Messages */}
              <div className="message-container custom-scrollbar">
                {messages.map(message => (
                  <div
                    key={message.id}
                    className={`message-bubble ${message.type}`}
                  >
                    <p>{message.content}</p>
                    <span className="text-xs text-gray-500 block mt-1">
                      {formatTime(message.timestamp)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Message Input */}
              <div className="message-input">
                <div className="input-container">
                  <button className="btn btn-icon w-8 h-8">
                    <Paperclip className="w-4 h-4" />
                  </button>
                  <textarea
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type a message..."
                    className="message-textarea"
                    rows={1}
                  />
                  <button className="btn btn-icon w-8 h-8">
                    <Smile className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={sendMessage}
                    disabled={!messageText.trim()}
                    className="btn btn-send"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Welcome to P2P Secure Chat</h3>
                <p className="text-gray-500">Select a conversation to start chatting</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Settings Modal */}
      <SettingsModal 
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </div>
  );
};

export default ChatPage;
