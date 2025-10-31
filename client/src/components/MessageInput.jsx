import React, { useState, useEffect, useRef } from 'react';
import { Paperclip, Image as ImageIcon, Mic, Smile, Send } from 'lucide-react';

const MessageInput = ({ onSendMessage, onStartTyping, onStopTyping }) => {
  const [text, setText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef(null);

  useEffect(() => () => clearTimeout(typingTimeoutRef.current), []);

  const handleChange = (e) => {
    setText(e.target.value);
    if (!isTyping) { setIsTyping(true); onStartTyping?.(); }
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => { setIsTyping(false); onStopTyping?.(); }, 800);
  };

  const handleSend = () => {
    const value = text.trim();
    if (!value) return;
    onSendMessage?.({ type: 'text', content: value });
    setText('');
  };

  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') handleSend();
  };

  return (
    <div className="px-3 pb-3">
      <div className="flex items-end space-x-2 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-xl p-2 shadow-sm">
        <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700"><Paperclip className="w-5 h-5 text-gray-500" /></button>
        <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700"><ImageIcon className="w-5 h-5 text-gray-500" /></button>
        <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700"><Smile className="w-5 h-5 text-gray-500" /></button>
        <textarea value={text} onChange={handleChange} onKeyDown={handleKeyDown} placeholder="Type a message…" rows={1} className="flex-1 resize-none bg-transparent outline-none text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 p-2" />
        <button onClick={handleSend} className="p-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white transition-colors"><Send className="w-5 h-5" /></button>
      </div>
      <div className="flex justify-between mt-1 px-1">
        <p className="text-xs text-gray-400">Press Ctrl/⌘ + Enter to send</p>
        <button className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">Voice <Mic className="inline w-3 h-3 ml-1" /></button>
      </div>
    </div>
  );
};

export default MessageInput;
