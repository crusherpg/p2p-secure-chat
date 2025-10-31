import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { socketService } from '../services/socketService';
import UserList from '../components/UserList';
import ConversationList from '../components/ConversationList';
import MessageBubble from '../components/MessageBubble';
import MessageInput from '../components/MessageInput';
import UserMenu from '../components/UserMenu';
import { Menu, X, Users, MessageCircle, Settings, Shield, Wifi } from 'lucide-react';
import { encryptionService } from '../utils/encryption';
import toast from 'react-hot-toast';

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
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (token) {
      // Connect to socket and initialize
      const socket = socketService.connect(token);
      
      // Generate encryption key
      initializeEncryption();
      
      // Load demo data
      loadConversations();
      loadUsers();
      
      // Setup socket event listeners
      setupSocketListeners();
      
      // Check connection status
      setIsConnected(socketService.isSocketConnected());
      
      return () => {
        socketService.disconnect();
      };
    }
  }, [token]);

  const initializeEncryption = async () => {
    try {
      const keyExchange = await encryptionService.simulateKeyExchange(user?.id || 'demo-user', 'demo-peer');
      setEncryptionKey(keyExchange.key);
      console.log('🔐 Encryption initialized with fingerprint:', keyExchange.fingerprint);
    } catch (error) {
      console.error('❌ Encryption initialization failed:', error);
    }
  };

  const setupSocketListeners = () => {
    socketService.on('connect', () => {
      setIsConnected(true);
      toast.success('Connected to server');
    });

    socketService.on('disconnect', () => {
      setIsConnected(false);
      toast.error('Connection lost');
    });

    socketService.on('new_message', (messageData) => {
      if (selectedConversation && messageData.conversationId === selectedConversation.id) {
        setMessages(prev => [...prev, {
          id: messageData.id,
          from: messageData.from,
          content: messageData.content,
          type: messageData.type || 'text',
          attachment: messageData.attachment,
          timestamp: messageData.timestamp,
          status: 'delivered',
          encrypted: true
        }]);
      }
      
      // Update conversation with latest message
      setConversations(prev => prev.map(conv => 
        conv.id === messageData.conversationId 
          ? { ...conv, lastMessage: { content: messageData.content, timestamp: messageData.timestamp }, unreadCount: (conv.unreadCount || 0) + 1 }
          : conv
      ));
    });

    socketService.on('message_status_update', (data) => {
      setMessages(prev => prev.map(msg => 
        msg.id === data.messageId ? { ...msg, status: data.status } : msg
      ));
    });

    socketService.on('user_typing', (data) => {
      if (selectedConversation && data.conversationId === selectedConversation.id) {
        setTypingUsers(prev => new Set([...prev, data.username]));
      }
    });

    socketService.on('user_stop_typing', (data) => {
      setTypingUsers(prev => {
        const updated = new Set(prev);
        updated.delete(data.username);
        return updated;
      });
    });

    socketService.on('user_status_change', (data) => {
      if (data.status === 'online') {
        setOnlineUsers(prev => new Set([...prev, data.userId]));
      } else {
        setOnlineUsers(prev => {
          const updated = new Set(prev);
          updated.delete(data.userId);
          return updated;
        });
      }
      
      // Update user in users list
      setUsers(prev => prev.map(u => 
        u.id === data.userId ? { ...u, status: data.status, lastSeen: data.lastSeen } : u
      ));
    });

    socketService.on('conversation_created', (data) => {
      setConversations(prev => [...prev, data.conversation]);
      setSelectedConversation(data.conversation);
      setMessages([]);
      setShowSidebar(false);
    });
  };

  const loadConversations = async () => {
    // Generate demo conversations based on current user
    const demoConversations = [
      {
        id: 'conv1',
        participants: [
          { id: 'alice', username: 'Alice Cooper', avatar: null, status: 'online' },
          { id: user?.id || 'current-user', username: user?.username || 'You', avatar: user?.avatar || null }
        ],
        lastMessage: {
          content: 'Hey! How are you doing?',
          timestamp: new Date(Date.now() - 300000).toISOString()
        },
        unreadCount: 2,
        type: 'direct',
        encryption: {
          enabled: true,
          fingerprint: 'demo-fingerprint'
        }
      },
      {
        id: 'conv2',
        participants: [
          { id: 'bob', username: 'Bob Wilson', avatar: null, status: 'away' },
          { id: user?.id || 'current-user', username: user?.username || 'You', avatar: user?.avatar || null }
        ],
        lastMessage: {
          content: 'Can we schedule a meeting tomorrow?',
          timestamp: new Date(Date.now() - 3600000).toISOString()
        },
        unreadCount: 0,
        type: 'direct',
        encryption: {
          enabled: true,
          fingerprint: 'demo-fingerprint-2'
        }
      }
    ];
    setConversations(demoConversations);
  };

  const loadUsers = async () => {
    // Generate demo users
    const demoUsers = [
      { id: 'alice', username: 'Alice Cooper', email: 'alice@company.com', status: 'online', avatar: null, lastSeen: new Date().toISOString() },
      { id: 'bob', username: 'Bob Wilson', email: 'bob@company.com', status: 'away', avatar: null, lastSeen: new Date(Date.now() - 900000).toISOString() },
      { id: 'carol', username: 'Carol Davis', email: 'carol@company.com', status: 'online', avatar: null, lastSeen: new Date().toISOString() },
      { id: 'david', username: 'David Chen', email: 'david@company.com', status: 'offline', avatar: null, lastSeen: new Date(Date.now() - 7200000).toISOString() }
    ];
    setUsers(demoUsers.filter(u => u.id !== user?.id));
    setOnlineUsers(new Set(['alice', 'carol']));
  };

  const loadMessages = async (conversationId) => {
    // Generate demo messages for the selected conversation
    const demoMessages = [
      {
        id: 'msg1',
        from: { id: 'alice', username: 'Alice Cooper', avatar: null },
        content: 'Hey there! How are things going with the new project?',
        type: 'text',
        timestamp: new Date(Date.now() - 600000).toISOString(),
        status: 'read',
        encrypted: true
      },
      {
        id: 'msg2',
        from: { id: user?.id || 'current-user', username: user?.username || 'You', avatar: user?.avatar || null },
        content: 'Everything is going well! Just finished the authentication module.',
        type: 'text',
        timestamp: new Date(Date.now() - 480000).toISOString(),
        status: 'delivered',
        encrypted: true
      },
      {
        id: 'msg3',
        from: { id: 'alice', username: 'Alice Cooper', avatar: null },
        content: 'That\'s great to hear! The security features are really important.',
        type: 'text',
        timestamp: new Date(Date.now() - 360000).toISOString(),
        status: 'read',
        encrypted: true
      },
      {
        id: 'msg4',
        from: { id: user?.id || 'current-user', username: user?.username || 'You', avatar: user?.avatar || null },
        content: 'Absolutely! End-to-end encryption is working perfectly now.',
        type: 'text',
        timestamp: new Date(Date.now() - 120000).toISOString(),
        status: 'delivered',
        encrypted: true
      }
    ];
    setMessages(demoMessages);
  };

  const selectConversation = (conversation) => {
    console.log('🎯 Selecting conversation:', conversation.id);
    setSelectedConversation(conversation);
    loadMessages(conversation.id);
    setShowSidebar(false);
    
    // Mark as read
    setConversations(prev => prev.map(conv => 
      conv.id === conversation.id ? { ...conv, unreadCount: 0 } : conv
    ));
  };

  const startNewConversation = (userId) => {
    console.log('💬 Starting new conversation with:', userId);
    socketService.createConversation(userId);
  };

  const sendMessage = async (messageData) => {
    if (!selectedConversation) {
      toast.error('Please select a conversation');
      return;
    }

    if (!encryptionKey) {
      toast.error('Encryption not ready');
      return;
    }

    try {
      let processedContent = messageData.content;
      
      // Encrypt text messages
      if (messageData.type === 'text') {
        const encrypted = await encryptionService.encryptMessage(messageData.content, encryptionKey);
        processedContent = encrypted;
      }

      // Create message payload
      const messagePayload = {
        conversationId: selectedConversation.id,
        content: processedContent,
        type: messageData.type || 'text',
        attachment: messageData.attachment
      };

      // Emit to socket
      socketService.sendMessage(messagePayload);

      // Add to local state immediately for better UX
      const localMessage = {
        id: `temp-${Date.now()}`,
        from: {
          id: user?.id || 'current-user',
          username: user?.username || 'You',
          avatar: user?.avatar || null
        },
        content: messageData.content, // Display unencrypted for own messages
        type: messageData.type || 'text',
        attachment: messageData.attachment,
        timestamp: new Date().toISOString(),
        status: 'sent',
        encrypted: true
      };
      
      setMessages(prev => [...prev, localMessage]);
      
      // Update conversation preview
      setConversations(prev => prev.map(conv => 
        conv.id === selectedConversation.id 
          ? { ...conv, lastMessage: { content: messageData.content, timestamp: localMessage.timestamp } }
          : conv
      ));
      
    } catch (error) {
      console.error('❌ Send message error:', error);
      toast.error('Failed to send message');
    }
  };

  const decryptMessageContent = async (encryptedContent) => {
    if (!encryptionKey) {
      return 'Decryption key unavailable';
    }
    
    try {
      // If content is already a string, return it (own messages or already decrypted)
      if (typeof encryptedContent === 'string') {
        return encryptedContent;
      }
      
      // Attempt decryption
      const decrypted = await encryptionService.decryptMessage(encryptedContent, encryptionKey);
      return decrypted;
    } catch (error) {
      console.warn('⚠️ Decryption failed (using fallback):', error.message);
      return '[Encrypted Message]';
    }
  };

  const getOtherParticipant = (conversation) => {
    return conversation.participants.find(p => p.id !== user?.id) || 
           { username: 'Unknown User', status: 'offline', avatar: null };
  };

  const isUserOnline = (userId) => {
    return onlineUsers.has(userId);
  };

  return (
    <div className="h-screen flex bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Mobile Sidebar Overlay */}
      {showSidebar && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setShowSidebar(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed lg:relative inset-y-0 left-0 z-50 w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transform transition-transform duration-300 ease-in-out lg:translate-x-0
        ${showSidebar ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Sidebar Header */}
        <div className="flex items-center justify-between h-16 px-6 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white">P2P Chat</h1>
              <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <UserMenu />
            <button
              onClick={() => setShowSidebar(false)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex bg-gray-50 dark:bg-gray-800/50">
          <button
            onClick={() => setActiveTab('conversations')}
            className={`flex-1 flex items-center justify-center px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'conversations'
                ? 'text-blue-600 dark:text-blue-400 bg-white dark:bg-gray-800 border-b-2 border-blue-600 dark:border-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Conversations
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`flex-1 flex items-center justify-center px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'users'
                ? 'text-blue-600 dark:text-blue-400 bg-white dark:bg-gray-800 border-b-2 border-blue-600 dark:border-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            <Users className="w-4 h-4 mr-2" />
            Contacts
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'conversations' ? (
            <ConversationList 
              conversations={conversations}
              selectedConversation={selectedConversation}
              onSelectConversation={selectConversation}
              currentUserId={user?.id}
            />
          ) : (
            <UserList 
              users={users}
              onlineUsers={onlineUsers}
              currentUserId={user?.id}
              onStartConversation={startNewConversation}
            />
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="flex items-center justify-between h-16 px-6 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center min-w-0">
                <button
                  onClick={() => setShowSidebar(true)}
                  className="lg:hidden p-2 mr-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <Menu className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </button>
                
                {(() => {
                  const otherUser = getOtherParticipant(selectedConversation);
                  return (
                    <div className="flex items-center min-w-0">
                      <div className="relative">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                          {otherUser.avatar ? (
                            <img
                              src={otherUser.avatar}
                              alt={otherUser.username}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <span className="text-white font-medium text-sm">
                              {otherUser.username?.[0]?.toUpperCase() || 'U'}
                            </span>
                          )}
                        </div>
                        <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white dark:border-gray-800 ${
                          isUserOnline(otherUser.id) ? 'bg-green-500' : otherUser.status === 'away' ? 'bg-yellow-500' : 'bg-gray-400'
                        }`} />
                      </div>
                      <div className="ml-3 min-w-0">
                        <h2 className="text-base font-semibold text-gray-900 dark:text-white truncate">
                          {otherUser.username}
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                          {typingUsers.size > 0 ? (
                            <span className="text-blue-600 dark:text-blue-400">
                              {Array.from(typingUsers).join(', ')} typing...
                            </span>
                          ) : (
                            <span className="flex items-center">
                              <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
                                isUserOnline(otherUser.id) ? 'bg-green-500' : 
                                otherUser.status === 'away' ? 'bg-yellow-500' : 'bg-gray-400'
                              }`} />
                              {isUserOnline(otherUser.id) ? 'Online' : 
                               otherUser.status === 'away' ? 'Away' : 'Offline'}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  );
                })()} 
              </div>
              
              <div className="flex items-center space-x-2">
                {selectedConversation.encryption?.enabled && (
                  <div className="flex items-center space-x-1 text-xs text-green-600 dark:text-green-400">
                    <Shield className="w-3 h-3" />
                    <span>Encrypted</span>
                  </div>
                )}
                <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                  <Settings className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </button>
              </div>
            </div>

            {/* Messages Container */}
            <div className="flex-1 overflow-y-auto px-4 py-4 scrollbar-thin">
              <div className="max-w-4xl mx-auto space-y-3">
                {messages.map((message) => (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    isOwn={message.from.id === user?.id}
                    onDecrypt={decryptMessageContent}
                    showAvatar={false}
                  />
                ))}
                
                {/* Typing Indicator */}
                {typingUsers.size > 0 && (
                  <div className="flex items-start space-x-3 px-4">
                    <div className="flex space-x-1 mt-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full typing-dot" />
                      <div className="w-2 h-2 bg-gray-400 rounded-full typing-dot" />
                      <div className="w-2 h-2 bg-gray-400 rounded-full typing-dot" />
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {Array.from(typingUsers).join(', ')} {typingUsers.size === 1 ? 'is' : 'are'} typing...
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Message Input */}
            <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <MessageInput
                onSendMessage={sendMessage}
                onStartTyping={() => selectedConversation && socketService.startTyping(selectedConversation.id)}
                onStopTyping={() => selectedConversation && socketService.stopTyping(selectedConversation.id)}
                placeholder={`Message ${getOtherParticipant(selectedConversation).username}...`}
              />
            </div>
          </>
        ) : (
          /* Empty State */
          <div className="flex-1 flex flex-col items-center justify-center p-8">
            <button
              onClick={() => setShowSidebar(true)}
              className="lg:hidden absolute top-4 left-4 p-2 rounded-lg bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <Menu className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
            
            <div className="text-center">
              <div className="w-16 h-16 mx-auto bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-6">
                <MessageCircle className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Welcome to P2P Secure Chat
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md">
                Your messages are end-to-end encrypted and stored securely. Select a conversation to start chatting.
              </p>
              <button
                onClick={() => setShowSidebar(true)}
                className="lg:hidden btn-primary inline-flex items-center"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                View Conversations
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPage;