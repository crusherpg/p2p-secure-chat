import React, { useState, useRef, useEffect } from 'react';
import { Send, Smile, Image, Mic, MicOff, Plus, X } from 'lucide-react';
import MediaPicker from './MediaPicker';
import AudioRecorder from './AudioRecorder';
import SpeechToText from './SpeechToText';
import toast from 'react-hot-toast';

const MessageInput = ({ onSendMessage, onStartTyping, onStopTyping }) => {
  const [message, setMessage] = useState('');
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [showAudioRecorder, setShowAudioRecorder] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeechToText, setIsSpeechToText] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    adjustTextareaHeight();
  }, [message]);

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const maxHeight = 120; // Max 5 lines approximately
      textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`;
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setMessage(value);

    // Handle typing indicators
    if (value.trim() && !isTyping) {
      setIsTyping(true);
      onStartTyping?.();
    }

    // Clear existing timeout
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }

    // Set new timeout
    const timeout = setTimeout(() => {
      setIsTyping(false);
      onStopTyping?.();
    }, 1000);
    setTypingTimeout(timeout);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage();
  };

  const sendMessage = () => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage) return;

    onSendMessage({
      type: 'text',
      content: trimmedMessage
    });

    setMessage('');
    setIsTyping(false);
    onStopTyping?.();
    
    // Clear typing timeout
    if (typingTimeout) {
      clearTimeout(typingTimeout);
      setTypingTimeout(null);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleMediaSelect = (mediaData) => {
    onSendMessage(mediaData);
    setShowMediaPicker(false);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 25 * 1024 * 1024) { // 25MB limit
        toast.error('File size must be less than 25MB');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        onSendMessage({
          type: 'image',
          content: e.target.result,
          attachment: {
            fileName: file.name,
            size: file.size,
            type: file.type
          }
        });
      };
      reader.readAsDataURL(file);
    }
    
    // Reset file input
    e.target.value = '';
  };

  const handleAudioMessage = (audioData) => {
    onSendMessage({
      type: 'audio',
      content: audioData.audioURL,
      attachment: {
        fileName: `voice_message_${Date.now()}.webm`,
        duration: audioData.duration,
        size: audioData.size
      }
    });
    setShowAudioRecorder(false);
  };

  const handleSpeechResult = (transcript) => {
    setMessage(prev => prev + (prev ? ' ' : '') + transcript);
  };

  const toggleMediaPicker = () => {
    setShowMediaPicker(!showMediaPicker);
    setShowAudioRecorder(false);
  };

  const toggleAudioRecorder = () => {
    setShowAudioRecorder(!showAudioRecorder);
    setShowMediaPicker(false);
  };

  return (
    <div className="bg-white dark:bg-dark-800 border-t border-gray-200 dark:border-dark-700">
      {/* Media Picker */}
      {showMediaPicker && (
        <div className="border-b border-gray-200 dark:border-dark-700">
          <MediaPicker
            onSelectMedia={handleMediaSelect}
            onClose={() => setShowMediaPicker(false)}
          />
        </div>
      )}

      {/* Audio Recorder */}
      {showAudioRecorder && (
        <div className="border-b border-gray-200 dark:border-dark-700">
          <AudioRecorder
            onAudioRecorded={handleAudioMessage}
            onClose={() => setShowAudioRecorder(false)}
            isRecording={isRecording}
            onRecordingStateChange={setIsRecording}
          />
        </div>
      )}

      {/* Main Input Area */}
      <div className="p-4">
        <form onSubmit={handleSubmit} className="flex items-end space-x-3">
          {/* Media Controls */}
          <div className="flex items-center space-x-2 flex-shrink-0">
            {/* Media Picker Toggle */}
            <button
              type="button"
              onClick={toggleMediaPicker}
              className={`p-2 rounded-full transition-colors ${
                showMediaPicker
                  ? 'bg-primary-100 text-primary-600 dark:bg-primary-900 dark:text-primary-400'
                  : 'text-gray-500 hover:text-primary-600 hover:bg-primary-50 dark:text-gray-400 dark:hover:text-primary-400 dark:hover:bg-primary-900/50'
              }`}
              title="Media & Emojis"
            >
              {showMediaPicker ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            </button>

            {/* Quick Image Upload */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 rounded-full text-gray-500 hover:text-primary-600 hover:bg-primary-50 dark:text-gray-400 dark:hover:text-primary-400 dark:hover:bg-primary-900/50 transition-colors"
              title="Upload Image"
            >
              <Image className="w-5 h-5" />
            </button>

            {/* Audio Recorder Toggle */}
            <button
              type="button"
              onClick={toggleAudioRecorder}
              className={`p-2 rounded-full transition-colors ${
                showAudioRecorder || isRecording
                  ? 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400'
                  : 'text-gray-500 hover:text-primary-600 hover:bg-primary-50 dark:text-gray-400 dark:hover:text-primary-400 dark:hover:bg-primary-900/50'
              }`}
              title="Voice Message"
            >
              {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
          </div>

          {/* Text Input Area */}
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="w-full resize-none rounded-2xl border border-gray-300 dark:border-dark-600 bg-gray-50 dark:bg-dark-700 px-4 py-3 pr-20 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-colors"
              rows={1}
              style={{ minHeight: '44px' }}
            />

            {/* Speech to Text & Emoji in Text Input */}
            <div className="absolute right-2 bottom-2 flex items-center space-x-1">
              {/* Quick Emoji */}
              <button
                type="button"
                onClick={() => setMessage(prev => prev + '😊')}
                className="p-1.5 rounded-full text-gray-400 hover:text-yellow-500 transition-colors"
                title="Add emoji"
              >
                <Smile className="w-4 h-4" />
              </button>

              {/* Speech to Text */}
              <SpeechToText
                onResult={handleSpeechResult}
                isActive={isSpeechToText}
                onActiveChange={setIsSpeechToText}
              />
            </div>
          </div>

          {/* Send Button */}
          <button
            type="submit"
            disabled={!message.trim()}
            className={`flex-shrink-0 p-3 rounded-full transition-all duration-200 ${
              message.trim()
                ? 'bg-primary-600 text-white hover:bg-primary-700 shadow-lg hover:shadow-xl'
                : 'bg-gray-200 dark:bg-dark-600 text-gray-400 dark:text-gray-500 cursor-not-allowed'
            }`}
            title="Send message"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>

        {/* Character Count for Long Messages */}
        {message.length > 800 && (
          <div className="mt-2 text-right">
            <span className={`text-xs ${
              message.length > 1000
                ? 'text-red-500'
                : 'text-gray-400 dark:text-gray-500'
            }`}>
              {message.length}/1000
            </span>
          </div>
        )}
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
      />
    </div>
  );
};

export default MessageInput;