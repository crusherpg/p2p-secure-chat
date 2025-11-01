import React from 'react';
import { Check, CheckCheck } from 'lucide-react';

const ConversationList = ({ conversations = [], selectedConversation, onSelectConversation, currentUserId }) => {
  return (
    <aside className="sidebar w-80 hidden lg:flex flex-col">
      <div className="px-4 py-3 border-b border-gray-200">
        <p className="text-[13px] font-semibold text-gray-600">Messages</p>
      </div>
      <div className="flex-1 overflow-y-auto">
        {conversations.map(conv => {
          const other = conv.participants.find(p => p.id !== currentUserId) || conv.participants[0];
          const active = selectedConversation?.id === conv.id;
          return (
            <button key={conv.id} onClick={() => onSelectConversation(conv)} className={`w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-gray-50 ${active ? 'bg-gray-50' : ''}`}>
              <div className="flex items-center">
                <div className="relative w-9 h-9 rounded-full overflow-hidden bg-gray-200">
                  {other.avatar ? <img src={other.avatar} alt={other.username} /> : <div className="w-full h-full flex items-center justify-center text-xs font-medium">{other.username?.[0]}</div>}
                </div>
                <div className="ml-3 min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium truncate">{other.username}</p>
                    <span className="text-[11px] text-gray-500">{new Date(conv.lastMessage.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500 truncate">{typeof conv.lastMessage.content === 'string' ? conv.lastMessage.content : 'Encrypted message'}</p>
                    {conv.unreadCount > 0 ? (
                      <span className="ml-2 min-w-[18px] h-[18px] rounded-full bg-blue-600 text-white text-[11px] flex items-center justify-center">{conv.unreadCount}</span>
                    ) : (
                      <CheckCheck className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </aside>
  );
};

export default ConversationList;
