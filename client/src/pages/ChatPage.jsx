import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { socketService } from '../services/socketService';
import UserList from '../components/UserList';
import ConversationList from '../components/ConversationList';
import MessageBubble from '../components/MessageBubble';
import MessageInput from '../components/MessageInput';
import UserMenu from '../components/UserMenu';
import { Menu, X, Users, MessageCircle, Settings } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState('conversations'); // 'conversations' or 'users'
  const [encryptionKey, setEncryptionKey] = useState(null);

  useEffect(() => {
    if (token) {
      // Connect to socket
      socketService.connect(token);
      
      // Generate demo encryption key
      initializeEncryption();
      
      // Load initial data
      loadConversations();
      loadUsers();
      
      // Setup socket listeners
      setupSocketListeners();
      
      return () => {
        socketService.disconnect();
      };
    }
  }, [token]);

  const initializeEncryption = async () => {
    try {
      const keyExchange = await encryptionService.simulateKeyExchange(user.id, 'demo');
      setEncryptionKey(keyExchange.key);
    } catch (error) {
      console.error('Encryption initialization error:', error);
    }
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

    socketService.on('message_delivered', (data) => {
      setMessages(prev => prev.map(msg => 
        msg.id === data.messageId ? { ...msg, status: 'delivered' } : msg
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
    });

    socketService.on('conversation_created', (data) => {
      setConversations(prev => [...prev, data.conversation]);
      setSelectedConversation(data.conversation);
      setShowSidebar(false);
    });
  };

  const loadConversations = async () => {
    // Demo conversations
    const demoConversations = [
      {
        id: 'conv1',
        participants: [
          { id: 'user1', username: 'Alice Cooper', avatar: null, status: 'online' },
          { id: 'user2', username: 'Bob Wilson', avatar: null, status: 'offline' }
        ],
        lastMessage: {
          content: 'Hey! How are you doing?',
          timestamp: new Date().toISOString()
        },
        unreadCount: 2
      }
    ];
    setConversations(demoConversations);
  };

  const loadUsers = async () => {
    // Demo users
    const demoUsers = [
      { id: 'user1', username: 'Alice Cooper', email: 'alice@example.com', status: 'online', avatar: null },
      { id: 'user2', username: 'Bob Wilson', email: 'bob@example.com', status: 'offline', avatar: null },
      { id: 'user3', username: 'Carol Davis', email: 'carol@example.com', status: 'online', avatar: null }
    ];
    setUsers(demoUsers);
    setOnlineUsers(new Set(['user1', 'user3']));
  };

  const loadMessages = async (conversationId) => {
    // Demo messages
    const demoMessages = [
      {
        id: 'msg1',
        from: { id: 'user1', username: 'Alice Cooper', avatar: null },
        content: { encrypted: 'SGV5ISBIb3cgYXJlIHlvdSBkb2luZz8=', iv: 'demo-iv', authTag: 'demo-tag' },
        type: 'text',
        timestamp: new Date(Date.now() - 300000).toISOString(),
        status: 'read'
      },
      {
        id: 'msg2',
        from: { id: user.id, username: user.username, avatar: null },
        content: { encrypted: 'SSdtIGRvaW5nIGdyZWF0ISBUaGFua3MgZm9yIGFza2luZyE=', iv: 'demo-iv', authTag: 'demo-tag' },
        type: 'text',
        timestamp: new Date(Date.now() - 180000).toISOString(),
        status: 'delivered'
      }
    ];
    setMessages(demoMessages);
  };

  const selectConversation = (conversation) => {
    setSelectedConversation(conversation);
    loadMessages(conversation.id);
    setShowSidebar(false);
  };

  const startNewConversation = (userId) => {
    socketService.createConversation(userId);
  };

  const sendMessage = async (messageData) => {
    if (!selectedConversation || !encryptionKey) {
      toast.error('Unable to send message');
      return;
    }

    try {
      let encryptedContent;
      
      if (messageData.type === 'text') {
        encryptedContent = await encryptionService.encryptMessage(messageData.content, encryptionKey);
      } else {
        // For media messages, simulate encryption
        encryptedContent = {
          encrypted: btoa(messageData.content),
          iv: 'demo-iv-' + Date.now(),
          authTag: 'demo-tag-' + Date.now()
        };
      }

      const messagePayload = {
        conversationId: selectedConversation.id,
        encryptedContent: encryptedContent.encrypted,
        iv: encryptedContent.iv,
        authTag: encryptedContent.authTag,
        type: messageData.type || 'text',
        attachment: messageData.attachment
      };

      socketService.sendMessage(messagePayload);

      // Add message to local state immediately for better UX
      const newMessage = {
        id: 'temp-' + Date.now(),
        from: { id: user.id, username: user.username, avatar: user.avatar },
        content: encryptedContent,
        type: messageData.type || 'text',
        attachment: messageData.attachment,
        timestamp: new Date().toISOString(),
        status: 'sent'
      };
      
      setMessages(prev => [...prev, newMessage]);
    } catch (error) {
      console.error('Send message error:', error);
      toast.error('Failed to send message');
    }
  };

  const decryptMessageContent = async (encryptedContent) => {
    if (!encryptionKey) return 'Decryption unavailable';
    
    try {
      return await encryptionService.decryptMessage(encryptedContent, encryptionKey);
    } catch (error) {
      console.error('Decryption error:', error);
      return 'Failed to decrypt';
    }
  };

  return (
    <div className="h-screen flex bg-gray-50 dark:bg-dark-900">
      {/* Mobile Sidebar Overlay */}
      {showSidebar && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setShowSidebar(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed lg:relative inset-y-0 left-0 z-50 w-80 bg-white dark:bg-dark-800 border-r border-gray-200 dark:border-dark-700 transform transition-transform duration-300 ease-in-out lg:translate-x-0
        ${showSidebar ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Sidebar Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-dark-700">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">P2P Chat</h1>
          <div className="flex items-center space-x-2">
            <UserMenu />
            <button
              onClick={() => setShowSidebar(false)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors"
            >
              <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 dark:border-dark-700">
          <button
            onClick={() => setActiveTab('conversations')}
            className={`flex-1 flex items-center justify-center px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'conversations'
                ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Chats
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`flex-1 flex items-center justify-center px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'users'
                ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <Users className="w-4 h-4 mr-2" />
            Contacts
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'conversations' ? (
            <ConversationList 
              conversations={conversations}
              selectedConversation={selectedConversation}
              onSelectConversation={selectConversation}
            />
          ) : (
            <UserList 
              users={users.filter(u => u.id !== user.id)}
              onlineUsers={onlineUsers}
              onStartConversation={startNewConversation}
            />
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="flex items-center justify-between h-16 px-4 bg-white dark:bg-dark-800 border-b border-gray-200 dark:border-dark-700">
              <div className="flex items-center">
                <button
                  onClick={() => setShowSidebar(true)}
                  className="lg:hidden p-2 mr-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors"
                >
                  <Menu className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </button>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-medium">
                      {selectedConversation.participants.find(p => p.id !== user.id)?.username[0] || 'U'}
                    </span>
                  </div>
                  <div className="ml-3">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {selectedConversation.participants.find(p => p.id !== user.id)?.username || 'Unknown'}
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {typingUsers.size > 0 ? (
                        <span className="text-primary-600 dark:text-primary-400">
                          {Array.from(typingUsers).join(', ')} typing...
                        </span>
                      ) : (
                        onlineUsers.has(selectedConversation.participants.find(p => p.id !== user.id)?.id) ? 'Online' : 'Offline'
                      )}
                    </p>
                  </div>
                </div>
              </div>
              <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors">
                <Settings className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  isOwn={message.from.id === user.id}
                  onDecrypt={decryptMessageContent}
                />
              ))}
              
              {/* Typing Indicator */}
              {typingUsers.size > 0 && (
                <div className="flex items-center space-x-2 px-4 py-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full typing-dot"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full typing-dot"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full typing-dot"></div>
                  </div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {Array.from(typingUsers).join(', ')} {typingUsers.size === 1 ? 'is' : 'are'} typing...
                  </span>
                </div>
              )}
            </div>

            {/* Message Input */}
            <MessageInput
              onSendMessage={sendMessage}
              onStartTyping={() => socketService.startTyping(selectedConversation.id)}
              onStopTyping={() => socketService.stopTyping(selectedConversation.id)}
            />
          </>
        ) : (
          /* No Conversation Selected */
          <div className="flex-1 flex items-center justify-center">
            <button
              onClick={() => setShowSidebar(true)}
              className="lg:hidden absolute top-4 left-4 p-2 rounded-lg bg-white dark:bg-dark-800 shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <Menu className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
            <div className="text-center px-4">
              <div className="w-16 h-16 mx-auto bg-gray-200 dark:bg-dark-700 rounded-full flex items-center justify-center mb-4">
                <MessageCircle className="w-8 h-8 text-gray-400 dark:text-gray-500" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Welcome to P2P Secure Chat
              </h2>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                Select a conversation to start messaging securely
              </p>
              <button
                onClick={() => setShowSidebar(true)}
                className="lg:hidden bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors"
              >
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