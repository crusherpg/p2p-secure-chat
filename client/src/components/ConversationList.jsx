import React from 'react';
import { MessageCircle, Pin } from 'lucide-react';

const ConversationList = ({ conversations, selectedConversation, onSelectConversation }) => {
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffHours < 1) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    } else if (diffDays < 1) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const truncateMessage = (message, maxLength = 50) => {
    if (!message) return '';
    if (message.length <= maxLength) return message;
    return message.substring(0, maxLength) + '...';
  };

  const getOtherParticipant = (conversation, currentUserId) => {
    return conversation.participants?.find(p => p.id !== currentUserId);
  };

  if (conversations.length === 0) {
    return (
      <div className="p-8 text-center">
        <MessageCircle className="w-12 h-12 mx-auto text-gray-400 mb-4" />
        <p className="text-gray-500 dark:text-gray-400 mb-2">
          No conversations yet
        </p>
        <p className="text-sm text-gray-400 dark:text-gray-500">
          Start a new conversation from the Contacts tab
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-200 dark:divide-dark-600">
      {conversations.map((conversation) => {
        const otherParticipant = getOtherParticipant(conversation, 'current-user-id'); // In real app, use actual user ID
        const isSelected = selectedConversation?.id === conversation.id;
        
        return (
          <div
            key={conversation.id}
            className={`p-4 cursor-pointer transition-colors ${
              isSelected
                ? 'bg-primary-50 dark:bg-primary-900/20 border-r-2 border-primary-600'
                : 'hover:bg-gray-50 dark:hover:bg-dark-700'
            }`}
            onClick={() => onSelectConversation(conversation)}
          >
            <div className="flex items-center space-x-3">
              {/* Avatar */}
              <div className="flex-shrink-0 relative">
                <div className="w-12 h-12 bg-primary-600 rounded-full flex items-center justify-center">
                  {otherParticipant?.avatar ? (
                    <img
                      src={otherParticipant.avatar}
                      alt={otherParticipant.username}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-white font-medium text-lg">
                      {otherParticipant?.username?.[0]?.toUpperCase() || 'U'}
                    </span>
                  )}
                </div>
                
                {/* Online Status Indicator */}
                {otherParticipant?.status === 'online' && (
                  <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-dark-800" />
                )}
              </div>

              {/* Conversation Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <h3 className={`text-sm font-semibold truncate ${
                      isSelected
                        ? 'text-primary-700 dark:text-primary-300'
                        : 'text-gray-900 dark:text-white'
                    }`}>
                      {otherParticipant?.username || 'Unknown User'}
                    </h3>
                    
                    {conversation.pinned && (
                      <Pin className="w-3 h-3 text-gray-400" />
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {conversation.lastMessage?.timestamp && (
                      <span className={`text-xs ${
                        isSelected
                          ? 'text-primary-600 dark:text-primary-400'
                          : 'text-gray-500 dark:text-gray-400'
                      }`}>
                        {formatTime(conversation.lastMessage.timestamp)}
                      </span>
                    )}
                    
                    {/* Unread Count */}
                    {conversation.unreadCount > 0 && (
                      <div className="bg-primary-600 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                        {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Last Message */}
                {conversation.lastMessage && (
                  <div className="mt-1 flex items-center">
                    <p className={`text-sm truncate flex-1 ${
                      conversation.unreadCount > 0
                        ? 'font-medium text-gray-900 dark:text-white'
                        : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      {truncateMessage(conversation.lastMessage.content)}
                    </p>
                  </div>
                )}
                
                {/* Typing Indicator */}
                {conversation.typing && (
                  <div className="mt-1 flex items-center space-x-1">
                    <div className="flex space-x-1">
                      <div className="w-1 h-1 bg-primary-500 rounded-full typing-dot"></div>
                      <div className="w-1 h-1 bg-primary-500 rounded-full typing-dot"></div>
                      <div className="w-1 h-1 bg-primary-500 rounded-full typing-dot"></div>
                    </div>
                    <span className="text-xs text-primary-500">typing...</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ConversationList;