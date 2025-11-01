import React from 'react';
import { Shield } from 'lucide-react';

const ConversationHeader = ({ title, encrypted }) => {
  return (
    <div className="h-14 px-6 flex items-center justify-between bg-white border-b border-gray-200">
      <h2 className="text-[15px] font-semibold">{title}</h2>
      {encrypted && (
        <span className="inline-flex items-center text-[11px] px-2 py-1 rounded-full bg-green-100 text-green-700">
          <Shield className="w-3 h-3 mr-1" />
          End-to-end encrypted
        </span>
      )}
    </div>
  );
};

export default ConversationHeader;
