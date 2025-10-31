import React from 'react';
import { MessageCircle, User as UserIcon } from 'lucide-react';

const UserList = ({ users, onlineUsers, onStartConversation }) => {
  const formatLastSeen = (lastSeen) => {
    if (!lastSeen) return 'Never';
    const date = new Date(lastSeen);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getStatusColor = (userId) => {
    return onlineUsers.has(userId) ? 'bg-green-500' : 'bg-gray-400';
  };

  const getStatusText = (userId) => {
    return onlineUsers.has(userId) ? 'Online' : 'Offline';
  };

  if (users.length === 0) {
    return (
      <div className="p-8 text-center">
        <UserIcon className="w-12 h-12 mx-auto text-gray-400 mb-4" />
        <p className="text-gray-500 dark:text-gray-400">
          No contacts available
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-200 dark:divide-dark-600">
      {users.map((user) => (
        <div
          key={user.id}
          className="p-4 hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors cursor-pointer"
          onClick={() => onStartConversation(user.id)}
        >
          <div className="flex items-center space-x-3">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-12 h-12 bg-primary-600 rounded-full flex items-center justify-center">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.username}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <span className="text-white font-medium text-lg">
                    {user.username[0].toUpperCase()}
                  </span>
                )}
              </div>
              {/* Online Status Indicator */}
              <div className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-white dark:border-dark-800 ${getStatusColor(user.id)}`} />
            </div>

            {/* User Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                  {user.username}
                </h3>
                <div className="flex items-center space-x-1">
                  <div className={`w-2 h-2 rounded-full ${getStatusColor(user.id)}`} />
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {getStatusText(user.id)}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between mt-1">
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                  {user.email}
                </p>
                {!onlineUsers.has(user.id) && user.lastSeen && (
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    {formatLastSeen(user.lastSeen)}
                  </span>
                )}
              </div>
            </div>

            {/* Start Conversation Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onStartConversation(user.id);
              }}
              className="flex-shrink-0 p-2 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              title="Start conversation"
            >
              <MessageCircle className="w-5 h-5" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default UserList;