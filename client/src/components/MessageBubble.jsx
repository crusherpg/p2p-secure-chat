import React, { useState, useEffect } from 'react';
import { Check, CheckCheck, Download, Play, Pause, Volume2 } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';

const MessageBubble = ({ message, isOwn, onDecrypt }) => {
  const [decryptedContent, setDecryptedContent] = useState('');
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showFullImage, setShowFullImage] = useState(false);

  useEffect(() => {
    console.log('[MessageBubble] mount/update', { id: message?.id, type: message?.type, contentType: typeof message?.content });
    if (message?.type === 'text') {
      // Text messages may provide either a string or an encrypted object
      if (message?.content && typeof message.content === 'object' && message.content.encrypted && onDecrypt) {
        decryptMessage();
      } else if (typeof message?.content === 'string') {
        setDecryptedContent(message.content);
      } else {
        // Fallback to a readable placeholder instead of rendering an object (which causes React error)
        setDecryptedContent('[encrypted text]');
      }
    }
  }, [message?.id, message?.type, message?.content, onDecrypt]);

  const decryptMessage = async () => {
    setIsDecrypting(true);
    try {
      console.log('[MessageBubble] decrypting', { id: message?.id });
      const content = await onDecrypt(message.content);
      setDecryptedContent(content);
    } catch (error) {
      console.error('[MessageBubble] Decryption failed:', error);
      setDecryptedContent('Failed to decrypt message');
    } finally {
      setIsDecrypting(false);
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  const getStatusIcon = () => {
    switch (message?.status) {
      case 'sent':
        return <Check className="w-4 h-4 text-gray-400" />;
      case 'delivered':
        return <CheckCheck className="w-4 h-4 text-gray-400" />;
      case 'read':
        return <CheckCheck className="w-4 h-4 text-green-500" />;
      default:
        return null;
    }
  };

  const handleImageClick = () => setShowFullImage(true);
  const handleAudioPlay = () => setIsPlaying(!isPlaying);

  const renderContent = () => {
    switch (message?.type) {
      case 'text': {
        return (
          <div className="whitespace-pre-wrap break-words">
            {isDecrypting ? (
              <div className="flex items-center space-x-2">
                <LoadingSpinner size="sm" />
                <span className="text-sm opacity-70">Decrypting...</span>
              </div>
            ) : (
              // Ensure we never render an object directly
              typeof decryptedContent === 'string' ? decryptedContent : String(decryptedContent ?? '')
            )}
          </div>
        );
      }
      case 'emoji':
        return <div className="text-2xl">{String(message?.content ?? '')}</div>;
      case 'image':
        return (
          <div className="max-w-xs">
            <img
              src={typeof message?.content === 'string' ? message.content : ''}
              alt={message?.attachment?.fileName || 'Image'}
              className="rounded-lg cursor-pointer hover:opacity-90 transition-opacity max-w-full h-auto"
              onClick={handleImageClick}
              loading="lazy"
            />
            {message?.attachment?.fileName && (
              <p className="text-xs opacity-70 mt-1 truncate">{message.attachment.fileName}</p>
            )}
          </div>
        );
      case 'gif':
        return (
          <div className="max-w-xs">
            <img
              src={typeof message?.content === 'string' ? message.content : ''}
              alt="GIF"
              className="rounded-lg max-w-full h-auto"
              loading="lazy"
            />
          </div>
        );
      case 'audio':
        return (
          <div className="flex items-center space-x-3 min-w-0">
            <button
              onClick={handleAudioPlay}
              className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                isOwn ? 'bg-white/20 hover:bg-white/30' : 'bg-primary-100 hover:bg-primary-200 dark:bg-primary-900 dark:hover:bg-primary-800'
              }`}
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </button>
            <div className="flex items-center space-x-1 flex-1 min-w-0">
              {Array.from({ length: 20 }, (_, i) => (
                <div key={i} className={`w-1 bg-current rounded-full transition-all duration-150 ${isPlaying && i <= 8 ? 'h-6' : 'h-2'}`} style={{ opacity: isPlaying && i <= 8 ? 1 : 0.5, animationDelay: `${i * 0.1}s` }} />
              ))}
            </div>
            <div className="flex-shrink-0">
              <Volume2 className="w-4 h-4 opacity-70" />
              <span className="text-xs opacity-70 ml-1">{message?.metadata?.duration || '0:15'}</span>
            </div>
          </div>
        );
      case 'file':
        return (
          <div className="flex items-center space-x-3 max-w-xs">
            <div className="flex-shrink-0 w-10 h-10 bg-gray-200 dark:bg-gray-600 rounded-lg flex items-center justify-center">
              <Download className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium truncate">{message?.attachment?.fileName || 'File'}</p>
              <p className="text-xs opacity-70">{message?.attachment?.size || 'Unknown size'}</p>
            </div>
          </div>
        );
      default:
        return <div className="text-sm opacity-70">Unsupported message type</div>;
    }
  };

  return (
    <>
      <div className={`flex message-slide-in ${isOwn ? 'justify-end' : 'justify-start'}`}>
        <div className={`max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl message-bubble ${
          isOwn ? 'bg-primary-600 text-white rounded-l-2xl rounded-tr-2xl rounded-br-md' : 'bg-white dark:bg-dark-700 text-gray-900 dark:text-white rounded-r-2xl rounded-tl-2xl rounded-bl-md shadow-sm'
        } p-3 relative`}>
          <div className="mb-1">{renderContent()}</div>
          <div className={`flex items-center justify-end space-x-1 text-xs mt-2 ${isOwn ? 'text-white/70' : 'text-gray-500 dark:text-gray-400'}`}>
            <span>{formatTime(message?.timestamp)}</span>
            {isOwn && <div className="flex items-center space-x-1">{getStatusIcon()}</div>}
          </div>
          {message?.encrypted && (
            <div className="absolute -top-1 -right-1">
              <div className="w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-dark-900" title="End-to-end encrypted" />
            </div>
          )}
        </div>
      </div>
      {showFullImage && message?.type === 'image' && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-4" onClick={() => setShowFullImage(false)}>
          <div className="relative max-w-full max-h-full">
            <img src={typeof message?.content === 'string' ? message.content : ''} alt={message?.attachment?.fileName || 'Image'} className="max-w-full max-h-full object-contain rounded-lg" />
            <button onClick={() => setShowFullImage(false)} className="absolute top-4 right-4 w-8 h-8 bg-black bg-opacity-50 text-white rounded-full flex items-center justify-center hover:bg-opacity-70 transition-colors">×</button>
            {message?.attachment?.fileName && (
              <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 text-white px-3 py-2 rounded-lg"><p className="text-sm">{message.attachment.fileName}</p></div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default MessageBubble;
