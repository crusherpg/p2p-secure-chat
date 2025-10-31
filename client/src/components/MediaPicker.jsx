import React, { useState } from 'react';
import { Smile, Image, FileText, X, Search } from 'lucide-react';
import toast from 'react-hot-toast';

const MediaPicker = ({ onSelectMedia, onClose }) => {
  const [activeTab, setActiveTab] = useState('emoji');
  const [emojiSearch, setEmojiSearch] = useState('');
  const [gifSearch, setGifSearch] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);

  // Demo emoji data organized by categories
  const emojiCategories = {
    recent: ['😊', '❤️', '👍', '😂', '🎉', '🔥', '💯', '✨'],
    smileys: ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🥸', '🤩', '🥳'],
    people: ['👋', '🤚', '🖐', '✋', '🖖', '👌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏'],
    nature: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐻‍❄️', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🙈', '🙉', '🙊', '🐒', '🐔', '🐧', '🐦', '🐤', '🐣', '🐥', '🦆', '🦢', '🦅', '🦉', '🦚'],
    objects: ['📱', '💻', '🖥', '🖨', '⌨️', '🖱', '🖲', '💽', '💾', '💿', '📀', '🧮', '🎥', '🎞', '📹', '📷', '📸', '📻', '🎙', '🎚', '🎛', '⏱', '⏲', '⏰', '🕰', '⌛', '⏳', '📡', '🔋', '🔌', '💡']
  };

  // Demo GIF data
  const demoGifs = [
    { id: '1', url: 'https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif', title: 'thumbs up' },
    { id: '2', url: 'https://media.giphy.com/media/3oriO0OEd9QIDdllqo/giphy.gif', title: 'dancing' },
    { id: '3', url: 'https://media.giphy.com/media/26BRrSvJUa0crqw4E/giphy.gif', title: 'applause' },
    { id: '4', url: 'https://media.giphy.com/media/l3q2XhfQ8oCkm1Ts4/giphy.gif', title: 'celebration' },
    { id: '5', url: 'https://media.giphy.com/media/3o6Zt4HU9uwXmXSAuI/giphy.gif', title: 'happy dance' },
    { id: '6', url: 'https://media.giphy.com/media/l0HlvtIPzPdt2usKs/giphy.gif', title: 'mind blown' }
  ];

  const handleEmojiClick = (emoji) => {
    onSelectMedia({
      type: 'emoji',
      content: emoji
    });
  };

  const handleGifClick = (gif) => {
    onSelectMedia({
      type: 'gif',
      content: gif.url,
      metadata: {
        title: gif.title,
        source: 'Tenor'
      }
    });
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 25 * 1024 * 1024) {
        toast.error('File size must be less than 25MB');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        onSelectMedia({
          type: file.type.startsWith('image/') ? 'image' : 'file',
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
  };

  const filterEmojis = (category) => {
    const emojis = emojiCategories[category] || [];
    if (!emojiSearch) return emojis;
    return emojis.filter(emoji => 
      emoji.includes(emojiSearch.toLowerCase())
    );
  };

  const renderEmojiTab = () => (
    <div className="h-80 flex flex-col">
      {/* Emoji Search */}
      <div className="p-3 border-b border-gray-200 dark:border-dark-600">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search emojis..."
            value={emojiSearch}
            onChange={(e) => setEmojiSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-gray-100 dark:bg-dark-700 border border-gray-200 dark:border-dark-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Emoji Categories */}
      <div className="flex-1 overflow-y-auto">
        {Object.keys(emojiCategories).map(category => {
          const filteredEmojis = filterEmojis(category);
          if (filteredEmojis.length === 0) return null;

          return (
            <div key={category} className="p-3">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 capitalize">
                {category}
              </h4>
              <div className="grid grid-cols-8 gap-2">
                {filteredEmojis.map((emoji, index) => (
                  <button
                    key={`${category}-${index}`}
                    onClick={() => handleEmojiClick(emoji)}
                    className="text-2xl hover:bg-gray-100 dark:hover:bg-dark-600 rounded p-1 transition-colors"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderGifTab = () => (
    <div className="h-80 flex flex-col">
      {/* GIF Search */}
      <div className="p-3 border-b border-gray-200 dark:border-dark-600">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search GIFs..."
            value={gifSearch}
            onChange={(e) => setGifSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-gray-100 dark:bg-dark-700 border border-gray-200 dark:border-dark-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* GIF Grid */}
      <div className="flex-1 overflow-y-auto p-3">
        <div className="grid grid-cols-2 gap-3">
          {demoGifs.map(gif => (
            <button
              key={gif.id}
              onClick={() => handleGifClick(gif)}
              className="relative rounded-lg overflow-hidden hover:opacity-90 transition-opacity group"
            >
              <img
                src={gif.url}
                alt={gif.title}
                className="w-full h-24 object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all" />
            </button>
          ))}
        </div>
        
        {/* No Results */}
        {gifSearch && demoGifs.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">No GIFs found</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderFileTab = () => (
    <div className="h-80 flex flex-col items-center justify-center p-8">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto bg-gray-100 dark:bg-dark-700 rounded-full flex items-center justify-center mb-4">
          <FileText className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Upload File
        </h3>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          Select images, documents, or other files to share
        </p>
        <label className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors cursor-pointer inline-flex items-center space-x-2">
          <Image className="w-5 h-5" />
          <span>Choose File</span>
          <input
            type="file"
            onChange={handleFileUpload}
            className="hidden"
            accept="*/*"
          />
        </label>
        <p className="text-xs text-gray-400 mt-3">
          Maximum file size: 25MB
        </p>
      </div>
    </div>
  );

  return (
    <div className="bg-white dark:bg-dark-800">
      {/* Mobile: Bottom Sheet Style */}
      <div className="media-picker md:max-w-md">
        {/* Header with Tabs */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-dark-600">
          <div className="flex space-x-4">
            <button
              onClick={() => setActiveTab('emoji')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                activeTab === 'emoji'
                  ? 'bg-primary-100 text-primary-600 dark:bg-primary-900 dark:text-primary-400'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <Smile className="w-4 h-4" />
              <span className="text-sm font-medium">Emoji</span>
            </button>
            
            <button
              onClick={() => setActiveTab('gif')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                activeTab === 'gif'
                  ? 'bg-primary-100 text-primary-600 dark:bg-primary-900 dark:text-primary-400'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <span className="text-sm font-bold">GIF</span>
            </button>
            
            <button
              onClick={() => setActiveTab('file')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                activeTab === 'file'
                  ? 'bg-primary-100 text-primary-600 dark:bg-primary-900 dark:text-primary-400'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span className="text-sm font-medium">Files</span>
            </button>
          </div>
          
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'emoji' && renderEmojiTab()}
        {activeTab === 'gif' && renderGifTab()}
        {activeTab === 'file' && renderFileTab()}
      </div>
    </div>
  );
};

export default MediaPicker;